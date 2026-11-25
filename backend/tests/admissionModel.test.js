
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const db = require("../config/db");
const admissionModel = require("../models/admissionModel");

// Original database methods
const originalQuery = db.query;
const originalGetConnection = db.getConnection;

// Restore database methods before every test
beforeEach(() => {
    db.query = originalQuery;
    db.getConnection = originalGetConnection;
});

afterEach(() => {
    db.query = originalQuery;
    db.getConnection = originalGetConnection;
});

// Sample admission data
const sampleAdmission = {
    application_id: 1,
    applicant_name: "Rahim",
    date_of_birth: "2010-05-10",
    gender: "Male",
    guardian_name: "Karim",
    guardian_phone: "01700000000",
    email: "rahim@gmail.com",
    address: "Dhaka",
    applying_class: "Class 4",
    status: "pending"
};

// Mock database connection
const createMockConnection = (queryHandler) => {
    const calls = [];

    const connection = {
        beginTransaction: async () => {},

        commit: async () => {},

        rollback: async () => {},

        release: () => {},

        query: async (sql, values = []) => {
            calls.push({ sql, values });

            return queryHandler(sql, values, calls);
        }
    };

    return { connection, calls };
};

// ----------------------------------------
// GET ALL ADMISSIONS
// ----------------------------------------

test("getAllAdmissions should return all admission applications", async () => {
    const admissions = [sampleAdmission];

    db.query = async () => [admissions];

    const result = await admissionModel.getAllAdmissions();

    assert.deepEqual(result, admissions);
});

test("getAllAdmissions should return empty array when no admissions exist", async () => {
    db.query = async () => [[]];

    const result = await admissionModel.getAllAdmissions();

    assert.deepEqual(result, []);
});

// ----------------------------------------
// GET ADMISSION BY ID
// ----------------------------------------

test("getAdmissionById should return admission by ID", async () => {
    db.query = async () => [[sampleAdmission]];

    const result = await admissionModel.getAdmissionById(1);

    assert.deepEqual(result, sampleAdmission);
});

test("getAdmissionById should return undefined when admission does not exist", async () => {
    db.query = async () => [[]];

    const result = await admissionModel.getAdmissionById(999);

    assert.equal(result, undefined);
});

// ----------------------------------------
// CREATE ADMISSION
// ----------------------------------------

test("createAdmission should insert a new admission", async () => {
    db.query = async () => [{ insertId: 10 }];

    const result = await admissionModel.createAdmission({
        applicant_name: "Rahim",
        applying_class: "Class 4"
    });

    assert.equal(result, 10);
});

test("createAdmission should insert optional fields as null", async () => {
    let insertedValues;

    db.query = async (sql, values) => {
        insertedValues = values;
        return [{ insertId: 11 }];
    };

    await admissionModel.createAdmission({
        applicant_name: "Karim",
        applying_class: "Class 5"
    });

    assert.equal(insertedValues[1], null);
    assert.equal(insertedValues[2], null);
    assert.equal(insertedValues[3], null);
    assert.equal(insertedValues[4], null);
});

// ----------------------------------------
// UPDATE ADMISSION
// ----------------------------------------

test("updateAdmission should update admission successfully", async () => {
    db.query = async () => [{ affectedRows: 1 }];

    const result = await admissionModel.updateAdmission(1, {
        applicant_name: "Rahim Updated",
        applying_class: "Class 5"
    });

    assert.equal(result, 1);
});

test("updateAdmission should return 0 when admission does not exist", async () => {
    db.query = async () => [{ affectedRows: 0 }];

    const result = await admissionModel.updateAdmission(999, {
        applicant_name: "Test",
        applying_class: "Class 4"
    });

    assert.equal(result, 0);
});

// ----------------------------------------
// APPROVE ADMISSION - CREATE STUDENT
// ----------------------------------------

