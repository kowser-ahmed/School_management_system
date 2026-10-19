
const sectionModel = require("../models/sectionModel");

// Get all sections
const getAllSections = async (req, res) => {
    try {
        const sections = await sectionModel.getAllSections();

        res.status(200).json({
            success: true,
            count: sections.length,
            data: sections
        });
    } catch (error) {
        console.error("Get Sections Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sections."
        });
    }
};

// Get section by ID
const getSectionById = async (req, res) => {
    try {
        const section = await sectionModel.getSectionById(req.params.id);

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found."
            });
        }

        res.status(200).json({
            success: true,
            data: section
        });
    } catch (error) {
        console.error("Get Section Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch section."
        });
    }
};

// Create section
const createSection = async (req, res) => {
    try {
        const { class_id, section_name, capacity } = req.body;

        if (
            class_id === undefined ||
            class_id === null ||
            !Number.isInteger(Number(class_id)) ||
            Number(class_id) <= 0 ||
            !section_name ||
            !String(section_name).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid class_id and section_name are required."
            });
        }

        if (
            capacity !== undefined &&
            (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive integer."
            });
        }

        const sectionId = await sectionModel.createSection({
            class_id: Number(class_id),
            section_name: String(section_name).trim(),
            capacity: capacity === undefined ? 40 : Number(capacity)
        });

        res.status(201).json({
            success: true,
            message: "Section created successfully.",
            section_id: sectionId
        });
    } catch (error) {
        console.error("Create Section Error:", error.message);

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "The specified class does not exist."
            });
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This section may already exist for the class."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create section."
        });
    }
};

// Update section
const updateSection = async (req, res) => {
    try {
        const { class_id, section_name, capacity } = req.body;

        if (
            class_id === undefined ||
            class_id === null ||
            !Number.isInteger(Number(class_id)) ||
            Number(class_id) <= 0 ||
            !section_name ||
            !String(section_name).trim() ||
            !Number.isInteger(Number(capacity)) ||
            Number(capacity) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid class_id, section_name, and capacity are required."
            });
        }

        const affectedRows = await sectionModel.updateSection(req.params.id, {
            class_id: Number(class_id),
            section_name: String(section_name).trim(),
            capacity: Number(capacity)
        });

        if (affectedRows === 0) {
            const existingSection = await sectionModel.getSectionById(req.params.id);

            if (!existingSection) {
                return res.status(404).json({
                    success: false,
                    message: "Section not found."
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Section updated successfully."
        });
    } catch (error) {
        console.error("Update Section Error:", error.message);

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "The specified class does not exist."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update section."
        });
    }
};

// Delete section
const deleteSection = async (req, res) => {
    try {
        const affectedRows = await sectionModel.deleteSection(req.params.id);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Section not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Section deleted successfully."
        });
    } catch (error) {
        console.error("Delete Section Error:", error.message);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this section because students are assigned to it."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to delete section."
        });
    }
};

module.exports = {
    getAllSections,
    getSectionById,
    createSection,
    updateSection,
    deleteSection
};
