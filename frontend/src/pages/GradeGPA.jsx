
import { useState, useEffect } from 'react'
import API from '../api/axios'

function GradeGPA() {
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [examId, setExamId] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      const response = await API.get('/exams')
      setExams(response.data.data || [])
    } catch (error) {
      console.error(error)
      setMessage('Failed to load examinations.')
    }
  }

  const calculateGrade = (marks) => {
    if (marks >= 80) return { grade: 'A+', point: 5.00 }
    if (marks >= 70) return { grade: 'A', point: 4.00 }
    if (marks >= 60) return { grade: 'A-', point: 3.50 }
    if (marks >= 50) return { grade: 'B', point: 3.00 }
    if (marks >= 40) return { grade: 'C', point: 2.00 }
    if (marks >= 33) return { grade: 'D', point: 1.00 }

    return { grade: 'F', point: 0.00 }
  }

  const loadResults = async () => {
    if (!examId) {
      setMessage('Please select an examination.')
      return
    }

    try {
      const response = await API.get(`/results/exam/${examId}`)
      const data = response.data.data || []

      const updatedResults = data.map(item => {
        const calculated = calculateGrade(Number(item.marks))

        return {
          ...item,
          calculated_grade: calculated.grade,
          calculated_point: calculated.point
        }
      })

      setResults(updatedResults)
      setMessage('')
    } catch (error) {
      console.error(error)
      setMessage('Failed to load results.')
    }
  }

  const saveGrades = async () => {
    try {
      for (const item of results) {
        await API.put(`/results/${item.result_id}`, {
          exam_id: item.exam_id,
          student_id: item.student_id,
          subject_id: item.subject_id,
          marks: item.marks,
          grade: item.calculated_grade,
          grade_point: item.calculated_point,
          remarks: item.calculated_grade === 'F' ? 'Fail' : 'Pass'
        })
      }

      setMessage('Grades and GPA saved successfully.')
      loadResults()
    } catch (error) {
      console.error(error)
      setMessage(
        error.response?.data?.message || 'Failed to save grades.'
      )
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

      {message && <p>{message}</p>}

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h3>Select Examination</h3>

        <select
          value={examId}
          onChange={e => setExamId(e.target.value)}
        >
          <option value="">Select Examination</option>

          {exams.map(exam => (
            <option key={exam.exam_id} value={exam.exam_id}>
              {exam.exam_name}
            </option>
          ))}
        </select>

        <button onClick={loadResults} style={{ marginLeft: '12px' }}>
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
                  <td colSpan="6">No results loaded.</td>
                </tr>
              ) : (
                results.map(item => (
                  <tr key={item.result_id}>
                    <td>{item.full_name}</td>
                    <td>{item.roll_number}</td>
                    <td>{item.subject_name}</td>
                    <td>{item.marks}</td>
                    <td>{item.calculated_grade}</td>
                    <td>{item.calculated_point.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={saveGrades}
          disabled={results.length === 0}
          style={{ marginTop: '20px' }}
        >
          Save Grades & GPA
        </button>
      </div>
    </div>
  )
}

export default GradeGPA
