
const teacherModel = require("../models/teacherModel");

// Handle teacher errors
const handleTeacherError = (error, res) => {
    if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        const errorMessage = error.message?.toLowerCase() || "";

        if (
            errorMessage.includes("employee_code") ||
            errorMessage.includes("employee code")
        ) {
            return res.status(409).json({
                success: false,
                message: "Employee Code already exists."
            });
        }

        return res.status(409).json({
            success: false,
            message: "Duplicate teacher information already exists."
        });
    }

    return res.status(500).json({
        success: false,
        message: error.message || "Internal server error"
    });
};

// Get all teachers
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await teacherModel.getAllTeachers();

        res.status(200).json({
            success: true,
            data: teachers
        });

    } catch (error) {
        return handleTeacherError(error, res);
    }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
    try {
        const teacher = await teacherModel.getTeacherById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: teacher
        });

    } catch (error) {
        return handleTeacherError(error, res);
    }
};

// Create teacher
const createTeacher = async (req, res) => {
    try {
        const { employee_code, full_name } = req.body;

        if (!employee_code || !full_name) {
            return res.status(400).json({
                success: false,
                message: "Employee code and full name are required"
            });
        }

        const teacherId = await teacherModel.createTeacher(req.body);

        return res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            teacher_id: teacherId
        });

    } catch (error) {
        return handleTeacherError(error, res);
    }
};

// Update teacher
const updateTeacher = async (req, res) => {
    try {
        const teacher = await teacherModel.getTeacherById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const affectedRows = await teacherModel.updateTeacher(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: affectedRows > 0
                ? "Teacher updated successfully"
                : "No changes made"
        });

    } catch (error) {
        return handleTeacherError(error, res);
    }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
    try {
        const affectedRows = await teacherModel.deleteTeacher(req.params.id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Teacher deleted successfully"
        });

    } catch (error) {
        return handleTeacherError(error, res);
    }
};

module.exports = {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
};
