
import { useState, useEffect } from 'react'
import API from '../api/axios'
import './ExamModules.css'

function GradeGPA() {
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [examId, setExamId] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      const response = await API.get('/exams')
      setExams(response.data.data || [])
    } catch (error) {
      console.error('Exam loading error:', error)
      setMessage('Failed to load examinations.')
      setMessageType('error')
    }
  }

  const calculateGrade = (marks) => {
    const value = Number(marks)

    if (value >= 80) return { grade: 'A+', point: 5.00 }
    if (value >= 70) return { grade: 'A', point: 4.00 }
    if (value >= 60) return { grade: 'A-', point: 3.50 }
    if (value >= 50) return { grade: 'B', point: 3.00 }
    if (value >= 40) return { grade: 'C', point: 2.00 }
    if (value >= 33) return { grade: 'D', point: 1.00 }

    return { grade: 'F', point: 0.00 }
  }

  const loadResults = async (preserveMessage = false) => {
    if (!examId) {
      setMessage('Please select an examination.')
      setMessageType('error')
      return false
    }

    try {
      const response = await API.get(`/results/exam/${examId}`)
      const data = response.data.data || []

      const updatedResults = data.map(item => {
        const calculated = calculateGrade(item.marks)

        return {
          ...item,
          calculated_grade: calculated.grade,
          calculated_point: calculated.point
        }
      })

      setResults(updatedResults)

      if (!preserveMessage) {
        setMessage('')
        setMessageType('')
      }

      return true
    } catch (error) {
      console.error('Result loading error:', error)

      setMessage(
        error.response?.data?.message || 'Failed to load results.'
      )
      setMessageType('error')

      return false
    }
  }

  const saveGrades = async () => {
    if (results.length === 0) {
      setMessage('No results available to save.')
      setMessageType('error')
      return
    }

    try {
      setSaving(true)
      setMessage('')
      setMessageType('')

      for (const item of results) {
        await API.put(`/results/${item.result_id}`, {
          exam_id: item.exam_id,
          student_id: item.student_id,
          subject_id: item.subject_id,
          marks: Number(item.marks),
          grade: item.calculated_grade,
          grade_point: item.calculated_point,
          remarks: item.calculated_grade === 'F' ? 'Fail' : 'Pass'
        })
      }

      await loadResults(true)

      setMessage('Grades & GPA saved successfully!')
      setMessageType('success')
    } catch (error) {
      console.error('Grade saving error:', error)

      setMessage(
        error.response?.data?.message || 'Failed to save grades.'
      )
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-content">

      <div className="dashboard-section-heading">
        <div>
          <h2>Grade & GPA Calculation</h2>
          <p>Calculate and manage student grades.</p>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '6px',
            backgroundColor:
              messageType === 'success' ? '#d4edda' : '#f8d7da',
            color:
              messageType === 'success' ? '#155724' : '#721c24',
            border:
              messageType === 'success'
                ? '1px solid #c3e6cb'
                : '1px solid #f5c6cb',
            fontWeight: '600'
          }}
        >
          {message}
        </div>
      )}

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h3>Select Examination</h3>

        <select
          value={examId}
          onChange={e => {
            setExamId(e.target.value)
            setResults([])
            setMessage('')
            setMessageType('')
          }}
        >
          <option value="">Select Examination</option>

          {exams.map(exam => (
            <option key={exam.exam_id} value={exam.exam_id}>
              {exam.exam_name}
            </option>
          ))}
        </select>

        <button
          onClick={() => loadResults()}
          style={{ marginLeft: '12px' }}
        >
          Load Results
        </button>
      </div>

      <div
        className="dashboard-card"
        style={{ padding: '24px', marginTop: '24px' }}
      >
        <h3>Student Grade Sheet</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Grade Point</th>
              </tr>
            </thead>

            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    No results loaded.
                  </td>
                </tr>
              ) : (
                results.map(item => (
                  <tr key={item.result_id}>
                    <td>{item.full_name || 'N/A'}</td>

                    <td>
                      {item.roll_number ??
                        item.roll_no ??
                        item.roll ??
                        'Not available'}
                    </td>

                    <td>{item.subject_name || 'N/A'}</td>

                    <td>{item.marks}</td>

                    <td>{item.calculated_grade}</td>

                    <td>
                      {Number(item.calculated_point).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={saveGrades}
          disabled={results.length === 0 || saving}
          style={{
            marginTop: '20px',
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Grades & GPA'}
        </button>
      </div>
    </div>
  )
}

export default GradeGPA
