
const test = require("node:test");
const assert = require("node:assert/strict");

const holidayFactory = require("../utils/holidayFactory");

const {
    validateHoliday,
    isValidDate
} = require("../utils/holidayValidation");

const validHoliday = {
    holiday_name: "Eid Holidays",
    start_date: "2026-03-20",
    end_date: "2026-03-22",
    description: "School will remain closed."
};

test("Holiday Factory Tests", async (t) => {

    // ================= CREATE HOLIDAY =================

    await t.test("createHoliday - should create holiday data", () => {
        const result = holidayFactory.createHoliday(validHoliday);

        assert.equal(result.holiday_name, "Eid Holidays");
        assert.equal(result.start_date, "2026-03-20");
        assert.equal(result.end_date, "2026-03-22");
    });

    await t.test("createHoliday - should trim text and handle empty description", () => {
        const result = holidayFactory.createHoliday({
            ...validHoliday,
            holiday_name: " Eid ",
            description: ""
        });

        assert.equal(result.holiday_name, "Eid");
        assert.equal(result.description, null);
    });

    // ================= UPDATE HOLIDAY =================

    await t.test("updateHoliday - should prepare updated holiday data", () => {
        const result = holidayFactory.updateHoliday({
            ...validHoliday,
            holiday_name: "Updated Eid"
        });

        assert.equal(result.holiday_name, "Updated Eid");
        assert.equal(result.start_date, "2026-03-20");
    });

    await t.test("updateHoliday - should trim description", () => {
        const result = holidayFactory.updateHoliday({
            ...validHoliday,
            description: " Updated description "
        });

        assert.equal(result.description, "Updated description");
    });
});

test("Holiday Validation Strategy Tests", async (t) => {

    // ================= VALID HOLIDAY =================

    await t.test("validateHoliday - should accept valid holiday data", () => {
        const errors = validateHoliday(validHoliday);

        assert.deepEqual(errors, []);
    });

    await t.test("validateHoliday - should accept optional empty description", () => {
        const errors = validateHoliday({
            ...validHoliday,
            description: ""
        });

        assert.deepEqual(errors, []);
    });

    // ================= HOLIDAY NAME =================

    await t.test("validateHoliday - should reject empty holiday name", () => {
        const errors = validateHoliday({
            ...validHoliday,
            holiday_name: "   "
        });

        assert.ok(errors.includes("Holiday name is required."));
    });

    await t.test("validateHoliday - should reject name longer than 100 characters", () => {
        const errors = validateHoliday({
            ...validHoliday,
            holiday_name: "A".repeat(101)
        });

        assert.ok(errors.includes("Holiday name cannot exceed 100 characters."));
    });

    // ================= DATE VALIDATION =================

    await t.test("validateHoliday - should reject invalid start date", () => {
        const errors = validateHoliday({
            ...validHoliday,
            start_date: "2026-02-30"
        });

        assert.ok(
            errors.includes("A valid start date is required (YYYY-MM-DD).")
        );
    });

    await t.test("validateHoliday - should reject end date before start date", () => {
        const errors = validateHoliday({
            ...validHoliday,
            start_date: "2026-03-25",
            end_date: "2026-03-20"
        });

        assert.ok(
            errors.includes("End date cannot be earlier than start date.")
        );
    });

    // ================= DESCRIPTION =================

    await t.test("validateHoliday - should reject description longer than 255 characters", () => {
        const errors = validateHoliday({
            ...validHoliday,
            description: "A".repeat(256)
        });

        assert.ok(
            errors.includes("Description cannot exceed 255 characters.")
        );
    });

    await t.test("validateHoliday - should reject non-text description", () => {
        const errors = validateHoliday({
            ...validHoliday,
            description: 123
        });

        assert.ok(errors.includes("Description must be text."));
    });

    // ================= GENERAL INPUT =================

    await t.test("validateHoliday - should reject missing data", () => {
        const errors = validateHoliday(null);

        assert.deepEqual(errors, ["Invalid holiday data."]);
    });

    await t.test("isValidDate - should accept and reject date values correctly", () => {
        assert.equal(isValidDate("2026-12-16"), true);
        assert.equal(isValidDate("2026-02-30"), false);
    });
});
