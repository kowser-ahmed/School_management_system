
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;

let mockDb;
let leaveModel;

function setupModel() {
    mockDb = {
        query: async () => [[], []]
    };

    Module._load = function (request, parent, isMain) {
        if (
            request === "../config/db" &&
            parent.filename.includes("leaveModel")
        ) {
            return mockDb;
        }

        return originalLoad.call(this, request, parent, isMain);
    };

    delete require.cache[require.resolve("../models/leaveModel")];

    leaveModel = require("../models/leaveModel");
}

function restoreModel() {
    Module._load = originalLoad;
}

// GET ALL LEAVES

test("getAllLeaves returns all leave records", async () => {
    setupModel();

    mockDb.query = async () => [[
        {
            leave_id: 1,
            user_id: 1,
            full_name: "Staff User",
            leave_type: "Casual Leave"
        }
    ], []];

    const result = await leaveModel.getAllLeaves();

    assert.equal(result.length, 1);
    assert.equal(result[0].leave_id, 1);
    assert.equal(result[0].full_name, "Staff User");

    restoreModel();
});

test("getAllLeaves returns empty list when no leaves exist", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    const result = await leaveModel.getAllLeaves();

    assert.deepEqual(result, []);

    restoreModel();
});

// GET LEAVE BY ID

test("getLeaveById returns an existing leave", async () => {
    setupModel();

    mockDb.query = async () => [[
        {
            leave_id: 1,
            user_id: 1,
            leave_type: "Casual Leave"
        }
    ], []];

    const result = await leaveModel.getLeaveById(1);

    assert.equal(result.leave_id, 1);
    assert.equal(result.leave_type, "Casual Leave");

    restoreModel();
});

test("getLeaveById returns undefined when leave is missing", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    const result = await leaveModel.getLeaveById(999);

    assert.equal(result, undefined);

    restoreModel();
});

// GET LEAVES BY USER ID

test("getLeavesByUserId returns user's leave records", async () => {
    setupModel();

    mockDb.query = async () => [[
        {
            leave_id: 1,
            user_id: 5,
            leave_type: "Sick Leave"
        },
        {
            leave_id: 2,
            user_id: 5,
            leave_type: "Casual Leave"
        }
    ], []];

    const result = await leaveModel.getLeavesByUserId(5);

    assert.equal(result.length, 2);
    assert.equal(result[0].user_id, 5);

    restoreModel();
});

test("getLeavesByUserId returns empty list when user has no leaves", async () => {
    setupModel();

    mockDb.query = async () => [[], []];

    const result = await leaveModel.getLeavesByUserId(999);

    assert.deepEqual(result, []);

    restoreModel();
});

// CREATE LEAVE

test("createLeave inserts a leave application", async () => {
    setupModel();

    mockDb.query = async () => [{ insertId: 10 }, []];

    const result = await leaveModel.createLeave({
        user_id: 1,
        leave_type: "Casual Leave",
        start_date: "2026-12-01",
        end_date: "2026-12-02",
        reason: "Personal work"
    });

    assert.equal(result, 10);

    restoreModel();
});

// UPDATE LEAVE

test("updateLeave updates a pending leave application", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    const result = await leaveModel.updateLeave(1, {
        leave_type: "Sick Leave",
        start_date: "2026-12-05",
        end_date: "2026-12-06",
        reason: "Medical reasons"
    });

    assert.equal(result, 1);

    restoreModel();
});

test("updateLeave returns zero when leave cannot be updated", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 0 }, []];

    const result = await leaveModel.updateLeave(999, {
        leave_type: "Casual Leave",
        start_date: "2026-12-01",
        end_date: "2026-12-02",
        reason: "Personal work"
    });

    assert.equal(result, 0);

    restoreModel();
});

// UPDATE LEAVE STATUS

test("updateLeaveStatus approves a pending leave", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    const result = await leaveModel.updateLeaveStatus(
        1,
        "approved",
        2
    );

    assert.equal(result, 1);

    restoreModel();
});

test("updateLeaveStatus rejects a pending leave", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    const result = await leaveModel.updateLeaveStatus(
        1,
        "rejected",
        2
    );

    assert.equal(result, 1);

    restoreModel();
});

test("updateLeaveStatus returns zero when leave is already processed", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 0 }, []];

    const result = await leaveModel.updateLeaveStatus(
        1,
        "approved",
        2
    );

    assert.equal(result, 0);

    restoreModel();
});

// DELETE LEAVE

test("deleteLeave deletes a pending leave application", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 1 }, []];

    const result = await leaveModel.deleteLeave(1);

    assert.equal(result, 1);

    restoreModel();
});

test("deleteLeave returns zero when leave does not exist", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 0 }, []];

    const result = await leaveModel.deleteLeave(999);

    assert.equal(result, 0);

    restoreModel();
});

test("deleteLeave returns zero when leave is not pending", async () => {
    setupModel();

    mockDb.query = async () => [{ affectedRows: 0 }, []];

    const result = await leaveModel.deleteLeave(1);

    assert.equal(result, 0);

    restoreModel();
});

// DATABASE ERROR HANDLING

test("getAllLeaves throws error when database query fails", async () => {
    setupModel();

    mockDb.query = async () => {
        throw new Error("Database error");
    };

    await assert.rejects(
        leaveModel.getAllLeaves(),
        /Database error/
    );

    restoreModel();
});

test("createLeave throws error when database insert fails", async () => {
    setupModel();

    mockDb.query = async () => {
        throw new Error("Database error");
    };

    await assert.rejects(
        leaveModel.createLeave({
            user_id: 1,
            leave_type: "Casual Leave",
            start_date: "2026-12-01",
            end_date: "2026-12-02",
            reason: "Personal work"
        }),
        /Database error/
    );

    restoreModel();
});
