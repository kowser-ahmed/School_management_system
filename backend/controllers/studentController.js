
const studentModel = require("../models/studentModel");

// Validate student input
const validateStudent = (student) => {
    if (!student.student_code || !student.student_code.trim()) {
        return "Student code is required";
    }

    if (!student.full_name || !student.full_name.trim()) {
        return "Student name is required";
    }

    if (student.student_code.trim().length > 30) {
        return "Student code cannot exceed 30 characters";
    }

    if (student.full_name.trim().length > 100) {
        return "Student name cannot exceed 100 characters";
    }

    if (
        student.gender &&
        !["male", "female", "other"].includes(student.gender)
    ) {
        return "Invalid gender";
    }

    if (
        student.status &&
        !["active", "inactive", "transferred"].includes(
            student.status.toLowerCase()
        )
    ) {
        return "Invalid student status";
    }

    const phoneRegex = /^01[3-9]\d{8}$/;

    if (student.phone && !phoneRegex.test(student.phone)) {
        return "Enter a valid 11-digit Bangladesh phone number";
    }

    if (student.guardian_phone && !phoneRegex.test(student.guardian_phone)) {
        return "Enter a valid guardian phone number";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (student.email && !emailRegex.test(student.email)) {
        return "Enter a valid email address";
    }

    const numberFields = ["class_id", "section_id", "roll_number"];

    for (const field of numberFields) {
        if (
            student[field] !== undefined &&
            student[field] !== null &&
            student[field] !== ""
        ) {
            if (
                !Number.isInteger(Number(student[field])) ||
                Number(student[field]) <= 0
            ) {
                return `${field.replace("_", " ")} must be a positive number`;
            }
        }
    }

    return null;
};

// Validate ID
const validId = (id) => {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
};

// Get all students
const getAllStudents = async (req, res) => {
    try {
        const students = await studentModel.getAllStudents();

        return res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error("Get Students Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};

// Get student by ID
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const student = await studentModel.getStudentById(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error("Get Student Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch student"
        });
    }
};

// Create student
const createStudent = async (req, res) => {
    try {
        const student = req.body || {};

        const validationError = validateStudent(student);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const payload = {
            ...student,
            student_code: student.student_code.trim(),
            full_name: student.full_name.trim(),
            admission_date: student.admission_date || null,
            date_of_birth: student.date_of_birth || null,
            class_id: student.class_id || null,
            section_id: student.section_id || null,
            roll_number: student.roll_number || null,
            status: student.status
                ? student.status.toLowerCase()
                : "active"
        };

        const studentId = await studentModel.createStudent(payload);

        return res.status(201).json({
            success: true,
            message: "Student created successfully",
            student_id: studentId
        });

    } catch (error) {
        console.error("Create Student Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
    let message = "Duplicate student information already exists.";

    if (error.message?.includes("uq_students_class_section_roll")) {
        message = "This roll number already exists in this class and section.";
    } else if (error.message?.includes("student_code")) {
        message = "Student Code already exists.";
    } else if (error.message?.includes("user_id")) {
        message = "This User ID is already linked to another student.";
    }

    return res.status(409).json({ message });
}

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Invalid class, section, or user ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create student"
        });
    }
};

// Update student
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = req.body || {};

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const validationError = validateStudent(student);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const payload = {
            ...student,
            student_code: student.student_code.trim(),
            full_name: student.full_name.trim(),
            admission_date: student.admission_date || null,
            date_of_birth: student.date_of_birth || null,
            class_id: student.class_id || null,
            section_id: student.section_id || null,
            roll_number: student.roll_number || null,
            status: student.status
                ? student.status.toLowerCase()
                : "active"
        };

        const affectedRows = await studentModel.updateStudent(id, payload);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.json({
            success: true,
            message: "Student updated successfully"
        });

    } catch (error) {
        console.error("Update Student Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Student code or user ID already exists"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Invalid class, section, or user ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};

// Delete student
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const affectedRows = await studentModel.deleteStudent(id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error("Delete Student Error:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this student because related records exist"
            });
        }

        return res.status(500).json({
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
