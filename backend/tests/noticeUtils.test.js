const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const NoticeFactory = require("../utils/noticeFactory");
const { validateNotice } = require("../utils/noticeValidation");

describe("Notice Factory Tests", () => {

    // CREATE NOTICE
    describe("createNotice()", () => {
        it("should create a notice with default values", () => {
            const result = NoticeFactory.createNotice({
                title: "  Exam Notice  ",
                content: "  Exams start soon.  ",
                created_by: 1
            });

            assert.equal(result.title, "Exam Notice");
            assert.equal(result.content, "Exams start soon.");
            assert.equal(result.target_role, "all");
            assert.equal(result.status, "published");
            assert.equal(result.created_by, 1);
        });

        it("should preserve supplied role and status", () => {
            const result = NoticeFactory.createNotice({
                title: "Student Notice",
                content: "For students only.",
                target_role: "student",
                publish_date: "2026-11-25 10:00:00",
                created_by: 2,
                status: "draft"
            });

            assert.equal(result.target_role, "student");
            assert.equal(result.status, "draft");
            assert.equal(result.created_by, 2);
        });
    });

    // UPDATE NOTICE
    describe("updateNotice()", () => {
        it("should return trimmed updated notice data", () => {
            const result = NoticeFactory.updateNotice({
                title: "  Updated Notice  ",
                content: "  Updated content  "
            });

            assert.equal(result.title, "Updated Notice");
            assert.equal(result.content, "Updated content");
            assert.equal(result.target_role, "all");
            assert.equal(result.status, "published");
        });

        it("should preserve supplied update values", () => {
            const result = NoticeFactory.updateNotice({
                title: "Holiday Notice",
                content: "School is closed.",
                target_role: "parent",
                publish_date: "2026-12-01 09:00:00",
                status: "draft"
            });

            assert.equal(result.target_role, "parent");
            assert.equal(result.status, "draft");
            assert.equal(result.publish_date, "2026-12-01 09:00:00");
        });
    });
});

describe("Notice Validation Tests", () => {

    it("should accept valid notice data", () => {
        const result = validateNotice({
            title: "Exam Notice",
            content: "The examination will start next week.",
            target_role: "all",
            status: "published"
        });

        assert.equal(result.valid, true);
        assert.deepEqual(result.errors, []);
    });

    it("should reject an empty title and content", () => {
        const result = validateNotice({
            title: "   ",
            content: "   "
        });

        assert.equal(result.valid, false);
        assert.ok(result.errors.length >= 2);
    });

    it("should reject an invalid target role", () => {
        const result = validateNotice({
            title: "Notice",
            content: "Notice content",
            target_role: "unknown"
        });

        assert.equal(result.valid, false);
        assert.ok(result.errors.includes("Invalid target role."));
    });

    it("should reject an invalid notice status", () => {
        const result = validateNotice({
            title: "Notice",
            content: "Notice content",
            status: "archived"
        });

        assert.equal(result.valid, false);
        assert.ok(result.errors.includes("Invalid notice status."));
    });

    it("should reject a title longer than 200 characters", () => {
        const result = validateNotice({
            title: "A".repeat(201),
            content: "Notice content"
        });

        assert.equal(result.valid, false);
        assert.ok(result.errors.includes(
            "Notice title cannot exceed 200 characters."
        ));
    });

    it("should reject an invalid publish date", () => {
        const result = validateNotice({
            title: "Notice",
            content: "Notice content",
            publish_date: "invalid-date"
        });

        assert.equal(result.valid, false);
        assert.ok(result.errors.includes("Invalid publish date."));
    });
});