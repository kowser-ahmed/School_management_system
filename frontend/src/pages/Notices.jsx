
import { useEffect, useState } from 'react'
import API from '../api/axios'
import './Notices.css'

function Notices({ user }) {
  const role = user?.role?.toLowerCase() || ''
  const isAdmin = role === 'admin'

  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_role: 'all',
    status: 'published'
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // ================= FETCH NOTICES =================

  const fetchNotices = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/notices')
      setNotices(response.data.data || [])
    } catch (err) {
      console.error('Notice fetch error:', err)
      setError(
        err.response?.data?.message ||
        'Unable to load notices.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  // ================= SEARCH =================

  const filteredNotices = notices.filter(notice =>
    [
      notice.title,
      notice.content,
      notice.target_role,
      notice.status
    ].some(value =>
      String(value ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )

  // ================= FORM HANDLERS =================

  const openAddForm = () => {
    setEditingId(null)
    setFormError('')

    setFormData({
      title: '',
      content: '',
      target_role: 'all',
      status: 'published'
    })

    setShowForm(true)
  }

  const openEditForm = notice => {
    setEditingId(notice.notice_id)
    setFormError('')

    setFormData({
      title: notice.title || '',
      content: notice.content || '',
      target_role: notice.target_role || 'all',
      status: notice.status || 'published'
    })

    setShowForm(true)
  }

  const handleFormChange = (name, value) => {
    setFormData(previous => ({
      ...previous,
      [name]: value
    }))
  }

  const handleSubmit = async event => {
    event.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError('Title and content are required.')
      return
    }

    try {
      setSaving(true)
      setFormError('')

      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        target_role: formData.target_role,
        status: formData.status
      }

      if (editingId) {
        await API.put(`/notices/${editingId}`, payload)
      } else {
        await API.post('/notices', payload)
      }

      setShowForm(false)
      setEditingId(null)

      await fetchNotices()
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        'Unable to save this notice.'
      )
    } finally {
      setSaving(false)
    }
  }

  // ================= DELETE NOTICE =================

  const handleDelete = async notice => {
    if (!window.confirm(
      `Are you sure you want to delete "${notice.title}"?`
    )) {
      return
    }

    try {
      setError('')

      await API.delete(`/notices/${notice.notice_id}`)
      await fetchNotices()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete this notice.'
      )
    }
  }

  // ================= FORMAT DATE =================

  const formatDate = date => {
    if (!date) return 'N/A'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleString()
  }

  // ================= ACCESS CONTROL =================

  if (!user) {
    return (
      <div className="dashboard-content">
        <div className="content-card">
          <p className="notice-message">
            Please log in to view notices.
          </p>
        </div>
      </div>
    )
  }

  // ================= MAIN UI =================

  return (
    <div className="dashboard-content">

      <div className="section-title notice-heading">
        <div>
          <h2>Notice Management</h2>
          <p>
            {isAdmin
              ? 'Create and manage school announcements'
              : 'View school announcements and important updates'}
          </p>
        </div>
      </div>

      <div className="content-card notice-list-card">

        <div className="notice-table-header">
          <div>
            <h3>School Notices</h3>
            <p>Total Notices: {filteredNotices.length}</p>
          </div>

          <input
            className="notice-search"
            type="search"
            placeholder="Search notices..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          {isAdmin && (
            <button
              className="notice-action-button"
              onClick={openAddForm}
            >
              + Add New Notice
            </button>
          )}
        </div>

        {loading ? (
          <p className="notice-message">Loading notices...</p>
        ) : error ? (
          <div className="notice-message notice-error">
            {error}
            <button onClick={fetchNotices}>Retry</button>
          </div>
        ) : filteredNotices.length === 0 ? (
          <p className="notice-message">No notices found.</p>
        ) : (
          <div className="table-responsive">
            <table className="notice-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Content</th>
                  <th>Target Role</th>
                  <th>Publish Date</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {filteredNotices.map(notice => (
                  <tr key={notice.notice_id}>
                    <td className="notice-title-cell">
                      {notice.title}
                    </td>

                    <td className="notice-content-cell">
                      {notice.content}
                    </td>

                    <td>
                      {notice.target_role || 'all'}
                    </td>

                    <td>
                      {formatDate(notice.publish_date)}
                    </td>

                    <td>
                      <span
                        className={`notice-status ${
                          notice.status === 'published'
                            ? 'published'
                            : 'draft'
                        }`}
                      >
                        {notice.status}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="notice-row-actions">
                        <button
                          className="notice-edit-button"
                          onClick={() => openEditForm(notice)}
                        >
                          Edit
                        </button>

                        <button
                          className="notice-delete-button"
                          onClick={() => handleDelete(notice)}
                        >
                          Delete
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

      {/* ================= NOTICE FORM MODAL ================= */}

      {showForm && isAdmin && (
        <div className="notice-modal-backdrop">
          <div className="notice-modal">

            <div className="notice-modal-header">
              <h3>
                {editingId ? 'Update Notice' : 'Create New Notice'}
              </h3>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="notice-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="notice-form-group">
                <label htmlFor="notice-title">Notice Title</label>

                <input
                  id="notice-title"
                  type="text"
                  placeholder="Enter notice title"
                  value={formData.title}
                  onChange={event =>
                    handleFormChange('title', event.target.value)
                  }
                  maxLength={200}
                  required
                />
              </div>

              <div className="notice-form-group">
                <label htmlFor="notice-content">Notice Content</label>

                <textarea
                  id="notice-content"
                  placeholder="Write notice details..."
                  value={formData.content}
                  onChange={event =>
                    handleFormChange('content', event.target.value)
                  }
                  rows={6}
                  required
                />
              </div>

              <div className="notice-form-group">
                <label htmlFor="notice-target">Target Role</label>

                <select
                  id="notice-target"
                  value={formData.target_role}
                  onChange={event =>
                    handleFormChange('target_role', event.target.value)
                  }
                >
                  <option value="all">Everyone</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="accountant">Accountant</option>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div className="notice-form-group">
                <label htmlFor="notice-status">Status</label>

                <select
                  id="notice-status"
                  value={formData.status}
                  onChange={event =>
                    handleFormChange('status', event.target.value)
                  }
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {formError && (
                <p className="notice-error">{formError}</p>
              )}

              <div className="notice-form-actions">
                <button
                  type="button"
                  className="notice-cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="notice-action-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Notice'
                      : 'Publish Notice'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Notices
