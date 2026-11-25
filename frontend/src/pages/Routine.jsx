
import React, { useEffect, useState } from "react";
import API from "../api/axios";
import "./Routine.css";

const initialFormData = {
  class_id: "",
  section_id: "",
  subject_id: "",
  teacher_id: "",
  day_of_week: "Saturday",
  start_time: "",
  end_time: "",
  room: ""
};

const getResponseData = (response) => {
  const data = response?.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(response?.data)) return response.data;

  return [];
};

const Routine = ({ userRole }) => {
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownError, setDropdownError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState(initialFormData);

  const isAdmin = userRole?.toLowerCase() === "admin";

  // Get all routines
  const fetchRoutines = async () => {
    try {
      setLoading(true);

      const response = await API.get("/routines");

      setRoutines(getResponseData(response));
      setError("");
    } catch (err) {
      console.error("Routine Load Error:", err);

      setError(
        err.response?.data?.message ||
        "Routine load failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load dropdown data
  const fetchDropdownData = async () => {
    setDropdownError("");

    const requests = [
      {
        name: "Classes",
        url: "/classes",
        setter: setClasses
      },
      {
        name: "Sections",
        url: "/sections",
        setter: setSections
      },
      {
        name: "Subjects",
        url: "/subjects",
        setter: setSubjects
      },
      {
        name: "Teachers",
        url: "/teachers",
        setter: setTeachers
      }
    ];

    const results = await Promise.allSettled(
      requests.map((item) => API.get(item.url))
    );

    const failedRequests = [];

    results.forEach((result, index) => {
      const request = requests[index];

      if (result.status === "fulfilled") {
        const data = getResponseData(result.value);

        request.setter(data);

        console.log(
          `${request.name} API Data:`,
          data
        );
      } else {
        console.error(
          `${request.name} API Error:`,
          result.reason
        );

        failedRequests.push(request.name);
        request.setter([]);
      }
    });

    if (failedRequests.length > 0) {
      setDropdownError(
        `Failed to load: ${failedRequests.join(", ")}. Check API permissions.`
      );
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle class selection
  const handleClassChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      class_id: e.target.value,
      section_id: ""
    }));
  };

  // Add new routine
  const handleAddRoutine = async (e) => {
    e.preventDefault();

    if (!formData.class_id || !formData.subject_id) {
      alert("Please select Class and Subject.");
      return;
    }

    if (formData.end_time <= formData.start_time) {
      alert("End time must be later than start time.");
      return;
    }

    try {
      setSaving(true);

      const response = await API.post("/routines", {
        ...formData,
        class_id: Number(formData.class_id),
        subject_id: Number(formData.subject_id),
        section_id: formData.section_id
          ? Number(formData.section_id)
          : null,
        teacher_id: formData.teacher_id
          ? Number(formData.teacher_id)
          : null
      });

      if (response.data.success) {
        alert("Routine added successfully!");

        setFormData(initialFormData);
        setShowForm(false);

        await fetchRoutines();
      }
    } catch (err) {
      console.error("Add Routine Error:", err);

      alert(
        err.response?.data?.message ||
        "Failed to add routine."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete routine
  const handleDeleteRoutine = async (routineId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this routine?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(routineId);

      const response = await API.delete(
        `/routines/${routineId}`
      );

      if (response.data.success) {
        alert("Routine deleted successfully!");

        setRoutines((prev) =>
          prev.filter(
            (routine) => routine.routine_id !== routineId
          )
        );
      }
    } catch (err) {
      console.error("Delete Routine Error:", err);

      alert(
        err.response?.data?.message ||
        "Failed to delete routine."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Load page data
  useEffect(() => {
    fetchRoutines();

    if (isAdmin) {
      fetchDropdownData();
    }
  }, [isAdmin]);

  return (
    <div className="routine-container">

      {/* Header */}
      <div className="routine-header">
        <h2>Class Routine</h2>
        <p>View your class schedule and daily timetable.</p>
      </div>

      {/* Add Routine Button */}
      {isAdmin && (
        <button
          type="button"
          className="routine-add-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Routine"}
        </button>
      )}

      {/* Add Routine Form */}
      {showForm && isAdmin && (
        <div className="routine-form">

          <h3>Add New Routine</h3>

          {dropdownError && (
            <p className="routine-error">
              {dropdownError}
            </p>
          )}

          <form onSubmit={handleAddRoutine}>

            {/* Class */}
            <label>Class</label>
            <select
              name="class_id"
              value={formData.class_id}
              onChange={handleClassChange}
              required
            >
              <option value="">Select Class</option>

              {classes.map((item) => (
                <option
                  key={item.class_id}
                  value={item.class_id}
                >
                  {item.class_name}
                </option>
              ))}
            </select>

            {/* Section */}
            <label>Section</label>
            <select
              name="section_id"
              value={formData.section_id}
              onChange={handleChange}
            >
              <option value="">Select Section</option>

              {sections
                .filter((item) =>
                  !item.class_id ||
                  String(item.class_id) ===
                    String(formData.class_id)
                )
                .map((item) => (
                  <option
                    key={item.section_id}
                    value={item.section_id}
                  >
                    {item.section_name}
                  </option>
                ))}
            </select>

            {/* Subject */}
            <label>Subject</label>
            <select
              name="subject_id"
              value={formData.subject_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Subject</option>

              {subjects.map((item) => (
                <option
                  key={item.subject_id}
                  value={item.subject_id}
                >
                  {item.subject_name}
                </option>
              ))}
            </select>

            {/* Teacher */}
            <label>Teacher</label>
            <select
              name="teacher_id"
              value={formData.teacher_id}
              onChange={handleChange}
            >
              <option value="">Select Teacher</option>

              {teachers.map((item) => (
                <option
                  key={item.teacher_id}
                  value={item.teacher_id}
                >
                  {item.full_name}
                </option>
              ))}
            </select>

            {/* Day */}
            <label>Day</label>
            <select
              name="day_of_week"
              value={formData.day_of_week}
              onChange={handleChange}
              required
            >
              {[
                "Saturday",
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
              ].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            {/* Start Time */}
            <label>Start Time</label>
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
            />

            {/* End Time */}
            <label>End Time</label>
            <input
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
            />

            {/* Room */}
            <label>Room</label>
            <input
              type="text"
              name="room"
              placeholder="Enter Room Number"
              value={formData.room}
              onChange={handleChange}
            />

            {/* Save Button */}
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Routine"}
            </button>

          </form>
        </div>
      )}

      {/* Routine Table */}
      {loading ? (
        <p className="routine-message">
          Loading routines...
        </p>
      ) : error ? (
        <p className="routine-message routine-error">
          {error}
        </p>
      ) : routines.length === 0 ? (
        <p className="routine-message">
          No routine available.
        </p>
      ) : (
        <div className="routine-table-wrapper">

          <table className="routine-table">

            <thead>
              <tr>
                <th>Class</th>
                <th>Section</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Day</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Room</th>

                {isAdmin && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {routines.map((routine) => (
                <tr key={routine.routine_id}>

                  <td>
                    {routine.class_name || routine.class_id}
                  </td>

                  <td>
                    {routine.section_name || routine.section_id || "-"}
                  </td>

                  <td>
                    {routine.subject_name || routine.subject_id}
                  </td>

                  <td>
                    {routine.teacher_name || routine.teacher_id || "-"}
                  </td>

                  <td>{routine.day_of_week}</td>

                  <td>{routine.start_time}</td>

                  <td>{routine.end_time}</td>

                  <td>{routine.room || "-"}</td>

                  {isAdmin && (
                    <td>
                      <button
                        type="button"
                        disabled={deletingId === routine.routine_id}
                        onClick={() =>
                          handleDeleteRoutine(routine.routine_id)
                        }
                        style={{
                          backgroundColor: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: deletingId === routine.routine_id
                            ? "not-allowed"
                            : "pointer",
                          opacity: deletingId === routine.routine_id
                            ? 0.6
                            : 1
                        }}
                      >
                        {deletingId === routine.routine_id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  )}

                </tr>
              ))}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
};

export default Routine;
