
import { useEffect, useState } from 'react'
import API from '../api/axios'
import './staffs.css'

function Staff() {
  const initialFormData = {
    employee_code: '',
    full_name: '',
    gender: 'male',
    phone: '',
    email: '',
    designation: '',
    joining_date: new Date().toISOString().split('T')[0],
    salary: '',
    status: 'active',
    user_id: '',
  }

  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState(initialFormData)

  // Fetch all staff
  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/staff')
      setStaff(response.data.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load staff. Please check the backend server.'
      )
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
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

  // Open add form
  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  // Edit staff
  const editStaff = (item) => {
    setEditingId(item.staff_id)

    setFormData({
      employee_code: item.employee_code || '',
      full_name: item.full_name || '',
      gender: item.gender || 'male',
      phone: item.phone || '',
      email: item.email || '',
      designation: item.designation || '',
      joining_date: item.joining_date
        ? String(item.joining_date).split('T')[0]
        : '',
      salary: item.salary ?? '',
      status: (item.status || 'active').toLowerCase(),
      user_id: item.user_id ?? '',
    })

    setErrors({})
    setShowForm(true)
    setError('')
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
      newErrors.full_name = 'Staff Name is required.'
    } else if (formData.full_name.trim().length > 100) {
      newErrors.full_name =
        'Staff Name cannot exceed 100 characters.'
    }

    const phoneRegex = /^01[3-9]\d{8}$/

    if (formData.phone && !phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 11-digit Bangladesh phone number.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (formData.email && !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address.'
    }

    if (
      formData.gender &&
      !['male', 'female', 'other'].includes(formData.gender)
    ) {
      newErrors.gender = 'Please select a valid gender.'
    }

    if (!['active', 'inactive'].includes(formData.status)) {
      newErrors.status = 'Please select a valid status.'
    }

    if (formData.salary !== '') {
      const salary = Number(formData.salary)

      if (!Number.isFinite(salary) || salary <= 0 || salary > 99999999.99) {
        newErrors.salary = 'Enter a valid positive salary.'
      }
    }

    if (formData.user_id !== '') {
      const userId = Number(formData.user_id)

      if (!Number.isInteger(userId) || userId <= 0) {
        newErrors.user_id = 'User ID must be a positive whole number.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Save staff
  const saveStaff = async (e) => {
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
        employee_code: formData.employee_code.trim(),
        full_name: formData.full_name.trim(),
        gender: formData.gender,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        designation: formData.designation.trim() || null,
        joining_date: formData.joining_date || null,
        salary: formData.salary !== '' ? Number(formData.salary) : null,
        status: formData.status,
        user_id: formData.user_id !== '' ? Number(formData.user_id) : null,
      }

      if (editingId !== null) {
        await API.put(`/staff/${editingId}`, payload)
        setSuccess('Staff updated successfully!')
      } else {
        await API.post('/staff', payload)
        setSuccess('Staff added successfully!')
      }

      setFormData({ ...initialFormData })
      setEditingId(null)
      setShowForm(false)
      setErrors({})

      await fetchStaff()
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to save staff.'

      if (err.response?.status === 409) {
        if (message.toLowerCase().includes('employee code')) {
          setErrors((prev) => ({
            ...prev,
            employee_code: message,
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

  // Delete staff
  const deleteStaff = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this staff member?'
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await API.delete(`/staff/${id}`)

      setSuccess('Staff deleted successfully!')
      await fetchStaff()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to delete staff.'
      )
    }
  }

  // Search staff
  const query = search.trim().toLowerCase()

  const exactIdMatches = /^\d+$/.test(query)
    ? staff.filter((item) => String(item.staff_id) === query)
    : []

  const filteredStaff =
    exactIdMatches.length > 0
      ? exactIdMatches
      : staff.filter((item) => {
          if (!query) return true

          const fields = [
            item.staff_id,
            item.employee_code,
            item.full_name,
            item.gender,
            item.phone,
            item.email,
            item.designation,
            item.salary,
            item.status,
          ]

          return fields.some((value) =>
            String(value ?? '').toLowerCase().includes(query)
          )
        })

  // Reusable field error
  const FieldError = ({ name }) => {
    if (!errors[name]) return null

    return (
      <span className="staff-field-error" role="alert">
        {errors[name]}
      </span>
    )
  }

  return (
    <div className="staff-page">

      <div className="staff-page-header">
        <div>
          <h1>Staff Management</h1>
          <p>Manage all registered staff members</p>
        </div>

        <button
          className="staff-add-btn"
          onClick={showForm ? resetForm : openAddForm}
          disabled={saving}
        >
          + Add Staff
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="staff-alert error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="staff-alert success" role="status">
          {success}
        </div>
      )}

      {/* Staff Form */}
      {showForm && (
        <div className="staff-form-card">

          <div className="staff-form-heading">
            <h2>
              {editingId !== null ? 'Update Staff' : 'Add New Staff'}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              ✕
            </button>
          </div>

          <form onSubmit={saveStaff} noValidate>
            <div className="staff-form-grid">

              <div className="staff-field">
                <label>Employee Code *</label>
                <input
                  name="employee_code"
                  value={formData.employee_code}
                  onChange={handleChange}
                  placeholder="e.g. STF001"
                  maxLength="30"
                  className={errors.employee_code ? 'input-error' : ''}
                  aria-invalid={!!errors.employee_code}
                />
                <FieldError name="employee_code" />
              </div>

              <div className="staff-field">
                <label>Full Name *</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter staff name"
                  maxLength="100"
                  className={errors.full_name ? 'input-error' : ''}
                  aria-invalid={!!errors.full_name}
                />
                <FieldError name="full_name" />
              </div>

              <div className="staff-field">
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

              <div className="staff-field">
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

              <div className="staff-field">
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

              <div className="staff-field">
                <label>Designation</label>
                <input
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Office Assistant"
                  maxLength="100"
                />
              </div>

              <div className="staff-field">
                <label>Joining Date</label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                />
              </div>

              <div className="staff-field">
                <label>Salary</label>
                <input
                  type="number"
                  name="salary"
                  min="0.01"
                  step="0.01"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter salary"
                  className={errors.salary ? 'input-error' : ''}
                />
                <FieldError name="salary" />
              </div>

              <div className="staff-field">
                <label>User ID</label>
                <input
                  type="number"
                  name="user_id"
                  min="1"
                  step="1"
                  value={formData.user_id}
                  onChange={handleChange}
                  placeholder="Optional User ID"
                  className={errors.user_id ? 'input-error' : ''}
                />
                <FieldError name="user_id" />
              </div>

              <div className="staff-field">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <FieldError name="status" />
              </div>

            </div>

            <div className="staff-form-actions">
              <button
                type="button"
                className="staff-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="staff-save-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Staff'
                    : 'Save Staff'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div className="staff-list-card">

        <div className="staff-list-heading">
          <div>
            <h2>Staff List</h2>
            <p>Total Staff: {staff.length}</p>
          </div>

          <input
            type="text"
            className="staff-search"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="staff-empty">
            Loading staff...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="staff-empty">
            {error
              ? 'Unable to display staff.'
              : 'No matching staff found.'}
          </div>
        ) : (
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Joining Date</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map((item) => (
                  <tr key={item.staff_id}>
                    <td>{item.staff_id}</td>
                    <td>{item.employee_code}</td>
                    <td>{item.full_name}</td>
                    <td>{item.gender || 'N/A'}</td>
                    <td>{item.phone || 'N/A'}</td>
                    <td>{item.email || 'N/A'}</td>
                    <td>{item.designation || 'N/A'}</td>
                    <td>
                      {item.joining_date
                        ? String(item.joining_date).split('T')[0]
                        : 'N/A'}
                    </td>
                    <td>{item.salary ?? 'N/A'}</td>
                    <td>{item.status || 'N/A'}</td>

                    <td>
                      <div className="staff-action-buttons">
                        <button
                          className="staff-edit-btn"
                          onClick={() => editStaff(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="staff-delete-btn"
                          onClick={() => deleteStaff(item.staff_id)}
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

export default Staff
