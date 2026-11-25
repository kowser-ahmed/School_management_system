
const admissionModel = require("../models/admissionModel");

// Get all admission applications
const getAllAdmissions = async (req, res) => {
    try {
        const admissions = await admissionModel.getAllAdmissions();

        return res.json({
            success: true,
            data: admissions
        });
    } catch (error) {
        console.error("Get Admissions Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch admission applications"
        });
    }
};

// Get admission application by ID
const getAdmissionById = async (req, res) => {
    try {
        const { id } = req.params;

        const admission = await admissionModel.getAdmissionById(id);

        if (!admission) {
            return res.status(404).json({
                success: false,
                message: "Admission application not found"
            });
        }

        return res.json({
            success: true,
            data: admission
        });
    } catch (error) {
        console.error("Get Admission Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch admission application"
        });
    }
};

// Create admission application
const createAdmission = async (req, res) => {
    try {
        const admissionData = req.body;

        if (!admissionData.applicant_name) {
            return res.status(400).json({
                success: false,
                message: "Applicant name is required"
            });
        }

        if (!admissionData.applying_class) {
            return res.status(400).json({
                success: false,
                message: "Applying class is required"
            });
        }

        const applicationId = await admissionModel.createAdmission(
            admissionData
        );

        return res.status(201).json({
            success: true,
            message: "Admission application submitted successfully",
            application_id: applicationId
        });
    } catch (error) {
        console.error("Create Admission Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit admission application"
        });
    }
};

// Update admission application
const updateAdmission = async (req, res) => {
    try {
        const { id } = req.params;
        const admissionData = req.body;

        if (!admissionData.applicant_name) {
            return res.status(400).json({
                success: false,
                message: "Applicant name is required"
            });
        }

        const affectedRows = await admissionModel.updateAdmission(
            id,
            admissionData
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Admission application not found"
            });
        }

        return res.json({
            success: true,
            message: "Admission application updated successfully"
        });
    } catch (error) {
        console.error("Update Admission Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update admission application"
        });
    }
};

// Update admission status
// Approving an application automatically creates a Student record
const updateAdmissionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!/^\d+$/.test(String(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid admission application ID"
            });
        }

        const allowedStatuses = ["pending", "approved", "rejected"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admission status"
            });
        }

        const affectedRows = await admissionModel.updateAdmissionStatus(
            id,
            status
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Admission application not found"
            });
        }

        return res.json({
            success: true,
            message: status === "approved"
                ? "Admission approved and student added successfully"
                : `Admission status updated to ${status}`,
            status: status
        });

    } catch (error) {
        console.error("Update Admission Status Error:", error);

        if (error.code === "ADMISSION_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "ADMISSION_CLASS_NOT_FOUND") {
            return res.status(400).json({
                success: false,
                message: "Applying class was not found. Please check the class name in Classes module."
            });
        }

        if (
            error.code === "ADMISSION_ALREADY_ENROLLED" ||
            error.code === "ADMISSION_NOT_APPROVED"
        ) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Student already exists or duplicate student information"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update admission status"
        });
    }
};

// Enroll approved applicant
const enrollAdmission = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(String(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid admission application ID"
            });
        }

        const studentId = await admissionModel.enrollAdmission(id);

        return res.status(201).json({
            success: true,
            message: "Applicant successfully enrolled",
            student_id: studentId
        });

    } catch (error) {
        console.error("Enroll Admission Error:", error);

        if (error.code === "ADMISSION_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.code === "ADMISSION_ALREADY_ENROLLED" ||
            error.code === "ADMISSION_NOT_APPROVED"
        ) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "ADMISSION_CLASS_NOT_FOUND") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Student already exists or duplicate student code"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to enroll applicant"
        });
    }
};

// Delete admission application
const deleteAdmission = async (req, res) => {
    try {
        const { id } = req.params;

        const affectedRows = await admissionModel.deleteAdmission(id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Admission application not found"
            });
        }

        return res.json({
            success: true,
            message: "Admission application deleted successfully"
        });
    } catch (error) {
        console.error("Delete Admission Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete admission application"
        });
    }
};

module.exports = {
    getAllAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    updateAdmissionStatus,
    enrollAdmission,
    deleteAdmission
};
