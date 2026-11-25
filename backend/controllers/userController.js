
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

const allowedRoles = [
    "admin",
    "teacher",
    "accountant",
    "parent",
    "student",
    "staff"
];

// Normalize role safely
const normalizeRole = (role) => {
    return typeof role === "string"
        ? role.trim().toLowerCase()
        : "";
};

// Handle model errors
const handleModelError = (res, error, action) => {
    console.error(`${action} Error:`, error);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "Email or profile is already linked."
        });
    }

    const modelErrors = {
        TEACHER_NOT_FOUND: {
            status: 404,
            message: "Selected teacher profile not found."
        },
        TEACHER_ALREADY_LINKED: {
            status: 409,
            message: "This teacher profile is already linked to another account."
        },
        STUDENT_NOT_FOUND: {
            status: 404,
            message: "Selected student profile not found."
        },
        STUDENT_ALREADY_LINKED: {
            status: 409,
            message: "This student profile is already linked to another account."
        },
        STAFF_NOT_FOUND: {
            status: 404,
            message: "Selected staff profile not found."
        },
        STAFF_ALREADY_LINKED: {
            status: 409,
            message: "This staff profile is already linked to another account."
        }
    };

    const modelError = modelErrors[error.message];

    if (modelError) {
        return res.status(modelError.status).json({
            success: false,
            message: modelError.message
        });
    }

    return res.status(500).json({
        success: false,
        message: `Failed to ${action.toLowerCase()}.`
    });
};

// Validate profile ID
const isValidProfileId = (id) => {
    return Number.isInteger(Number(id)) && Number(id) > 0;
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        handleModelError(res, error, "Fetch Users");
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await userModel.getUserById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        handleModelError(res, error, "Fetch User");
    }
};

// Create user
const createUser = async (req, res) => {
    try {
        const {
            full_name,
            email,
            password,
            phone,
            teacher_id,
            student_id,
            staff_id
        } = req.body;

        const role = normalizeRole(req.body.role);

        // Diagnostic log
        console.log("CREATE USER ROLE:", JSON.stringify(req.body.role));
        console.log("NORMALIZED ROLE:", JSON.stringify(role));

        if (!full_name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required."
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role."
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        if (role === "teacher" && !isValidProfileId(teacher_id)) {
            return res.status(400).json({
                success: false,
                message: "Please select a teacher profile."
            });
        }

        if (role === "student" && !isValidProfileId(student_id)) {
            return res.status(400).json({
                success: false,
                message: "Please select a student profile."
            });
        }

        if (role === "staff" && !isValidProfileId(staff_id)) {
            return res.status(400).json({
                success: false,
                message: "Please select a staff profile."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const userId = await userModel.createUser({
            full_name: full_name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role,
            phone,
            teacher_id: role === "teacher" ? Number(teacher_id) : null,
            student_id: role === "student" ? Number(student_id) : null,
            staff_id: role === "staff" ? Number(staff_id) : null
        });

        res.status(201).json({
            success: true,
            message: role === "teacher"
                ? "Teacher account created and profile linked successfully."
                : role === "student"
                    ? "Student account created and profile linked successfully."
                    : role === "staff"
                        ? "Staff account created and profile linked successfully."
                        : "User created successfully.",
            user_id: userId
        });

    } catch (error) {
        handleModelError(res, error, "Create User");
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            status,
            teacher_id,
            student_id,
            staff_id
        } = req.body;

        const role = normalizeRole(req.body.role);

        // Diagnostic log
        console.log("UPDATE USER ROLE:", JSON.stringify(req.body.role));
        console.log("NORMALIZED ROLE:", JSON.stringify(role));

        if (!full_name || !email || !role || !status) {
            return res.status(400).json({
                success: false,
                message: "Name, email, role and status are required."
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role."
            });
        }

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account status."
            });
        }

        if (role === "teacher" && !isValidProfileId(teacher_id)) {
            return res.status(400).json({
                success: false,
                message: "Please select a teacher profile."
            });
        }

        if (role === "student" && !isValidProfileId(student_id)) {
            return res.status(400).json({
                success: false,
                message: "Please select a student profile."
            });
        }

        if (role === "staff" && !isValidProfileId(staff_id)) {
            return res.status(400).json({
                success: false,
                message: "Please select a staff profile."
            });
        }

        const affectedRows = await userModel.updateUser(
            req.params.id,
            {
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                role,
                phone,
                status,
                teacher_id: role === "teacher" ? Number(teacher_id) : null,
                student_id: role === "student" ? Number(student_id) : null,
                staff_id: role === "staff" ? Number(staff_id) : null
            }
        );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully."
        });

    } catch (error) {
        handleModelError(res, error, "Update User");
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        if (userId === req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete your own account."
            });
        }

        const affectedRows = await userModel.deleteUser(userId);

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully."
        });

    } catch (error) {
        handleModelError(res, error, "Delete User");
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
