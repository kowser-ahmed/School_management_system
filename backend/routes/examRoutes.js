
const express = require("express");

const {
    getAllExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    publishExamResult,
    unpublishExamResult
} = require("../controllers/examController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get all exams
router.get(
    "/",
    authenticateToken,
    authorizePermission("exams:read"),
    getAllExams
);

// Get exam by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("exams:read"),
    getExamById
);

// Create exam
router.post(
    "/",
    authenticateToken,
    authorizePermission("exams:create"),
    createExam
);

// Update exam
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("exams:update"),
    updateExam
);

// Delete exam
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("exams:delete"),
    deleteExam
);

// Publish exam result
router.put(
    "/:id/publish",
    authenticateToken,
    authorizePermission("exams:update"),
    publishExamResult
);

// Unpublish exam result
router.put(
    "/:id/unpublish",
    authenticateToken,
    authorizePermission("exams:update"),
    unpublishExamResult
);

module.exports = router;
