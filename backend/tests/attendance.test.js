const assert = require("node:assert/strict");
const express = require("express");
const { test } = require("node:test");
const db = require("../config/db");
const attendanceRoutes = require("../routes/attendanceRoutes");
const { createAttendanceToken } = require("../middleware/attendanceAuthorization");

process.env.ATTENDANCE_TOKEN_SECRET = "attendance-test-secret-with-at-least-32-bytes";

const createTestServer = async (user) => {
    const app = express();
    app.use(express.json());
    if (user) {
        app.use((req, res, next) => {
            req.user = user;
            next();
        });
    }
    app.use("/api/attendance", attendanceRoutes);
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    const address = server.address();
    return {
        baseUrl: `http://127.0.0.1:${address.port}/api/attendance`,
        close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    };
};

const callApi = async (baseUrl, path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers }
    });
    return { status: response.status, body: await response.json() };
};

test("attendance APIs enforce authentication, role checks and request validation", async () => {
    const unauthenticated = await createTestServer(null);
    const authenticated = await createTestServer(null);
    const adminToken = createAttendanceToken({ user_id: 1, role: "admin" });
    const teacherToken = createAttendanceToken({ user_id: 2, role: "teacher" });

    try {
        const unauthorized = await callApi(unauthenticated.baseUrl, "/employees?type=teacher&date=2098-04-01");
        assert.equal(unauthorized.status, 401);

        const session = await callApi(authenticated.baseUrl, "/session", {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.deepEqual(session.body.data, { user_id: 1, role: "admin" });

        const invalidToken = await callApi(authenticated.baseUrl, "/session", {
            headers: { Authorization: `Bearer ${adminToken.slice(0, -1)}x` }
        });
        assert.equal(invalidToken.status, 401);

        const forbidden = await callApi(authenticated.baseUrl, "/leaves/1", {
            method: "PATCH",
            headers: { Authorization: `Bearer ${teacherToken}` },
            body: JSON.stringify({ status: "approved" })
        });
        assert.equal(forbidden.status, 403);

        const invalidFilters = await callApi(authenticated.baseUrl, "/students/roster?class_id=bad", {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(invalidFilters.status, 400);

        const invalidEmployeeFilters = await callApi(authenticated.baseUrl, "/employees?type=parent&date=not-a-date", {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(invalidEmployeeFilters.status, 400);
    } finally {
        await unauthenticated.close();
        await authenticated.close();
    }
});

test("attendance APIs persist and report student and employee records", async (t) => {
    try {
        await db.query("SELECT 1");
    } catch (error) {
        t.skip(`MySQL is unavailable for attendance integration tests: ${error.message}`);
        return;
    }

    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const date1 = "2098-04-01";
    const date2 = "2098-04-02";
    const date3 = "2098-04-03";
    const emailPrefix = `attendance-test-${suffix}`;
    let adminUserId;
    let teacherUserId;
    let staffUserId;
    let classId;
    let sectionId;
    let studentId;
    let teacherId;
    let staffId;
    let server;

    try {
        const [adminResult] = await db.query(
            "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'admin')",
            ["Attendance Test Admin", `${emailPrefix}-admin@example.test`, "not-used"]
        );
        adminUserId = adminResult.insertId;
        const [teacherUserResult] = await db.query(
            "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'teacher')",
            ["Attendance Test Teacher", `${emailPrefix}-teacher@example.test`, "not-used"]
        );
        teacherUserId = teacherUserResult.insertId;
        const [staffUserResult] = await db.query(
            "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'accountant')",
            ["Attendance Test Staff", `${emailPrefix}-staff@example.test`, "not-used"]
        );
        staffUserId = staffUserResult.insertId;

        const [classResult] = await db.query(
            "INSERT INTO classes (class_name, academic_year) VALUES (?, ?)",
            [`Attendance Test ${suffix}`, "2098-2099"]
        );
        classId = classResult.insertId;
        const [sectionResult] = await db.query(
            "INSERT INTO sections (class_id, section_name) VALUES (?, ?)",
            [classId, `A${suffix.slice(-3)}`]
        );
        sectionId = sectionResult.insertId;
        const [studentResult] = await db.query(
            `INSERT INTO students
                (student_code, full_name, class_id, section_id, roll_number)
             VALUES (?, ?, ?, ?, ?)`,
            [`AT-${suffix}`, "Attendance Test Student", classId, sectionId, 1]
        );
        studentId = studentResult.insertId;
        const [teacherResult] = await db.query(
            "INSERT INTO teachers (user_id, employee_code, full_name) VALUES (?, ?, ?)",
            [teacherUserId, `ATT-${suffix}`, "Attendance Test Teacher"]
        );
        teacherId = teacherResult.insertId;
        const [staffResult] = await db.query(
            "INSERT INTO staff (user_id, employee_code, full_name) VALUES (?, ?, ?)",
            [staffUserId, `ATS-${suffix}`, "Attendance Test Staff"]
        );
        staffId = staffResult.insertId;

        server = await createTestServer({ user_id: adminUserId, role: "admin" });
        const filters = `academic_year=2098-2099&class_id=${classId}&section_id=${sectionId}`;

        const emptyRoster = await callApi(server.baseUrl, `/students/roster?${filters}&date=${date1}`);
        assert.equal(emptyRoster.status, 200);
        assert.equal(emptyRoster.body.data.length, 1);
        assert.equal(emptyRoster.body.data[0].attendance_id, null);

        const save = await callApi(server.baseUrl, "/students", {
            method: "POST",
            body: JSON.stringify({
                academic_year: "2098-2099", class_id: classId, section_id: sectionId,
                date: date1, attendance: [{ student_id: studentId, status: "present" }]
            })
        });
        assert.equal(save.status, 201);

        const duplicate = await callApi(server.baseUrl, "/students", {
            method: "POST",
            body: JSON.stringify({
                academic_year: "2098-2099", class_id: classId, section_id: sectionId,
                date: date1, attendance: [{ student_id: studentId, status: "absent" }]
            })
        });
        assert.equal(duplicate.status, 409);

        const savedRoster = await callApi(server.baseUrl, `/students/roster?${filters}&date=${date1}`);
        const attendanceId = savedRoster.body.data[0].attendance_id;
        const update = await callApi(server.baseUrl, `/students/${attendanceId}`, {
            method: "PUT", body: JSON.stringify({ status: "absent", remarks: "Test absence" })
        });
        assert.equal(update.status, 200);

        for (const date of [date2, date3]) {
            const result = await callApi(server.baseUrl, "/students", {
                method: "POST",
                body: JSON.stringify({
                    academic_year: "2098-2099", class_id: classId, section_id: sectionId,
                    date, attendance: [{ student_id: studentId, status: "absent" }]
                })
            });
            assert.equal(result.status, 201);
        }

        const daily = await callApi(server.baseUrl, `/students/reports/daily?${filters}&date=${date1}`);
        assert.equal(daily.body.data[0].attendance_status, "absent");
        const monthly = await callApi(server.baseUrl, `/students/reports/monthly?${filters}&month=2098-04`);
        assert.equal(Number(monthly.body.data[0].absent_days), 3);
        assert.equal(Number(monthly.body.data[0].attendance_percentage), 0);
        const history = await callApi(server.baseUrl, `/students/${studentId}/history`);
        assert.equal(history.body.data.length, 3);
        const frequent = await callApi(server.baseUrl, `/students/reports/frequent-absences?from=${date1}&to=${date3}&minimum=3`);
        assert.equal(frequent.body.data[0].student_id, studentId);

        const teacherSave = await callApi(server.baseUrl, "/employees", {
            method: "POST",
            body: JSON.stringify({
                type: "teacher", employee_id: teacherId, date: date1,
                status: "present", check_in: "08:10", check_out: "16:00"
            })
        });
        assert.equal(teacherSave.status, 201);
        const teacherDuplicate = await callApi(server.baseUrl, "/employees", {
            method: "POST",
            body: JSON.stringify({ type: "teacher", employee_id: teacherId, date: date1, status: "present" })
        });
        assert.equal(teacherDuplicate.status, 409);

        const teacherList = await callApi(server.baseUrl, `/employees?type=teacher&date=${date1}`);
        const teacherAttendanceId = teacherList.body.data[0].attendance_id;
        const teacherUpdate = await callApi(server.baseUrl, `/employees/${teacherAttendanceId}`, {
            method: "PUT",
            body: JSON.stringify({ type: "teacher", status: "late", check_in: "08:30", check_out: "16:00" })
        });
        assert.equal(teacherUpdate.status, 200);

        const staffSave = await callApi(server.baseUrl, "/employees", {
            method: "POST",
            body: JSON.stringify({ type: "staff", employee_id: staffId, date: date1, status: "leave" })
        });
        assert.equal(staffSave.status, 201);
        const staffReport = await callApi(server.baseUrl, "/employees/reports/monthly?type=staff&month=2098-04");
        assert.equal(Number(staffReport.body.data[0].leave_days), 1);

        const leaveSave = await callApi(server.baseUrl, `/employees/staff/${staffId}/leaves`, {
            method: "POST",
            body: JSON.stringify({ leave_type: "Test leave", start_date: date1, end_date: date2, reason: "Test" })
        });
        assert.equal(leaveSave.status, 201);
        const leaveList = await callApi(server.baseUrl, `/employees/staff/${staffId}/leaves`);
        const leaveId = leaveList.body.data[0].leave_id;
        const leaveUpdate = await callApi(server.baseUrl, `/leaves/${leaveId}`, {
            method: "PATCH", body: JSON.stringify({ status: "approved" })
        });
        assert.equal(leaveUpdate.status, 200);

        const unauthenticated = await createTestServer(null);
        const unauthorizedResponse = await callApi(unauthenticated.baseUrl, `/students/roster?${filters}&date=${date1}`);
        assert.equal(unauthorizedResponse.status, 401);
        await unauthenticated.close();

        const teacherApp = await createTestServer({ user_id: teacherUserId, role: "teacher" });
        const forbiddenApproval = await callApi(teacherApp.baseUrl, `/leaves/${leaveId}`, {
            method: "PATCH", body: JSON.stringify({ status: "approved" })
        });
        assert.equal(forbiddenApproval.status, 403);
        await teacherApp.close();
    } finally {
        if (server) await server.close();
        if (studentId) await db.query("DELETE FROM student_attendance WHERE student_id = ?", [studentId]);
        if (teacherId) await db.query("DELETE FROM teacher_attendance WHERE teacher_id = ?", [teacherId]);
        if (staffId) await db.query("DELETE FROM staff_attendance WHERE staff_id = ?", [staffId]);
        if (teacherUserId || staffUserId) {
            await db.query("DELETE FROM leave_records WHERE user_id IN (?, ?)", [teacherUserId || 0, staffUserId || 0]);
        }
        if (studentId) await db.query("DELETE FROM students WHERE student_id = ?", [studentId]);
        if (teacherId) await db.query("DELETE FROM teachers WHERE teacher_id = ?", [teacherId]);
        if (staffId) await db.query("DELETE FROM staff WHERE staff_id = ?", [staffId]);
        if (sectionId) await db.query("DELETE FROM sections WHERE section_id = ?", [sectionId]);
        if (classId) await db.query("DELETE FROM classes WHERE class_id = ?", [classId]);
        const userIds = [adminUserId, teacherUserId, staffUserId].filter(Boolean);
        if (userIds.length) {
            await db.query(`DELETE FROM users WHERE user_id IN (${userIds.map(() => "?").join(", ")})`, userIds);
        }
    }
});