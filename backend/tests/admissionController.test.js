
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const admissionModel = require("../models/admissionModel");

const {
    getAllAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    updateAdmissionStatus,
    enrollAdmission,
    deleteAdmission
} = require("../controllers/admissionController");

// Mock response
const createResponse = () => {
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
};

// Reset model methods before every test
beforeEach(() => {
    admissionModel.getAllAdmissions = async () => [];
    admissionModel.getAdmissionById = async () => null;
    admissionModel.createAdmission = async () => 1;
    admissionModel.updateAdmission = async () => 1;
    admissionModel.updateAdmissionStatus = async () => 1;
    admissionModel.enrollAdmission = async () => 1;
    admissionModel.deleteAdmission = async () => 1;
});

// Get all admissions
test("getAllAdmissions should return all applications", async () => {
    const admissions = [
        { application_id: 1, applicant_name: "Rahim" },
        { application_id: 2, applicant_name: "Karim" }
    ];

    admissionModel.getAllAdmissions = async () => admissions;

    const req = {};
    const res = createResponse();

    await getAllAdmissions(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, admissions);
});

test("getAllAdmissions should return 500 when model fails", async () => {
    admissionModel.getAllAdmissions = async () => {
        throw new Error("Database error");
    };

    const res = createResponse();

    await getAllAdmissions({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
});

// Get admission by ID
test("getAdmissionById should return an application", async () => {
    const admission = {
        application_id: 1,
        applicant_name: "Rahim"
    };

    admissionModel.getAdmissionById = async () => admission;

    const req = { params: { id: "1" } };
    const res = createResponse();

    await getAdmissionById(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, admission);
});

test("getAdmissionById should return 404 when application does not exist", async () => {
    admissionModel.getAdmissionById = async () => null;

    const req = { params: { id: "99" } };
    const res = createResponse();

    await getAdmissionById(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
});

// Create admission
test("createAdmission should create a new application", async () => {
    admissionModel.createAdmission = async () => 10;

    const req = {
        body: {
            applicant_name: "Rahim",
            applying_class: "Class 4"
        }
    };

    const res = createResponse();

    await createAdmission(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.application_id, 10);
});

test("createAdmission should return 400 when applicant name is missing", async () => {
    const req = {
        body: {
            applying_class: "Class 4"
        }
    };

    const res = createResponse();

    await createAdmission(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
});

test("createAdmission should return 400 when applying class is missing", async () => {
    const req = {
        body: {
            applicant_name: "Rahim"
        }
    };

    const res = createResponse();

    await createAdmission(req, res);

    assert.equal(res.statusCode, 400);
});

// Update admission
test("updateAdmission should update an application", async () => {
    admissionModel.updateAdmission = async () => 1;

    const req = {
        params: { id: "1" },
        body: {
            applicant_name: "Updated Rahim",
            applying_class: "Class 5"
        }
    };

    const res = createResponse();

    await updateAdmission(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
});

test("updateAdmission should return 400 when applicant name is missing", async () => {
    const req = {
        params: { id: "1" },
        body: {
            applying_class: "Class 4"
        }
    };

    const res = createResponse();

    await updateAdmission(req, res);

    assert.equal(res.statusCode, 400);
});

test("updateAdmission should return 404 when application does not exist", async () => {
    admissionModel.updateAdmission = async () => 0;

    const req = {
        params: { id: "99" },
        body: {
            applicant_name: "Rahim"
        }
    };

    const res = createResponse();

    await updateAdmission(req, res);

    assert.equal(res.statusCode, 404);
});

// Update admission status
test("updateAdmissionStatus should approve an application", async () => {
    admissionModel.updateAdmissionStatus = async () => 1;

    const req = {
        params: { id: "1" },
        body: { status: "approved" }
    };

    const res = createResponse();

    await updateAdmissionStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
});

test("updateAdmissionStatus should reject an application", async () => {
    admissionModel.updateAdmissionStatus = async () => 1;

    const req = {
        params: { id: "1" },
        body: { status: "rejected" }
    };

    const res = createResponse();

    await updateAdmissionStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
});

test("updateAdmissionStatus should return 400 for invalid status", async () => {
    const req = {
        params: { id: "1" },
        body: { status: "wrong-status" }
    };

    const res = createResponse();

    await updateAdmissionStatus(req, res);

    assert.equal(res.statusCode, 400);
});

test("updateAdmissionStatus should return 404 when application does not exist", async () => {
    admissionModel.updateAdmissionStatus = async () => 0;

    const req = {
        params: { id: "99" },
        body: { status: "approved" }
    };

    const res = createResponse();

    await updateAdmissionStatus(req, res);

    assert.equal(res.statusCode, 404);
});

// Enroll admission
test("enrollAdmission should enroll an approved applicant", async () => {
    admissionModel.enrollAdmission = async () => 20;

    const req = {
        params: { id: "1" }
    };

    const res = createResponse();

    await enrollAdmission(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.student_id, 20);
});

test("enrollAdmission should return 400 for invalid ID", async () => {
    const req = {
        params: { id: "abc" }
    };

    const res = createResponse();

    await enrollAdmission(req, res);

    assert.equal(res.statusCode, 400);
});

// Delete admission
test("deleteAdmission should delete an application", async () => {
    admissionModel.deleteAdmission = async () => 1;

    const req = {
        params: { id: "1" }
    };

    const res = createResponse();

    await deleteAdmission(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
});

test("deleteAdmission should return 404 when application does not exist", async () => {
    admissionModel.deleteAdmission = async () => 0;

    const req = {
        params: { id: "99" }
    };

    const res = createResponse();

    await deleteAdmission(req, res);

    assert.equal(res.statusCode, 404);
});
