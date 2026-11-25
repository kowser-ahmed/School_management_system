
import { useCallback, useEffect, useState } from 'react'
import API from '../api/axios'
import './leave.css'

function Leave({ user }) {
  const role = user?.role?.toLowerCase() || ''

  const isAdmin = role === 'admin'
  const canApply = ['admin', 'teacher', 'staff'].includes(role)

  const tabs = isAdmin
    ? [
        { id: 'all', label: 'All Leaves' },
        { id: 'my', label: 'My Leaves' }
      ]
    : [
        { id: 'my', label: 'My Leaves' }
      ]

  const [activeTab, setActiveTab] = useState(
    isAdmin ? 'all' : 'my'
  )

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    leave_type: 'Casual Leave',
    start_date: '',
    end_date: '',
    reason: ''
  })

  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const today = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  // Format date returned by MySQL / API
  const formatDate = value => {
    if (!value) return 'N/A'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${day}-${month}-${year}`
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const endpoint = activeTab === 'all'
        ? '/leaves'
        : '/leaves/my'

      const response = await API.get(endpoint)

      setData(response.data.data || [])
    } catch (err) {
      console.error('Leave fetch error:', err)

      setError(
        err.response?.data?.message ||
        'Unable to load leave applications.'
      )
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (canApply) {
      fetchData()
    }
  }, [fetchData, canApply])

  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      String(value ?? '')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  )

  const openAddForm = () => {
    setEditingId(null)
    setFormError('')

    setFormData({
      leave_type: 'Casual Leave',
      start_date: today(),
      end_date: today(),
      reason: ''
    })

    setShowForm(true)
  }

  const openEditForm = item => {
    if (item.status !== 'pending') {
      setError('Only pending leave applications can be updated.')
      return
    }

    setEditingId(item.leave_id)
    setFormError('')

    setFormData({
      leave_type: item.leave_type || 'Casual Leave',
      start_date: item.start_date
        ? new Date(item.start_date).getFullYear() +
          '-' +
          String(new Date(item.start_date).getMonth() + 1).padStart(2, '0') +
          '-' +
          String(new Date(item.start_date).getDate()).padStart(2, '0')
        : '',
      end_date: item.end_date
        ? new Date(item.end_date).getFullYear() +
          '-' +
          String(new Date(item.end_date).getMonth() + 1).padStart(2, '0') +
          '-' +
          String(new Date(item.end_date).getDate()).padStart(2, '0')
        : '',
      reason: item.reason || ''
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

    setSaving(true)
    setFormError('')

    if (formData.end_date < formData.start_date) {
      setFormError('End date cannot be before start date.')
      setSaving(false)
      return
    }

    try {
      if (editingId) {
        await API.put(`/leaves/${editingId}`, formData)
      } else {
        await API.post('/leaves', formData)
      }

      setShowForm(false)
      setEditingId(null)

      await fetchData()
    } catch (err) {
      console.error('Leave save error:', err)

      setFormError(
        err.response?.data?.message ||
        'Unable to save leave application.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async item => {
    if (item.status !== 'pending') {
      setError('Only pending leave applications can be deleted.')
      return
    }

    if (!window.confirm(
      'Are you sure you want to delete this leave application?'
    )) {
      return
    }

    try {
      setError('')

      await API.delete(`/leaves/${item.leave_id}`)

      await fetchData()
    } catch (err) {
      console.error('Leave delete error:', err)

      setError(
        err.response?.data?.message ||
        'Unable to delete leave application.'
      )
    }
  }

  const handleStatusChange = async (item, status) => {
    if (!window.confirm(
      `Are you sure you want to ${status} this leave application?`
    )) {
      return
    }

    try {
      setError('')

      await API.patch(`/leaves/${item.leave_id}/status`, {
        status
      })

      await fetchData()
    } catch (err) {
      console.error('Leave status update error:', err)

      setError(
        err.response?.data?.message ||
        `Unable to ${status} leave application.`
      )
    }
  }

  const formatLabel = key =>
    key.replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())

  if (!canApply) {
    return (
      <div className="dashboard-content">
        <div className="content-card">
          <p className="leave-message leave-error">
            You do not have permission to access Leave Management.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">

      {/* ================= HEADING ================= */}

      <div className="section-title leave-heading">
        <div>
          <h2>Leave Management</h2>

          <p>
            {isAdmin
              ? 'Manage and review employee leave applications'
              : 'Apply for leave and manage your leave applications'}
          </p>
        </div>
      </div>

      {/* ================= TABS ================= */}

      <div className="leave-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`leave-tab ${
              activeTab === tab.id ? 'active' : ''
            }`}
            onClick={() => {
              setActiveTab(tab.id)
              setSearch('')
              setError('')
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= LEAVE TABLE ================= */}

      <div className="content-card leave-list-card">

        <div className="leave-table-header">
          <div>
            <h3>
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h3>

            <p>Total Records: {data.length}</p>
          </div>

          <input
            className="leave-search"
            type="search"
            placeholder="Search leave applications..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          {canApply && (
            <button
              className="leave-action-button"
              onClick={openAddForm}
            >
              + Apply for Leave
            </button>
          )}
        </div>

        {loading ? (
          <p className="leave-message">
            Loading leave applications...
          </p>
        ) : error ? (
          <div className="leave-message leave-error">
            {error}

            <button onClick={fetchData}>
              Retry
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <p className="leave-message">
            No leave applications found.
          </p>
        ) : (
          <div className="leave-table-wrapper">
            <table className="leave-table">

              <thead>
                <tr>
                  {isAdmin && activeTab === 'all' && (
                    <th>Employee</th>
                  )}

                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map(item => (
                  <tr key={item.leave_id}>

                    {isAdmin && activeTab === 'all' && (
                      <td>
                        <strong>{item.full_name || 'N/A'}</strong>
                        <br />
                        {item.email || ''}
                      </td>
                    )}

                    <td>{item.leave_type || 'N/A'}</td>

                    <td>{formatDate(item.start_date)}</td>

                    <td>{formatDate(item.end_date)}</td>

                    <td>{item.reason || 'N/A'}</td>

                    <td>
                      <span
                        className={`leave-status ${
                          item.status || 'pending'
                        }`}
                      >
                        {item.status || 'pending'}
                      </span>
                    </td>

                    <td className="leave-row-actions">

                      {!isAdmin && item.status === 'pending' && (
                        <>
                          <button
                            className="leave-edit-button"
                            onClick={() => openEditForm(item)}
                          >
                            Edit
                          </button>

                          <button
                            className="leave-delete-button"
                            onClick={() => handleDelete(item)}
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {isAdmin && activeTab === 'all' &&
                        item.status === 'pending' && (
                          <>
                            <button
                              className="leave-approve-button"
                              onClick={() =>
                                handleStatusChange(item, 'approved')
                              }
                            >
                              Approve
                            </button>

                            <button
                              className="leave-reject-button"
                              onClick={() =>
                                handleStatusChange(item, 'rejected')
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}

                      {item.status !== 'pending' && (
                        <span>N/A</span>
                      )}

                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* ================= LEAVE FORM MODAL ================= */}

      {showForm && (
        <div className="leave-modal-backdrop">

          <div className="leave-modal">

            <div className="leave-modal-header">
              <h3>
                {editingId ? 'Update Leave Application' : 'Apply for Leave'}
              </h3>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="leave-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="leave-form-group">
                <label htmlFor="leave_type">
                  Leave Type
                </label>

                <select
                  id="leave_type"
                  value={formData.leave_type}
                  onChange={event =>
                    handleFormChange('leave_type', event.target.value)
                  }
                  required
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="leave-form-group">
                <label htmlFor="start_date">
                  Start Date
                </label>

                <input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={event =>
                    handleFormChange('start_date', event.target.value)
                  }
                  required
                />
              </div>

              <div className="leave-form-group">
                <label htmlFor="end_date">
                  End Date
                </label>

                <input
                  id="end_date"
                  type="date"
                  min={formData.start_date}
                  value={formData.end_date}
                  onChange={event =>
                    handleFormChange('end_date', event.target.value)
                  }
                  required
                />
              </div>

              <div className="leave-form-group">
                <label htmlFor="reason">
                  Reason
                </label>

                <textarea
                  id="reason"
                  placeholder="Enter your reason for leave..."
                  value={formData.reason}
                  onChange={event =>
                    handleFormChange('reason', event.target.value)
                  }
                  required
                />
              </div>

              {formError && (
                <p className="leave-error">
                  {formError}
                </p>
              )}

              <div className="leave-form-actions">

                <button
                  type="button"
                  className="leave-cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="leave-action-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update'
                      : 'Submit Application'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Leave
