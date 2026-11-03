const api = "/api";
const state = {
    classes: [],
    sections: [],
    students: [],
    employees: [],
    employeeType: "teacher",
    studentView: "daily",
    token: ""
};

const $ = (selector) => document.querySelector(selector);
const today = new Date().toISOString().slice(0, 10);

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
}[character]));

const showNotice = (message, isError = false) => {
    const notice = $("#notice");
    notice.textContent = message;
    notice.classList.toggle("is-error", isError);
    notice.hidden = false;
};

const request = async (url, options = {}) => {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const response = await fetch(url, {
        ...options,
        headers
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.message || `Request failed (${response.status})`);
    }
    return result;
};

const queryString = (values) => new URLSearchParams(values).toString();

const fillSelect = (select, items, valueKey, labelFn, placeholder) => {
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + items.map((item) =>
        `<option value="${escapeHtml(item[valueKey])}">${escapeHtml(labelFn(item))}</option>`
    ).join("");
};

const reportError = (error) => showNotice(error.message, true);

const loadClassOptions = async () => {
    const [classResult, sectionResult] = await Promise.all([
        request(`${api}/classes`),
        request(`${api}/sections`)
    ]);
    state.classes = classResult.data || [];
    state.sections = sectionResult.data || [];

    const years = [...new Set(state.classes.map((item) => item.academic_year))].sort().reverse();
    fillSelect($("#academicYear"), years.map((academic_year) => ({ academic_year })), "academic_year", (item) => item.academic_year, "Select year");
    updateClassOptions();
};

const selectedClass = () => state.classes.find((item) => String(item.class_id) === $("#classSelect").value);

const updateClassOptions = () => {
    const academicYear = $("#academicYear").value;
    const classes = state.classes.filter((item) => item.academic_year === academicYear);
    fillSelect($("#classSelect"), classes, "class_id", (item) => item.class_name, "Select class");
    updateSectionOptions();
};

const updateSectionOptions = () => {
    const classId = $("#classSelect").value;
    const sections = state.sections.filter((section) => String(section.class_id) === classId);
    fillSelect($("#sectionSelect"), sections, "section_id", (item) => item.section_name, "Select section");
};

const studentFilters = () => ({
    academic_year: $("#academicYear").value,
    class_id: $("#classSelect").value,
    section_id: $("#sectionSelect").value,
    date: $("#studentDate").value
});

