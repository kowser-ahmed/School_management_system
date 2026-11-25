
const test = require("node:test");
const assert = require("node:assert/strict");

const holidayModel = require("../models/holidayModel");

const {
    getAllHolidays,
    getHolidayById,
    createHoliday,
    updateHoliday,
    deleteHoliday
} = require("../controllers/holidayController");

const validHoliday = {
    holiday_name: "Eid Holidays",
    start_date: "2026-03-20",
    end_date: "2026-03-22",
    description: "School holidays"
};

function createResponse() {
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

test("Holiday Controller Tests", async (t) => {

    // ================= GET ALL HOLIDAYS =================

    await t.test("getAllHolidays - should return all holidays", async (t) => {
        const holidays = [validHoliday];

        t.mock.method(
            holidayModel,
            "getAllHolidays",
            async () => holidays
        );

        const req = {};
        const res = createResponse();

        await getAllHolidays(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.count, 1);
        assert.equal(res.body.data.length, 1);
    });

    await t.test("getAllHolidays - should handle database errors", async (t) => {
        t.mock.method(
            holidayModel,
            "getAllHolidays",
            async () => {
                throw new Error("Database error");
            }
        );

        const res = createResponse();

        await getAllHolidays({}, res);

        assert.equal(res.statusCode, 500);
        assert.equal(res.body.success, false);
    });

    // ================= GET HOLIDAY BY ID =================

    await t.test("getHolidayById - should return holiday for valid ID", async (t) => {
        t.mock.method(
            holidayModel,
            "getHolidayById",
            async () => ({ holiday_id: 1, ...validHoliday })
        );

        const req = { params: { id: "1" } };
        const res = createResponse();

        await getHolidayById(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.data.holiday_id, 1);
    });

    await t.test("getHolidayById - should reject invalid ID", async () => {
        const req = { params: { id: "abc" } };
        const res = createResponse();

        await getHolidayById(req, res);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.success, false);
    });

    await t.test("getHolidayById - should return 404 when holiday does not exist", async (t) => {
        t.mock.method(
            holidayModel,
            "getHolidayById",
            async () => undefined
        );

        const req = { params: { id: "999" } };
        const res = createResponse();

        await getHolidayById(req, res);

        assert.equal(res.statusCode, 404);
    });

    // ================= CREATE HOLIDAY =================

    await t.test("createHoliday - should create a valid holiday", async (t) => {
        t.mock.method(
            holidayModel,
            "createHoliday",
            async () => 10
        );

        t.mock.method(
            holidayModel,
            "getHolidayById",
            async () => ({ holiday_id: 10, ...validHoliday })
        );

        const req = { body: validHoliday };
        const res = createResponse();

        await createHoliday(req, res);

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.data.holiday_id, 10);
    });

    await t.test("createHoliday - should reject invalid holiday data", async () => {
        const req = {
            body: {
                holiday_name: "",
                start_date: "invalid",
                end_date: "invalid"
            }
        };

        const res = createResponse();

        await createHoliday(req, res);

        assert.equal(res.statusCode, 400);
        assert.ok(res.body.errors.length > 0);
    });

    // ================= UPDATE HOLIDAY =================

    await t.test("updateHoliday - should update an existing holiday", async (t) => {
        let calls = 0;

        t.mock.method(
            holidayModel,
            "getHolidayById",
            async () => {
                calls++;

                return {
                    holiday_id: 1,
                    ...validHoliday
                };
            }
        );

        t.mock.method(
            holidayModel,
            "updateHoliday",
            async () => 1
        );

        const req = {
            params: { id: "1" },
            body: {
                ...validHoliday,
                holiday_name: "Updated Eid"
            }
        };

        const res = createResponse();

        await updateHoliday(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.data.holiday_id, 1);
        assert.equal(calls, 2);
    });

    await t.test("updateHoliday - should reject invalid ID", async () => {
        const req = {
            params: { id: "abc" },
            body: validHoliday
        };

        const res = createResponse();

        await updateHoliday(req, res);

        assert.equal(res.statusCode, 400);
    });

    await t.test("updateHoliday - should return 404 for missing holiday", async (t) => {
        t.mock.method(
            holidayModel,
            "getHolidayById",
            async () => undefined
        );

        const req = {
            params: { id: "999" },
            body: validHoliday
        };

        const res = createResponse();

        await updateHoliday(req, res);

        assert.equal(res.statusCode, 404);
    });

    // ================= DELETE HOLIDAY =================

    await t.test("deleteHoliday - should delete an existing holiday", async (t) => {
        t.mock.method(
            holidayModel,
            "deleteHoliday",
            async () => 1
        );

        const req = { params: { id: "1" } };
        const res = createResponse();

        await deleteHoliday(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
    });

    await t.test("deleteHoliday - should return 404 for missing holiday", async (t) => {
        t.mock.method(
            holidayModel,
            "deleteHoliday",
            async () => 0
        );

        const req = { params: { id: "999" } };
        const res = createResponse();

        await deleteHoliday(req, res);

        assert.equal(res.statusCode, 404);
    });

    await t.test("deleteHoliday - should reject invalid ID", async () => {
        const req = { params: { id: "abc" } };
        const res = createResponse();

        await deleteHoliday(req, res);

        assert.equal(res.statusCode, 400);
    });
});
