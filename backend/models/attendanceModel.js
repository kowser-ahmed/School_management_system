const db = require("../config/db");

const employeeTables = {
    teacher: {
        entity: "teachers",
        attendance: "teacher_attendance",
        id: "teacher_id"
    },
    staff: {
        entity: "staff",
        attendance: "staff_attendance",
        id: "staff_id"
    }
};

const getStudentRoster = async ({ academicYear, classId, sectionId, date }) => {
    const [rows] = await db.query(
        `SELECT
            s.student_id,
            s.student_code,
            s.full_name,
            s.roll_number,
            a.attendance_id,
            a.status AS attendance_status,
            a.remarks
         FROM students s
         INNER JOIN classes c ON c.class_id = s.class_id
         INNER JOIN sections sec ON sec.section_id = s.section_id
         LEFT JOIN student_attendance a
                ON a.student_id = s.student_id AND a.attendance_date = ?
                AND a.class_id = s.class_id AND a.section_id = s.section_id
         WHERE c.academic_year = ?
            AND s.class_id = ?
            AND s.section_id = ?
            AND sec.class_id = s.class_id
            AND s.status = 'active'
         ORDER BY s.roll_number, s.full_name`,
        [date, academicYear, classId, sectionId]
    );

    return rows;
};

const saveStudentAttendance = async ({ academicYear, classId, sectionId, date, entries }) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const studentIds = entries.map((entry) => entry.student_id);
        const placeholders = studentIds.map(() => "?").join(", ");
        const [students] = await connection.query(
            `SELECT s.student_id
             FROM students s
             INNER JOIN classes c ON c.class_id = s.class_id
             INNER JOIN sections sec ON sec.section_id = s.section_id
             WHERE s.student_id IN (${placeholders})
                AND s.class_id = ?
                AND s.section_id = ?
                AND sec.class_id = s.class_id
                AND c.academic_year = ?
                AND s.status = 'active'`,
            [...studentIds, classId, sectionId, academicYear]
        );

        if (students.length !== studentIds.length) {
            const error = new Error("One or more students are not in the selected class and section");
            error.code = "INVALID_STUDENT_SELECTION";
            throw error;
        }

        for (const entry of entries) {
            await connection.query(
                `INSERT INTO student_attendance
                          (student_id, class_id, section_id, academic_year, attendance_date, status, remarks)
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                     [entry.student_id, classId, sectionId, academicYear, date, entry.status, entry.remarks || null]
            );
        }

        await connection.commit();
        return entries.length;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const updateStudentAttendance = async (attendanceId, { status, remarks }) => {
    const [result] = await db.query(
        `UPDATE student_attendance
         SET status = ?, remarks = ?
         WHERE attendance_id = ?`,
        [status, remarks || null, attendanceId]
    );

    return result.affectedRows;
};

const getDailyStudentReport = async ({ academicYear, classId, sectionId, date }) => {
    const [rows] = await db.query(
        `SELECT
            s.student_id,
            s.student_code,
            s.full_name,
            s.roll_number,
            a.attendance_id,
            a.status AS attendance_status,
            a.remarks
         FROM students s
         INNER JOIN classes c ON c.class_id = s.class_id
         INNER JOIN sections sec ON sec.section_id = s.section_id
         LEFT JOIN student_attendance a
                ON a.student_id = s.student_id AND a.attendance_date = ?
                AND a.class_id = s.class_id AND a.section_id = s.section_id
         WHERE c.academic_year = ?
            AND s.class_id = ?
            AND s.section_id = ?
            AND sec.class_id = s.class_id
            AND s.status = 'active'
         ORDER BY s.roll_number, s.full_name`,
        [date, academicYear, classId, sectionId]
    );

    return rows;
};

const getMonthlyStudentReport = async ({ academicYear, classId, sectionId, month }) => {
    const [rows] = await db.query(
        `SELECT
            s.student_id,
            s.student_code,
            s.full_name,
            s.roll_number,
            SUM(a.status = 'present') AS present_days,
            SUM(a.status = 'absent') AS absent_days,
            SUM(a.status = 'late') AS late_days,
            SUM(a.status = 'leave') AS leave_days,
            SUM(a.status IN ('present', 'absent', 'late')) AS counted_days,
            ROUND(
                100 * SUM(a.status IN ('present', 'late')) /
                NULLIF(SUM(a.status IN ('present', 'absent', 'late')), 0),
                2
            ) AS attendance_percentage
         FROM students s
         INNER JOIN classes c ON c.class_id = s.class_id
         INNER JOIN sections sec ON sec.section_id = s.section_id
         LEFT JOIN student_attendance a
            ON a.student_id = s.student_id
            AND a.attendance_date >= ?
            AND a.attendance_date < DATE_ADD(?, INTERVAL 1 MONTH)
                AND a.class_id = s.class_id
                AND a.section_id = s.section_id
                AND a.academic_year = c.academic_year
         WHERE c.academic_year = ?
            AND s.class_id = ?
            AND s.section_id = ?
            AND sec.class_id = s.class_id
            AND s.status = 'active'
         GROUP BY s.student_id, s.student_code, s.full_name, s.roll_number
         ORDER BY s.roll_number, s.full_name`,
        [`${month}-01`, `${month}-01`, academicYear, classId, sectionId]
    );

    return rows;
};

const getStudentHistory = async (studentId) => {
    const [rows] = await db.query(
        `SELECT
            a.attendance_id,
            a.attendance_date,
            a.status,
            a.remarks,
            c.class_name,
            c.academic_year,
            sec.section_name
         FROM student_attendance a
         INNER JOIN students s ON s.student_id = a.student_id
         LEFT JOIN classes c ON c.class_id = a.class_id
         LEFT JOIN sections sec ON sec.section_id = a.section_id
         WHERE a.student_id = ?
         ORDER BY a.attendance_date DESC`,
        [studentId]
    );

    return rows;
};

const getFrequentAbsences = async ({ from, to, minimum }) => {
    const [rows] = await db.query(
        `SELECT
            s.student_id,
            s.student_code,
            s.full_name,
            c.class_name,
            c.academic_year,
            sec.section_name,
            COUNT(*) AS absent_days
         FROM student_attendance a
            INNER JOIN students s ON s.student_id = a.student_id
            LEFT JOIN classes c ON c.class_id = a.class_id
            LEFT JOIN sections sec ON sec.section_id = a.section_id
         WHERE a.status = 'absent'
            AND a.attendance_date >= ?
            AND a.attendance_date <= ?
         GROUP BY s.student_id, s.student_code, s.full_name,
                c.class_name, a.academic_year, sec.section_name
         HAVING COUNT(*) >= ?
         ORDER BY absent_days DESC, s.full_name`,
        [from, to, minimum]
    );

    return rows;
};

const getEmployees = async (type, date) => {
    const tables = employeeTables[type];
    const [rows] = await db.query(
        `SELECT
            e.${tables.id} AS employee_id,
            e.employee_code,
            e.full_name,
            e.designation,
            a.attendance_id,
            a.status AS attendance_status,
            a.check_in,
            a.check_out,
            a.remarks
         FROM ${tables.entity} e
         LEFT JOIN ${tables.attendance} a
            ON a.${tables.id} = e.${tables.id} AND a.attendance_date = ?
         WHERE e.status = 'active'
         ORDER BY e.full_name`,
        [date]
    );

    return rows;
};

const saveEmployeeAttendance = async (type, { employeeId, date, status, checkIn, checkOut, remarks }) => {
    const tables = employeeTables[type];
    const [result] = await db.query(
        `INSERT INTO ${tables.attendance}
            (${tables.id}, attendance_date, status, check_in, check_out, remarks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employeeId, date, status, checkIn || null, checkOut || null, remarks || null]
    );

    return result.insertId;
};

