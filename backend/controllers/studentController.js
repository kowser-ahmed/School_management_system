const studentModel = require("../models/studentModel");

// Get all students
const getAllStudents = async (req, res) => {
    try {
        const students = await studentModel.getAllStudents();

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error("Get Students Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};

// Get student by ID
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await studentModel.getStudentById(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error("Get Student Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch student"
        });
    }
};

// Create student
const createStudent = async (req, res) => {
    try {
        const student = req.body;

        if (!student.full_name) {
            return res.status(400).json({
                success: false,
                message: "Student name is required"
            });
        }

        const studentId = await studentModel.createStudent(student);

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            student_id: studentId
        });
    } catch (error) {
        console.error("Create Student Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create student"
        });
    }
};

const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = req.body;

        const affectedRows = await studentModel.updateStudent(id, student);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            message: "Student updated successfully"
        });
    } catch (error) {
        console.error("Update Student Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const affectedRows = await studentModel.deleteStudent(id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            message: "Student deleted successfully"
        });
    } catch (error) {
        console.error("Delete Student Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
};
module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};