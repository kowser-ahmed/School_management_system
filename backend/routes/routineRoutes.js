const express = require("express");
const router = express.Router();

const {
    getAllRoutines,
    getRoutineById,
    createRoutine,
    updateRoutine,
    deleteRoutine
} = require("../controllers/routineController");

// Get all routines
router.get("/", getAllRoutines);
// Get routine by ID
router.get("/:id", getRoutineById);

// Create routine
router.post("/", createRoutine);

// Update routine
router.put("/:id", updateRoutine);

// Delete routine
router.delete("/:id", deleteRoutine);

module.exports = router;