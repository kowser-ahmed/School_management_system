
const db = require("../config/db");

class HolidayModel {

    // Get all holidays
    async getAllHolidays() {
        const [rows] = await db.execute(
            "SELECT * FROM holidays ORDER BY start_date ASC"
        );

        return rows;
    }

    // Get holiday by ID
    async getHolidayById(holidayId) {
        const [rows] = await db.execute(
            "SELECT * FROM holidays WHERE holiday_id = ?",
            [holidayId]
        );

        return rows[0];
    }

    // Create a new holiday
    async createHoliday(holidayData) {
        const {
            holiday_name,
            start_date,
            end_date,
            description
        } = holidayData;

        const [result] = await db.execute(
            `INSERT INTO holidays
            (holiday_name, start_date, end_date, description)
            VALUES (?, ?, ?, ?)`,
            [
                holiday_name,
                start_date,
                end_date,
                description || null
            ]
        );

        return result.insertId;
    }

    // Update an existing holiday
    async updateHoliday(holidayId, holidayData) {
        const {
            holiday_name,
            start_date,
            end_date,
            description
        } = holidayData;

        const [result] = await db.execute(
            `UPDATE holidays
            SET holiday_name = ?,
                start_date = ?,
                end_date = ?,
                description = ?
            WHERE holiday_id = ?`,
            [
                holiday_name,
                start_date,
                end_date,
                description || null,
                holidayId
            ]
        );

        return result.affectedRows;
    }

    // Delete a holiday
    async deleteHoliday(holidayId) {
        const [result] = await db.execute(
            "DELETE FROM holidays WHERE holiday_id = ?",
            [holidayId]
        );

        return result.affectedRows;
    }
}

module.exports = new HolidayModel();
