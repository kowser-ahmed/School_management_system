const attendanceModel = require("../models/attendanceModel");
const {
    isPositiveInteger,
    isValidDate,
    isValidMonth,
    isValidTime,
    isAttendanceStatus,
    isEmployeeType
} = require("../utils/attendanceValidation");

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const handleError = (res, error, operation) => {
    if (error.code === "ER_DUP_ENTRY") {
        return fail(res, 409, "Attendance has already been recorded for this person and date");
    }
    if (error.code === "INVALID_STUDENT_SELECTION") {
        return fail(res, 400, error.message);
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return fail(res, 400, "The selected record does not exist");
    }

    console.error(`${operation} Error:`, error.message);
    return fail(res, 500, "Attendance request failed");
};

const validClassFilters = ({ academic_year, class_id, section_id, date }) =>
    typeof academic_year === "string" && academic_year.trim().length > 0 &&
    isPositiveInteger(class_id) && isPositiveInteger(section_id) && isValidDate(date);

const getStudentRoster = async (req, res) => {
    const filters = req.query;
    if (!validClassFilters(filters)) {
        return fail(res, 400, "academic_year, class_id, section_id and a valid date are required");
    }

    try {
        const data = await attendanceModel.getStudentRoster({
            academicYear: filters.academic_year.trim(),
            classId: Number(filters.class_id),
            sectionId: Number(filters.section_id),
            date: filters.date
        });
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(res, error, "Get Student Roster");
    }
};

const saveStudentAttendance = async (req, res) => {
    const { academic_year, class_id, section_id, date, attendance } = req.body;
    if (!validClassFilters({ academic_year, class_id, section_id, date }) ||
        !Array.isArray(attendance) || attendance.length === 0 ||
        attendance.some((entry) => !entry || !isPositiveInteger(entry.student_id) ||
            !isAttendanceStatus(entry.status) ||
            (entry.remarks != null && typeof entry.remarks !== "string"))) {
        return fail(res, 400, "Provide class filters and at least one valid attendance entry");
    }

    const studentIds = attendance.map((entry) => Number(entry.student_id));
    if (new Set(studentIds).size !== studentIds.length) {
        return fail(res, 400, "A student may appear only once in an attendance submission");
    }

    try {
        const saved = await attendanceModel.saveStudentAttendance({
            academicYear: academic_year.trim(),
            classId: Number(class_id),
            sectionId: Number(section_id),
            date,
            entries: attendance.map((entry) => ({
                student_id: Number(entry.student_id),
                status: entry.status,
                remarks: entry.remarks?.trim() || null
            }))
        });
        return res.status(201).json({ success: true, message: "Attendance saved", count: saved });
    } catch (error) {
        return handleError(res, error, "Save Student Attendance");
    }
};

const updateStudentAttendance = async (req, res) => {
    const { status, remarks } = req.body;
    if (!isPositiveInteger(req.params.attendanceId) || !isAttendanceStatus(status) ||
        (remarks != null && typeof remarks !== "string")) {
        return fail(res, 400, "A valid attendance ID and status are required");
    }

    try {
        const updated = await attendanceModel.updateStudentAttendance(
            Number(req.params.attendanceId),
            { status, remarks }
        );
        if (!updated) {
            return fail(res, 404, "Attendance record not found");
        }
        return res.json({ success: true, message: "Attendance updated" });
    } catch (error) {
        return handleError(res, error, "Update Student Attendance");
    }
};

const getDailyStudentReport = async (req, res) => {
    if (!validClassFilters(req.query)) {
        return fail(res, 400, "academic_year, class_id, section_id and a valid date are required");
    }

    try {
        const data = await attendanceModel.getDailyStudentReport({
            academicYear: req.query.academic_year.trim(),
            classId: Number(req.query.class_id),
            sectionId: Number(req.query.section_id),
            date: req.query.date
        });
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(res, error, "Get Daily Student Report");
    }
};

const getMonthlyStudentReport = async (req, res) => {
    const { academic_year, class_id, section_id, month } = req.query;
    if (typeof academic_year !== "string" || !academic_year.trim() ||
        !isPositiveInteger(class_id) || !isPositiveInteger(section_id) || !isValidMonth(month)) {
        return fail(res, 400, "academic_year, class_id, section_id and month in YYYY-MM format are required");
    }

    try {
        const data = await attendanceModel.getMonthlyStudentReport({
            academicYear: academic_year.trim(),
            classId: Number(class_id),
            sectionId: Number(section_id),
            month
        });
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(res, error, "Get Monthly Student Report");
    }
};

const getStudentHistory = async (req, res) => {
    if (!isPositiveInteger(req.params.studentId)) {
        return fail(res, 400, "A valid student ID is required");
    }

    try {
        const data = await attendanceModel.getStudentHistory(Number(req.params.studentId));
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(res, error, "Get Student History");
    }
};

const getFrequentAbsences = async (req, res) => {
    const { from, to } = req.query;
    const minimum = req.query.minimum === undefined ? 3 : Number(req.query.minimum);
    if (!isValidDate(from) || !isValidDate(to) || from > to ||
        !Number.isInteger(minimum) || minimum < 1) {
        return fail(res, 400, "Valid from/to dates and a positive minimum are required");
    }

    try {
        const data = await attendanceModel.getFrequentAbsences({ from, to, minimum });
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(res, error, "Get Frequent Absences");
    }
};

