
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;

let mockModel;
let controller;

function setupController() {
    mockModel = {
        getAllLeaves: async () => [],
        getLeaveById: async () => null,
        getLeavesByUserId: async () => [],
        createLeave: async () => ({ insertId: 1 }),
        updateLeave: async () => ({ affectedRows: 1 }),
        updateLeaveStatus: async () => ({ affectedRows: 1 }),
        deleteLeave: async () => ({ affectedRows: 1 })
    };

    Module._load = function (request, parent, isMain) {
        if (
            request === "../models/leaveModel" &&
            parent.filename.includes("leaveController")
        ) {
            return mockModel;
        }

        return originalLoad.call(this, request, parent, isMain);
    };

    delete require.cache[require.resolve("../controllers/leaveController")];
    controller = require("../controllers/leaveController");
}

function restoreController() {
    Module._load = originalLoad;
}

function mockResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
}

async function callController(method, req = {}) {
    const res = mockResponse();

    await controller[method](
        {
            body: {},
            params: {},
            query: {},
            user: {
                user_id: 1,
                role: "admin"
            },
            ...req
        },
        res
    );

    return res;
}

const validLeave = {
    leave_type: "Casual Leave",
    start_date: "2026-12-01",
    end_date: "2026-12-02",
    reason: "Personal work"
};

// GET ALL LEAVES

test("Controller: getAllLeaves returns all leave records", async () => {
    setupController();

    mockModel.getAllLeaves = async () => [
        { leave_id: 1, leave_type: "Casual Leave" }
    ];

    const res = await callController("getAllLeaves");

    assert.equal(res.statusCode, 200);

    restoreController();
});

// GET MY LEAVES

test("Controller: getMyLeaves returns user's leave records", async () => {
    setupController();

    mockModel.getLeavesByUserId = async () => [
        { leave_id: 1, user_id: 1 }
    ];

    const res = await callController("getMyLeaves");

    assert.equal(res.statusCode, 200);

    restoreController();
});

// GET LEAVE BY ID

test("Controller: getLeaveById rejects invalid ID", async () => {
    setupController();

    const res = await callController("getLeaveById", {
        params: { id: "abc" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: getLeaveById returns 404 for missing leave", async () => {
    setupController();

    mockModel.getLeaveById = async () => null;

    const res = await callController("getLeaveById", {
        params: { id: "999" }
    });

    assert.equal(res.statusCode, 404);

    restoreController();
});

// CREATE LEAVE

test("Controller: createLeave rejects missing leave type", async () => {
    setupController();

    const res = await callController("createLeave", {
        body: {
            ...validLeave,
            leave_type: ""
        },
        user: { user_id: 1, role: "staff" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: createLeave rejects missing reason", async () => {
    setupController();

    const res = await callController("createLeave", {
        body: {
            ...validLeave,
            reason: ""
        },
        user: { user_id: 1, role: "staff" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: createLeave rejects invalid start date", async () => {
    setupController();

    const res = await callController("createLeave", {
        body: {
            ...validLeave,
            start_date: "invalid-date"
        },
        user: { user_id: 1, role: "staff" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: createLeave rejects invalid calendar date", async () => {
    setupController();

    const res = await callController("createLeave", {
        body: {
            ...validLeave,
            start_date: "2026-02-30"
        },
        user: { user_id: 1, role: "staff" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: createLeave rejects end date before start date", async () => {
    setupController();

    const res = await callController("createLeave", {
        body: {
            ...validLeave,
            start_date: "2026-12-05",
            end_date: "2026-12-01"
        },
        user: { user_id: 1, role: "staff" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: createLeave successfully creates a leave", async () => {
    setupController();

    const res = await callController("createLeave", {
        body: validLeave,
        user: { user_id: 1, role: "staff" }
    });

    assert.equal(res.statusCode, 201);

    restoreController();
});

// UPDATE LEAVE

test("Controller: updateLeave rejects invalid ID", async () => {
    setupController();

    const res = await callController("updateLeave", {
        params: { id: "abc" },
        body: validLeave
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: updateLeave returns 404 for missing leave", async () => {
    setupController();

    mockModel.getLeaveById = async () => null;

    const res = await callController("updateLeave", {
        params: { id: "999" },
        body: validLeave
    });

    assert.equal(res.statusCode, 404);

    restoreController();
});

test("Controller: updateLeave rejects invalid data", async () => {
    setupController();

    mockModel.getLeaveById = async () => ({
        leave_id: 1,
        user_id: 1,
        status: "pending"
    });

    const res = await callController("updateLeave", {
        params: { id: "1" },
        body: {
            ...validLeave,
            leave_type: ""
        }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

// UPDATE LEAVE STATUS

test("Controller: updateLeaveStatus rejects invalid ID", async () => {
    setupController();

    const res = await callController("updateLeaveStatus", {
        params: { id: "abc" },
        body: { status: "approved" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: updateLeaveStatus rejects invalid status", async () => {
    setupController();

    const res = await callController("updateLeaveStatus", {
        params: { id: "1" },
        body: { status: "pending" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: updateLeaveStatus rejects missing status", async () => {
    setupController();

    const res = await callController("updateLeaveStatus", {
        params: { id: "1" },
        body: {}
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

// DELETE LEAVE

test("Controller: deleteLeave rejects invalid ID", async () => {
    setupController();

    const res = await callController("deleteLeave", {
        params: { id: "abc" }
    });

    assert.equal(res.statusCode, 400);

    restoreController();
});

test("Controller: deleteLeave returns 404 for missing leave", async () => {
    setupController();

    mockModel.getLeaveById = async () => null;

    const res = await callController("deleteLeave", {
        params: { id: "999" }
    });

    assert.equal(res.statusCode, 404);

    restoreController();
});
