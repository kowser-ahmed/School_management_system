const db = require("../config/db");

// Get all exams
const getAllExams = async () => {
    const [rows] = await db.query(
        "SELECT * FROM exams ORDER BY exam_id DESC"
    );
    return rows;
};

// Get exam by ID
const getExamById = async (examId) => {
    const [rows] = await db.query(
        "SELECT * FROM exams WHERE exam_id = ?",
        [examId]
    );
    return rows[0];
};

// Create a new exam
const createExam = async (examData) => {
    const [result] = await db.query(
        `INSERT INTO exams
        (exam_name, class_id, academic_year, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?)`,
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
        `UPDATE exams
        SET exam_name = ?,
            class_id = ?,
            academic_year = ?,
            start_date = ?,
            end_date = ?,
            status = ?
        WHERE exam_id = ?`,
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
        "DELETE FROM exams WHERE exam_id = ?",
        [examId]
    );
    return result.affectedRows;
};
// Publish exam result
const publishExamResult = async (examId) => {
    const [result] = await db.query(
        `UPDATE exams
         SET result_status = 'published',
             published_at = NOW()
         WHERE exam_id = ?`,
        [examId]
    );

    return result.affectedRows;
};

// Unpublish exam result
const unpublishExamResult = async (examId) => {
    const [result] = await db.query(
        `UPDATE exams
         SET result_status = 'draft',
             published_at = NULL
         WHERE exam_id = ?`,
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
    publishExamResult,
    unpublishExamResult
};
  