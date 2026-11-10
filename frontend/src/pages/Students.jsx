
import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Students.css'

function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState({})

  const initialFormData = {
    student_code: '',
    full_name: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    email: '',
    blood_group: '',
    address: '',
    class_id: '',
    section_id: '',
    roll_number: '',
    guardian_name: '',
    guardian_phone: '',
    admission_date: new Date().toISOString().split('T')[0],
    status: 'active',
  }

  const [formData, setFormData] = useState(initialFormData)

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/students')
      setStudents(response.data.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load students. Please check the backend server.'
      )
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    setError('')
    setSuccess('')
  }

  // Reset form
  const resetForm = () => {
    setFormData({ ...initialFormData })
    setEditingId(null)
    setShowForm(false)
    setErrors({})
    setError('')
  }

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  // Edit student
  const editStudent = (student) => {
    setEditingId(student.student_id)

    setFormData({
      student_code: student.student_code || '',
      full_name: student.full_name || '',
      gender: student.gender || 'male',
      date_of_birth: student.date_of_birth
        ? String(student.date_of_birth).split('T')[0]
        : '',
      phone: student.phone || '',
      email: student.email || '',
      blood_group: student.blood_group || '',
      address: student.address || '',
      class_id: student.class_id || '',
      section_id: student.section_id || '',
      roll_number: student.roll_number || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      admission_date: student.admission_date
        ? String(student.admission_date).split('T')[0]
        : '',
      status: (student.status || 'active').toLowerCase(),
    })

    setErrors({})
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {}

    if (!formData.student_code.trim()) {
      newErrors.student_code = 'Student Code is required.'
    } else if (formData.student_code.trim().length > 30) {
      newErrors.student_code = 'Student Code cannot exceed 30 characters.'
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Student Name is required.'
    } else if (formData.full_name.trim().length > 100) {
      newErrors.full_name = 'Student Name cannot exceed 100 characters.'
    }

    const phoneRegex = /^01[3-9]\d{8}$/

    if (formData.phone && !phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 11-digit Bangladesh phone number.'
    }

    if (
      formData.guardian_phone &&
      !phoneRegex.test(formData.guardian_phone.trim())
    ) {
      newErrors.guardian_phone = 'Enter a valid guardian phone number.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (formData.email && !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address.'
    }

    const numberFields = ['class_id', 'section_id', 'roll_number']

    numberFields.forEach((field) => {
      if (
        formData[field] &&
        (!Number.isInteger(Number(formData[field])) ||
          Number(formData[field]) <= 0)
      ) {
        newErrors[field] = 'Must be a positive whole number.'
      }
    })

    if (
      formData.gender &&
      !['male', 'female', 'other'].includes(formData.gender)
    ) {
      newErrors.gender = 'Please select a valid gender.'
    }

    if (
      !['active', 'inactive', 'transferred'].includes(formData.status)
    ) {
      newErrors.status = 'Please select a valid status.'
    }

    if (
      formData.date_of_birth &&
      formData.date_of_birth > new Date().toISOString().split('T')[0]
    ) {
      newErrors.date_of_birth = 'Date of birth cannot be in the future.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  // Save student
  const saveStudent = async (e) => {
    e.preventDefault()

    if (saving) return

    setError('')
    setSuccess('')

    if (!validateForm()) {
      setError('Please correct the highlighted fields.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        ...formData,
        student_code: formData.student_code.trim(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        guardian_phone: formData.guardian_phone.trim(),
        guardian_name: formData.guardian_name.trim(),
        date_of_birth: formData.date_of_birth || null,
        admission_date: formData.admission_date || null,
        class_id: formData.class_id
          ? Number(formData.class_id)
          : null,
        section_id: formData.section_id
          ? Number(formData.section_id)
          : null,
        roll_number: formData.roll_number
          ? Number(formData.roll_number)
          : null,
        status: formData.status.toLowerCase(),
      }

      if (editingId !== null) {
        await API.put(`/students/${editingId}`, payload)
        setSuccess('Student updated successfully!')
      } else {
        await API.post('/students', payload)
        setSuccess('Student added successfully!')
      }

      setFormData({ ...initialFormData })
      setEditingId(null)
      setShowForm(false)
      setErrors({})

      await fetchStudents()
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to save student.'

      // Handle duplicate errors near the related input field
      if (err.response?.status === 409) {
        if (message.toLowerCase().includes('roll number')) {
          setErrors((prev) => ({
            ...prev,
            roll_number: message,
          }))

          setError('')
        } else if (message.toLowerCase().includes('student code')) {
          setErrors((prev) => ({
            ...prev,
            student_code: message,
          }))

          setError('')
        } else {
          setError(message)
        }
      } else {
        setError(message)
      }

      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Delete student
  const deleteStudent = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this student?'
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await API.delete(`/students/${id}`)

      setSuccess('Student deleted successfully!')
      await fetchStudents()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to delete student.'
      )
    }
  }

  // Search students
  const query = search.trim().toLowerCase()

  const exactIdMatches = /^\d+$/.test(query)
    ? students.filter(
        (student) => String(student.student_id) === query
      )
    : []

  const filteredStudents =
    exactIdMatches.length > 0
      ? exactIdMatches
      : students.filter((student) => {
          if (!query) return true

          const fields = [
            student.student_id,
            student.student_code,
            student.full_name,
            student.gender,
            student.phone,
            student.email,
            student.blood_group,
            student.class_id,
            student.section_id,
            student.roll_number,
            student.guardian_name,
            student.guardian_phone,
            student.status,
          ]

          return fields.some((value) =>
            String(value ?? '').toLowerCase().includes(query)
          )
        })

  // Reusable field error
  const FieldError = ({ name }) => {
    if (!errors[name]) return null

    return (
      <span className="student-field-error" role="alert">
        {errors[name]}
      </span>
    )
  }

  return (
    <div className="student-page">

      <div className="student-page-header">
        <div>
          <h1>Student Management</h1>
          <p>Manage all registered students</p>
        </div>

        <button
          className="student-add-btn"
          onClick={showForm ? resetForm : openAddForm}
          disabled={saving}
        >
          + Add Student
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="student-alert error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="student-alert success" role="status">
          {success}
        </div>
      )}

      {/* Student Form */}
      {showForm && (
        <div className="student-form-card">

          <div className="student-form-heading">
            <h2>
              {editingId !== null ? 'Update Student' : 'Add New Student'}
            </h2>

            <button type="button" onClick={resetForm} disabled={saving}>
              ✕
            </button>
          </div>

          <form onSubmit={saveStudent} noValidate>
            <div className="student-form-grid">

              <div className="student-field">
                <label>Student Code *</label>
                <input
                  name="student_code"
                  value={formData.student_code}
                  onChange={handleChange}
                  placeholder="e.g. STU003"
                  maxLength="30"
                  className={errors.student_code ? 'input-error' : ''}
                  aria-invalid={!!errors.student_code}
                />
                <FieldError name="student_code" />
              </div>

              <div className="student-field">
                <label>Full Name *</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter student name"
                  maxLength="100"
                  className={errors.full_name ? 'input-error' : ''}
                  aria-invalid={!!errors.full_name}
                />
                <FieldError name="full_name" />
              </div>

              <div className="student-field">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <FieldError name="gender" />
              </div>

              <div className="student-field">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
                <FieldError name="date_of_birth" />
              </div>

              <div className="student-field">
                <label>Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  maxLength="11"
                  className={errors.phone ? 'input-error' : ''}
                />
                <FieldError name="phone" />
              </div>

              <div className="student-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className={errors.email ? 'input-error' : ''}
                />
                <FieldError name="email" />
              </div>

              <div className="student-field">
                <label>Blood Group</label>
                <select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                >
                  <option value="">Select blood group</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(
                    (group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="student-field">
                <label>Class ID</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleChange}
                  className={errors.class_id ? 'input-error' : ''}
                />
                <FieldError name="class_id" />
              </div>

              <div className="student-field">
                <label>Section ID</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="section_id"
                  value={formData.section_id}
                  onChange={handleChange}
                  className={errors.section_id ? 'input-error' : ''}
                />
                <FieldError name="section_id" />
              </div>

              <div className="student-field">
                <label>Roll Number</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  className={errors.roll_number ? 'input-error' : ''}
                  aria-invalid={!!errors.roll_number}
                />
                <FieldError name="roll_number" />
              </div>

              <div className="student-field">
                <label>Admission Date</label>
                <input
                  type="date"
                  name="admission_date"
                  value={formData.admission_date}
                  onChange={handleChange}
                />
              </div>

              <div className="student-field">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                </select>
                <FieldError name="status" />
              </div>

              <div className="student-field">
                <label>Guardian Name</label>
                <input
                  name="guardian_name"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  maxLength="100"
                />
              </div>

              <div className="student-field">
                <label>Guardian Phone</label>
                <input
                  name="guardian_phone"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  maxLength="11"
                  className={errors.guardian_phone ? 'input-error' : ''}
                />
                <FieldError name="guardian_phone" />
              </div>

              <div className="student-field full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="student-form-actions">
              <button
                type="button"
                className="student-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="student-save-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Student'
                    : 'Save Student'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Student List */}
      <div className="student-list-card">

        <div className="student-list-heading">
          <div>
            <h2>Student List</h2>
            <p>Total Students: {students.length}</p>
          </div>

          <input
            type="text"
            className="student-search"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="student-empty">
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="student-empty">
            {error
              ? 'Unable to display students.'
              : 'No matching students found.'}
          </div>
        ) : (
          <div className="student-table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Code</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Roll</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.student_id}>
                    <td>{student.student_id}</td>
                    <td>{student.student_code}</td>
                    <td>{student.full_name}</td>
                    <td>{student.gender || 'N/A'}</td>
                    <td>{student.phone || 'N/A'}</td>
                    <td>{student.email || 'N/A'}</td>
                    <td>{student.class_id || 'N/A'}</td>
                    <td>{student.section_id || 'N/A'}</td>
                    <td>{student.roll_number || 'N/A'}</td>
                    <td>{student.status || 'N/A'}</td>
                    <td>
                      <div className="student-action-buttons">
                        <button
                          className="student-edit-btn"
                          onClick={() => editStudent(student)}
                        >
                          Edit
                        </button>

                        <button
                          className="student-delete-btn"
                          onClick={() => deleteStudent(student.student_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}

export default Students
