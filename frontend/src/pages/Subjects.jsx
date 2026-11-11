
import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Subjects.css'

const initialForm = {
  subject_name: '',
  subject_code: '',
  class_id: '',
}

function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')

  // Fetch all subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/subjects')
      setSubjects(response.data.data || [])
    } catch (err) {
      console.error('Fetch subjects error:', err)
      setError('Unable to load subjects. Please check the backend server.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch classes for the class selection dropdown
  const fetchClasses = async () => {
    try {
      const response = await API.get('/classes')
      setClasses(response.data.data || [])
    } catch (err) {
      console.error('Fetch classes error:', err)
    }
  }

  useEffect(() => {
    fetchSubjects()
    fetchClasses()
  }, [])

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })

    setFormError('')
  }

  // Validate subject form
  const validateForm = () => {
    if (!formData.subject_name.trim()) {
      return 'Subject name is required.'
    }

    if (formData.subject_name.trim().length > 100) {
      return 'Subject name cannot exceed 100 characters.'
    }

    if (formData.subject_code.trim().length > 50) {
      return 'Subject code cannot exceed 50 characters.'
    }

    if (
      formData.class_id &&
      (!Number.isInteger(Number(formData.class_id)) ||
        Number(formData.class_id) <= 0)
    ) {
      return 'Please select a valid class.'
    }

    return ''
  }

  // Reset form
  const resetForm = () => {
    setFormData(initialForm)
    setEditingId(null)
    setShowForm(false)
    setFormError('')
  }

  // Add or update subject
  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationMessage = validateForm()

    if (validationMessage) {
      setFormError(validationMessage)
      return
    }

    const payload = {
      subject_name: formData.subject_name.trim(),
      subject_code: formData.subject_code.trim() || null,
      class_id: formData.class_id
        ? Number(formData.class_id)
        : null,
    }

    try {
      setSaving(true)
      setFormError('')

      if (editingId) {
        await API.put(`/subjects/${editingId}`, payload)
        alert('Subject updated successfully!')
      } else {
        await API.post('/subjects', payload)
        alert('Subject added successfully!')
      }

      resetForm()
      await fetchSubjects()
    } catch (err) {
      console.error('Save subject error:', err)

      setFormError(
        err.response?.data?.message ||
        'Failed to save subject. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Load subject information into the form
  const editSubject = (item) => {
    setEditingId(item.subject_id)

    setFormData({
      subject_name: item.subject_name || '',
      subject_code: item.subject_code || '',
      class_id: item.class_id ? String(item.class_id) : '',
    })

    setFormError('')
    setShowForm(true)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete subject
  const deleteSubject = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this subject?'
    )

    if (!confirmed) return

    try {
      await API.delete(`/subjects/${id}`)

      alert('Subject deleted successfully!')
      await fetchSubjects()
    } catch (err) {
      console.error('Delete subject error:', err)

      alert(
        err.response?.data?.message ||
        'Failed to delete subject. It may be linked to another record.'
      )
    }
  }

  // Search subjects
  const filteredSubjects = subjects.filter((item) => {
    const query = search.toLowerCase()

    return (
      String(item.subject_id).includes(query) ||
      (item.subject_name || '').toLowerCase().includes(query) ||
      (item.subject_code || '').toLowerCase().includes(query) ||
      String(item.class_id || '').includes(query)
    )
  })

  // Get class name using class ID
  const getClassName = (classId) => {
    if (!classId) return 'Not assigned'

    const selectedClass = classes.find(
      (item) => String(item.class_id) === String(classId)
    )

    return selectedClass
      ? selectedClass.class_name
      : `Class ID: ${classId}`
  }

  return (
    <div className="dashboard-content">
      <div className="section-title subject-heading">
        <div>
          <h2>Subject Management</h2>
          <p>Manage subjects and their assigned classes</p>
        </div>

        <button
          className="subject-primary-btn"
          onClick={() => {
            if (showForm && !editingId) {
              resetForm()
            } else {
              setFormData(initialForm)
              setEditingId(null)
              setFormError('')
              setShowForm(true)
            }
          }}
        >
          + Add Subject
        </button>
      </div>

      {showForm && (
        <div className="content-card subject-form-card">
          <h3>{editingId ? 'Update Subject' : 'Add New Subject'}</h3>

          <form onSubmit={handleSubmit} className="subject-form">
            {formError && (
              <p className="subject-error subject-full-width">
                {formError}
              </p>
            )}

            <div className="subject-form-group">
              <label htmlFor="subject_name">Subject Name *</label>

              <input
                id="subject_name"
                name="subject_name"
                value={formData.subject_name}
                onChange={handleChange}
                placeholder="e.g. Mathematics"
                maxLength={100}
                required
              />
            </div>

            <div className="subject-form-group">
              <label htmlFor="subject_code">Subject Code</label>

              <input
                id="subject_code"
                name="subject_code"
                value={formData.subject_code}
                onChange={handleChange}
                placeholder="e.g. MATH101"
                maxLength={50}
              />
            </div>

            <div className="subject-form-group">
              <label htmlFor="class_id">Assigned Class</label>

              <select
                id="class_id"
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
              >
                <option value="">No class assigned</option>

                {classes.map((item) => (
                  <option
                    key={item.class_id}
                    value={item.class_id}
                  >
                    {item.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="subject-form-actions subject-full-width">
              <button
                type="submit"
                className="subject-primary-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Subject'
                    : 'Save Subject'}
              </button>

              <button
                type="button"
                className="subject-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card subject-list-card">
        <div className="subject-table-header">
          <div>
            <h3>Subject List</h3>
            <p>Total Subjects: {subjects.length}</p>
          </div>

          <input
            className="subject-search"
            type="search"
            placeholder="Search subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="subject-message">Loading subjects...</p>
        ) : error ? (
          <div className="subject-message subject-error">
            {error}
            <button onClick={fetchSubjects}>Retry</button>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <p className="subject-message">
            {subjects.length === 0
              ? 'No subjects found. Add your first subject.'
              : 'No matching subjects found.'}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="subject-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject Name</th>
                  <th>Subject Code</th>
                  <th>Class</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.map((item) => (
                  <tr key={item.subject_id}>
                    <td>{item.subject_id}</td>
                    <td>{item.subject_name}</td>
                    <td>{item.subject_code || 'N/A'}</td>
                    <td>{getClassName(item.class_id)}</td>

                    <td>
                      <div className="subject-action-buttons">
                        <button
                          className="subject-edit-btn"
                          onClick={() => editSubject(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="subject-delete-btn"
                          onClick={() =>
                            deleteSubject(item.subject_id)
                          }
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

export default Subjects
