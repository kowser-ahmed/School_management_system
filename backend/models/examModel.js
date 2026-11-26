
const db = require("../config/db");

// Get all exams
const getAllExams = async () => {
    const [rows] = await db.query(`
        SELECT
            e.exam_id,
            e.exam_name,
            e.class_id,
            c.class_name,
            e.academic_year,
            e.start_date,
            e.end_date,
            e.status
        FROM exams e
        LEFT JOIN classes c
            ON e.class_id = c.class_id
        ORDER BY e.exam_id DESC
    `);

    return rows;
};

// Get exam by ID
const getExamById = async (examId) => {
    const [rows] = await db.query(
        `
        SELECT
            e.exam_id,
            e.exam_name,
            e.class_id,
            c.class_name,
            e.academic_year,
            e.start_date,
            e.end_date,
            e.status
        FROM exams e
        LEFT JOIN classes c
            ON e.class_id = c.class_id
        WHERE e.exam_id = ?
        `,
        [examId]
    );

    return rows[0];
};

// Create a new exam
const createExam = async (examData) => {
    const [result] = await db.query(
        `
        INSERT INTO exams
        (
            exam_name,
            class_id,
            academic_year,
            start_date,
            end_date,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            examData.exam_name,
            examData.class_id,
            examData.academic_year,
            examData.start_date,
            examData.end_date,
            examData.status
        ]
    );

    return result.insertId;
};

// Update exam
const updateExam = async (examId, examData) => {
    const [result] = await db.query(
        `
        UPDATE exams
        SET
            exam_name = ?,
            class_id = ?,
            academic_year = ?,
            start_date = ?,
            end_date = ?,
            status = ?
        WHERE exam_id = ?
        AND status != 'published'
        `,
        [
            examData.exam_name,
            examData.class_id,
            examData.academic_year,
            examData.start_date,
            examData.end_date,
            examData.status,
            examId
        ]
    );

    return result.affectedRows;
};

// Delete exam
const deleteExam = async (examId) => {
    const [result] = await db.query(
        `
        DELETE FROM exams
        WHERE exam_id = ?
        AND status != 'published'
        `,
        [examId]
    );

    return result.affectedRows;
};

// Check whether all active students have marks
// for every subject scheduled in this examination
const getPublicationReadiness = async (examId) => {
    const [examRows] = await db.query(
        `
        SELECT class_id
        FROM exams
        WHERE exam_id = ?
        `,
        [examId]
    );

    if (examRows.length === 0) {
        return null;
    }

    const classId = examRows[0].class_id;

    const [subjectRows] = await db.query(
        `
        SELECT COUNT(DISTINCT subject_id) AS total_subjects
        FROM exam_schedule
        WHERE exam_id = ?
        `,
        [examId]
    );

    const [studentRows] = await db.query(
        `
        SELECT COUNT(*) AS total_students
        FROM students
        WHERE class_id = ?
        AND status = 'active'
        `,
        [classId]
    );

    const totalSubjects = Number(subjectRows[0].total_subjects);
    const totalStudents = Number(studentRows[0].total_students);

    if (totalSubjects === 0) {
        return {
            ready: false,
            message: "No subjects have been scheduled for this examination."
        };
    }

    if (totalStudents === 0) {
        return {
            ready: false,
            message: "No active students found in this class."
        };
    }

    const [missingRows] = await db.query(
        `
        SELECT COUNT(*) AS missing_marks
        FROM students s
        CROSS JOIN (
            SELECT DISTINCT subject_id
            FROM exam_schedule
            WHERE exam_id = ?
        ) es
        LEFT JOIN results r
            ON r.exam_id = ?
            AND r.student_id = s.student_id
            AND r.subject_id = es.subject_id
        WHERE s.class_id = ?
        AND s.status = 'active'
        AND r.result_id IS NULL
        `,
        [examId, examId, classId]
    );

    const missingMarks = Number(missingRows[0].missing_marks);

    return {
        ready: missingMarks === 0,
        total_students: totalStudents,
        total_subjects: totalSubjects,
        missing_marks: missingMarks,
        message: missingMarks === 0
            ? "All student marks are complete."
            : `${missingMarks} student-subject mark entries are still missing.`
    };
};

// Publish exam result
const publishExamResult = async (examId) => {
    const [result] = await db.query(
        `
        UPDATE exams
        SET status = 'published'
        WHERE exam_id = ?
        AND status = 'completed'
        `,
        [examId]
    );

    return result.affectedRows;
};

// Unpublish exam result
const unpublishExamResult = async (examId) => {
    const [result] = await db.query(
        `
        UPDATE exams
        SET status = 'completed'
        WHERE exam_id = ?
        AND status = 'published'
        `,
        [examId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    getPublicationReadiness,
    publishExamResult,
    unpublishExamResult
};
