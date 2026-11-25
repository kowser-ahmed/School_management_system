
const LeaveModel = require("../models/leaveModel");

const validId = id =>
    /^\d+$/.test(String(id)) && Number(id) > 0;

const validDate = date => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date;
};

const sendError = (res, error) => {
    console.error(error);

    res.status(500).json({
        success: false,
        message: "Server error."
    });
};


// ================= LEAVE MANAGEMENT =================

// Get all leave applications (Admin)
exports.getAllLeaves = async (req, res) => {
    try {
        const data = await LeaveModel.getAllLeaves();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        sendError(res, error);
    }
};


// Get leave by ID
exports.getLeaveById = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave ID."
            });
        }

        const data = await LeaveModel.getLeaveById(req.params.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Leave application not found."
            });
        }

        if (
            req.user.role !== "admin" &&
            Number(data.user_id) !== Number(req.user.user_id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own leave application."
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        sendError(res, error);
    }
};


// Get logged-in user's own leave history
exports.getMyLeaves = async (req, res) => {
    try {
        const data = await LeaveModel.getLeavesByUserId(
            req.user.user_id
        );

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        sendError(res, error);
    }
};


// Apply for leave
exports.createLeave = async (req, res) => {
    try {
        const {
            leave_type,
            start_date,
            end_date,
            reason
        } = req.body;

        if (
            !leave_type?.trim() ||
            !validDate(start_date) ||
            !validDate(end_date) ||
            !reason?.trim() ||
            end_date < start_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid leave information."
            });
        }

        const result = await LeaveModel.createLeave({
            user_id: req.user.user_id,
            leave_type: leave_type.trim(),
            start_date,
            end_date,
            reason: reason.trim()
        });

        res.status(201).json({
            success: true,
            message: "Leave application submitted successfully.",
            leave_id: result
        });
    } catch (error) {
        sendError(res, error);
    }
};


// Update pending leave application
exports.updateLeave = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave ID."
            });
        }

        const leave = await LeaveModel.getLeaveById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave application not found."
            });
        }

        if (
            req.user.role !== "admin" &&
            Number(leave.user_id) !== Number(req.user.user_id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own leave."
            });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending leave applications can be updated."
            });
        }

        const {
            leave_type,
            start_date,
            end_date,
            reason
        } = req.body;

        if (
            !leave_type?.trim() ||
            !validDate(start_date) ||
            !validDate(end_date) ||
            !reason?.trim() ||
            end_date < start_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid leave information."
            });
        }

        const result = await LeaveModel.updateLeave(
            req.params.id,
            {
                leave_type: leave_type.trim(),
                start_date,
                end_date,
                reason: reason.trim()
            }
        );

        if (!result) {
            return res.status(400).json({
                success: false,
                message: "Leave application could not be updated."
            });
        }

        res.json({
            success: true,
            message: "Leave application updated successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};


// Approve or reject leave (Admin)
exports.updateLeaveStatus = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave ID."
            });
        }

        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be approved or rejected."
            });
        }

        const leave = await LeaveModel.getLeaveById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave application not found."
            });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This leave application has already been processed."
            });
        }

        const result = await LeaveModel.updateLeaveStatus(
            req.params.id,
            status,
            req.user.user_id
        );

        if (!result) {
            return res.status(400).json({
                success: false,
                message: "Leave status could not be updated."
            });
        }

        res.json({
            success: true,
            message: `Leave application ${status} successfully.`
        });
    } catch (error) {
        sendError(res, error);
    }
};


// Delete pending leave application
exports.deleteLeave = async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave ID."
            });
        }

        const leave = await LeaveModel.getLeaveById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave application not found."
            });
        }

        if (
            req.user.role !== "admin" &&
            Number(leave.user_id) !== Number(req.user.user_id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own leave."
            });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending leave applications can be deleted."
            });
        }

        const result = await LeaveModel.deleteLeave(req.params.id);

        if (!result) {
            return res.status(400).json({
                success: false,
                message: "Leave application could not be deleted."
            });
        }

        res.json({
            success: true,
            message: "Leave application deleted successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};
