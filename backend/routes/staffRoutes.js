
const express = require("express");

const {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff
} = require("../controllers/staffController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get all staff
router.get(
    "/",
    authenticateToken,
    authorizePermission("staff:read"),
    getAllStaff
);

// Get staff by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("staff:read"),
    getStaffById
);

// Create staff
router.post(
    "/",
    authenticateToken,
    authorizePermission("staff:create"),
    createStaff
);

// Update staff
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("staff:update"),
    updateStaff
);

// Delete staff
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("staff:delete"),
    deleteStaff
);

module.exports = router;
