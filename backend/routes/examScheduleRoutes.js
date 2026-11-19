const express = require("express");

const {
    getAllExamSchedules,
    getExamScheduleById,
    getSchedulesByExamId,
    createExamSchedule,
    updateExamSchedule,
    deleteExamSchedule
} = require("../controllers/examScheduleController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get all exam schedules
router.get(
    "/",
    authenticateToken,
    authorizePermission("exams:read"),
    getAllExamSchedules
);

// Get schedule by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("exams:read"),
    getExamScheduleById
);

// Get schedules by exam ID
router.get(
    "/exam/:examId",
    authenticateToken,
    authorizePermission("exams:read"),
    getSchedulesByExamId
);

// Create exam schedule
router.post(
    "/",
    authenticateToken,
    authorizePermission("exams:create"),
    createExamSchedule
);

// Update exam schedule
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("exams:update"),
    updateExamSchedule
);

// Delete exam schedule
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("exams:delete"),
    deleteExamSchedule
);

module.exports = router;