
const db = require("../config/db");

// Get all exam schedules
const getAllExamSchedules = async () => {
    const [rows] = await db.query(`
        SELECT
            es.schedule_id,
            es.exam_id,
            e.exam_name,
            e.class_id,
            c.class_name,
            es.subject_id,
            s.subject_name,
            es.exam_date,
            es.start_time,
            es.end_time,
            es.room
        FROM exam_schedule es
        JOIN exams e ON es.exam_id = e.exam_id
        JOIN classes c ON e.class_id = c.class_id
        JOIN subjects s ON es.subject_id = s.subject_id
        ORDER BY es.exam_date ASC
    `);

    return rows;
};

// Get schedule by ID
const getExamScheduleById = async (scheduleId) => {
    const [rows] = await db.query(
        "SELECT * FROM exam_schedule WHERE schedule_id = ?",
        [scheduleId]
    );

    return rows[0];
};

// Get schedules by exam ID
const getSchedulesByExamId = async (examId) => {
    const [rows] = await db.query(
        `SELECT
            es.*,
            s.subject_name,
            s.subject_code
         FROM exam_schedule es
         JOIN subjects s ON es.subject_id = s.subject_id
         WHERE es.exam_id = ?
         ORDER BY es.exam_date ASC`,
        [examId]
    );

    return rows;
};

// Create exam schedule
const createExamSchedule = async (scheduleData) => {
    const [result] = await db.query(
        `INSERT INTO exam_schedule
        (exam_id, subject_id, exam_date, start_time, end_time, room)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            scheduleData.exam_id,
            scheduleData.subject_id,
            scheduleData.exam_date,
            scheduleData.start_time,
            scheduleData.end_time,
            scheduleData.room
        ]
    );

    return result.insertId;
};

// Update exam schedule
const updateExamSchedule = async (scheduleId, scheduleData) => {
    const [result] = await db.query(
        `UPDATE exam_schedule
         SET exam_id = ?,
             subject_id = ?,
             exam_date = ?,
             start_time = ?,
             end_time = ?,
             room = ?
         WHERE schedule_id = ?`,
        [
            scheduleData.exam_id,
            scheduleData.subject_id,
            scheduleData.exam_date,
            scheduleData.start_time,
            scheduleData.end_time,
            scheduleData.room,
            scheduleId
        ]
    );

    return result.affectedRows;
};

// Delete exam schedule
const deleteExamSchedule = async (scheduleId) => {
    const [result] = await db.query(
        "DELETE FROM exam_schedule WHERE schedule_id = ?",
        [scheduleId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllExamSchedules,
    getExamScheduleById,
    getSchedulesByExamId,
    createExamSchedule,
    updateExamSchedule,
    deleteExamSchedule
};
