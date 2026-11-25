
const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("../config/db");
const holidayModel = require("../models/holidayModel");

test("Holiday Model Tests", async (t) => {

    // ================= GET ALL HOLIDAYS =================

    await t.test("getAllHolidays - should return all holidays", async (t) => {
        const holidays = [
            { holiday_id: 1, holiday_name: "Eid", start_date: "2026-03-20", end_date: "2026-03-22" },
            { holiday_id: 2, holiday_name: "Victory Day", start_date: "2026-12-16", end_date: "2026-12-16" }
        ];

        t.mock.method(db, "execute", async () => [holidays]);

        const result = await holidayModel.getAllHolidays();

        assert.equal(result.length, 2);
        assert.equal(result[0].holiday_name, "Eid");
    });

    await t.test("getAllHolidays - should return empty array when no holidays exist", async (t) => {
        t.mock.method(db, "execute", async () => [[]]);

        const result = await holidayModel.getAllHolidays();

        assert.deepEqual(result, []);
    });

    // ================= GET HOLIDAY BY ID =================

    await t.test("getHolidayById - should return a holiday", async (t) => {
        const holiday = {
            holiday_id: 1,
            holiday_name: "Eid",
            start_date: "2026-03-20",
            end_date: "2026-03-22"
        };

        t.mock.method(db, "execute", async () => [[holiday]]);

        const result = await holidayModel.getHolidayById(1);

        assert.equal(result.holiday_id, 1);
        assert.equal(result.holiday_name, "Eid");
    });

    await t.test("getHolidayById - should return undefined for missing holiday", async (t) => {
        t.mock.method(db, "execute", async () => [[]]);

        const result = await holidayModel.getHolidayById(999);

        assert.equal(result, undefined);
    });

    // ================= CREATE HOLIDAY =================

    await t.test("createHoliday - should return inserted ID", async (t) => {
        t.mock.method(db, "execute", async () => [
            { insertId: 5 }
        ]);

        const result = await holidayModel.createHoliday({
            holiday_name: "Eid",
            start_date: "2026-03-20",
            end_date: "2026-03-22",
            description: "Eid holidays"
        });

        assert.equal(result, 5);
    });

    await t.test("createHoliday - should store null for empty description", async (t) => {
        const mock = t.mock.method(db, "execute", async () => [
            { insertId: 6 }
        ]);

        const result = await holidayModel.createHoliday({
            holiday_name: "Victory Day",
            start_date: "2026-12-16",
            end_date: "2026-12-16",
            description: ""
        });

        assert.equal(result, 6);
        assert.equal(mock.mock.calls[0].arguments[1][3], null);
    });

    // ================= UPDATE HOLIDAY =================

    await t.test("updateHoliday - should return affected rows", async (t) => {
        t.mock.method(db, "execute", async () => [
            { affectedRows: 1 }
        ]);

        const result = await holidayModel.updateHoliday(1, {
            holiday_name: "Updated Eid",
            start_date: "2026-03-21",
            end_date: "2026-03-23",
            description: "Updated description"
        });

        assert.equal(result, 1);
    });

    await t.test("updateHoliday - should return zero when no record is updated", async (t) => {
        t.mock.method(db, "execute", async () => [
            { affectedRows: 0 }
        ]);

        const result = await holidayModel.updateHoliday(999, {
            holiday_name: "Test",
            start_date: "2026-03-21",
            end_date: "2026-03-23",
            description: null
        });

        assert.equal(result, 0);
    });

    // ================= DELETE HOLIDAY =================

    await t.test("deleteHoliday - should return one affected row", async (t) => {
        t.mock.method(db, "execute", async () => [
            { affectedRows: 1 }
        ]);

        const result = await holidayModel.deleteHoliday(1);

        assert.equal(result, 1);
    });

    await t.test("deleteHoliday - should return zero for missing holiday", async (t) => {
        t.mock.method(db, "execute", async () => [
            { affectedRows: 0 }
        ]);

        const result = await holidayModel.deleteHoliday(999);

        assert.equal(result, 0);
    });
});
