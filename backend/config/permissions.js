
const permissions = {
    admin: ["*"],

    teacher: [
        "students:read",
        "teachers:read",
        "classes:read",
        "sections:read",
        "subjects:read",

        // Attendance permissions
        "attendance:read",
        "attendance:create",
        "attendance:update",

        // Exam permissions
        "exams:read",
        "exams:create",
        "exams:update",
        "exams:delete",

        // Result permissions
        "results:read",
        "results:create",
        "results:update",
        "results:delete",

        // Leave permissions
        "leave:read",
        "leave:create"
    ],

    staff: [
        // Leave permissions
        "leave:read",
        "leave:create"
    ],

    accountant: [
        // Fee structure
        "fees:read",
        "fees:create",
        "fees:update",
        "fees:delete",

        // Student fees
        "student-fees:read",
        "student-fees:create",

        // Dues
        "dues:read",

        // Payments
        "payments:read",
        "payments:create",

        // Income
        "income:read",
        "income:create",
        "income:update",
        "income:delete",

        // Expenses
        "expenses:read",
        "expenses:create",
        "expenses:update",
        "expenses:delete",

        // Payslips
        "payslips:read",
        "payslips:create",
        "payslips:pay"
    ],

    parent: [
        "children:read",
        "attendance:read",
        "results:read",
        "fees:read"
    ],

    student: [
        "profile:read",
        "attendance:read",
        "results:read",
        "fees:read",
        "student:fees:read",
        "student:dues:read",
        "student:payments:read"
    ]
};

module.exports = permissions;
