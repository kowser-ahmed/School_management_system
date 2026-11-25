const db = require("../config/db");

// Get all routines
const getAllRoutines = async () => {
    const [rows] = await db.query(`
        SELECT
            r.routine_id,
            r.class_id,
            c.class_name,
            r.section_id,
            r.subject_id,
            s.subject_name,
            r.teacher_id,
            t.full_name AS teacher_name,
            r.day_of_week,
            r.start_time,
            r.end_time,
            r.room
        FROM routines r
        LEFT JOIN classes c ON r.class_id = c.class_id
        LEFT JOIN subjects s ON r.subject_id = s.subject_id
        LEFT JOIN teachers t ON r.teacher_id = t.teacher_id
        ORDER BY r.routine_id DESC
    `);

    return rows;
};

// Get routine by ID
const getRoutineById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
            r.routine_id,
            r.class_id,
            c.class_name,
            r.section_id,
            r.subject_id,
            s.subject_name,
            r.teacher_id,
            t.full_name AS teacher_name,
            r.day_of_week,
            r.start_time,
            r.end_time,
            r.room
        FROM routines r
        LEFT JOIN classes c ON r.class_id = c.class_id
        LEFT JOIN subjects s ON r.subject_id = s.subject_id
        LEFT JOIN teachers t ON r.teacher_id = t.teacher_id
        WHERE r.routine_id = ?
        `,
        [id]
    );

    return rows[0];
};

// Create routine
const createRoutine = async (routineData) => {
    const {
        class_id,
        section_id = null,
        subject_id,
        teacher_id = null,
        day_of_week,
        start_time,
        end_time,
        room = null
    } = routineData;

    const [result] = await db.query(
        `
        INSERT INTO routines
        (
            class_id,
            section_id,
            subject_id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            room
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            class_id,
            section_id,
            subject_id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            room
        ]
    );

    return result.insertId;
};

// Update routine
const updateRoutine = async (id, routineData) => {
    const {
        class_id,
        section_id = null,
        subject_id,
        teacher_id = null,
        day_of_week,
        start_time,
        end_time,
        room = null
    } = routineData;

    const [result] = await db.query(
        `
        UPDATE routines
        SET
            class_id = ?,
            section_id = ?,
            subject_id = ?,
            teacher_id = ?,
            day_of_week = ?,
            start_time = ?,
            end_time = ?,
            room = ?
        WHERE routine_id = ?
        `,
        [
            class_id,
            section_id,
            subject_id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            room,
            id
        ]
    );

    return result.affectedRows;
};

// Delete routine
const deleteRoutine = async (id) => {
    const [result] = await db.query(
        "DELETE FROM routines WHERE routine_id = ?",
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAllRoutines,
    getRoutineById,
    createRoutine,
    updateRoutine,
    deleteRoutine
};