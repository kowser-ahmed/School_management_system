const { describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");

const db = require("../config/db");
const NoticeModel = require("../models/noticeModel");

describe("Notice Model Tests", () => {

    // GET ALL NOTICES
    describe("getAllNotices()", () => {
        it("should return published notices for a student", async (t) => {
            const notices = [
                { notice_id: 1, title: "Exam Notice", status: "published", target_role: "all" }
            ];

            t.mock.method(db, "query", async () => [notices]);

            const result = await NoticeModel.getAllNotices("student");

            assert.equal(result.length, 1);
            assert.equal(result[0].title, "Exam Notice");
        });

        it("should return all notices, including drafts, for admin", async (t) => {
            const notices = [
                { notice_id: 1, title: "Published Notice", status: "published" },
                { notice_id: 2, title: "Draft Notice", status: "draft" }
            ];

            t.mock.method(db, "query", async () => [notices]);

            const result = await NoticeModel.getAllNotices("admin");

            assert.equal(result.length, 2);
            assert.equal(result[1].status, "draft");
        });
    });

    // GET NOTICE BY ID
    describe("getNoticeById()", () => {
        it("should return a notice when the ID exists", async (t) => {
            const notice = {
                notice_id: 1,
                title: "Holiday Notice"
            };

            t.mock.method(db, "query", async () => [[notice]]);

            const result = await NoticeModel.getNoticeById(1);

            assert.deepEqual(result, notice);
        });

        it("should return null when the notice does not exist", async (t) => {
            t.mock.method(db, "query", async () => [[]]);

            const result = await NoticeModel.getNoticeById(999);

            assert.equal(result, null);
        });
    });

    // CREATE NOTICE
    describe("createNotice()", () => {
        it("should return the new notice ID", async (t) => {
            t.mock.method(db, "query", async () => [{ insertId: 10 }]);

            const result = await NoticeModel.createNotice({
                title: "Exam Notice",
                content: "Exams start soon.",
                target_role: "all",
                publish_date: null,
                created_by: 1,
                status: "published"
            });

            assert.equal(result, 10);
        });

        it("should insert the supplied notice data", async (t) => {
            const queryMock = t.mock.method(
                db,
                "query",
                async () => [{ insertId: 11 }]
            );

            await NoticeModel.createNotice({
                title: "Holiday",
                content: "School will be closed.",
                target_role: "student",
                publish_date: null,
                created_by: 1,
                status: "published"
            });

            assert.equal(queryMock.mock.calls.length, 1);
            assert.equal(queryMock.mock.calls[0].arguments[1][0], "Holiday");
            assert.equal(queryMock.mock.calls[0].arguments[1][4], 1);
        });
    });

    // UPDATE NOTICE
    describe("updateNotice()", () => {
        it("should return 1 when a notice is updated", async (t) => {
            t.mock.method(db, "query", async () => [{ affectedRows: 1 }]);

            const result = await NoticeModel.updateNotice(1, {
                title: "Updated Notice",
                content: "Updated content",
                target_role: "all",
                publish_date: null,
                status: "published"
            });

            assert.equal(result, 1);
        });

        it("should return 0 when no notice is updated", async (t) => {
            t.mock.method(db, "query", async () => [{ affectedRows: 0 }]);

            const result = await NoticeModel.updateNotice(999, {
                title: "Updated Notice",
                content: "Updated content",
                target_role: "all",
                publish_date: null,
                status: "published"
            });

            assert.equal(result, 0);
        });
    });

    // DELETE NOTICE
    describe("deleteNotice()", () => {
        it("should return 1 when a notice is deleted", async (t) => {
            t.mock.method(db, "query", async () => [{ affectedRows: 1 }]);

            const result = await NoticeModel.deleteNotice(1);

            assert.equal(result, 1);
        });

        it("should return 0 when the notice does not exist", async (t) => {
            t.mock.method(db, "query", async () => [{ affectedRows: 0 }]);

            const result = await NoticeModel.deleteNotice(999);

            assert.equal(result, 0);
        });
    });
});