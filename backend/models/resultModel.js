
const db = require("../config/db");

// Validate exam, student, subject and section before saving marks
const validateResultData = async (resultData) => {
    const {
        exam_id,
        student_id,
        subject_id,
        section_id
    } = resultData;

    if (!section_id) {
        const error = new Error("Section ID is required");
        error.code = "INVALID_RESULT_ASSIGNMENT";
        throw error;
    }

    const [rows] = await db.query(
        `
        SELECT
            e.class_id AS exam_class_id,
            s.class_id AS student_class_id,
            s.section_id AS student_section_id,
            sub.class_id AS subject_class_id,
            sec.class_id AS section_class_id
        FROM exams e
        JOIN students s ON s.student_id = ?
        JOIN subjects sub ON sub.subject_id = ?
        JOIN sections sec ON sec.section_id = ?
        WHERE e.exam_id = ?
        `,
        [student_id, subject_id, section_id, exam_id]
    );

    if (rows.length === 0) {
        const error = new Error(
            "Invalid exam, student, subject or section"
        );
        error.code = "INVALID_RESULT_ASSIGNMENT";
        throw error;
    }

    const data = rows[0];

    if (Number(data.student_class_id) !== Number(data.exam_class_id)) {
        const error = new Error(
            "Student does not belong to the selected exam class"
        );
        error.code = "INVALID_RESULT_ASSIGNMENT";
        throw error;
    }

    if (Number(data.student_section_id) !== Number(section_id)) {
        const error = new Error(
            "Student does not belong to the selected section"
        );
        error.code = "INVALID_RESULT_ASSIGNMENT";
        throw error;
    }

    if (Number(data.section_class_id) !== Number(data.exam_class_id)) {
        const error = new Error(
            "Selected section does not belong to the exam class"
        );
        error.code = "INVALID_RESULT_ASSIGNMENT";
        throw error;
    }

    if (Number(data.subject_class_id) !== Number(data.exam_class_id)) {
        const error = new Error(
            "Subject does not belong to the selected exam class"
        );
        error.code = "INVALID_RESULT_ASSIGNMENT";
        throw error;
    }
};

// Get all results
const getAllResults = async () => {
    const [rows] = await db.query(
        `SELECT r.*,
                s.full_name,
                s.roll_number,
                sub.subject_name,
                e.exam_name
         FROM results r
         JOIN students s ON r.student_id = s.student_id
         JOIN subjects sub ON r.subject_id = sub.subject_id
         JOIN exams e ON r.exam_id = e.exam_id
         ORDER BY r.result_id DESC`
    );

    return rows;
};

// Get result by ID
const getResultById = async (resultId) => {
    const [rows] = await db.query(
        "SELECT * FROM results WHERE result_id = ?",
        [resultId]
    );

    return rows[0];
};

// Get existing result by exam, student and subject
const getResultByExamStudentSubject = async (
    examId,
    studentId,
    subjectId
) => {
    const [rows] = await db.query(
        `SELECT result_id
         FROM results
         WHERE exam_id = ?
           AND student_id = ?
           AND subject_id = ?
         LIMIT 1`,
        [examId, studentId, subjectId]
    );

    return rows[0];
};

// Search students by ID, code, name, email, phone or roll
const searchStudents = async (searchTerm) => {
    const searchValue = `%${searchTerm}%`;

    const [rows] = await db.query(
        `
        SELECT
            s.student_id,
            s.student_code,
            s.full_name,
            s.gender,
            s.date_of_birth,
            s.blood_group,
            s.phone,
            s.email,
            s.address,
            s.admission_date,
            s.class_id,
            c.class_name,
            s.section_id,
            sec.section_name,
            s.roll_number,
            s.guardian_name,
            s.guardian_phone,
            s.status
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.class_id
        LEFT JOIN sections sec ON s.section_id = sec.section_id
        WHERE
            CAST(s.student_id AS CHAR) LIKE ?
            OR s.student_code LIKE ?
            OR s.full_name LIKE ?
            OR s.email LIKE ?
            OR s.phone LIKE ?
            OR CAST(s.roll_number AS CHAR) LIKE ?
        ORDER BY s.full_name ASC, s.student_id ASC
        `,
        [
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue,
            searchValue
        ]
    );

    return rows;
};

// Get results by student ID
const getResultsByStudentId = async (studentId) => {
    const [rows] = await db.query(
        `SELECT
            r.*,
            sub.subject_name,
            e.exam_name,
            e.result_status,
            e.published_at
         FROM results r
         JOIN subjects sub ON r.subject_id = sub.subject_id
         JOIN exams e ON r.exam_id = e.exam_id
         WHERE r.student_id = ?
         ORDER BY e.start_date DESC`,
        [studentId]
    );

    return rows;
};

// Get results by exam ID
const getResultsByExamId = async (examId) => {
    const [rows] = await db.query(
        `SELECT r.*, s.full_name, s.roll_number, sub.subject_name
         FROM results r
         JOIN students s ON r.student_id = s.student_id
         JOIN subjects sub ON r.subject_id = sub.subject_id
         WHERE r.exam_id = ?
         ORDER BY s.roll_number ASC`,
        [examId]
    );

    return rows;
};

// Create result
const createResult = async (resultData) => {
    await validateResultData(resultData);

    const [result] = await db.query(
        `INSERT INTO results
        (exam_id, student_id, subject_id, marks, grade, grade_point, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            resultData.exam_id,
            resultData.student_id,
            resultData.subject_id,
            resultData.marks,
            resultData.grade,
            resultData.grade_point,
            resultData.remarks
        ]
    );

    return result.insertId;
};

// Update result
const updateResult = async (resultId, resultData) => {
    await validateResultData(resultData);

    const [result] = await db.query(
        `UPDATE results
         SET exam_id = ?,
             student_id = ?,
             subject_id = ?,
             marks = ?,
             grade = ?,
             grade_point = ?,
             remarks = ?
         WHERE result_id = ?`,
        [
            resultData.exam_id,
            resultData.student_id,
            resultData.subject_id,
            resultData.marks,
            resultData.grade,
            resultData.grade_point,
            resultData.remarks,
            resultId
        ]
    );

    return result.affectedRows;
};

// Delete result
const deleteResult = async (resultId) => {
    const [result] = await db.query(
        "DELETE FROM results WHERE result_id = ?",
        [resultId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllResults,
    getResultById,
    getResultByExamStudentSubject,
    searchStudents,
    getResultsByStudentId,
    getResultsByExamId,
    createResult,
    updateResult,
    deleteResult
};
