const Routine = require("../models/routineModel");

// Get all routines
const getAllRoutines = async (req, res) => {
    try {
        const routines = await Routine.getAllRoutines();

        res.status(200).json({
            success: true,
            message: "Routines retrieved successfully.",
            data: routines
        });
    } catch (error) {
        console.error("Get all routines error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve routines.",
            error: error.message
        });
    }
};

// Get routine by ID
const getRoutineById = async (req, res) => {
    try {
        const routine = await Routine.getRoutineById(req.params.id);

        if (!routine) {
            return res.status(404).json({
                success: false,
                message: "Routine not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Routine retrieved successfully.",
            data: routine
        });
    } catch (error) {
        console.error("Get routine by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve routine.",
            error: error.message
        });
    }
};

// Create routine
const createRoutine = async (req, res) => {
    try {
        const {
            class_id,
            section_id,
            subject_id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            room
        } = req.body;

        if (
            !class_id ||
            !subject_id ||
            !day_of_week ||
            !start_time ||
            !end_time
        ) {
            return res.status(400).json({
                success: false,
                message: "Class, subject, day, start time and end time are required."
            });
        }

        const routineId = await Routine.createRoutine({
            class_id,
            section_id,
            subject_id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            room
        });

        res.status(201).json({
            success: true,
            message: "Routine created successfully.",
            data: {
                routine_id: routineId
            }
        });
    } catch (error) {
        console.error("Create routine error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create routine.",
            error: error.message
        });
    }
};

// Update routine
const updateRoutine = async (req, res) => {
    try {
        const routineId = req.params.id;

        const affectedRows = await Routine.updateRoutine(
            routineId,
            req.body
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Routine not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Routine updated successfully."
        });
    } catch (error) {
        console.error("Update routine error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update routine.",
            error: error.message
        });
    }
};

// Delete routine
const deleteRoutine = async (req, res) => {
    try {
        const affectedRows = await Routine.deleteRoutine(req.params.id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Routine not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Routine deleted successfully."
        });
    } catch (error) {
        console.error("Delete routine error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete routine.",
            error: error.message
        });
    }
};

module.exports = {
    getAllRoutines,
    getRoutineById,
    createRoutine,
    updateRoutine,
    deleteRoutine
};