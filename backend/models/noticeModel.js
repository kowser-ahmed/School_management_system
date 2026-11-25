const db = require("../config/db");

class NoticeModel {

    // Get all published notices visible to the user
    async getAllNotices(role = "all") {
    let query;
    let params = [];

    if (role === "admin") {
        // Admin can see all notices, including drafts
        query = `
            SELECT
                notice_id,
                title,
                content,
                target_role,
                publish_date,
                created_by,
                status
            FROM notices
            ORDER BY publish_date DESC
        `;
    } else {
        // Other roles see only published notices
        // targeted to everyone or their own role
        query = `
            SELECT
                notice_id,
                title,
                content,
                target_role,
                publish_date,
                created_by,
                status
            FROM notices
            WHERE status = 'published'
              AND (target_role = 'all' OR target_role = ?)
            ORDER BY publish_date DESC
        `;

        params = [role];
    }

    const [rows] = await db.query(query, params);

    return rows;
} 

    // Get a notice by ID
    async getNoticeById(id) {
        const [rows] = await db.query(
            `SELECT 
                notice_id,
                title,
                content,
                target_role,
                publish_date,
                created_by,
                status
             FROM notices
             WHERE notice_id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    // Create a new notice
    async createNotice(data) {
        const {
            title,
            content,
            target_role,
            publish_date,
            created_by,
            status
        } = data;

        const [result] = await db.query(
            `INSERT INTO notices
                (title, content, target_role, publish_date, created_by, status)
             VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?)`,
            [
                title,
                content,
                target_role,
                publish_date,
                created_by,
                status
            ]
        );

        return result.insertId;
    }

    // Update an existing notice
    async updateNotice(id, data) {
        const {
            title,
            content,
            target_role,
            publish_date,
            status
        } = data;

        const [result] = await db.query(
            `UPDATE notices
             SET title = ?,
                 content = ?,
                 target_role = ?,
                 publish_date = COALESCE(?, publish_date),
                 status = ?
             WHERE notice_id = ?`,
            [
                title,
                content,
                target_role,
                publish_date,
                status,
                id
            ]
        );

        return result.affectedRows;
    }

    // Delete a notice
    async deleteNotice(id) {
        const [result] = await db.query(
            `DELETE FROM notices
             WHERE notice_id = ?`,
            [id]
        );

        return result.affectedRows;
    }
}

module.exports = new NoticeModel();