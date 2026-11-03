const db = require("../config/db");
const { createAttendanceToken } = require("../middleware/attendanceAuthorization");

const issueToken = async () => {
    const userId = Number(process.argv[2]);
    const lifetimeHours = process.argv[3] === undefined ? 8 : Number(process.argv[3]);
    if (!Number.isInteger(userId) || userId < 1 || !Number.isInteger(lifetimeHours)) {
        throw new Error("Usage: node backend/scripts/createAttendanceToken.js <user_id> [hours: 1-168]");
    }

    const [rows] = await db.query(
        "SELECT user_id, role FROM users WHERE user_id = ? AND status = 'active'",
        [userId]
    );
    if (!rows[0]) {
        throw new Error("Active user account not found");
    }

    const token = createAttendanceToken(rows[0], lifetimeHours * 60 * 60);
    console.log(token);
};

issueToken()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => db.end());