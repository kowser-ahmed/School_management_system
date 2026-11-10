
import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Teachers.css'

const initialForm = {
  employee_code: '',
  full_name: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  joining_date: '',
  designation: '',
  salary: ''
}

function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState({})

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true)

      const response = await API.get('/teachers')
      setTeachers(response.data.data || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teachers.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: ''
    }))

    setError('')
    setSuccess('')
  }

  // Reset form
  const resetForm = () => {
    setFormData({ ...initialForm })
    setEditingId(null)
    setShowForm(false)
    setErrors({})
    setError('')
  }

  // Open add form
  const openAddForm = () => {
    resetForm()
    setShowForm(true)
    setSuccess('')
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {}

    if (!formData.employee_code.trim()) {
      newErrors.employee_code = 'Employee Code is required.'
    } else if (formData.employee_code.trim().length > 30) {
      newErrors.employee_code =
        'Employee Code cannot exceed 30 characters.'
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Teacher Name is required.'
    } else if (formData.full_name.trim().length > 100) {
      newErrors.full_name =
        'Teacher Name cannot exceed 100 characters.'
    }

    if (
      formData.gender &&
      !['male', 'female', 'other'].includes(formData.gender)
    ) {
      newErrors.gender = 'Please select a valid gender.'
    }

    const phoneRegex = /^01[3-9]\d{8}$/

if (
  formData.phone.trim() &&
  !phoneRegex.test(formData.phone.trim())
) {
  newErrors.phone =
    'Enter a valid 11-digit Bangladesh phone number.'
}

    if (formData.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailPattern.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.'
      }
    }

    if (formData.email.trim().length > 100) {
      newErrors.email = 'Email cannot exceed 100 characters.'
    }

    if (formData.designation.trim().length > 100) {
      newErrors.designation =
        'Designation cannot exceed 100 characters.'
    }

    if (
      formData.salary !== '' &&
      (
        !Number.isFinite(Number(formData.salary)) ||
        Number(formData.salary) < 0
      )
    ) {
      newErrors.salary =
        'Salary must be a valid non-negative number.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  // Add or update teacher
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (saving) return

    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    const payload = {
      employee_code: formData.employee_code.trim(),
      full_name: formData.full_name.trim(),
      gender: formData.gender || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      joining_date: formData.joining_date || null,
      designation: formData.designation.trim() || null,
      salary:
        formData.salary === ''
          ? null
          : Number(formData.salary)
    }

    try {
      setSaving(true)

      if (editingId !== null) {
        await API.put(`/teachers/${editingId}`, payload)
        setSuccess('Teacher updated successfully.')
      } else {
        await API.post('/teachers', payload)
        setSuccess('Teacher added successfully.')
      }

      setFormData({ ...initialForm })
      setEditingId(null)
      setShowForm(false)
      setErrors({})

      await fetchTeachers()
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to save teacher.'

      const lowerMessage = message.toLowerCase()

      // Show duplicate employee code error under Employee Code
      if (
        lowerMessage.includes('employee code') ||
        lowerMessage.includes('employee_code') ||
        lowerMessage.includes('duplicate entry')
      ) {
        setErrors((prev) => ({
          ...prev,
          employee_code: message
        }))
        setError('')
      } else if (
        lowerMessage.includes('full name') ||
        lowerMessage.includes('teacher name')
      ) {
        setErrors((prev) => ({
          ...prev,
          full_name: message
        }))
        setError('')
      } else {
        setError(message)
      }

      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Edit teacher
  const handleEdit = (teacher) => {
    setFormData({
      employee_code: teacher.employee_code || '',
      full_name: teacher.full_name || '',
      gender: teacher.gender || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      joining_date: teacher.joining_date
        ? String(teacher.joining_date).slice(0, 10)
        : '',
      designation: teacher.designation || '',
      salary: teacher.salary ?? ''
    })

    setEditingId(teacher.teacher_id)
    setShowForm(true)
    setErrors({})
    setError('')
    setSuccess('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete teacher
  const handleDelete = async (id) => {
    if (
      !window.confirm('Are you sure you want to delete this teacher?')
    ) {
      return
    }

    try {
      setError('')
      setSuccess('')

      await API.delete(`/teachers/${id}`)

      setSuccess('Teacher deleted successfully.')
      await fetchTeachers()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete teacher. This teacher may be linked to other records.'
      )
    }
  }

  // Search teachers
  const query = search.trim().toLowerCase()

  const exactIdMatches = /^\d+$/.test(query)
    ? teachers.filter(
        (teacher) => String(teacher.teacher_id) === query
      )
    : []

  const filteredTeachers =
    exactIdMatches.length > 0
      ? exactIdMatches
      : teachers.filter((teacher) => {
          if (!query) return true

          const fields = [
            teacher.teacher_id,
            teacher.employee_code,
            teacher.full_name,
            teacher.phone,
            teacher.email,
            teacher.designation
          ]

          return fields.some((value) =>
            String(value ?? '').toLowerCase().includes(query)
          )
        })

  // Reusable field error component
  const FieldError = ({ name }) => {
    if (!errors[name]) return null

    return (
      <span className="teacher-field-error" role="alert">
        {errors[name]}
      </span>
    )
  }

  return (
    <div className="teacher-page">

      {/* Header */}
      <div className="teacher-page-header">
        <div>
          <h1>Teacher Management</h1>
          <p>Manage your school's teaching staff.</p>
        </div>

        <button
          className="teacher-add-btn"
          onClick={showForm ? resetForm : openAddForm}
          disabled={saving}
        >
          + Add Teacher
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="teacher-alert error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="teacher-alert success" role="status">
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="teacher-form-card">

          <div className="teacher-form-heading">
            <h2>
              {editingId !== null ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="teacher-form-grid">

              {/* Employee Code */}
              <div className="teacher-field">
                <label>Employee Code *</label>
                <input
                  name="employee_code"
                  value={formData.employee_code}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="e.g. TCH001"
                  className={
                    errors.employee_code ? 'input-error' : ''
                  }
                  aria-invalid={!!errors.employee_code}
                />
                <FieldError name="employee_code" />
              </div>

              {/* Full Name */}
              <div className="teacher-field">
                <label>Full Name *</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Enter full name"
                  className={errors.full_name ? 'input-error' : ''}
                  aria-invalid={!!errors.full_name}
                />
                <FieldError name="full_name" />
              </div>

              {/* Gender */}
              <div className="teacher-field">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={errors.gender ? 'input-error' : ''}
                  aria-invalid={!!errors.gender}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <FieldError name="gender" />
              </div>

              {/* Phone */}
              <div className="teacher-field">
                <label>Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={11}
placeholder="01XXXXXXXXX"
                  className={errors.phone ? 'input-error' : ''}
                  aria-invalid={!!errors.phone}
                />
                <FieldError name="phone" />
              </div>

              {/* Email */}
              <div className="teacher-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="example@email.com"
                  className={errors.email ? 'input-error' : ''}
                  aria-invalid={!!errors.email}
                />
                <FieldError name="email" />
              </div>

              {/* Designation */}
              <div className="teacher-field">
                <label>Designation</label>
                <input
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Senior Teacher"
                  className={errors.designation ? 'input-error' : ''}
                  aria-invalid={!!errors.designation}
                />
                <FieldError name="designation" />
              </div>

              {/* Joining Date */}
              <div className="teacher-field">
                <label>Joining Date</label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                />
              </div>

              {/* Salary */}
              <div className="teacher-field">
                <label>Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter salary"
                  className={errors.salary ? 'input-error' : ''}
                  aria-invalid={!!errors.salary}
                />
                <FieldError name="salary" />
              </div>

              {/* Address */}
              <div className="teacher-field full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter full address"
                />
              </div>

            </div>

            <div className="teacher-form-actions">
              <button
                type="button"
                className="teacher-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="teacher-save-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Teacher'
                    : 'Save Teacher'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teacher List */}
      <div className="teacher-list-card">

        <div className="teacher-list-heading">
          <div>
            <h2>Teachers List</h2>
            <p>
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </p>
          </div>

          <input
            className="teacher-search"
            type="text"
            placeholder="Search by ID, name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="teacher-empty">
            Loading teachers...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="teacher-empty">
            {search.trim()
              ? 'No matching teachers found.'
              : 'No teachers available.'}
          </div>
        ) : (
          <div className="teacher-table-wrapper">

            <table className="teacher-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.teacher_id}>
                    <td>{teacher.teacher_id}</td>
                    <td>{teacher.employee_code}</td>
                    <td>{teacher.full_name}</td>
                    <td>{teacher.gender || '-'}</td>
                    <td>{teacher.phone || '-'}</td>
                    <td>{teacher.email || '-'}</td>
                    <td>{teacher.designation || '-'}</td>
                    <td>
                      {teacher.salary == null
                        ? '-'
                        : Number(teacher.salary).toLocaleString()}
                    </td>

                    <td>
                      <div className="teacher-action-buttons">
                        <button
                          className="teacher-edit-btn"
                          onClick={() => handleEdit(teacher)}
                        >
                          Edit
                        </button>

                        <button
                          className="teacher-delete-btn"
                          onClick={() => handleDelete(teacher.teacher_id)}
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

export default Teachers