const renderStudentRows = (students, monthly = false) => {
    if (!students.length) {
        $("#studentTableWrap").innerHTML = '<div class="empty-state">No students found for these filters.</div>';
        return;
    }

    const statuses = ["present", "absent", "late", "leave"];
    const rows = students.map((student, index) => {
        const status = student.attendance_status || student.status || "present";
        const statusCell = monthly
            ? `<span class="status-select">${escapeHtml(student.attendance_percentage ?? "-")}%</span>`
            : `<select class="status-select attendance-status" aria-label="Attendance status for ${escapeHtml(student.full_name)}">${statuses.map((item) =>
                `<option value="${item}"${status === item ? " selected" : ""}>${item[0].toUpperCase()}${item.slice(1)}</option>`
            ).join("")}</select>`;
        const remarks = monthly
            ? `${escapeHtml(student.present_days || 0)} present / ${escapeHtml(student.absent_days || 0)} absent / ${escapeHtml(student.late_days || 0)} late`
            : `<input class="attendance-remarks" aria-label="Remarks for ${escapeHtml(student.full_name)}" maxlength="255" value="${escapeHtml(student.remarks || "")}" placeholder="Add note">`;
        return `<tr style="animation-delay:${Math.min(index, 12) * 18}ms" data-student-id="${escapeHtml(student.student_id)}" data-attendance-id="${escapeHtml(student.attendance_id || "")}">
            <td>${escapeHtml(student.roll_number ?? "-")}</td>
            <td><span class="student-name">${escapeHtml(student.full_name)}</span><span class="student-code">${escapeHtml(student.student_code)}</span></td>
            <td>${statusCell}</td><td>${remarks}</td></tr>`;
    }).join("");
    $("#studentTableWrap").innerHTML = `<table><thead><tr><th>Roll</th><th>Student</th><th>${monthly ? "Attendance" : "Status"}</th><th>${monthly ? "Month summary" : "Remarks"}</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const updateStudentSummary = (students, monthly = false) => {
    const summary = $("#studentSummary");
    summary.hidden = false;
    if (monthly) {
        const average = students.length
            ? (students.reduce((total, student) => total + Number(student.attendance_percentage || 0), 0) / students.length).toFixed(1)
            : "0.0";
        summary.innerHTML = `<span class="summary-chip">${students.length} students</span><span class="summary-chip">${average}% average attendance</span>`;
        return;
    }
    const counts = Object.fromEntries(["present", "absent", "late", "leave"].map((status) =>
        [status, students.filter((student) => (student.attendance_status || "") === status).length]
    ));
    summary.innerHTML = `<span class="summary-chip">${students.length} students</span>` +
        Object.entries(counts).map(([status, count]) => `<span class="summary-chip${status === "absent" ? " absent" : ""}">${count} ${status}</span>`).join("");
};

const loadStudents = async () => {
    const filters = studentFilters();
    const selected = selectedClass();
    if (!filters.academic_year || !filters.class_id || !filters.section_id ||
        (state.studentView === "daily" && !filters.date) || !selected) {
        throw new Error("Choose the academic year, class, section and date or month first");
    }
    let data;
    if (state.studentView === "monthly") {
        const month = $("#studentMonth").value;
        if (!month) throw new Error("Choose a month first");
        const query = queryString({ academic_year: filters.academic_year, class_id: filters.class_id, section_id: filters.section_id, month });
        data = (await request(`${api}/attendance/students/reports/monthly?${query}`)).data || [];
    } else {
        const query = queryString(filters);
        data = (await request(`${api}/attendance/students/roster?${query}`)).data || [];
    }
    state.students = data;
    renderStudentRows(data, state.studentView === "monthly");
    updateStudentSummary(data, state.studentView === "monthly");
    $("#studentCount").textContent = `${data.length} student${data.length === 1 ? "" : "s"} loaded`;
    $("#saveStudents").disabled = state.studentView !== "daily" || data.length === 0;
};

const saveStudents = async () => {
    const filters = studentFilters();
    const rows = [...$("#studentTableWrap").querySelectorAll("tbody tr")];
    const newEntries = [];
    const updates = [];
    for (const row of rows) {
        const entry = {
            student_id: Number(row.dataset.studentId),
            status: row.querySelector(".attendance-status").value,
            remarks: row.querySelector(".attendance-remarks").value.trim()
        };
        if (row.dataset.attendanceId) updates.push({ ...entry, attendance_id: row.dataset.attendanceId });
        else newEntries.push(entry);
    }
    if (newEntries.length) {
        await request(`${api}/attendance/students`, {
            method: "POST",
            body: JSON.stringify({ ...filters, attendance: newEntries })
        });
    }
    await Promise.all(updates.map(({ attendance_id, status, remarks }) => request(`${api}/attendance/students/${attendance_id}`, {
        method: "PUT", body: JSON.stringify({ status, remarks })
    })));
    showNotice("Student attendance saved.");
    await loadStudents();
};

const renderEmployeeRows = (employees, monthly = false) => {
    if (!employees.length) {
        $("#employeeTableWrap").innerHTML = '<div class="empty-state">No employees found.</div>';
        return;
    }
    const statuses = ["present", "absent", "late", "leave"];
    const rows = employees.map((employee) => `<tr data-employee-id="${escapeHtml(employee.employee_id)}" data-attendance-id="${escapeHtml(employee.attendance_id || "")}">
        <td><span class="student-name">${escapeHtml(employee.full_name)}</span><span class="student-code">${escapeHtml(employee.employee_code)}${employee.designation ? ` · ${escapeHtml(employee.designation)}` : ""}</span></td>
        ${monthly
            ? `<td>${escapeHtml(employee.present_days || 0)}</td><td>${escapeHtml(employee.absent_days || 0)}</td><td>${escapeHtml(employee.late_days || 0)}</td><td>${escapeHtml(employee.leave_days || 0)}</td>`
            : `<td><select class="status-select employee-status">${statuses.map((status) => `<option value="${status}"${(employee.attendance_status || "present") === status ? " selected" : ""}>${status[0].toUpperCase()}${status.slice(1)}</option>`).join("")}</select></td>
                <td><input class="check-in" type="time" aria-label="Check-in time for ${escapeHtml(employee.full_name)}" value="${escapeHtml(employee.check_in || "")}"></td>
                <td><input class="check-out" type="time" aria-label="Check-out time for ${escapeHtml(employee.full_name)}" value="${escapeHtml(employee.check_out || "")}"></td>
                <td><input class="employee-remarks" maxlength="255" placeholder="Add note" value="${escapeHtml(employee.remarks || "")}"></td>`}
        </tr>`).join("");
    const headings = monthly ? "<th>Present</th><th>Absent</th><th>Late</th><th>Leave</th>" : "<th>Status</th><th>Check in</th><th>Check out</th><th>Remarks</th>";
    $("#employeeTableWrap").innerHTML = `<table><thead><tr><th>Employee</th>${headings}</tr></thead><tbody>${rows}</tbody></table>`;
};

const loadEmployees = async () => {
    const date = $("#employeeDate").value;
    if (!date) throw new Error("Choose a date first");
    const query = queryString({ type: state.employeeType, date });
    state.employees = (await request(`${api}/attendance/employees?${query}`)).data || [];
    renderEmployeeRows(state.employees);
    $("#employeeCount").textContent = `${state.employees.length} ${state.employeeType}${state.employees.length === 1 ? "" : "s"} loaded`;
    $("#saveEmployees").disabled = state.employees.length === 0;
    $("#employeeSummary").hidden = true;
};

const saveEmployees = async () => {
    const rows = [...$("#employeeTableWrap").querySelectorAll("tbody tr")];
    await Promise.all(rows.map((row) => {
        const record = {
            type: state.employeeType,
            status: row.querySelector(".employee-status").value,
            check_in: row.querySelector(".check-in").value || null,
            check_out: row.querySelector(".check-out").value || null,
            remarks: row.querySelector(".employee-remarks").value.trim()
        };
        if (row.dataset.attendanceId) {
            return request(`${api}/attendance/employees/${row.dataset.attendanceId}`, { method: "PUT", body: JSON.stringify(record) });
        }
        return request(`${api}/attendance/employees`, {
            method: "POST",
            body: JSON.stringify({ ...record, employee_id: Number(row.dataset.employeeId), date: $("#employeeDate").value })
        });
    }));
    showNotice(`${state.employeeType === "teacher" ? "Teacher" : "Staff"} attendance saved.`);
    await loadEmployees();
};

const renderSimpleTable = (container, rows, columns) => {
    if (!rows.length) {
        container.innerHTML = '<div class="empty-state">No records found.</div>';
        return;
    }
    const headers = columns.map(([label]) => `<th>${escapeHtml(label)}</th>`).join("");
    const body = rows.map((row) => `<tr>${columns.map(([, key]) => `<td>${escapeHtml(row[key] ?? "-")}</td>`).join("")}</tr>`).join("");
    container.innerHTML = `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
};

