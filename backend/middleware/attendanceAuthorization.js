const crypto = require("node:crypto");

const tokenRoles = new Set(["admin", "teacher"]);
const maxTokenLifetimeSeconds = 7 * 24 * 60 * 60;

const getSecret = () => {
    const secret = process.env.ATTENDANCE_TOKEN_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
        throw new Error("ATTENDANCE_TOKEN_SECRET must contain at least 32 bytes");
    }
    return secret;
};

const sign = (message, secret) => crypto.createHmac("sha256", secret).update(message).digest("base64url");

const createAttendanceToken = (user, lifetimeSeconds = 8 * 60 * 60) => {
    const userId = Number(user.user_id);
    if (!Number.isInteger(userId) || userId < 1 || !tokenRoles.has(user.role)) {
        throw new Error("Only active admin or teacher accounts can receive attendance tokens");
    }
    if (!Number.isInteger(lifetimeSeconds) || lifetimeSeconds < 60 || lifetimeSeconds > maxTokenLifetimeSeconds) {
        throw new Error("Token lifetime must be between 60 seconds and 7 days");
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
        user_id: userId,
        role: user.role,
        iat: now,
        exp: now + lifetimeSeconds
    })).toString("base64url");
    const message = `at1.${payload}`;
    return `${message}.${sign(message, getSecret())}`;
};

const readAttendanceToken = (token) => {
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "at1") {
        return null;
    }

    const message = `${parts[0]}.${parts[1]}`;
    const expected = Buffer.from(sign(message, getSecret()));
    const received = Buffer.from(parts[2]);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
        return null;
    }

    try {
        const user = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        const now = Math.floor(Date.now() / 1000);
        if (!Number.isInteger(user.user_id) || user.user_id < 1 ||
            !tokenRoles.has(user.role) || !Number.isInteger(user.iat) ||
            !Number.isInteger(user.exp) || user.iat > now + 60 ||
            user.exp <= now || user.exp - user.iat > maxTokenLifetimeSeconds) {
            return null;
        }
        return { user_id: user.user_id, role: user.role };
    } catch (error) {
        return null;
    }
};

const requireAuthenticated = (req, res, next) => {
    if (req.user && Number.isInteger(Number(req.user.user_id))) {
        return next();
    }

    const authorization = req.get("authorization") || "";
    const match = authorization.match(/^Bearer ([A-Za-z0-9._-]+)$/);
    let user;
    try {
        user = match ? readAttendanceToken(match[1]) : null;
    } catch (error) {
        return res.status(500).json({ success: false, message: "Attendance authentication is not configured" });
    }

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "A valid attendance bearer token is required"
        });
    }

    req.user = user;
    return next();
};

const requireAttendanceRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action"
        });
    }

    next();
};

module.exports = {
    requireAuthenticated,
    requireAttendanceRoles,
    createAttendanceToken
};