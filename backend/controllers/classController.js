const classModel = require("../models/classModel");

// Get all classes
const getAllClasses = async (req, res) => {
    try {
        const classes = await classModel.getAllClasses();

        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        console.error("Get Classes Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch classes"
        });
    }
};

// Get class by ID
const getClassById = async (req, res) => {
    try {
        const { id } = req.params;

        const classData = await classModel.getClassById(id);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        res.json({
            success: true,
            data: classData
        });
    } catch (error) {
        console.error("Get Class Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch class"
        });
    }
};

// Create class
const createClass = async (req, res) => {
    try {
        const classData = req.body;

        if (!classData.class_name) {
            return res.status(400).json({
                success: false,
                message: "Class name is required"
            });
        }

        if (!classData.academic_year) {
            return res.status(400).json({
                success: false,
                message: "Academic year is required"
            });
        }

        const classId = await classModel.createClass(classData);

        res.status(201).json({
            success: true,
            message: "Class created successfully",
            class_id: classId
        });
    } catch (error) {
        console.error("Create Class Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create class"
        });
    }
};

// Update class
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const classData = req.body;

        const affectedRows = await classModel.updateClass(id, classData);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        res.json({
            success: true,
            message: "Class updated successfully"
        });
    } catch (error) {
        console.error("Update Class Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update class"
        });
    }
};

// Delete class
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        const affectedRows = await classModel.deleteClass(id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        res.json({
            success: true,
            message: "Class deleted successfully"
        });
    } catch (error) {
        console.error("Delete Class Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete class"
        });
    }
};

module.exports = {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
};