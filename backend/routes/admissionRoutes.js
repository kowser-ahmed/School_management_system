
const express = require("express");

const {
    getAllAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    updateAdmissionStatus,
    enrollAdmission,
    deleteAdmission
} = require("../controllers/admissionController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

const router = express.Router();

// Test admission route
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Admission route is working!"
    });
});

// Public: Submit admission application
router.post("/", createAdmission);

// Get all admission applications
router.get(
    "/",
    authenticateToken,
    authorizePermission("admissions:read"),
    getAllAdmissions
);

// Get admission application by ID
router.get(
    "/:id",
    authenticateToken,
    authorizePermission("admissions:read"),
    getAdmissionById
);

// Enroll approved applicant into Students List
router.post(
    "/:id/enroll",
    authenticateToken,
    authorizePermission("admissions:update"),
    enrollAdmission
);

// Update admission application
router.put(
    "/:id",
    authenticateToken,
    authorizePermission("admissions:update"),
    updateAdmission
);

// Update admission application status
router.patch(
    "/:id/status",
    authenticateToken,
    authorizePermission("admissions:update"),
    updateAdmissionStatus
);

// Delete admission application
router.delete(
    "/:id",
    authenticateToken,
    authorizePermission("admissions:delete"),
    deleteAdmission
);

module.exports = router;
