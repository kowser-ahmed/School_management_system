
const db = require("../config/db");

// Get all staff
const getAllStaff = async () => {
    const [rows] = await db.query(`
        SELECT
            staff_id,
            user_id,
            employee_code,
            full_name,
            gender,
            phone,
            email,
            designation,
            joining_date,
            salary,
            status
        FROM staff
        ORDER BY staff_id DESC
    `);

    return rows;
};

// Get staff by ID
const getStaffById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM staff WHERE staff_id = ?",
        [id]
    );

    return rows[0];
};

// Create staff
const createStaff = async (staff) => {
    const {
        user_id,
        employee_code,
        full_name,
        gender,
        phone,
        email,
        designation,
        joining_date,
        salary,
        status
    } = staff;

    const [result] = await db.query(
        `
        INSERT INTO staff
        (
            user_id,
            employee_code,
            full_name,
            gender,
            phone,
            email,
            designation,
            joining_date,
            salary,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            user_id,
            employee_code,
            full_name,
            gender,
            phone,
            email,
            designation,
            joining_date,
            salary,
            status || "active"
        ]
    );

    return result.insertId;
};

// Update staff
const updateStaff = async (id, staff) => {
    const {
        user_id,
        employee_code,
        full_name,
        gender,
        phone,
        email,
        designation,
        joining_date,
        salary,
        status
    } = staff;

    const [result] = await db.query(
        `
        UPDATE staff
        SET
            user_id = ?,
            employee_code = ?,
            full_name = ?,
            gender = ?,
            phone = ?,
            email = ?,
            designation = ?,
            joining_date = ?,
            salary = ?,
            status = ?
        WHERE staff_id = ?
        `,
        [
            user_id,
            employee_code,
            full_name,
            gender,
            phone,
            email,
            designation,
            joining_date,
            salary,
            status || "active",
            id
        ]
    );

    return result.affectedRows;
};

// Delete staff
const deleteStaff = async (id) => {
    const [result] = await db.query(
        "DELETE FROM staff WHERE staff_id = ?",
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff
};