test("updateAdmissionStatus should create student when admission is approved", async () => {
    const { connection, calls } = createMockConnection((sql) => {
        if (sql.includes("FROM online_admissions")) {
            return [[sampleAdmission]];
        }

        if (sql.includes("FROM students")) {
            return [[]];
        }

        if (sql.includes("FROM classes")) {
            return [[{ class_id: 4 }]];
        }

        if (sql.includes("INSERT INTO students")) {
            return [{ insertId: 20 }];
        }

        if (sql.includes("UPDATE online_admissions")) {
            return [{ affectedRows: 1 }];
        }

        return [[]];
    });

    db.getConnection = async () => connection;

    const result = await admissionModel.updateAdmissionStatus(1, "approved");

    assert.equal(result, 1);

    const studentInsert = calls.find(call =>
        call.sql.includes("INSERT INTO students")
    );

    assert.ok(studentInsert);
    assert.equal(studentInsert.values[0], "ADM-1");
    assert.equal(studentInsert.values[1], "Rahim");
});

// ----------------------------------------
// REJECT ADMISSION - STUDENT INACTIVE
// ----------------------------------------

test("updateAdmissionStatus should make existing student inactive when rejected", async () => {
    const approvedAdmission = {
        ...sampleAdmission,
        status: "approved"
    };

    const { connection, calls } = createMockConnection((sql) => {
        if (sql.includes("FROM online_admissions")) {
            return [[approvedAdmission]];
        }

        if (sql.includes("UPDATE students")) {
            return [{ affectedRows: 1 }];
        }

        if (sql.includes("UPDATE online_admissions")) {
            return [{ affectedRows: 1 }];
        }

        return [[]];
    });

    db.getConnection = async () => connection;

    const result = await admissionModel.updateAdmissionStatus(1, "rejected");

    assert.equal(result, 1);

    const studentUpdate = calls.find(call =>
        call.sql.includes("UPDATE students")
    );

    assert.ok(studentUpdate, "Student should be updated when admission is rejected");
    assert.match(studentUpdate.sql, /status\s*=\s*'inactive'/i);
});

// ----------------------------------------
// APPROVE AGAIN - STUDENT ACTIVE
// ----------------------------------------

test("updateAdmissionStatus should activate existing student when approved again", async () => {
    const rejectedAdmission = {
        ...sampleAdmission,
        status: "rejected"
    };

    const { connection, calls } = createMockConnection((sql) => {
        if (sql.includes("FROM online_admissions")) {
            return [[rejectedAdmission]];
        }

        if (sql.includes("FROM students")) {
            return [[{ student_id: 30 }]];
        }

        if (sql.includes("UPDATE students")) {
            return [{ affectedRows: 1 }];
        }

        if (sql.includes("UPDATE online_admissions")) {
            return [{ affectedRows: 1 }];
        }

        return [[]];
    });

    db.getConnection = async () => connection;

    const result = await admissionModel.updateAdmissionStatus(1, "approved");

    assert.equal(result, 1);

    const studentUpdate = calls.find(call =>
        call.sql.includes("UPDATE students")
    );

    assert.ok(studentUpdate, "Existing student should be activated again");
    assert.match(studentUpdate.sql, /status\s*=\s*'active'/i);
});

// ----------------------------------------
// UPDATE ADMISSION STATUS - NOT FOUND
// ----------------------------------------

test("updateAdmissionStatus should throw error when admission does not exist", async () => {
    const { connection } = createMockConnection(() => [[]]);

    db.getConnection = async () => connection;

    await assert.rejects(
        admissionModel.updateAdmissionStatus(999, "approved"),
        {
            code: "ADMISSION_NOT_FOUND"
        }
    );
});

// ----------------------------------------
// UPDATE ADMISSION STATUS - ENROLLED
// ----------------------------------------

test("updateAdmissionStatus should not change an already enrolled admission", async () => {
    const enrolledAdmission = {
        ...sampleAdmission,
        status: "enrolled"
    };

    const { connection } = createMockConnection(() => [
        [enrolledAdmission]
    ]);

    db.getConnection = async () => connection;

    await assert.rejects(
        admissionModel.updateAdmissionStatus(1, "rejected"),
        {
            code: "ADMISSION_ALREADY_ENROLLED"
        }
    );
});

