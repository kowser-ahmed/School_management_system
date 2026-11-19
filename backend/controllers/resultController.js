const Result = require("../models/resultModel");

// Get all results
const getAllResults = async (req, res) => {
    try {
        const results = await Result.getAllResults();

        res.status(200).json({
            success: true,
            message: "Results retrieved successfully.",
            data: results
        });
    } catch (error) {
        console.error("Get all results error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve results."
        });
    }
};

// Get result by ID
const getResultById = async (req, res) => {
    try {
        const resultId = Number(req.params.id);

        if (!Number.isInteger(resultId) || resultId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid result ID."
            });
        }

        const result = await Result.getResultById(resultId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found."
            });
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get result error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve result."
        });
    }
};

// Get results by student ID

const getResultsByStudentId = async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        const results = await Result.getResultsByStudentId(studentId);

        const publishedResults = results.filter(
            result => result.result_status === 'published'
        );

        res.status(200).json({
            success: true,
            data: publishedResults
        });
    } catch (error) {
        console.error("Get student results error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve student results."
        });
    }
};


// Get results by exam ID
const getResultsByExamId = async (req, res) => {
    try {
        const examId = Number(req.params.examId);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID."
            });
        }

        const results = await Result.getResultsByExamId(examId);

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error("Get exam results error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve exam results."
        });
    }
};

// Create result
const createResult = async (req, res) => {
    try {
        const {
            exam_id,
            student_id,
            subject_id,
            marks,
            grade,
            grade_point,
            remarks
        } = req.body;

        if (
            !Number.isInteger(Number(exam_id)) || Number(exam_id) <= 0 ||
            !Number.isInteger(Number(student_id)) || Number(student_id) <= 0 ||
            !Number.isInteger(Number(subject_id)) || Number(subject_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid exam, student and subject IDs are required."
            });
        }

        if (
            marks === undefined ||
            marks === null ||
            marks === "" ||
            !Number.isFinite(Number(marks)) ||
            Number(marks) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Marks must be a valid non-negative number."
            });
        }

        if (grade_point !== undefined && grade_point !== null &&
            grade_point !== "" &&
            (!Number.isFinite(Number(grade_point)) ||
                Number(grade_point) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Grade point must be a valid non-negative number."
            });
        }

        const resultId = await Result.createResult({
            exam_id: Number(exam_id),
            student_id: Number(student_id),
            subject_id: Number(subject_id),
            marks: Number(marks),
            grade: grade || null,
            grade_point: grade_point === "" || grade_point == null
                ? null
                : Number(grade_point),
            remarks: remarks || null
        });

        res.status(201).json({
            success: true,
            message: "Result created successfully.",
            data: { result_id: resultId }
        });
    } catch (error) {
        console.error("Create result error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A result already exists for this student, exam and subject."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create result."
        });
    }
};

// Update result
const updateResult = async (req, res) => {
    try {
        const resultId = Number(req.params.id);

        if (!Number.isInteger(resultId) || resultId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid result ID."
            });
        }

        const {
            exam_id,
            student_id,
            subject_id,
            marks,
            grade,
            grade_point,
            remarks
        } = req.body;

        if (
            !Number.isInteger(Number(exam_id)) || Number(exam_id) <= 0 ||
            !Number.isInteger(Number(student_id)) || Number(student_id) <= 0 ||
            !Number.isInteger(Number(subject_id)) || Number(subject_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid exam, student and subject IDs are required."
            });
        }

        if (
            marks === undefined ||
            marks === null ||
            marks === "" ||
            !Number.isFinite(Number(marks)) ||
            Number(marks) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Marks must be a valid non-negative number."
            });
        }

        if (grade_point !== undefined && grade_point !== null &&
            grade_point !== "" &&
            (!Number.isFinite(Number(grade_point)) ||
                Number(grade_point) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Grade point must be a valid non-negative number."
            });
        }

        const affectedRows = await Result.updateResult(resultId, {
            exam_id: Number(exam_id),
            student_id: Number(student_id),
            subject_id: Number(subject_id),
            marks: Number(marks),
            grade: grade || null,
            grade_point: grade_point === "" || grade_point == null
                ? null
                : Number(grade_point),
            remarks: remarks || null
        });

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Result not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Result updated successfully."
        });
    } catch (error) {
        console.error("Update result error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A result already exists for this student, exam and subject."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update result."
        });
    }
};

// Delete result
const deleteResult = async (req, res) => {
    try {
        const resultId = Number(req.params.id);

        if (!Number.isInteger(resultId) || resultId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid result ID."
            });
        }

        const affectedRows = await Result.deleteResult(resultId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Result not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Result deleted successfully."
        });
    } catch (error) {
        console.error("Delete result error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete result."
        });
    }
};

module.exports = {
    getAllResults,
    getResultById,
    getResultsByStudentId,
    getResultsByExamId,
    createResult,
    updateResult,
    deleteResult
};