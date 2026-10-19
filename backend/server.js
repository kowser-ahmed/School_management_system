const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env"),
    override: true
});

const db = require("./config/db");
const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Test backend
app.get("/", (req, res) => {
    res.json({
        message: "School Management Software Backend is running!"
    });
});

// Test database
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

// Student routes
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});