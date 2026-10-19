
const db = require("../config/db");

// Get all sections
const getAllSections = async () => {
    const [rows] = await db.query(`
        SELECT
            section_id,
            class_id,
            section_name,
            capacity
        FROM sections
        ORDER BY section_id DESC
    `);

    return rows;
};

// Get section by ID
const getSectionById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM sections WHERE section_id = ?",
        [id]
    );

    return rows[0];
};

// Create section
const createSection = async (sectionData) => {
    const { class_id, section_name, capacity } = sectionData;

    const [result] = await db.query(
        `INSERT INTO sections (class_id, section_name, capacity)
         VALUES (?, ?, ?)`,
        [class_id, section_name, capacity ?? 40]
    );

    return result.insertId;
};

// Update section
const updateSection = async (id, sectionData) => {
    const { class_id, section_name, capacity } = sectionData;

    const [result] = await db.query(
        `UPDATE sections
         SET class_id = ?, section_name = ?, capacity = ?
         WHERE section_id = ?`,
        [class_id, section_name, capacity, id]
    );

    return result.affectedRows;
};

// Delete section
const deleteSection = async (id) => {
    const [result] = await db.query(
        "DELETE FROM sections WHERE section_id = ?",
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAllSections,
    getSectionById,
    createSection,
    updateSection,
    deleteSection
};
