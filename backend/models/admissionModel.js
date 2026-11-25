
const db = require("../config/db");

// Get all admission applications
const getAllAdmissions = async () => {
    const [rows] = await db.query(`
        SELECT
            application_id,
            applicant_name,
            date_of_birth,
            gender,
            guardian_name,
            guardian_phone,
            email,
            address,
            applying_class,
            application_date,
            status
        FROM online_admissions
        ORDER BY application_id DESC
    `);

    return rows;
};

// Get admission application by ID
const getAdmissionById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM online_admissions WHERE application_id = ?",
        [id]
    );

    return rows[0];
};

// Create admission application
const createAdmission = async (admissionData) => {
    const {
        applicant_name,
        date_of_birth,
        gender,
        guardian_name,
        guardian_phone,
        email,
        address,
        applying_class
    } = admissionData;

    const [result] = await db.query(
        `
        INSERT INTO online_admissions
        (
            applicant_name,
            date_of_birth,
            gender,
            guardian_name,
            guardian_phone,
            email,
            address,
            applying_class
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            applicant_name,
            date_of_birth || null,
            gender || null,
            guardian_name || null,
            guardian_phone || null,
            email || null,
            address || null,
            applying_class || null
        ]
    );

    return result.insertId;
};

// Update admission application
const updateAdmission = async (id, admissionData) => {
    const {
        applicant_name,
        date_of_birth,
        gender,
        guardian_name,
        guardian_phone,
        email,
        address,
        applying_class
    } = admissionData;

    const [result] = await db.query(
        `
        UPDATE online_admissions
        SET
            applicant_name = ?,
            date_of_birth = ?,
            gender = ?,
            guardian_name = ?,
            guardian_phone = ?,
            email = ?,
            address = ?,
            applying_class = ?
        WHERE application_id = ?
        `,
        [
            applicant_name,
            date_of_birth || null,
            gender || null,
            guardian_name || null,
            guardian_phone || null,
            email || null,
            address || null,
            applying_class || null,
            id
        ]
    );

    return result.affectedRows;
};

// Find class ID
const findClassId = async (connection, applyingClass) => {
    if (!applyingClass) {
        const error = new Error("Applying class is missing");
        error.code = "ADMISSION_CLASS_NOT_FOUND";
        throw error;
    }

    const classValue = String(applyingClass).trim();

    let [classes] = await connection.query(
        `
        SELECT class_id
        FROM classes
        WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?))
        LIMIT 1
        `,
        [classValue]
    );

    if (classes.length === 0) {
        const numericClass = classValue
            .replace(/^class\s*/i, "")
            .trim();

        if (/^\d+$/.test(numericClass)) {
            [classes] = await connection.query(
                `
                SELECT class_id
                FROM classes
                WHERE
                    TRIM(class_name) = ?
                    OR LOWER(TRIM(class_name)) = LOWER(?)
                LIMIT 1
                `,
                [
                    numericClass,
                    `Class ${numericClass}`
                ]
            );
        }
    }

    if (classes.length === 0) {
        const error = new Error(
            `Class "${classValue}" was not found`
        );
        error.code = "ADMISSION_CLASS_NOT_FOUND";
        throw error;
    }

    return classes[0].class_id;
};

// Update admission status
const updateAdmissionStatus = async (id, status) => {
    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid admission status");
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [admissions] = await connection.query(
            `
            SELECT *
            FROM online_admissions
            WHERE application_id = ?
            FOR UPDATE
            `,
            [id]
        );

        const admission = admissions[0];

        if (!admission) {
            const error = new Error("Admission application not found");
            error.code = "ADMISSION_NOT_FOUND";
            throw error;
        }

        if (admission.status === "enrolled") {
            const error = new Error(
                "This applicant is already enrolled"
            );
            error.code = "ADMISSION_ALREADY_ENROLLED";
            throw error;
        }

        const studentCode = `ADM-${admission.application_id}`;

        // APPROVE
        if (status === "approved") {
            const [existingStudents] = await connection.query(
                `
                SELECT student_id
                FROM students
                WHERE student_code = ?
                LIMIT 1
                `,
                [studentCode]
            );

            if (existingStudents.length > 0) {
                // Activate existing student again
                await connection.query(
                    `
                    UPDATE students
                    SET status = 'active'
                    WHERE student_code = ?
                    `,
                    [studentCode]
                );
            } else {
                const classId = await findClassId(
                    connection,
                    admission.applying_class
                );

                await connection.query(
                    `
                    INSERT INTO students
                    (
                        student_code,
                        full_name,
                        gender,
                        date_of_birth,
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
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?,
                        CURRENT_DATE, ?, NULL, NULL, ?, ?, 'active'
                    )
                    `,
                    [
                        studentCode,
                        admission.applicant_name,
                        admission.gender
                            ? admission.gender.toLowerCase()
                            : null,
                        admission.date_of_birth || null,
                        null,
                        admission.email || null,
                        admission.address || null,
                        classId,
                        admission.guardian_name || null,
                        admission.guardian_phone || null
                    ]
                );
            }
        }

        // REJECT: Make existing student inactive
        if (status === "rejected") {
            await connection.query(
                `
                UPDATE students
                SET status = 'inactive'
                WHERE student_code = ?
                `,
                [studentCode]
            );
        }

        // Update admission status
        const [result] = await connection.query(
            `
            UPDATE online_admissions
            SET status = ?
            WHERE application_id = ?
            `,
            [status, id]
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

// Enroll approved applicant
const enrollAdmission = async (id) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [admissions] = await connection.query(
            `
            SELECT *
            FROM online_admissions
            WHERE application_id = ?
            FOR UPDATE
            `,
            [id]
        );

        const admission = admissions[0];

        if (!admission) {
            const error = new Error("Admission application not found");
            error.code = "ADMISSION_NOT_FOUND";
            throw error;
        }

        if (admission.status === "enrolled") {
            const error = new Error(
                "This applicant is already enrolled"
            );
            error.code = "ADMISSION_ALREADY_ENROLLED";
            throw error;
        }

        if (admission.status !== "approved") {
            const error = new Error(
                "Only approved applications can be enrolled"
            );
            error.code = "ADMISSION_NOT_APPROVED";
            throw error;
        }

        const studentCode = `ADM-${admission.application_id}`;

        const [students] = await connection.query(
            `
            SELECT student_id
            FROM students
            WHERE student_code = ?
            LIMIT 1
            `,
            [studentCode]
        );

        if (students.length === 0) {
            const error = new Error("Student record not found");
            error.code = "ADMISSION_STUDENT_NOT_FOUND";
            throw error;
        }

        await connection.query(
            `
            UPDATE online_admissions
            SET status = 'enrolled'
            WHERE application_id = ?
            `,
            [id]
        );

        await connection.commit();

        return students[0].student_id;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// Delete admission application
const deleteAdmission = async (id) => {
    const [result] = await db.query(
        `
        DELETE FROM online_admissions
        WHERE application_id = ?
        `,
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAllAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    updateAdmissionStatus,
    enrollAdmission,
    deleteAdmission
};