const updateEmployeeAttendance = async (type, attendanceId, { status, checkIn, checkOut, remarks }) => {
    const tables = employeeTables[type];
    const [result] = await db.query(
        `UPDATE ${tables.attendance}
         SET status = ?, check_in = ?, check_out = ?, remarks = ?
         WHERE attendance_id = ?`,
        [status, checkIn || null, checkOut || null, remarks || null, attendanceId]
    );

    return result.affectedRows;
};

const getMonthlyEmployeeReport = async ({ type, month }) => {
    const tables = employeeTables[type];
    const [rows] = await db.query(
        `SELECT
            e.${tables.id} AS employee_id,
            e.employee_code,
            e.full_name,
            e.designation,
            SUM(a.status = 'present') AS present_days,
            SUM(a.status = 'absent') AS absent_days,
            SUM(a.status = 'late') AS late_days,
            SUM(a.status = 'leave') AS leave_days
         FROM ${tables.entity} e
         LEFT JOIN ${tables.attendance} a
            ON a.${tables.id} = e.${tables.id}
            AND a.attendance_date >= ?
            AND a.attendance_date < DATE_ADD(?, INTERVAL 1 MONTH)
         WHERE e.status = 'active'
         GROUP BY e.${tables.id}, e.employee_code, e.full_name, e.designation
         ORDER BY e.full_name`,
        [`${month}-01`, `${month}-01`]
    );

    return rows;
};

const getEmployeeLeaves = async (type, employeeId) => {
    const tables = employeeTables[type];
    const [rows] = await db.query(
        `SELECT l.leave_id, l.leave_type, l.start_date, l.end_date,
            l.reason, l.status, l.approved_by, l.created_at
         FROM leave_records l
         INNER JOIN ${tables.entity} e ON e.user_id = l.user_id
         WHERE e.${tables.id} = ?
         ORDER BY l.start_date DESC`,
        [employeeId]
    );

    return rows;
};

const createEmployeeLeave = async (type, employeeId, leave) => {
    const tables = employeeTables[type];
    const [employees] = await db.query(
        `SELECT user_id FROM ${tables.entity} WHERE ${tables.id} = ?`,
        [employeeId]
    );

    if (!employees[0]?.user_id) {
        return null;
    }

    const [result] = await db.query(
        `INSERT INTO leave_records
            (user_id, leave_type, start_date, end_date, reason)
         VALUES (?, ?, ?, ?, ?)`,
        [employees[0].user_id, leave.leaveType, leave.startDate, leave.endDate, leave.reason || null]
    );

    return result.insertId;
};

const updateLeaveRecord = async (leaveId, { status, approvedBy }) => {
    const [result] = await db.query(
        `UPDATE leave_records
         SET status = ?, approved_by = ?
         WHERE leave_id = ?`,
        [status, approvedBy || null, leaveId]
    );

    return result.affectedRows;
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