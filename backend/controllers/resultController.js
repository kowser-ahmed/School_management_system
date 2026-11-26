
const Result = require("../models/resultModel");

// Calculate grade and grade point automatically
const calculateGrade = (marks) => {
    if (marks >= 80) {
        return { grade: "A+", grade_point: 5.00 };
    }

    if (marks >= 70) {
        return { grade: "A", grade_point: 4.00 };
    }

    if (marks >= 60) {
        return { grade: "A-", grade_point: 3.50 };
    }

    if (marks >= 50) {
        return { grade: "B", grade_point: 3.00 };
    }

    if (marks >= 40) {
        return { grade: "C", grade_point: 2.00 };
    }

    if (marks >= 33) {
        return { grade: "D", grade_point: 1.00 };
    }

    return { grade: "F", grade_point: 0.00 };
};

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

// Search students
const searchStudents = async (req, res) => {
    try {
        const searchTerm = req.query.q?.trim();

        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: "Please enter a search term."
            });
        }

        const students = await Result.searchStudents(searchTerm);

        res.status(200).json({
            success: true,
            message: "Students found successfully.",
            data: students
        });
    } catch (error) {
        console.error("Search students error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search students."
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
            result => result.result_status === "published"
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

// Create or update result
const createResult = async (req, res) => {
    try {
        const {
            exam_id,
            student_id,
            subject_id,
            section_id,
            marks,
            remarks
        } = req.body;

        if (
            !Number.isInteger(Number(exam_id)) || Number(exam_id) <= 0 ||
            !Number.isInteger(Number(student_id)) || Number(student_id) <= 0 ||
            !Number.isInteger(Number(subject_id)) || Number(subject_id) <= 0 ||
            !Number.isInteger(Number(section_id)) || Number(section_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid exam, student, subject and section IDs are required."
            });
        }

        if (
            marks === undefined ||
            marks === null ||
            marks === "" ||
            !Number.isFinite(Number(marks)) ||
            Number(marks) < 0 ||
            Number(marks) > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Marks must be between 0 and 100."
            });
        }

        const numericExamId = Number(exam_id);
        const numericStudentId = Number(student_id);
        const numericSubjectId = Number(subject_id);
        const numericSectionId = Number(section_id);
        const numericMarks = Number(marks);

        const gradeData = calculateGrade(numericMarks);

        const resultData = {
            exam_id: numericExamId,
            student_id: numericStudentId,
            subject_id: numericSubjectId,
            section_id: numericSectionId,
            marks: numericMarks,
            grade: gradeData.grade,
            grade_point: gradeData.grade_point,
            remarks: remarks || null
        };

        // Check whether this result already exists
        const existingResult = await Result.getResultByExamStudentSubject(
            numericExamId,
            numericStudentId,
            numericSubjectId
        );

        // If result exists, update it
        if (existingResult) {
            await Result.updateResult(
                existingResult.result_id,
                resultData
            );

            return res.status(200).json({
                success: true,
                message: "Existing result updated successfully.",
                data: {
                    result_id: existingResult.result_id,
                    marks: numericMarks,
                    grade: gradeData.grade,
                    grade_point: gradeData.grade_point
                }
            });
        }

        // If result does not exist, create a new one
        const resultId = await Result.createResult(resultData);

        res.status(201).json({
            success: true,
            message: "Result created successfully.",
            data: {
                result_id: resultId,
                marks: numericMarks,
                grade: gradeData.grade,
                grade_point: gradeData.grade_point
            }
        });
    } catch (error) {
        console.error("Create or update result error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A result already exists for this student, exam and subject."
            });
        }

        if (error.code === "INVALID_RESULT_ASSIGNMENT") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to save result."
        });
    }
};

// Update result by ID
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
            section_id,
            marks,
            remarks
        } = req.body;

        if (
            !Number.isInteger(Number(exam_id)) || Number(exam_id) <= 0 ||
            !Number.isInteger(Number(student_id)) || Number(student_id) <= 0 ||
            !Number.isInteger(Number(subject_id)) || Number(subject_id) <= 0 ||
            !Number.isInteger(Number(section_id)) || Number(section_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid exam, student, subject and section IDs are required."
            });
        }

        if (
            marks === undefined ||
            marks === null ||
            marks === "" ||
            !Number.isFinite(Number(marks)) ||
            Number(marks) < 0 ||
            Number(marks) > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Marks must be between 0 and 100."
            });
        }

        const numericMarks = Number(marks);
        const gradeData = calculateGrade(numericMarks);

        const affectedRows = await Result.updateResult(resultId, {
            exam_id: Number(exam_id),
            student_id: Number(student_id),
            subject_id: Number(subject_id),
            section_id: Number(section_id),
            marks: numericMarks,
            grade: gradeData.grade,
            grade_point: gradeData.grade_point,
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
            message: "Result updated successfully.",
            data: {
                marks: numericMarks,
                grade: gradeData.grade,
                grade_point: gradeData.grade_point
            }
        });
    } catch (error) {
        console.error("Update result error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A result already exists for this student, exam and subject."
            });
        }

        if (error.code === "INVALID_RESULT_ASSIGNMENT") {
            return res.status(400).json({
                success: false,
                message: error.message
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
    searchStudents,
    getResultsByStudentId,
    getResultsByExamId,
    createResult,
    updateResult,
    deleteResult
};
