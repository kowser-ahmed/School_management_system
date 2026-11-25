
const db = require("../config/db");

// Get all leave applications
const getAllLeaves = async () => {
    const [rows] = await db.query(
        `SELECT
            l.*,
            u.full_name,
            u.email,
            u.role
         FROM leave_records l
         JOIN users u ON l.user_id = u.user_id
         ORDER BY l.leave_id DESC`
    );

    return rows;
};

// Get leave by ID
const getLeaveById = async (leaveId) => {
    const [rows] = await db.query(
        `SELECT
            l.*,
            u.full_name,
            u.email,
            u.role
         FROM leave_records l
         JOIN users u ON l.user_id = u.user_id
         WHERE l.leave_id = ?`,
        [leaveId]
    );

    return rows[0];
};

// Get leaves by user ID
const getLeavesByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT *
         FROM leave_records
         WHERE user_id = ?
         ORDER BY leave_id DESC`,
        [userId]
    );

    return rows;
};

// Create leave application
const createLeave = async (leaveData) => {
    const [result] = await db.query(
        `INSERT INTO leave_records
        (user_id, leave_type, start_date, end_date, reason)
        VALUES (?, ?, ?, ?, ?)`,
        [
            leaveData.user_id,
            leaveData.leave_type,
            leaveData.start_date,
            leaveData.end_date,
            leaveData.reason
        ]
    );

    return result.insertId;
};

// Update leave application
const updateLeave = async (leaveId, leaveData) => {
    const [result] = await db.query(
        `UPDATE leave_records
         SET leave_type = ?,
             start_date = ?,
             end_date = ?,
             reason = ?
         WHERE leave_id = ?
         AND status = 'pending'`,
        [
            leaveData.leave_type,
            leaveData.start_date,
            leaveData.end_date,
            leaveData.reason,
            leaveId
        ]
    );

    return result.affectedRows;
};

// Approve or reject leave
const updateLeaveStatus = async (leaveId, status, approvedBy) => {
    const [result] = await db.query(
        `UPDATE leave_records
         SET status = ?,
             approved_by = ?
         WHERE leave_id = ?
         AND status = 'pending'`,
        [
            status,
            approvedBy,
            leaveId
        ]
    );

    return result.affectedRows;
};

// Delete leave application
const deleteLeave = async (leaveId) => {
    const [result] = await db.query(
        `DELETE FROM leave_records
         WHERE leave_id = ?
         AND status = 'pending'`,
        [leaveId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllLeaves,
    getLeaveById,
    getLeavesByUserId,
    createLeave,
    updateLeave,
    updateLeaveStatus,
    deleteLeave
};
