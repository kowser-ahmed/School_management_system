

const isValidDate = (date) => {
    if (typeof date !== "string") {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    return (
        !isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === date
    );
};

// Strategy 1: Validate holiday name
class HolidayNameStrategy {
    validate(data) {
        if (
            typeof data.holiday_name !== "string" ||
            !data.holiday_name.trim()
        ) {
            return "Holiday name is required.";
        }

        if (data.holiday_name.trim().length > 100) {
            return "Holiday name cannot exceed 100 characters.";
        }

        return null;
    }
}

// Strategy 2: Validate start date
class StartDateStrategy {
    validate(data) {
        if (!isValidDate(data.start_date)) {
            return "A valid start date is required (YYYY-MM-DD).";
        }

        return null;
    }
}

// Strategy 3: Validate end date
class EndDateStrategy {
    validate(data) {
        if (!isValidDate(data.end_date)) {
            return "A valid end date is required (YYYY-MM-DD).";
        }

        return null;
    }
}

// Strategy 4: Validate date range
class DateRangeStrategy {
    validate(data) {
        if (
            isValidDate(data.start_date) &&
            isValidDate(data.end_date) &&
            data.start_date > data.end_date
        ) {
            return "End date cannot be earlier than start date.";
        }

        return null;
    }
}

// Strategy 5: Validate description
class DescriptionStrategy {
    validate(data) {
        if (
            data.description !== undefined &&
            data.description !== null &&
            typeof data.description !== "string"
        ) {
            return "Description must be text.";
        }

        if (
            typeof data.description === "string" &&
            data.description.trim().length > 255
        ) {
            return "Description cannot exceed 255 characters.";
        }

        return null;
    }
}

// Context: Runs all validation strategies
class HolidayValidationContext {
    constructor() {
        this.strategies = [
            new HolidayNameStrategy(),
            new StartDateStrategy(),
            new EndDateStrategy(),
            new DateRangeStrategy(),
            new DescriptionStrategy()
        ];
    }

    validate(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return ["Invalid holiday data."];
        }

        const errors = [];

        this.strategies.forEach((strategy) => {
            const error = strategy.validate(data);

            if (error) {
                errors.push(error);
            }
        });

        return errors;
    }
}

const holidayValidation = new HolidayValidationContext();

module.exports = {
    validateHoliday: (data) => holidayValidation.validate(data),
    isValidDate
};
