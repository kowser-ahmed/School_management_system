const allowedRoles = [
    "all",
    "admin",
    "teacher",
    "accountant",
    "parent",
    "student"
];

const allowedStatuses = [
    "published",
    "draft"
];

function validateNotice(data) {
    const errors = [];

    if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
        errors.push("Notice title is required.");
    } else if (data.title.trim().length > 200) {
        errors.push("Notice title cannot exceed 200 characters.");
    }

    if (!data.content || typeof data.content !== "string" || !data.content.trim()) {
        errors.push("Notice content is required.");
    }

    if (
        data.target_role &&
        !allowedRoles.includes(data.target_role)
    ) {
        errors.push("Invalid target role.");
    }

    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        errors.push("Invalid notice status.");
    }

    if (
        data.publish_date &&
        isNaN(Date.parse(data.publish_date))
    ) {
        errors.push("Invalid publish date.");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateNotice
};