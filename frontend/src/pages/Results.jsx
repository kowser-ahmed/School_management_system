
import { useEffect, useMemo, useState } from 'react'
import API from '../api/axios'

function Results() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({
    marks: '',
    grade: '',
    grade_point: '',
    remarks: ''
  })

  const loadResults = async () => {
    try {
      setLoading(true)
      setMessage('')

      const response = await API.get('/results')
      setResults(response.data.data || [])
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to load results.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  const filteredResults = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    if (!keyword) return results

    return results.filter(item =>
      [
        item.full_name,
        item.roll_number,
        item.exam_name,
        item.subject_name,
        item.grade
      ].some(value =>
        String(value ?? '').toLowerCase().includes(keyword)
      )
    )
  }, [results, search])

  const startEditing = (item) => {
    setEditingId(item.result_id)
    setEditData({
      marks: item.marks ?? '',
      grade: item.grade ?? '',
      grade_point: item.grade_point ?? '',
      remarks: item.remarks ?? ''
    })
    setMessage('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData({
      marks: '',
      grade: '',
      grade_point: '',
      remarks: ''
    })
  }

  const handleSave = async (item) => {
    if (
      editData.marks === '' ||
      !Number.isFinite(Number(editData.marks)) ||
      Number(editData.marks) < 0
    ) {
      setMessage('Please enter valid marks.')
      return
    }

    if (
      editData.grade_point !== '' &&
      (!Number.isFinite(Number(editData.grade_point)) ||
        Number(editData.grade_point) < 0)
    ) {
      setMessage('Please enter a valid grade point.')
      return
    }

    try {
      await API.put(`/results/${item.result_id}`, {
        exam_id: item.exam_id,
        student_id: item.student_id,
        subject_id: item.subject_id,
        marks: Number(editData.marks),
        grade: editData.grade || null,
        grade_point:
          editData.grade_point === ''
            ? null
            : Number(editData.grade_point),
        remarks: editData.remarks || null
      })

      setMessage('Result updated successfully.')
      cancelEditing()
      await loadResults()
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to update result.'
      )
    }
  }

  const handleDelete = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this result?')) {
      return
    }

    try {
      await API.delete(`/results/${resultId}`)
      setMessage('Result deleted successfully.')
      await loadResults()
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to delete result.'
      )
    }
  }

  if (loading) {
    return (
      <div className="dashboard-content">
        <p>Loading results...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-section-heading">
        <div>
          <h2>Results Management</h2>
          <p>View, search and manage student examination results.</p>
        </div>
      </div>

      {message && (
        <div className="dashboard-card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}
        >
          <h3>Student Results ({filteredResults.length})</h3>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student, roll, exam or subject..."
            style={{
              padding: '10px 12px',
              minWidth: '250px',
              maxWidth: '100%'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll</th>
                <th>Exam</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Grade Point</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                    No results found.
                  </td>
                </tr>
              ) : (
                filteredResults.map(item => (
                  <tr key={item.result_id}>
                    <td>{item.full_name}</td>
                    <td>{item.roll_number}</td>
                    <td>{item.exam_name}</td>
                    <td>{item.subject_name}</td>

                    {editingId === item.result_id ? (
                      <>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={editData.marks}
                            onChange={e =>
                              setEditData({
                                ...editData,
                                marks: e.target.value
                              })
                            }
                            style={{ width: '75px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editData.grade}
                            onChange={e =>
                              setEditData({
                                ...editData,
                                grade: e.target.value
                              })
                            }
                            style={{ width: '65px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editData.grade_point}
                            onChange={e =>
                              setEditData({
                                ...editData,
                                grade_point: e.target.value
                              })
                            }
                            style={{ width: '75px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editData.remarks}
                            onChange={e =>
                              setEditData({
                                ...editData,
                                remarks: e.target.value
                              })
                            }
                            style={{ width: '100px' }}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleSave(item)}>
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            style={{ marginLeft: '6px' }}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.marks}</td>
                        <td>{item.grade || '-'}</td>
                        <td>
                          {item.grade_point == null
                            ? '-'
                            : Number(item.grade_point).toFixed(2)}
                        </td>
                        <td>{item.remarks || '-'}</td>
                        <td>
                          <button onClick={() => startEditing(item)}>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.result_id)}
                            style={{ marginLeft: '6px' }}
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={loadResults}
          style={{ marginTop: '20px' }}
        >
          Refresh Results
        </button>
      </div>
    </div>
  )
}

export default Results
