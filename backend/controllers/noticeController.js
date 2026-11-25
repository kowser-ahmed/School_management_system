const NoticeModel = require("../models/noticeModel");
const NoticeFactory = require("../utils/noticeFactory");
const { validateNotice } = require("../utils/noticeValidation");

// Validate IDs
const validId = (id) => /^\d+$/.test(String(id)) && Number(id) > 0;

// Handle errors
const sendError = (res, error) => {
    console.error("Notice Error:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};

// ================= GET ALL NOTICES =================
exports.getAllNotices = async (req, res) => {
    try {
        const role = req.user.role;

        const data = await NoticeModel.getAllNotices(role);

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        sendError(res, error);
    }
};

// ================= GET NOTICE BY ID =================
exports.getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notice ID."
            });
        }

        const notice = await NoticeModel.getNoticeById(id);

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: "Notice not found."
            });
        }

        // Non-admins cannot view drafts or role-targeted notices
        // that are not intended for them.
        if (req.user.role !== "admin") {
            if (notice.status !== "published") {
                return res.status(404).json({
                    success: false,
                    message: "Notice not found."
                });
            }

            if (
                notice.target_role !== "all" &&
                notice.target_role !== req.user.role
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to view this notice."
                });
            }
        }

        res.json({
            success: true,
            data: notice
        });
    } catch (error) {
        sendError(res, error);
    }
};

// ================= CREATE NOTICE =================
exports.createNotice = async (req, res) => {
    try {
        const validation = validateNotice(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validation.errors
            });
        }

        // The creator ID comes from the authenticated user,
        // not from the frontend request.
        const noticeData = NoticeFactory.createNotice({
            ...req.body,
            created_by: req.user.user_id
        });

        const noticeId = await NoticeModel.createNotice(noticeData);

        res.status(201).json({
            success: true,
            message: "Notice created successfully.",
            notice_id: noticeId
        });
    } catch (error) {
        sendError(res, error);
    }
};

// ================= UPDATE NOTICE =================
exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notice ID."
            });
        }

        const existingNotice = await NoticeModel.getNoticeById(id);

        if (!existingNotice) {
            return res.status(404).json({
                success: false,
                message: "Notice not found."
            });
        }

        const validation = validateNotice(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validation.errors
            });
        }

        const noticeData = NoticeFactory.updateNotice(req.body);

        const result = await NoticeModel.updateNotice(id, noticeData);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Notice not found."
            });
        }

        res.json({
            success: true,
            message: "Notice updated successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};

// ================= DELETE NOTICE =================
exports.deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notice ID."
            });
        }

        const result = await NoticeModel.deleteNotice(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Notice not found."
            });
        }

        res.json({
            success: true,
            message: "Notice deleted successfully."
        });
    } catch (error) {
        sendError(res, error);
    }
};