
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/db');
const attendanceModel = require('../models/attendanceModel');

let mockResult;
let capturedQuery;
let capturedParams;

beforeEach(() => {
    mockResult = null;
    capturedQuery = '';
    capturedParams = [];

    db.query = async (query, params = []) => {
        capturedQuery = query;
        capturedParams = params;
        return mockResult;
    };
});

// ==========================================
// STUDENT ATTENDANCE TESTS
// ==========================================

// Get all student attendance
test('getAllStudentAttendance should return all attendance records', async () => {
    const records = [
        { attendance_id: 1, student_id: 101, status: 'Present' },
        { attendance_id: 2, student_id: 102, status: 'Absent' }
    ];

    mockResult = [records];

    const result = await attendanceModel.getAllStudentAttendance();

    assert.deepEqual(result, records);
    assert.match(capturedQuery, /FROM student_attendance/);
});

test('getAllStudentAttendance should return empty array when no records exist', async () => {
    mockResult = [[]];

    const result = await attendanceModel.getAllStudentAttendance();

    assert.deepEqual(result, []);
});

// Get student attendance by ID
test('getStudentAttendanceById should return attendance by ID', async () => {
    const record = {
        attendance_id: 1,
        student_id: 101,
        status: 'Present'
    };

    mockResult = [[record]];

    const result = await attendanceModel.getStudentAttendanceById(1);

    assert.deepEqual(result, record);
    assert.deepEqual(capturedParams, [1]);
});

test('getStudentAttendanceById should return undefined when record does not exist', async () => {
    mockResult = [[]];

    const result = await attendanceModel.getStudentAttendanceById(999);

    assert.equal(result, undefined);
});

// Create student attendance
test('createStudentAttendance should return insertId', async () => {
    mockResult = [{ insertId: 10 }];

    const attendanceData = {
        student_id: 101,
        class_id: 5,
        section_id: 2,
        attendance_date: '2026-11-09',
        status: 'Present',
        remarks: 'On time'
    };

    const result = await attendanceModel.createStudentAttendance(attendanceData);

    assert.equal(result, 10);
    assert.deepEqual(capturedParams, [
        101,
        5,
        2,
        '2026-11-09',
        'Present',
        'On time'
    ]);
});

test('createStudentAttendance should use null for optional section_id and remarks', async () => {
    mockResult = [{ insertId: 11 }];

    const attendanceData = {
        student_id: 102,
        class_id: 5,
        attendance_date: '2026-11-09',
        status: 'Absent'
    };

    const result = await attendanceModel.createStudentAttendance(attendanceData);

    assert.equal(result, 11);
    assert.deepEqual(capturedParams, [
        102,
        5,
        null,
        '2026-11-09',
        'Absent',
        null
    ]);
});

// Update student attendance
test('updateStudentAttendance should return affectedRows', async () => {
    mockResult = [{ affectedRows: 1 }];

    const attendanceData = {
        status: 'Late',
        remarks: 'Arrived late'
    };

    const result = await attendanceModel.updateStudentAttendance(1, attendanceData);

    assert.equal(result, 1);
    assert.deepEqual(capturedParams, ['Late', 'Arrived late', 1]);
});

test('updateStudentAttendance should return 0 when no record is updated', async () => {
    mockResult = [{ affectedRows: 0 }];

    const result = await attendanceModel.updateStudentAttendance(999, {
        status: 'Present'
    });

    assert.equal(result, 0);
});

test('updateStudentAttendance should use null when remarks are not provided', async () => {
    mockResult = [{ affectedRows: 1 }];

    await attendanceModel.updateStudentAttendance(1, {
        status: 'Present'
    });

    assert.deepEqual(capturedParams, ['Present', null, 1]);
});

// Delete student attendance
test('deleteStudentAttendance should return affectedRows', async () => {
    mockResult = [{ affectedRows: 1 }];

    const result = await attendanceModel.deleteStudentAttendance(1);

    assert.equal(result, 1);
    assert.deepEqual(capturedParams, [1]);
});

test('deleteStudentAttendance should return 0 when record does not exist', async () => {
    mockResult = [{ affectedRows: 0 }];

    const result = await attendanceModel.deleteStudentAttendance(999);

    assert.equal(result, 0);
});

// Get class-wise attendance
test('getClassWiseAttendance should return class-wise attendance', async () => {
    const records = [
        { attendance_id: 1, student_id: 101, class_id: 5 },
        { attendance_id: 2, student_id: 102, class_id: 5 }
    ];

    mockResult = [records];

    const result = await attendanceModel.getClassWiseAttendance(
        5,
        2,
        '2026-11-09'
    );

    assert.deepEqual(result, records);
    assert.deepEqual(capturedParams, [5, '2026-11-09', 2]);
    assert.match(capturedQuery, /section_id = \?/);
});

