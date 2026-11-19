const db = require("../config/db");

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
    getResultsByStudentId,
    getResultsByExamId,
    createResult,
    updateResult,
    deleteResult
};