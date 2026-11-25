
const db = require("../config/db");

// Get all users
const getAllUsers = async () => {
    const [users] = await db.query(`
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.role,
            u.phone,
            u.status,
            u.created_at,
            t.teacher_id,
            s.student_id,
            st.staff_id
        FROM users u
        LEFT JOIN teachers t ON t.user_id = u.user_id
        LEFT JOIN students s ON s.user_id = u.user_id
        LEFT JOIN staff st ON st.user_id = u.user_id
        ORDER BY u.user_id DESC
    `);

    return users;
};

// Get user by ID
const getUserById = async (userId) => {
    const [users] = await db.query(`
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.role,
            u.phone,
            u.status,
            u.created_at,
            t.teacher_id,
            s.student_id,
            st.staff_id
        FROM users u
        LEFT JOIN teachers t ON t.user_id = u.user_id
        LEFT JOIN students s ON s.user_id = u.user_id
        LEFT JOIN staff st ON st.user_id = u.user_id
        WHERE u.user_id = ?
    `, [userId]);

    return users[0];
};

// Link teacher profile
const linkTeacher = async (connection, teacherId, userId) => {
    const [teachers] = await connection.query(
        `SELECT teacher_id, user_id
         FROM teachers
         WHERE teacher_id = ?
         FOR UPDATE`,
        [teacherId]
    );

    if (!teachers.length) {
        throw new Error("TEACHER_NOT_FOUND");
    }

    const teacher = teachers[0];

    if (teacher.user_id && Number(teacher.user_id) !== Number(userId)) {
        throw new Error("TEACHER_ALREADY_LINKED");
    }

    await connection.query(
        "UPDATE teachers SET user_id = ? WHERE teacher_id = ?",
        [userId, teacherId]
    );
};

// Link student profile
const linkStudent = async (connection, studentId, userId) => {
    const [students] = await connection.query(
        `SELECT student_id, user_id
         FROM students
         WHERE student_id = ?
         FOR UPDATE`,
        [studentId]
    );

    if (!students.length) {
        throw new Error("STUDENT_NOT_FOUND");
    }

    const student = students[0];

    if (student.user_id && Number(student.user_id) !== Number(userId)) {
        throw new Error("STUDENT_ALREADY_LINKED");
    }

    await connection.query(
        "UPDATE students SET user_id = ? WHERE student_id = ?",
        [userId, studentId]
    );
};

// Link staff profile
const linkStaff = async (connection, staffId, userId) => {
    const [staffMembers] = await connection.query(
        `SELECT staff_id, user_id
         FROM staff
         WHERE staff_id = ?
         FOR UPDATE`,
        [staffId]
    );

    if (!staffMembers.length) {
        throw new Error("STAFF_NOT_FOUND");
    }

    const staffMember = staffMembers[0];

    if (
        staffMember.user_id &&
        Number(staffMember.user_id) !== Number(userId)
    ) {
        throw new Error("STAFF_ALREADY_LINKED");
    }

    await connection.query(
        "UPDATE staff SET user_id = ? WHERE staff_id = ?",
        [userId, staffId]
    );
};

// Create user
const createUser = async (userData) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            full_name,
            email,
            password,
            role,
            phone,
            teacher_id,
            student_id,
            staff_id
        } = userData;

        const [result] = await connection.query(
            `INSERT INTO users
            (full_name, email, password, role, phone, status)
            VALUES (?, ?, ?, ?, ?, 'active')`,
            [full_name, email, password, role, phone || null]
        );

        const userId = result.insertId;

        if (role === "teacher") {
            await linkTeacher(connection, teacher_id, userId);
        }

        if (role === "student") {
            await linkStudent(connection, student_id, userId);
        }

        if (role === "staff") {
            await linkStaff(connection, staff_id, userId);
        }

        await connection.commit();

        return userId;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Update user
const updateUser = async (userId, userData) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            full_name,
            email,
            role,
            phone,
            status,
            teacher_id,
            student_id,
            staff_id
        } = userData;

        const [existingUsers] = await connection.query(
            "SELECT user_id FROM users WHERE user_id = ? FOR UPDATE",
            [userId]
        );

        if (!existingUsers.length) {
            await connection.rollback();
            return 0;
        }

        await connection.query(
            `UPDATE users
             SET full_name = ?, email = ?, role = ?, phone = ?, status = ?
             WHERE user_id = ?`,
            [full_name, email, role, phone || null, status, userId]
        );

        // Remove previous teacher link
        await connection.query(
            "UPDATE teachers SET user_id = NULL WHERE user_id = ?",
            [userId]
        );

        // Remove previous student link
        await connection.query(
            "UPDATE students SET user_id = NULL WHERE user_id = ?",
            [userId]
        );

        // Remove previous staff link
        await connection.query(
            "UPDATE staff SET user_id = NULL WHERE user_id = ?",
            [userId]
        );

        // Link selected teacher
        if (role === "teacher") {
            await linkTeacher(connection, teacher_id, userId);
        }

        // Link selected student
        if (role === "student") {
            await linkStudent(connection, student_id, userId);
        }

        // Link selected staff
        if (role === "staff") {
            await linkStaff(connection, staff_id, userId);
        }

        await connection.commit();

        return 1;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Delete user
const deleteUser = async (userId) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            "UPDATE teachers SET user_id = NULL WHERE user_id = ?",
            [userId]
        );

        await connection.query(
            "UPDATE students SET user_id = NULL WHERE user_id = ?",
            [userId]
        );

        await connection.query(
            "UPDATE staff SET user_id = NULL WHERE user_id = ?",
            [userId]
        );

        const [result] = await connection.query(
            "DELETE FROM users WHERE user_id = ?",
            [userId]
        );

        await connection.commit();

        return result.affectedRows;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