test('getClassWiseAttendance should work without section_id', async () => {
    mockResult = [[]];

    const result = await attendanceModel.getClassWiseAttendance(
        5,
        null,
        '2026-11-09'
    );

    assert.deepEqual(result, []);
    assert.deepEqual(capturedParams, [5, '2026-11-09']);
    assert.doesNotMatch(capturedQuery, /section_id = \?/);
});

// Get student attendance history
test('getStudentAttendanceHistory should return student attendance history', async () => {
    const records = [
        { attendance_id: 1, student_id: 101, status: 'Present' },
        { attendance_id: 2, student_id: 101, status: 'Absent' }
    ];

    mockResult = [records];

    const result = await attendanceModel.getStudentAttendanceHistory(101);

    assert.deepEqual(result, records);
    assert.deepEqual(capturedParams, [101]);
});

// Get monthly student attendance
test('getMonthlyStudentAttendance should return monthly attendance', async () => {
    const records = [
        { attendance_id: 1, student_id: 101, status: 'Present' }
    ];

    mockResult = [records];

    const result = await attendanceModel.getMonthlyStudentAttendance(
        101,
        11,
        2026
    );

    assert.deepEqual(result, records);
    assert.deepEqual(capturedParams, [101, 11, 2026]);
});

// Get student attendance percentage
test('getStudentAttendancePercentage should return attendance percentage', async () => {
    const percentage = {
        total_days: 20,
        present_days: 15,
        absent_days: 3,
        leave_days: 2,
        attendance_percentage: 75.00
    };

    mockResult = [[percentage]];

    const result = await attendanceModel.getStudentAttendancePercentage(101);

    assert.deepEqual(result, percentage);
    assert.deepEqual(capturedParams, [101]);
});

test('getStudentAttendancePercentage should return undefined when no result exists', async () => {
    mockResult = [[]];

    const result = await attendanceModel.getStudentAttendancePercentage(999);

    assert.equal(result, undefined);
});

// ==========================================
// STAFF ATTENDANCE TESTS
// ==========================================

// Get all staff attendance
test('getAllStaffAttendance should return all staff attendance records', async () => {
    const records = [
        { attendance_id: 1, staff_id: 201, status: 'Present' },
        { attendance_id: 2, staff_id: 202, status: 'Absent' }
    ];

    mockResult = [records];

    const result = await attendanceModel.getAllStaffAttendance();

    assert.deepEqual(result, records);
    assert.match(capturedQuery, /FROM staff_attendance/);
});

test('getAllStaffAttendance should return empty array when no records exist', async () => {
    mockResult = [[]];

    const result = await attendanceModel.getAllStaffAttendance();

    assert.deepEqual(result, []);
});

// Get staff attendance by ID
test('getStaffAttendanceById should return staff attendance by ID', async () => {
    const record = {
        attendance_id: 1,
        staff_id: 201,
        status: 'Present'
    };

    mockResult = [[record]];

    const result = await attendanceModel.getStaffAttendanceById(1);

    assert.deepEqual(result, record);
    assert.deepEqual(capturedParams, [1]);
});

test('getStaffAttendanceById should return undefined when record does not exist', async () => {
    mockResult = [[]];

    const result = await attendanceModel.getStaffAttendanceById(999);

    assert.equal(result, undefined);
});

// Create staff attendance
test('createStaffAttendance should return insertId', async () => {
    mockResult = [{ insertId: 20 }];

    const attendanceData = {
        staff_id: 201,
        attendance_date: '2026-11-09',
        status: 'Present',
        check_in_time: '08:00:00',
        check_out_time: '16:00:00',
        remarks: 'On time'
    };

    const result = await attendanceModel.createStaffAttendance(attendanceData);

    assert.equal(result, 20);
    assert.deepEqual(capturedParams, [
        201,
        '2026-11-09',
        'Present',
        '08:00:00',
        '16:00:00',
        'On time'
    ]);
});

test('createStaffAttendance should use default Present status and null optional values', async () => {
    mockResult = [{ insertId: 21 }];

    const attendanceData = {
        staff_id: 202,
        attendance_date: '2026-11-09'
    };

    const result = await attendanceModel.createStaffAttendance(attendanceData);

    assert.equal(result, 21);
    assert.deepEqual(capturedParams, [
        202,
        '2026-11-09',
        'Present',
        null,
        null,
        null
    ]);
});

// Update staff attendance
test('updateStaffAttendance should return affectedRows', async () => {
    mockResult = [{ affectedRows: 1 }];

    const attendanceData = {
        status: 'Late',
        check_in_time: '08:30:00',
        check_out_time: '16:00:00',
        remarks: 'Late arrival'
    };

    const result = await attendanceModel.updateStaffAttendance(1, attendanceData);

    assert.equal(result, 1);
    assert.deepEqual(capturedParams, [
        'Late',
        '08:30:00',
        '16:00:00',
        'Late arrival',
        1
    ]);
});

