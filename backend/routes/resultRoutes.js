const express = require("express");

const {
    getAllResults,
    getResultById,
    getResultsByStudentId,
    getResultsByExamId,
    createResult,
    updateResult,
    deleteResult
} = require("../controllers/resultController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get all results
router.get(
    "/",
    authenticateToken,
    authorizePermission("results:read"),
    getAllResults
);

// Get result by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("results:read"),
    getResultById
);

// Get results by student ID
router.get(
    "/student/:studentId",
    authenticateToken,
    authorizePermission("results:read"),
    getResultsByStudentId
);

// Get results by exam ID
router.get(
    "/exam/:examId",
    authenticateToken,
    authorizePermission("results:read"),
    getResultsByExamId
);

// Create result
router.post(
    "/",
    authenticateToken,
    authorizePermission("results:create"),
    createResult
);

// Update result
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("results:update"),
    updateResult
);

// Delete result
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("results:delete"),
    deleteResult
);

module.exports = router;