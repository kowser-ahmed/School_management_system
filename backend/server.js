
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
const sectionRoutes = require("./routes/sectionRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const staffRoutes = require("./routes/staffRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const accountsRoutes = require("./routes/accountsRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const examRoutes = require("./routes/examRoutes");
const examScheduleRoutes = require("./routes/examScheduleRoutes");
const resultRoutes = require("./routes/resultRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const teacherAssignmentRoutes = require("./routes/teacherAssignmentRoutes");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);


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
app.post("/api/test-validation", (req, res) => {
    console.log("TEST VALIDATION ROUTE HIT");
    console.log("Received body:", req.body);

    res.status(400).json({
        success: false,
        message: "Express test route working"
    });
});

app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exam-schedules", examScheduleRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/teacher-assignments", teacherAssignmentRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/teacher-assignments", teacherAssignmentRoutes);
app.use("/api/leaves", leaveRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on("close", () => {
    console.log("SERVER HAS CLOSED");
});

server.on("error", (error) => {
    console.error("SERVER ERROR:", error);
});

setInterval(() => {
    console.log("Server is still alive...");
}, 5000);
