const express = require("express");

const {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} = require("../controllers/studentController");

const router = express.Router();

// Get all students
router.get("/", getAllStudents);

// Get student by ID
router.get("/:id", getStudentById);

// Create student
router.post("/", createStudent);
// Update student
router.put("/:id", updateStudent);
// Delete student
router.delete("/:id", deleteStudent);

module.exports = router;