// ----------------------------------------
// CLASS NOT FOUND
// ----------------------------------------

test("updateAdmissionStatus should throw error when applying class does not exist", async () => {
    const { connection } = createMockConnection((sql) => {
        if (sql.includes("FROM online_admissions")) {
            return [[sampleAdmission]];
        }

        if (sql.includes("FROM students")) {
            return [[]];
        }

        if (sql.includes("FROM classes")) {
            return [[]];
        }

        return [[]];
    });

    db.getConnection = async () => connection;

    const admissionWithInvalidClass = {
        ...sampleAdmission,
        applying_class: "Class 99"
    };

    const { connection: invalidConnection } = createMockConnection((sql) => {
        if (sql.includes("FROM online_admissions")) {
            return [[admissionWithInvalidClass]];
        }

        if (sql.includes("FROM students")) {
            return [[]];
        }

        if (sql.includes("FROM classes")) {
            return [[]];
        }

        return [[]];
    });

    db.getConnection = async () => invalidConnection;

    await assert.rejects(
        admissionModel.updateAdmissionStatus(1, "approved"),
        {
            code: "ADMISSION_CLASS_NOT_FOUND"
        }
    );
});

// ----------------------------------------
// ENROLL ADMISSION
// ----------------------------------------

test("enrollAdmission should enroll an approved applicant", async () => {
    const approvedAdmission = {
        ...sampleAdmission,
        status: "approved"
    };

    const { connection, calls } = createMockConnection((sql) => {
        if (sql.includes("FROM online_admissions")) {
            return [[approvedAdmission]];
        }

        if (sql.includes("FROM students")) {
            return [[{ student_id: 20 }]];
        }

        if (sql.includes("UPDATE online_admissions")) {
            return [{ affectedRows: 1 }];
        }

        return [[]];
    });

    db.getConnection = async () => connection;

    const result = await admissionModel.enrollAdmission(1);

    assert.equal(result, 20);

    const updateCall = calls.find(call =>
        call.sql.includes("UPDATE online_admissions")
    );

    assert.ok(updateCall);
});

// ----------------------------------------
// ENROLL ADMISSION - NOT APPROVED
// ----------------------------------------

test("enrollAdmission should reject pending applications", async () => {
    const { connection } = createMockConnection(() => [
        [sampleAdmission]
    ]);

    db.getConnection = async () => connection;

    await assert.rejects(
        admissionModel.enrollAdmission(1),
        {
            code: "ADMISSION_NOT_APPROVED"
        }
    );
});

// ----------------------------------------
// ENROLL ADMISSION - STUDENT NOT FOUND
// ----------------------------------------

test("enrollAdmission should throw error when student does not exist", async () => {
    const approvedAdmission = {
        ...sampleAdmission,
        status: "approved"
    };

    const { connection } = createMockConnection((sql) => {
        if (sql.includes("FROM online_admissions")) {
            return [[approvedAdmission]];
        }

        if (sql.includes("FROM students")) {
            return [[]];
        }

        return [[]];
    });

    db.getConnection = async () => connection;

    await assert.rejects(
        admissionModel.enrollAdmission(1),
        {
            code: "ADMISSION_STUDENT_NOT_FOUND"
        }
    );
});

// ----------------------------------------
// DELETE ADMISSION
// ----------------------------------------

test("deleteAdmission should delete admission successfully", async () => {
    db.query = async () => [{ affectedRows: 1 }];

    const result = await admissionModel.deleteAdmission(1);

    assert.equal(result, 1);
});

test("deleteAdmission should return 0 when admission does not exist", async () => {
    db.query = async () => [{ affectedRows: 0 }];

    const result = await admissionModel.deleteAdmission(999);

    assert.equal(result, 0);
});
