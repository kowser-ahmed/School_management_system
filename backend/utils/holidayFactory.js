
class HolidayFactory {

    // Prepare data for creating a holiday
    createHoliday(data) {
        return {
            holiday_name: data.holiday_name.trim(),
            start_date: data.start_date,
            end_date: data.end_date,
            description: data.description
                ? data.description.trim()
                : null
        };
    }

    // Prepare data for updating a holiday
    updateHoliday(data) {
        return {
            holiday_name: data.holiday_name.trim(),
            start_date: data.start_date,
            end_date: data.end_date,
            description: data.description
                ? data.description.trim()
                : null
        };
    }
}

module.exports = new HolidayFactory();
