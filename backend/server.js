const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env"),
    override: true
});

console.log("DB USER:", process.env.DB_USER);
console.log("DB PASSWORD LENGTH:", process.env.DB_PASSWORD?.length);

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
});

app.get("/", (req, res) => {
    res.json({
        message: "School Management Software Backend is running!"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS test");

        res.json({
            success: true,
            message: "MySQL database connected successfully!",
            data: rows
        });
    } catch (error) {
        console.error("Database Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed!",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});