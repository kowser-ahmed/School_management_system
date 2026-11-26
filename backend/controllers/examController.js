
const Exam = require("../models/examModel");

// Get all exams
const getAllExams = async (req, res) => {
    try {
        const exams = await Exam.getAllExams();

        return res.status(200).json({
            success: true,
            data: exams
        });
    } catch (error) {
        console.error("Get All Exams Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch examinations."
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
                message: "Invalid examination ID."
            });
        }

        const exam = await Exam.getExamById(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Examination not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        console.error("Get Exam By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch examination."
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

        const classId = Number(class_id);

        if (!Number.isInteger(classId) || classId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid class."
            });
        }

        if (!academic_year || !String(academic_year).trim()) {
            return res.status(400).json({
                success: false,
                message: "Academic year is required."
            });
        }

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date are required."
            });
        }

        if (end_date < start_date) {
            return res.status(400).json({
                success: false,
                message: "End date cannot be before start date."
            });
        }

        const allowedStatuses = [
            "scheduled",
            "ongoing",
            "completed"
        ];

        const examStatus = status || "scheduled";

        if (!allowedStatuses.includes(examStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination status."
            });
        }

        const examId = await Exam.createExam({
            exam_name: exam_name.trim(),
            class_id: classId,
            academic_year: String(academic_year).trim(),
            start_date,
            end_date,
            status: examStatus
        });

        return res.status(201).json({
            success: true,
            message: "Examination created successfully.",
            data: {
                exam_id: examId,
                exam_name: exam_name.trim(),
                class_id: classId
            }
        });
    } catch (error) {
        console.error("Create Exam Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create examination."
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
                message: "Invalid examination ID."
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

        const classId = Number(class_id);

        if (!Number.isInteger(classId) || classId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid class."
            });
        }

        if (!academic_year || !String(academic_year).trim()) {
            return res.status(400).json({
                success: false,
                message: "Academic year is required."
            });
        }

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date are required."
            });
        }

        if (end_date < start_date) {
            return res.status(400).json({
                success: false,
                message: "End date cannot be before start date."
            });
        }

        const allowedStatuses = [
            "scheduled",
            "ongoing",
            "completed"
        ];

        const examStatus = status || "scheduled";

        if (!allowedStatuses.includes(examStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid examination status."
            });
        }

        const affectedRows = await Exam.updateExam(examId, {
            exam_name: exam_name.trim(),
            class_id: classId,
            academic_year: String(academic_year).trim(),
            start_date,
            end_date,
            status: examStatus
        });

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Examination not found or cannot be updated."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Examination updated successfully."
        });
    } catch (error) {
        console.error("Update Exam Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update examination."
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
                message: "Invalid examination ID."
            });
        }

        const affectedRows = await Exam.deleteExam(examId);

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Examination not found or cannot be deleted."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Examination deleted successfully."
        });
    } catch (error) {
        console.error("Delete Exam Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete examination."
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
                message: "Invalid examination ID."
            });
        }

        const exam = await Exam.getExamById(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Examination not found."
            });
        }

        if (exam.status === "published") {
            return res.status(400).json({
                success: false,
                message: "This examination result is already published."
            });
        }

        if (exam.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "Only completed examinations can be published."
            });
        }

        const readiness = await Exam.getPublicationReadiness(examId);

        if (!readiness || !readiness.ready) {
            return res.status(400).json({
                success: false,
                message: readiness?.message || "Result is not ready for publication.",
                data: readiness
            });
        }

        const affectedRows = await Exam.publishExamResult(examId);

        if (!affectedRows) {
            return res.status(400).json({
                success: false,
                message: "Unable to publish examination result."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Examination result published successfully."
        });
    } catch (error) {
        console.error("Publish Exam Result Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to publish examination result."
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
                message: "Invalid examination ID."
            });
        }

        const exam = await Exam.getExamById(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Examination not found."
            });
        }

        if (exam.status !== "published") {
            return res.status(400).json({
                success: false,
                message: "This examination result is not published."
            });
        }

        const affectedRows = await Exam.unpublishExamResult(examId);

        if (!affectedRows) {
            return res.status(400).json({
                success: false,
                message: "Unable to unpublish examination result."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Examination result unpublished successfully."
        });
    } catch (error) {
        console.error("Unpublish Exam Result Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to unpublish examination result."
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
