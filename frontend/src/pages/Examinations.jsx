
import React, { useEffect, useState } from 'react'
import API from '../api/axios'

const Examinations = () => {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    exam_name: '',
    class_id: '',
    academic_year: new Date().getFullYear().toString(),
    start_date: '',
    end_date: '',
    status: 'scheduled',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [examResponse, classResponse] = await Promise.all([
        API.get('/exams'),
        API.get('/classes'),
      ])

      setExams(examResponse.data.data || [])
      setClasses(classResponse.data.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load examinations. Please check API permissions.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      const response = await API.post('/exams', {
        ...form,
        class_id: Number(form.class_id),
      })

      setMessage(response.data.message || 'Examination created successfully!')

      setForm({
        exam_name: '',
        class_id: '',
        academic_year: new Date().getFullYear().toString(),
        start_date: '',
        end_date: '',
        status: 'scheduled',
      })

      loadData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create examination.'
      )
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this examination?'
    )

    if (!confirmed) return

    try {
      await API.delete(`/exams/${id}`)
      setMessage('Examination deleted successfully!')
      loadData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to delete examination.'
      )
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Examinations Management</h2>
      <p>Create and manage school examinations.</p>

      {message && (
        <p style={{ color: 'green' }}>{message}</p>
      )}

      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '25px',
        }}
      >
        <h3>Create New Examination</h3>

        <div style={{ marginBottom: '12px' }}>
          <label>Exam Name</label>
          <input
            type="text"
            name="exam_name"
            value={form.exam_name}
            onChange={handleChange}
            placeholder="Enter exam name"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Class</label>
          <select
            name="class_id"
            value={form.class_id}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="">Select Class</option>
            {classes.map((item) => (
              <option key={item.class_id} value={item.class_id}>
                {item.class_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Academic Year</label>
          <input
            type="text"
            name="academic_year"
            value={form.academic_year}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Start Date</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>End Date</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button type="submit" style={buttonStyle}>
          Create Examination
        </button>
      </form>

      <h3>Examination List</h3>

      {loading ? (
        <p>Loading examinations...</p>
      ) : exams.length === 0 ? (
        <p>No examinations found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>ID</th>
                <th style={cellStyle}>Exam Name</th>
                <th style={cellStyle}>Class ID</th>
                <th style={cellStyle}>Academic Year</th>
                <th style={cellStyle}>Start Date</th>
                <th style={cellStyle}>End Date</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {exams.map((exam) => (
                <tr key={exam.exam_id}>
                  <td style={cellStyle}>{exam.exam_id}</td>
                  <td style={cellStyle}>{exam.exam_name}</td>
                  <td style={cellStyle}>{exam.class_id}</td>
                  <td style={cellStyle}>{exam.academic_year}</td>
                  <td style={cellStyle}>
                    {exam.start_date?.slice(0, 10) || '-'}
                  </td>
                  <td style={cellStyle}>
                    {exam.end_date?.slice(0, 10) || '-'}
                  </td>
                  <td style={cellStyle}>{exam.status}</td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => handleDelete(exam.exam_id)}
                      style={{
                        ...buttonStyle,
                        background: '#dc3545',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px',
  marginTop: '5px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  boxSizing: 'border-box',
}

const buttonStyle = {
  padding: '10px 18px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  background: '#fff',
}

const cellStyle = {
  border: '1px solid #ddd',
  padding: '10px',
  textAlign: 'left',
}

export default Examinations