const getEmployees = async (req, res) => {
    const { type, date } = req.query;
    if (!isEmployeeType(type) || !isValidDate(date)) {
        return fail(res, 400, "A valid employee type and date are required");
    }

    try {
        const data = await attendanceModel.getEmployees(type, date);
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(res, error, "Get Employees");
    }
};

const saveEmployeeAttendance = async (req, res) => {
    const { type, employee_id, date, status, check_in, check_out, remarks } = req.body;
    if (!isEmployeeType(type) || !isPositiveInteger(employee_id) || !isValidDate(date) ||
        !isAttendanceStatus(status) || !isValidTime(check_in) || !isValidTime(check_out) ||
        (remarks != null && typeof remarks !== "string")) {
        return fail(res, 400, "Valid employee, date, status and check-in/check-out values are required");
    }

    try {
        const attendanceId = await attendanceModel.saveEmployeeAttendance(type, {
            employeeId: Number(employee_id), date, status, checkIn: check_in,
            checkOut: check_out, remarks: remarks?.trim() || null
        });
        return res.status(201).json({ success: true, attendance_id: attendanceId });
    } catch (error) {
        return handleError(res, error, "Save Employee Attendance");
    }
};

const updateEmployeeAttendance = async (req, res) => {
    const { type, status, check_in, check_out, remarks } = req.body;
    if (!isEmployeeType(type) || !isPositiveInteger(req.params.attendanceId) ||
        !isAttendanceStatus(status) || !isValidTime(check_in) || !isValidTime(check_out) ||
        (remarks != null && typeof remarks !== "string")) {
        return fail(res, 400, "Valid employee attendance fields are required");
    }

    try {
        const updated = await attendanceModel.updateEmployeeAttendance(type, Number(req.params.attendanceId), {
            status, checkIn: check_in, checkOut: check_out, remarks: remarks?.trim() || null
        });
        if (!updated) {
            return fail(res, 404, "Attendance record not found");
        }
        return res.json({ success: true, message: "Employee attendance updated" });
    } catch (error) {
        return handleError(res, error, "Update Employee Attendance");
    }
};

const getMonthlyEmployeeReport = async (req, res) => {
    const { type, month } = req.query;
    if (!isEmployeeType(type) || !isValidMonth(month)) {
        return fail(res, 400, "A valid employee type and month in YYYY-MM format are required");
    }

    try {
        const data = await attendanceModel.getMonthlyEmployeeReport({ type, month });
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(res, error, "Get Monthly Employee Report");
    }
};

const getEmployeeLeaves = async (req, res) => {
    const { type, employeeId } = req.params;
    if (!isEmployeeType(type) || !isPositiveInteger(employeeId)) {
        return fail(res, 400, "Valid employee type and ID are required");
    }

    try {
        const data = await attendanceModel.getEmployeeLeaves(type, Number(employeeId));
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(res, error, "Get Employee Leaves");
    }
};

const createEmployeeLeave = async (req, res) => {
    const { type, employeeId } = req.params;
    const { leave_type, start_date, end_date, reason } = req.body;
    if (!isEmployeeType(type) || !isPositiveInteger(employeeId) ||
        typeof leave_type !== "string" || !leave_type.trim() ||
        !isValidDate(start_date) || !isValidDate(end_date) || start_date > end_date ||
        (reason != null && typeof reason !== "string")) {
        return fail(res, 400, "Valid employee and leave details are required");
    }

    try {
        const leaveId = await attendanceModel.createEmployeeLeave(type, Number(employeeId), {
            leaveType: leave_type.trim(), startDate: start_date, endDate: end_date,
            reason: reason?.trim() || null
        });
        if (!leaveId) {
            return fail(res, 409, "This employee must be linked to a user account for leave tracking");
        }
        return res.status(201).json({ success: true, leave_id: leaveId });
    } catch (error) {
        return handleError(res, error, "Create Employee Leave");
    }
};

const updateLeaveRecord = async (req, res) => {
    const { status } = req.body;
    if (!isPositiveInteger(req.params.leaveId) || !["approved", "rejected"].includes(status)) {
        return fail(res, 400, "A valid leave ID and decision are required");
    }

    try {
        const updated = await attendanceModel.updateLeaveRecord(Number(req.params.leaveId), {
            status, approvedBy: Number(req.user.user_id)
        });
        if (!updated) {
            return fail(res, 404, "Leave record not found");
        }
        return res.json({ success: true, message: "Leave request updated" });
    } catch (error) {
        return handleError(res, error, "Update Leave Record");
    }
};

module.exports = {
    getStudentRoster,
    saveStudentAttendance,
    updateStudentAttendance,
    getDailyStudentReport,
    getMonthlyStudentReport,
    getStudentHistory,
    getFrequentAbsences,
    getEmployees,
    saveEmployeeAttendance,
    updateEmployeeAttendance,
    getMonthlyEmployeeReport,
    getEmployeeLeaves,
    createEmployeeLeave,
    updateLeaveRecord
};