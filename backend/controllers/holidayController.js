
const holidayModel = require("../models/holidayModel");
const holidayFactory = require("../utils/holidayFactory");
const { validateHoliday } = require("../utils/holidayValidation");

// Validate holiday ID
const isValidId = (id) => {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
};

// Get all holidays
const getAllHolidays = async (req, res) => {
    try {
        const holidays = await holidayModel.getAllHolidays();

        res.status(200).json({
            success: true,
            count: holidays.length,
            data: holidays
        });

    } catch (error) {
        console.error("Get holidays error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve holidays."
        });
    }
};

// Get holiday by ID
const getHolidayById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid holiday ID."
            });
        }

        const holiday = await holidayModel.getHolidayById(Number(id));

        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: "Holiday not found."
            });
        }

        res.status(200).json({
            success: true,
            data: holiday
        });

    } catch (error) {
        console.error("Get holiday error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve holiday."
        });
    }
};

// Create holiday
const createHoliday = async (req, res) => {
    try {
        const errors = validateHoliday(req.body);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        const holidayData = holidayFactory.createHoliday(req.body);

        const holidayId = await holidayModel.createHoliday(holidayData);

        const newHoliday = await holidayModel.getHolidayById(holidayId);

        res.status(201).json({
            success: true,
            message: "Holiday created successfully.",
            data: newHoliday
        });

    } catch (error) {
        console.error("Create holiday error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create holiday."
        });
    }
};

// Update holiday
const updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid holiday ID."
            });
        }

        const errors = validateHoliday(req.body);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        const existingHoliday = await holidayModel.getHolidayById(Number(id));

        if (!existingHoliday) {
            return res.status(404).json({
                success: false,
                message: "Holiday not found."
            });
        }

        const holidayData = holidayFactory.updateHoliday(req.body);

        await holidayModel.updateHoliday(Number(id), holidayData);

        const updatedHoliday = await holidayModel.getHolidayById(Number(id));

        res.status(200).json({
            success: true,
            message: "Holiday updated successfully.",
            data: updatedHoliday
        });

    } catch (error) {
        console.error("Update holiday error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update holiday."
        });
    }
};

// Delete holiday
const deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid holiday ID."
            });
        }

        const affectedRows = await holidayModel.deleteHoliday(Number(id));

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Holiday not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Holiday deleted successfully."
        });

    } catch (error) {
        console.error("Delete holiday error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete holiday."
        });
    }
};

module.exports = {
    getAllHolidays,
    getHolidayById,
    createHoliday,
    updateHoliday,
    deleteHoliday
};
