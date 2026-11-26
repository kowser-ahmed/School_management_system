const admissionModel = require("../models/admissionModel");


// ===============================
// Validation
// ===============================
const validateAdmissionData = (data) => {
    const {
        applicant_name,
        date_of_birth,
        gender,
        guardian_name,
        guardian_phone,
        email,
        address,
        applying_class
    } = data;


    // Required fields
    if (!applicant_name || !String(applicant_name).trim()) {
        return "Applicant name is required.";
    }

    if (!date_of_birth) {
        return "Date of birth is required.";
    }

    if (!gender) {
        return "Gender is required.";
    }

    if (!guardian_name || !String(guardian_name).trim()) {
        return "Guardian name is required.";
    }

    if (!guardian_phone || !String(guardian_phone).trim()) {
        return "Guardian phone number is required.";
    }

    if (!email || !String(email).trim()) {
        return "Gmail address is required.";
    }

    if (!address || !String(address).trim()) {
        return "Address is required.";
    }

    if (!applying_class || !String(applying_class).trim()) {
        return "Applying class is required.";
    }


    // ===============================
    // Bangladesh Phone Validation
    // ===============================
    const phone = String(guardian_phone).trim();

    const bangladeshPhoneRegex = /^01[3-9]\d{8}$/;

    if (!bangladeshPhoneRegex.test(phone)) {
        return "Please enter a valid Bangladesh mobile number.";
    }


    // ===============================
    // Gmail Validation
    // ===============================
    const gmail = String(email).trim();

    const gmailRegex =
        /^[a-zA-Z0-9](?:[a-zA-Z0-9._+-]*[a-zA-Z0-9])?@gmail\.com$/;

    if (!gmailRegex.test(gmail)) {
        return "Please enter a valid Gmail address.";
    }

    // Consecutive dots are not accepted
    if (gmail.includes("..")) {
        return "Please enter a valid Gmail address.";
    }

    // Gmail username
    const username = gmail.split("@")[0];

    if (!username) {
        return "Please enter a valid Gmail address.";
    }

    if (username.length > 30) {
        return "Please enter a valid Gmail address.";
    }

    if (
        username.startsWith(".") ||
        username.endsWith(".")
    ) {
        return "Please enter a valid Gmail address.";
    }


    // ===============================
    // Gender Validation
    // ===============================
    const allowedGenders = [
        "male",
        "female",
        "other"
    ];

    if (!allowedGenders.includes(gender)) {
        return "Invalid gender selected.";
    }


    // ===============================
    // Date of Birth
    // ===============================
    // No age restriction.
    // No specific DOB restriction.
    // The date is accepted as submitted.


    return null;
};


// ===============================
// Get all admissions
// ===============================
const getAllAdmissions = async (req, res) => {
    try {
        const admissions = await admissionModel.getAllAdmissions();

        res.json({
            success: true,
            data: admissions
        });

    } catch (error) {
        console.error("Get Admissions Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch admission applications."
        });
    }
};


// ===============================
// Get admission by ID
// ===============================
const getAdmissionById = async (req, res) => {
    try {
        const { id } = req.params;

        const admission =
            await admissionModel.getAdmissionById(id);

        if (!admission) {
            return res.status(404).json({
                success: false,
                message: "Admission application not found."
            });
        }

        res.json({
            success: true,
            data: admission
        });

    } catch (error) {
        console.error("Get Admission By ID Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch admission application."
        });
    }
};


// ===============================
// Create admission
// ===============================
const createAdmission = async (req, res) => {
    try {

        const validationError =
            validateAdmissionData(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        const admissionData = {
            applicant_name:
                String(req.body.applicant_name).trim(),

            date_of_birth:
                req.body.date_of_birth,

            gender:
                req.body.gender,

            guardian_name:
                String(req.body.guardian_name).trim(),

            guardian_phone:
                String(req.body.guardian_phone).trim(),

            email:
                String(req.body.email).trim(),

            address:
                String(req.body.address).trim(),

            applying_class:
                String(req.body.applying_class).trim()
        };


        const result =
            await admissionModel.createAdmission(
                admissionData
            );


        res.status(201).json({
            success: true,
            message:
                "Admission application submitted successfully!",
            data: result
        });

    } catch (error) {
        console.error("Create Admission Error:", error);

        res.status(500).json({
            success: false,
            message:
                "Failed to submit admission application."
        });
    }
};


// ===============================
// Update admission
// ===============================
const updateAdmission = async (req, res) => {
    try {
        const { id } = req.params;


        const validationError =
            validateAdmissionData(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        const admissionData = {
            applicant_name:
                String(req.body.applicant_name).trim(),

            date_of_birth:
                req.body.date_of_birth,

            gender:
                req.body.gender,

            guardian_name:
                String(req.body.guardian_name).trim(),

            guardian_phone:
                String(req.body.guardian_phone).trim(),

            email:
                String(req.body.email).trim(),

            address:
                String(req.body.address).trim(),

            applying_class:
                String(req.body.applying_class).trim()
        };


        const result =
            await admissionModel.updateAdmission(
                id,
                admissionData
            );


        if (!result) {
            return res.status(404).json({
                success: false,
                message:
                    "Admission application not found."
            });
        }


        res.json({
            success: true,
            message:
                "Admission application updated successfully.",
            data: result
        });

    } catch (error) {
        console.error("Update Admission Error:", error);

        res.status(500).json({
            success: false,
            message:
                "Failed to update admission application."
        });
    }
};


// ===============================
// Update admission status
// ===============================
const updateAdmissionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;


        const allowedStatuses = [
            "pending",
            "approved",
            "rejected",
            "enrolled"
        ];


        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admission status."
            });
        }


        const result =
            await admissionModel.updateAdmissionStatus(
                id,
                status
            );


        if (!result) {
            return res.status(404).json({
                success: false,
                message:
                    "Admission application not found."
            });
        }


        res.json({
            success: true,
            message:
                `Admission status updated to ${status} successfully.`,
            data: result
        });

    } catch (error) {
        console.error(
            "Update Admission Status Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update admission status."
        });
    }
};


// ===============================
// Enroll applicant
// ===============================
const enrollAdmission = async (req, res) => {
    try {
        const { id } = req.params;


        const result =
            await admissionModel.enrollAdmission(id);


        if (!result) {
            return res.status(404).json({
                success: false,
                message:
                    "Admission application not found."
            });
        }


        res.json({
            success: true,
            message:
                "Applicant successfully enrolled and added to Students List!",
            data: result
        });

    } catch (error) {
        console.error("Enroll Admission Error:", error);

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to enroll applicant."
        });
    }
};


// ===============================
// Delete admission
// ===============================
const deleteAdmission = async (req, res) => {
    try {
        const { id } = req.params;


        const result =
            await admissionModel.deleteAdmission(id);


        if (!result) {
            return res.status(404).json({
                success: false,
                message:
                    "Admission application not found."
            });
        }


        res.json({
            success: true,
            message:
                "Admission application deleted successfully."
        });

    } catch (error) {
        console.error("Delete Admission Error:", error);

        res.status(500).json({
            success: false,
            message:
                "Failed to delete admission application."
        });
    }
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