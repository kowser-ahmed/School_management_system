const express = require("express");
const router = express.Router();

const {
    getAllNotices,
    getNoticeById,
    createNotice,
    updateNotice,
    deleteNotice
} = require("../controllers/noticeController");

const {
    authenticateToken,
    authorizePermission
} = require("../middleware/authMiddleware");

// All notice routes require authentication
router.use(authenticateToken);

// ================= VIEW NOTICES =================
// Everyone who is logged in can view notices
router.get("/", authorizePermission("notices:read"), getAllNotices);
router.get("/:id", authorizePermission("notices:read"), getNoticeById);

// ================= ADMIN MANAGEMENT =================
router.post("/", authorizePermission("notices:create"), createNotice);
router.put("/:id", authorizePermission("notices:update"), updateNotice);
router.delete("/:id", authorizePermission("notices:delete"), deleteNotice);

module.exports = router;