
const staffModel = require("../models/staffModel");

// Validate staff input
const validateStaff = (staff) => {
    if (!staff.employee_code || !staff.employee_code.trim()) {
        return "Employee code is required";
    }

    if (!staff.full_name || !staff.full_name.trim()) {
        return "Staff name is required";
    }

    if (staff.employee_code.trim().length > 30) {
        return "Employee code cannot exceed 30 characters";
    }

    if (staff.full_name.trim().length > 100) {
        return "Staff name cannot exceed 100 characters";
    }

    if (
        staff.gender &&
        !["male", "female", "other"].includes(staff.gender.toLowerCase())
    ) {
        return "Invalid gender";
    }

    if (
        staff.status &&
        !["active", "inactive"].includes(staff.status.toLowerCase())
    ) {
        return "Invalid staff status";
    }

    const phoneRegex = /^01[3-9]\d{8}$/;

    if (staff.phone && !phoneRegex.test(staff.phone)) {
        return "Enter a valid 11-digit Bangladesh phone number";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (staff.email && !emailRegex.test(staff.email)) {
        return "Enter a valid email address";
    }

    if (
        staff.designation &&
        staff.designation.length > 100
    ) {
        return "Designation cannot exceed 100 characters";
    }

    if (
        staff.user_id !== undefined &&
        staff.user_id !== null &&
        staff.user_id !== ""
    ) {
        if (
            !Number.isInteger(Number(staff.user_id)) ||
            Number(staff.user_id) <= 0
        ) {
            return "User ID must be a positive number";
        }
    }

    if (
        staff.salary !== undefined &&
        staff.salary !== null &&
        staff.salary !== ""
    ) {
        if (
            !Number.isFinite(Number(staff.salary)) ||
            Number(staff.salary) < 0 ||
            Number(staff.salary) > 99999999.99
        ) {
            return "Enter a valid salary amount";
        }
    }

    return null;
};

// Validate ID
const validId = (id) => {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
};

// Get all staff
const getAllStaff = async (req, res) => {
    try {
        const staff = await staffModel.getAllStaff();

        return res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error("Get Staff Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff"
        });
    }
};

// Get staff by ID
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid staff ID"
            });
        }

        const staff = await staffModel.getStaffById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        return res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error("Get Staff Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff"
        });
    }
};

// Create staff
const createStaff = async (req, res) => {
    try {
        const staff = req.body || {};

        const validationError = validateStaff(staff);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const payload = {
            ...staff,
            employee_code: staff.employee_code.trim(),
            full_name: staff.full_name.trim(),
            gender: staff.gender ? staff.gender.toLowerCase() : null,
            phone: staff.phone || null,
            email: staff.email || null,
            designation: staff.designation || null,
            joining_date: staff.joining_date || null,
            user_id: staff.user_id || null,
            salary: staff.salary !== undefined && staff.salary !== ""
                ? staff.salary
                : null,
            status: staff.status
                ? staff.status.toLowerCase()
                : "active"
        };

        const staffId = await staffModel.createStaff(payload);

        return res.status(201).json({
            success: true,
            message: "Staff created successfully",
            staff_id: staffId
        });

    } catch (error) {
        console.error("Create Staff Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            let message = "Duplicate staff information already exists.";

            if (error.message?.includes("employee_code")) {
                message = "Employee code already exists.";
            } else if (error.message?.includes("user_id")) {
                message = "This User ID is already linked to another staff member.";
            }

            return res.status(409).json({
                success: false,
                message
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create staff"
        });
    }
};

// Update staff
const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = req.body || {};

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid staff ID"
            });
        }

        const validationError = validateStaff(staff);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const payload = {
            ...staff,
            employee_code: staff.employee_code.trim(),
            full_name: staff.full_name.trim(),
            gender: staff.gender ? staff.gender.toLowerCase() : null,
            phone: staff.phone || null,
            email: staff.email || null,
            designation: staff.designation || null,
            joining_date: staff.joining_date || null,
            user_id: staff.user_id || null,
            salary: staff.salary !== undefined && staff.salary !== ""
                ? staff.salary
                : null,
            status: staff.status
                ? staff.status.toLowerCase()
                : "active"
        };

        const affectedRows = await staffModel.updateStaff(id, payload);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        return res.json({
            success: true,
            message: "Staff updated successfully"
        });

    } catch (error) {
        console.error("Update Staff Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Employee code or user ID already exists"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update staff"
        });
    }
};

// Delete staff
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid staff ID"
            });
        }

        const affectedRows = await staffModel.deleteStaff(id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        return res.json({
            success: true,
            message: "Staff deleted successfully"
        });

    } catch (error) {
        console.error("Delete Staff Error:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this staff because related records exist"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete staff"
        });
    }
};

module.exports = {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff
};
