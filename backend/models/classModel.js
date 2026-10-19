const db = require("../config/db");

// Get all classes
const getAllClasses = async () => {
    const [rows] = await db.query(`
        SELECT
            class_id,
            class_name,
            academic_year,
            status
        FROM classes
        ORDER BY class_id DESC
    `);

    return rows;
};

// Get class by ID
const getClassById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM classes WHERE class_id = ?",
        [id]
    );

    return rows[0];
};

// Create class
const createClass = async (classData) => {
    const {
        class_name,
        academic_year,
        status
    } = classData;

    const [result] = await db.query(
        `
        INSERT INTO classes
        (
            class_name,
            academic_year,
            status
        )
        VALUES (?, ?, ?)
        `,
        [
            class_name,
            academic_year,
            status || "active"
        ]
    );

    return result.insertId;
};

// Update class
const updateClass = async (id, classData) => {
    const {
        class_name,
        academic_year,
        status
    } = classData;

    const [result] = await db.query(
        `
        UPDATE classes
        SET
            class_name = ?,
            academic_year = ?,
            status = ?
        WHERE class_id = ?
        `,
        [
            class_name,
            academic_year,
            status,
            id
        ]
    );

    return result.affectedRows;
};

// Delete class
const deleteClass = async (id) => {
    const [result] = await db.query(
        "DELETE FROM classes WHERE class_id = ?",
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
};