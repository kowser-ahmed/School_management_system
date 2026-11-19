
import { useEffect, useState } from 'react'
import API from '../api/axios'

function StudentResult() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [studentId, setStudentId] = useState('')

  const fetchResults = async () => {
    if (!studentId) {
      setMessage('Please enter your Student ID.')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      setResults([])

      const response = await API.get(`/results/student/${studentId}`)

      const data = response.data.data || []
      const publishedResults = data.filter(
        (result) => result.result_status === 'published'
      )

      setResults(publishedResults)

      if (publishedResults.length === 0) {
        setMessage('No published results found.')
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to load results.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Student Result View</h2>

      <div>
        <label>Student ID: </label>
        <input
          type="number"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Enter Student ID"
        />

        <button onClick={fetchResults} disabled={loading}>
          {loading ? 'Loading...' : 'View Result'}
        </button>
      </div>

      {message && <p>{message}</p>}

      {results.length > 0 && (
        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th>Exam</th>
              <th>Subject</th>
              <th>Marks</th>
              <th>Grade</th>
              <th>Grade Point</th>
            </tr>
          </thead>

          <tbody>
            {results.map((result) => (
              <tr key={result.result_id}>
                <td>{result.exam_name}</td>
                <td>{result.subject_name}</td>
                <td>{result.marks}</td>
                <td>{result.grade || 'Not calculated'}</td>
                <td>{result.grade_point ?? 'Not calculated'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default StudentResult
