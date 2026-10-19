const db = require("../config/db");

// Get all students
const getAllStudents = async () => {
    const [rows] = await db.query(`
        SELECT 
            student_id,
            student_code,
            full_name,
            gender,
            date_of_birth,
            blood_group,
            phone,
            email,
            address,
            admission_date,
            class_id,
            section_id,
            roll_number,
            guardian_name,
            guardian_phone,
            status
        FROM students
        ORDER BY student_id DESC
    `);

    return rows;
};

// Get student by ID
const getStudentById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM students WHERE student_id = ?",
        [id]
    );

    return rows[0];
};

// Create student
const createStudent = async (student) => {
    const {
        student_code,
        full_name,
        gender,
        date_of_birth,
        blood_group,
        phone,
        email,
        address,
        admission_date,
        class_id,
        section_id,
        roll_number,
        guardian_name,
        guardian_phone,
        status
    } = student;

    const [result] = await db.query(
        `
        INSERT INTO students
        (
            student_code,
            full_name,
            gender,
            date_of_birth,
            blood_group,
            phone,
            email,
            address,
            admission_date,
            class_id,
            section_id,
            roll_number,
            guardian_name,
            guardian_phone,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            student_code,
            full_name,
            gender,
            date_of_birth,
            blood_group,
            phone,
            email,
            address,
            admission_date,
            class_id,
            section_id,
            roll_number,
            guardian_name,
            guardian_phone,
            status || "Active"
        ]
    );

    return result.insertId;
};

// Update student
const updateStudent = async (id, student) => {
    const {
        student_code,
        full_name,
        gender,
        date_of_birth,
        blood_group,
        phone,
        email,
        address,
        admission_date,
        class_id,
        section_id,
        roll_number,
        guardian_name,
        guardian_phone,
        status
    } = student;

    const [result] = await db.query(
        `
        UPDATE students
        SET
            student_code = ?,
            full_name = ?,
            gender = ?,
            date_of_birth = ?,
            blood_group = ?,
            phone = ?,
            email = ?,
            address = ?,
            admission_date = ?,
            class_id = ?,
            section_id = ?,
            roll_number = ?,
            guardian_name = ?,
            guardian_phone = ?,
            status = ?
        WHERE student_id = ?
        `,
        [
            student_code,
            full_name,
            gender,
            date_of_birth,
            blood_group,
            phone,
            email,
            address,
            admission_date,
            class_id,
            section_id,
            roll_number,
            guardian_name,
            guardian_phone,
            status,
            id
        ]
    );

    return result.affectedRows;
};

// Delete student
const deleteStudent = async (id) => {
    const [result] = await db.query(
        "DELETE FROM students WHERE student_id = ?",
        [id]
    );

    return result.affectedRows;
};
module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};