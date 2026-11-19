const Exam = require("../models/examModel");

// Get all exams
const getAllExams = async (req, res) => {
    try {
        const exams = await Exam.getAllExams();

        res.status(200).json({
            success: true,
            message: "Exams retrieved successfully.",
            data: exams
        });
    } catch (error) {
        console.error("Get all exams error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve exams."
        });
    }
};

// Get exam by ID
const getExamById = async (req, res) => {
    try {
        const examId = Number(req.params.id);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID."
            });
        }

        const exam = await Exam.getExamById(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found."
            });
        }

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        console.error("Get exam by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve exam."
        });
    }
};

// Create exam
const createExam = async (req, res) => {
    try {
        const {
            exam_name,
            class_id,
            academic_year,
            start_date,
            end_date,
            status
        } = req.body;

        if (!exam_name || !exam_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Exam name is required."
            });
        }

        if (!class_id || !Number.isInteger(Number(class_id)) || Number(class_id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid class ID is required."
            });
        }

        const examId = await Exam.createExam({
            exam_name: exam_name.trim(),
            class_id: Number(class_id),
            academic_year,
            start_date: start_date || null,
            end_date: end_date || null,
            status: status || "scheduled"
        });

        res.status(201).json({
            success: true,
            message: "Exam created successfully.",
            data: { exam_id: examId }
        });
    } catch (error) {
        console.error("Create exam error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create exam."
        });
    }
};

// Update exam
const updateExam = async (req, res) => {
    try {
        const examId = Number(req.params.id);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID."
            });
        }

        const {
            exam_name,
            class_id,
            academic_year,
            start_date,
            end_date,
            status
        } = req.body;

        if (!exam_name || !exam_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Exam name is required."
            });
        }

        if (!class_id || !Number.isInteger(Number(class_id)) || Number(class_id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid class ID is required."
            });
        }

        const affectedRows = await Exam.updateExam(examId, {
            exam_name: exam_name.trim(),
            class_id: Number(class_id),
            academic_year,
            start_date: start_date || null,
            end_date: end_date || null,
            status: status || "scheduled"
        });

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Exam not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Exam updated successfully."
        });
    } catch (error) {
        console.error("Update exam error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update exam."
        });
    }
};

// Delete exam
const deleteExam = async (req, res) => {
    try {
        const examId = Number(req.params.id);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID."
            });
        }

        const affectedRows = await Exam.deleteExam(examId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Exam not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Exam deleted successfully."
        });
    } catch (error) {
        console.error("Delete exam error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete exam. It may be linked to schedules or results."
        });
    }
};
// Publish exam result
const publishExamResult = async (req, res) => {
    try {
        const examId = Number(req.params.id);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID."
            });
        }

        const affectedRows = await Exam.publishExamResult(examId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Exam not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Exam result published successfully."
        });
    } catch (error) {
        console.error("Publish result error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to publish exam result."
        });
    }
};

// Unpublish exam result
const unpublishExamResult = async (req, res) => {
    try {
        const examId = Number(req.params.id);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID."
            });
        }

        const affectedRows = await Exam.unpublishExamResult(examId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Exam not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Exam result unpublished successfully."
        });
    } catch (error) {
        console.error("Unpublish result error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to unpublish exam result."
        });
    }
};

module.exports = {
    getAllExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    publishExamResult,
    unpublishExamResult
};