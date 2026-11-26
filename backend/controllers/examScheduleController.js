
const ExamSchedule = require("../models/examScheduleModel");

// Get all exam schedules
const getAllExamSchedules = async (req, res) => {
    try {
        const schedules = await ExamSchedule.getAllExamSchedules();

        res.status(200).json({
            success: true,
            message: "Exam schedules retrieved successfully.",
            data: schedules
        });
    } catch (error) {
        console.error("Get exam schedules error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve exam schedules."
        });
    }
};

// Get schedule by ID
const getExamScheduleById = async (req, res) => {
    try {
        const scheduleId = Number(req.params.id);

        if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule ID."
            });
        }

        const schedule = await ExamSchedule.getExamScheduleById(scheduleId);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Exam schedule not found."
            });
        }

        res.status(200).json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error("Get schedule error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve exam schedule."
        });
    }
};

// Get schedules by exam ID
const getSchedulesByExamId = async (req, res) => {
    try {
        const examId = Number(req.params.examId);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID."
            });
        }

        const schedules = await ExamSchedule.getSchedulesByExamId(examId);

        res.status(200).json({
            success: true,
            data: schedules
        });
    } catch (error) {
        console.error("Get schedules by exam error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve exam schedules."
        });
    }
};

// Create exam schedule
const createExamSchedule = async (req, res) => {
    try {
        const {
            exam_id,
            subject_id,
            exam_date,
            start_time,
            end_time,
            room,
            room_number
        } = req.body;

        if (!Number.isInteger(Number(exam_id)) || Number(exam_id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid exam ID is required."
            });
        }

        if (!Number.isInteger(Number(subject_id)) || Number(subject_id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid subject ID is required."
            });
        }

        if (!exam_date) {
            return res.status(400).json({
                success: false,
                message: "Exam date is required."
            });
        }

        if (start_time && end_time && start_time >= end_time) {
            return res.status(400).json({
                success: false,
                message: "End time must be later than start time."
            });
        }

        const scheduleId = await ExamSchedule.createExamSchedule({
            exam_id: Number(exam_id),
            subject_id: Number(subject_id),
            exam_date,
            start_time: start_time || null,
            end_time: end_time || null,
            room: room || room_number || null
        });

        res.status(201).json({
            success: true,
            message: "Exam schedule created successfully.",
            data: {
                schedule_id: scheduleId
            }
        });
    } catch (error) {
        console.error("Create exam schedule error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create exam schedule."
        });
    }
};

// Update exam schedule
const updateExamSchedule = async (req, res) => {
    try {
        const scheduleId = Number(req.params.id);

        if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule ID."
            });
        }

        const {
            exam_id,
            subject_id,
            exam_date,
            start_time,
            end_time,
            room,
            room_number
        } = req.body;

        if (
            !Number.isInteger(Number(exam_id)) ||
            Number(exam_id) <= 0 ||
            !Number.isInteger(Number(subject_id)) ||
            Number(subject_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid exam ID and subject ID are required."
            });
        }

        if (!exam_date) {
            return res.status(400).json({
                success: false,
                message: "Exam date is required."
            });
        }

        if (start_time && end_time && start_time >= end_time) {
            return res.status(400).json({
                success: false,
                message: "End time must be later than start time."
            });
        }

        const affectedRows = await ExamSchedule.updateExamSchedule(
            scheduleId,
            {
                exam_id: Number(exam_id),
                subject_id: Number(subject_id),
                exam_date,
                start_time: start_time || null,
                end_time: end_time || null,
                room: room || room_number || null
            }
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Exam schedule not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Exam schedule updated successfully."
        });
    } catch (error) {
        console.error("Update exam schedule error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update exam schedule."
        });
    }
};

// Delete exam schedule
const deleteExamSchedule = async (req, res) => {
    try {
        const scheduleId = Number(req.params.id);

        if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule ID."
            });
        }

        const affectedRows = await ExamSchedule.deleteExamSchedule(scheduleId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Exam schedule not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Exam schedule deleted successfully."
        });
    } catch (error) {
        console.error("Delete exam schedule error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete exam schedule."
        });
    }
};

module.exports = {
    getAllExamSchedules,
    getExamScheduleById,
    getSchedulesByExamId,
    createExamSchedule,
    updateExamSchedule,
    deleteExamSchedule
};
