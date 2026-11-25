const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const NoticeModel = require("../models/noticeModel");
const controller = require("../controllers/noticeController");

// Simulated Express response
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

describe("Notice Controller Tests", () => {

    // GET ALL NOTICES
    describe("getAllNotices()", () => {
        it("should return notices for the logged-in user", async (t) => {
            const notices = [
                { notice_id: 1, title: "Exam Notice" }
            ];

            t.mock.method(NoticeModel, "getAllNotices", async () => notices);

            const req = { user: { role: "student" } };
            const res = createResponse();

            await controller.getAllNotices(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.count, 1);
            assert.equal(res.body.data[0].title, "Exam Notice");
        });

        it("should return an empty list when no notices exist", async (t) => {
            t.mock.method(NoticeModel, "getAllNotices", async () => []);

            const req = { user: { role: "teacher" } };
            const res = createResponse();

            await controller.getAllNotices(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.count, 0);
            assert.deepEqual(res.body.data, []);
        });
    });

    // GET NOTICE BY ID
    describe("getNoticeById()", () => {
        it("should return a notice when it exists", async (t) => {
            const notice = {
                notice_id: 1,
                title: "Exam Notice",
                status: "published",
                target_role: "all"
            };

            t.mock.method(NoticeModel, "getNoticeById", async () => notice);

            const req = {
                params: { id: "1" },
                user: { role: "student" }
            };
            const res = createResponse();

            await controller.getNoticeById(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.data.title, "Exam Notice");
        });

        it("should return 404 when the notice does not exist", async (t) => {
            t.mock.method(NoticeModel, "getNoticeById", async () => null);

            const req = {
                params: { id: "999" },
                user: { role: "student" }
            };
            const res = createResponse();

            await controller.getNoticeById(req, res);

            assert.equal(res.statusCode, 404);
            assert.equal(res.body.message, "Notice not found.");
        });

        it("should reject an invalid notice ID", async () => {
            const req = {
                params: { id: "abc" },
                user: { role: "student" }
            };
            const res = createResponse();

            await controller.getNoticeById(req, res);

            assert.equal(res.statusCode, 400);
        });

        it("should prevent a student from viewing another role's notice", async (t) => {
            const notice = {
                notice_id: 2,
                title: "Admin Notice",
                status: "published",
                target_role: "admin"
            };

            t.mock.method(NoticeModel, "getNoticeById", async () => notice);

            const req = {
                params: { id: "2" },
                user: { role: "student" }
            };
            const res = createResponse();

            await controller.getNoticeById(req, res);

            assert.equal(res.statusCode, 403);
        });
    });

    // CREATE NOTICE
    describe("createNotice()", () => {
        it("should create a valid notice", async (t) => {
            t.mock.method(NoticeModel, "createNotice", async () => 10);

            const req = {
                body: {
                    title: "Exam Notice",
                    content: "Exams start next week.",
                    target_role: "all",
                    status: "published"
                },
                user: { user_id: 1, role: "admin" }
            };
            const res = createResponse();

            await controller.createNotice(req, res);

            assert.equal(res.statusCode, 201);
            assert.equal(res.body.notice_id, 10);
        });

        it("should reject notice data with an empty title", async () => {
            const req = {
                body: {
                    title: " ",
                    content: "Notice content"
                },
                user: { user_id: 1, role: "admin" }
            };
            const res = createResponse();

            await controller.createNotice(req, res);

            assert.equal(res.statusCode, 400);
            assert.equal(res.body.success, false);
        });
    });

    // UPDATE NOTICE
    describe("updateNotice()", () => {
        it("should update an existing notice", async (t) => {
            t.mock.method(NoticeModel, "getNoticeById", async () => ({
                notice_id: 1
            }));

            t.mock.method(NoticeModel, "updateNotice", async () => 1);

            const req = {
                params: { id: "1" },
                body: {
                    title: "Updated Notice",
                    content: "Updated content",
                    target_role: "all",
                    status: "published"
                }
            };
            const res = createResponse();

            await controller.updateNotice(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.message, "Notice updated successfully.");
        });

        it("should return 404 when the notice does not exist", async (t) => {
            t.mock.method(NoticeModel, "getNoticeById", async () => null);

            const req = {
                params: { id: "999" },
                body: {
                    title: "Updated Notice",
                    content: "Updated content"
                }
            };
            const res = createResponse();

            await controller.updateNotice(req, res);

            assert.equal(res.statusCode, 404);
        });

        it("should reject invalid notice data", async (t) => {
            t.mock.method(NoticeModel, "getNoticeById", async () => ({
                notice_id: 1
            }));

            const req = {
                params: { id: "1" },
                body: {
                    title: "",
                    content: ""
                }
            };
            const res = createResponse();

            await controller.updateNotice(req, res);

            assert.equal(res.statusCode, 400);
        });
    });

    // DELETE NOTICE
    describe("deleteNotice()", () => {
        it("should delete an existing notice", async (t) => {
            t.mock.method(NoticeModel, "deleteNotice", async () => 1);

            const req = { params: { id: "1" } };
            const res = createResponse();

            await controller.deleteNotice(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.message, "Notice deleted successfully.");
        });

        it("should return 404 when the notice does not exist", async (t) => {
            t.mock.method(NoticeModel, "deleteNotice", async () => 0);

            const req = { params: { id: "999" } };
            const res = createResponse();

            await controller.deleteNotice(req, res);

            assert.equal(res.statusCode, 404);
        });

        it("should reject an invalid notice ID", async () => {
            const req = { params: { id: "abc" } };
            const res = createResponse();

            await controller.deleteNotice(req, res);

            assert.equal(res.statusCode, 400);
        });
    });
});