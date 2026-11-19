const db = require("../config/db");

async function testConnection() {
    try {
        const connection = await db.getConnection();

        console.log("MySQL Database Connected Successfully!");

        const [rows] = await connection.query(
            "SELECT DATABASE() AS database_name"
        );

        console.log("Database:", rows[0].database_name);

        connection.release();
        await db.end();
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        await db.end();
    }
}

testConnection();