test('updateStaffAttendance should use null for missing optional values', async () => {
    mockResult = [{ affectedRows: 1 }];

    await attendanceModel.updateStaffAttendance(1, {
        status: 'Present'
    });

    assert.deepEqual(capturedParams, [
        'Present',
        null,
        null,
        null,
        1
    ]);
});

test('updateStaffAttendance should return 0 when no record is updated', async () => {
    mockResult = [{ affectedRows: 0 }];

    const result = await attendanceModel.updateStaffAttendance(999, {
        status: 'Present'
    });

    assert.equal(result, 0);
});

// Delete staff attendance
test('deleteStaffAttendance should return affectedRows', async () => {
    mockResult = [{ affectedRows: 1 }];

    const result = await attendanceModel.deleteStaffAttendance(1);

    assert.equal(result, 1);
    assert.deepEqual(capturedParams, [1]);
});

test('deleteStaffAttendance should return 0 when record does not exist', async () => {
    mockResult = [{ affectedRows: 0 }];

    const result = await attendanceModel.deleteStaffAttendance(999);

    assert.equal(result, 0);
});

// Staff check-in
test('staffCheckIn should return insertId', async () => {
    mockResult = [{ insertId: 30 }];

    const attendanceData = {
        staff_id: 201,
        attendance_date: '2026-11-09',
        check_in_time: '08:00:00'
    };

    const result = await attendanceModel.staffCheckIn(attendanceData);

    assert.equal(result, 30);
    assert.deepEqual(capturedParams, [
        201,
        '2026-11-09',
        '08:00:00'
    ]);
    assert.match(capturedQuery, /'Present'/);
});

test('staffCheckIn should use null when check_in_time is not provided', async () => {
    mockResult = [{ insertId: 31 }];

    const result = await attendanceModel.staffCheckIn({
        staff_id: 202,
        attendance_date: '2026-11-09'
    });

    assert.equal(result, 31);
    assert.deepEqual(capturedParams, [
        202,
        '2026-11-09',
        null
    ]);
});

// Staff check-out
test('staffCheckOut should return affectedRows', async () => {
    mockResult = [{ affectedRows: 1 }];

    const result = await attendanceModel.staffCheckOut(
        1,
        '16:00:00'
    );

    assert.equal(result, 1);
    assert.deepEqual(capturedParams, ['16:00:00', 1]);
    assert.match(capturedQuery, /check_out_time IS NULL/);
});

test('staffCheckOut should return 0 when checkout is not possible', async () => {
    mockResult = [{ affectedRows: 0 }];

    const result = await attendanceModel.staffCheckOut(
        999,
        '16:00:00'
    );

    assert.equal(result, 0);
});

// Get staff leave records
test('getStaffLeaveRecords should return leave records', async () => {
    const records = [
        { attendance_id: 1, staff_id: 201, status: 'Leave' }
    ];

    mockResult = [records];

    const result = await attendanceModel.getStaffLeaveRecords();

    assert.deepEqual(result, records);
    assert.match(capturedQuery, /status = 'Leave'/);
});

test('getStaffLeaveRecords should return empty array when no leave records exist', async () => {
    mockResult = [[]];

    const result = await attendanceModel.getStaffLeaveRecords();

    assert.deepEqual(result, []);
});

// Get monthly staff attendance
test('getMonthlyStaffAttendance should return monthly staff attendance', async () => {
    const records = [
        { attendance_id: 1, staff_id: 201, status: 'Present' }
    ];

    mockResult = [records];

    const result = await attendanceModel.getMonthlyStaffAttendance(
        201,
        11,
        2026
    );

    assert.deepEqual(result, records);
    assert.deepEqual(capturedParams, [201, 11, 2026]);
});

// ==========================================
// DATABASE ERROR TESTS
// ==========================================

test('getAllStudentAttendance should throw database error', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        attendanceModel.getAllStudentAttendance(),
        /Database error/
    );
});

test('createStudentAttendance should throw database error', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        attendanceModel.createStudentAttendance({
            student_id: 101,
            class_id: 5,
            attendance_date: '2026-11-09',
            status: 'Present'
        }),
        /Database error/
    );
});

test('deleteStudentAttendance should throw database error', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        attendanceModel.deleteStudentAttendance(1),
        /Database error/
    );
});

test('getAllStaffAttendance should throw database error', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        attendanceModel.getAllStaffAttendance(),
        /Database error/
    );
});

test('createStaffAttendance should throw database error', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        attendanceModel.createStaffAttendance({
            staff_id: 201,
            attendance_date: '2026-11-09'
        }),
        /Database error/
    );
});

test('deleteStaffAttendance should throw database error', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        attendanceModel.deleteStaffAttendance(1),
        /Database error/
    );
});