const renderLeaveRows = (rows) => {
    if (!rows.length) {
        $("#leaveResults").innerHTML = '<div class="empty-state">No leave records found.</div>';
        return;
    }
    const body = rows.map((row) => `<tr data-leave-id="${escapeHtml(row.leave_id)}">
        <td>${escapeHtml(row.leave_type)}</td><td>${escapeHtml(row.start_date)}</td><td>${escapeHtml(row.end_date)}</td>
        <td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.reason || "-")}</td>
        <td>${row.status === "pending" ? '<button class="button button-outline leave-decision" type="button" data-status="approved">Approve</button> <button class="button button-outline leave-decision" type="button" data-status="rejected">Reject</button>' : "-"}</td>
        </tr>`).join("");
    $("#leaveResults").innerHTML = `<table><thead><tr><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Reason</th><th>Decision</th></tr></thead><tbody>${body}</tbody></table>`;
};

const loadEmployeeLeaves = async (type, id) => {
    const result = await request(`${api}/attendance/employees/${type}/${id}/leaves`);
    renderLeaveRows(result.data || []);
};

const bind = (selector, eventName, handler) => $(selector).addEventListener(eventName, async (event) => {
    event.preventDefault();
    try { await handler(event); } catch (error) { reportError(error); }
});

document.addEventListener("DOMContentLoaded", () => {
    $("#todayLabel").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
    $("#studentDate").value = today;
    $("#employeeDate").value = today;
    $("#studentMonth").value = today.slice(0, 7);
    $("#employeeMonth").value = today.slice(0, 7);
    $("#absenceFrom").value = `${today.slice(0, 4)}-${today.slice(5, 7)}-01`;
    $("#absenceTo").value = today;
    $("#leaveStart").value = today;
    $("#leaveEnd").value = today;

    $("#tokenForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const token = $("#attendanceToken").value.trim();
        const status = $("#authState");
        if (!token) {
            state.token = "";
            status.textContent = "Not connected";
            status.classList.remove("is-connected");
            showNotice("Attendance token cleared.");
            return;
        }

        state.token = token;
        try {
            const session = await request(`${api}/attendance/session`);
            status.textContent = `${session.data.role} · connected`;
            status.classList.add("is-connected");
            showNotice("Attendance access connected.");
        } catch (error) {
            state.token = "";
            status.textContent = "Not connected";
            status.classList.remove("is-connected");
            reportError(error);
        }
    });

    $(".section-tabs").addEventListener("click", (event) => {
        const button = event.target.closest("[data-panel]");
        if (!button) return;
        document.querySelectorAll(".tab-button").forEach((tab) => {
            const active = tab === button;
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", String(active));
        });
        document.querySelectorAll(".panel").forEach((panel) => {
            const active = panel.id === button.dataset.panel;
            panel.classList.toggle("is-visible", active);
            panel.hidden = !active;
        });
    });

    document.querySelectorAll("[data-student-view]").forEach((button) => button.addEventListener("click", () => {
        state.studentView = button.dataset.studentView;
        document.querySelectorAll("[data-student-view]").forEach((item) => item.classList.toggle("is-active", item === button));
        $("#studentDateLabel").hidden = state.studentView !== "daily";
        $("#studentMonthLabel").hidden = state.studentView !== "monthly";
    }));
    document.querySelectorAll("[data-employee-type]").forEach((button) => button.addEventListener("click", async () => {
        state.employeeType = button.dataset.employeeType;
        document.querySelectorAll("[data-employee-type]").forEach((item) => item.classList.toggle("is-active", item === button));
        try { await loadEmployees(); } catch (error) { reportError(error); }
    }));

    $("#academicYear").addEventListener("change", updateClassOptions);
    $("#classSelect").addEventListener("change", updateSectionOptions);
    bind("#studentFilters", "submit", loadStudents);
    bind("#saveStudents", "click", saveStudents);
    bind("#employeeFilters", "submit", loadEmployees);
    bind("#saveEmployees", "click", saveEmployees);
    bind("#loadEmployeeReport", "click", async () => {
        const month = $("#employeeMonth").value;
        if (!month) throw new Error("Choose a report month");
        const query = queryString({ type: state.employeeType, month });
        const result = await request(`${api}/attendance/employees/reports/monthly?${query}`);
        renderEmployeeRows(result.data || [], true);
        $("#employeeCount").textContent = `${(result.data || []).length} employees in report`;
        $("#saveEmployees").disabled = true;
    });

    bind("#historyForm", "submit", async () => {
        const result = await request(`${api}/attendance/students/${$("#historyStudentId").value}/history`);
        renderSimpleTable($("#studentLookupResults"), result.data || [], [
            ["Date", "attendance_date"], ["Status", "status"], ["Class", "class_name"], ["Year", "academic_year"], ["Section", "section_name"], ["Remarks", "remarks"]
        ]);
    });
    bind("#absenceForm", "submit", async () => {
        const query = queryString({ from: $("#absenceFrom").value, to: $("#absenceTo").value });
        const result = await request(`${api}/attendance/students/reports/frequent-absences?${query}`);
        renderSimpleTable($("#studentLookupResults"), result.data || [], [
            ["Student", "full_name"], ["Code", "student_code"], ["Class", "class_name"], ["Year", "academic_year"], ["Section", "section_name"], ["Absent days", "absent_days"]
        ]);
    });
    bind("#leaveForm", "submit", async () => {
        const type = $("#leaveEmployeeType").value;
        const employeeId = $("#leaveEmployeeId").value;
        const result = await request(`${api}/attendance/employees/${type}/${employeeId}/leaves`, {
            method: "POST",
            body: JSON.stringify({
                leave_type: $("#leaveType").value,
                start_date: $("#leaveStart").value,
                end_date: $("#leaveEnd").value,
                reason: $("#leaveReason").value
            })
        });
        showNotice(`Leave request recorded (${result.leave_id}).`);
    });
    bind("#leaveLookupForm", "submit", async () => {
        const type = $("#leaveLookupType").value;
        const id = $("#leaveLookupId").value;
        await loadEmployeeLeaves(type, id);
    });
    $("#leaveResults").addEventListener("click", async (event) => {
        const button = event.target.closest(".leave-decision");
        if (!button) return;
        try {
            const row = button.closest("tr");
            await request(`${api}/attendance/leaves/${row.dataset.leaveId}`, {
                method: "PATCH", body: JSON.stringify({ status: button.dataset.status })
            });
            showNotice(`Leave request ${button.dataset.status}.`);
            await loadEmployeeLeaves($("#leaveLookupType").value, $("#leaveLookupId").value);
        } catch (error) {
            reportError(error);
        }
    });

    loadClassOptions().catch(reportError);
});