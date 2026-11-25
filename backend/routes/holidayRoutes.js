
const express = require("express");
const router = express.Router();

const {
    getAllHolidays,
    getHolidayById,
    createHoliday,
    updateHoliday,
    deleteHoliday
} = require("../controllers/holidayController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

// All holiday routes require authentication
router.use(authenticateToken);

// View holidays
router.get(
    "/",
    authorizePermission("holidays:read"),
    getAllHolidays
);

router.get(
    "/:id",
    authorizePermission("holidays:read"),
    getHolidayById
);

// Admin-only operations
router.post(
    "/",
    authorizePermission("holidays:create"),
    createHoliday
);

router.put(
    "/:id",
    authorizePermission("holidays:update"),
    updateHoliday
);

router.delete(
    "/:id",
    authorizePermission("holidays:delete"),
    deleteHoliday
);

module.exports = router;
