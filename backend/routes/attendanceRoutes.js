const express = require("express");
const attendanceController = require("../controllers/attendanceController");
const {
    requireAuthenticated,
    requireAttendanceRoles
} = require("../middleware/attendanceAuthorization");

const router = express.Router();
const staffRoles = requireAttendanceRoles("admin", "teacher");
const adminRole = requireAttendanceRoles("admin");

router.use(requireAuthenticated);
router.get("/session", (req, res) => {
    res.json({ success: true, data: { user_id: req.user.user_id, role: req.user.role } });
});

router.get("/students/roster", attendanceController.getStudentRoster);
router.post("/students", staffRoles, attendanceController.saveStudentAttendance);
router.put("/students/:attendanceId", staffRoles, attendanceController.updateStudentAttendance);
router.get("/students/reports/daily", attendanceController.getDailyStudentReport);
router.get("/students/reports/monthly", attendanceController.getMonthlyStudentReport);
router.get("/students/reports/frequent-absences", attendanceController.getFrequentAbsences);
router.get("/students/:studentId/history", attendanceController.getStudentHistory);

router.get("/employees", attendanceController.getEmployees);
router.post("/employees", staffRoles, attendanceController.saveEmployeeAttendance);
router.put("/employees/:attendanceId", staffRoles, attendanceController.updateEmployeeAttendance);
router.get("/employees/reports/monthly", attendanceController.getMonthlyEmployeeReport);
router.get("/employees/:type/:employeeId/leaves", attendanceController.getEmployeeLeaves);
router.post("/employees/:type/:employeeId/leaves", staffRoles, attendanceController.createEmployeeLeave);
router.patch("/leaves/:leaveId", adminRole, attendanceController.updateLeaveRecord);

module.exports = router;