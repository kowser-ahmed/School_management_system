const attendanceStatuses = new Set(["present", "absent", "late", "leave"]);
const employeeTypes = new Set(["teacher", "staff"]);

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isValidMonth = (value) => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

const isValidTime = (value) => value == null || value === "" || /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

const isAttendanceStatus = (value) => attendanceStatuses.has(value);
const isEmployeeType = (value) => employeeTypes.has(value);

module.exports = {
    isPositiveInteger,
    isValidDate,
    isValidMonth,
    isValidTime,
    isAttendanceStatus,
    isEmployeeType
};