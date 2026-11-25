
const express = require("express");
const router = express.Router();

const {
    getAllLeaves,
    getLeaveById,
    getMyLeaves,
    createLeave,
    updateLeave,
    updateLeaveStatus,
    deleteLeave
} = require("../controllers/leaveController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

// All leave routes require authentication
router.use(authenticateToken);


// ================= STAFF / TEACHER SELF-SERVICE =================

// Logged-in staff or teacher can view only their own leave history
router.get(
    "/my",
    authorizePermission("leave:read"),
    getMyLeaves
);

// Apply for leave
router.post(
    "/",
    authorizePermission("leave:create"),
    createLeave
);

// Update own pending leave application
router.put(
    "/:id",
    authorizePermission("leave:create"),
    updateLeave
);

// Delete own pending leave application
router.delete(
    "/:id",
    authorizePermission("leave:create"),
    deleteLeave
);


// ================= LEAVE MANAGEMENT =================

// Admin: Get all leave applications
router.get(
    "/",
    authorizePermission("leave:read:all"),
    getAllLeaves
);

// Get leave application by ID
router.get(
    "/:id",
    authorizePermission("leave:read"),
    getLeaveById
);


// ================= LEAVE APPROVAL =================

// Admin: Approve or reject leave applications
router.patch(
    "/:id/status",
    authorizePermission("leave:approve"),
    updateLeaveStatus
);


module.exports = router;
