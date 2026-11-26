
import { useState } from 'react'
import API from '../api/axios'
import './ExamModules.css'

function StudentResult() {
  const [searchTerm, setSearchTerm] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Search students
  const searchStudents = async () => {
    if (!searchTerm.trim()) {
      setMessage('Please enter Student ID, Name, Email or Roll Number.')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      setStudents([])
      setSelectedStudent(null)
      setResults([])

      const response = await API.get(
        `/results/search?q=${encodeURIComponent(searchTerm.trim())}`
      )

      const data = response.data.data || []

      setStudents(data)

      if (data.length === 0) {
        setMessage('No student found.')
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to search students.'
      )
    } finally {
      setLoading(false)
    }
  }

  // View selected student's published results
  const viewStudentResult = async (student) => {
    try {
      setLoading(true)
      setMessage('')
      setSelectedStudent(student)
      setResults([])

      const response = await API.get(
        `/results/student/${student.student_id}`
      )

      const data = response.data.data || []

      setResults(data)

      if (data.length === 0) {
        setMessage('No published results found for this student.')
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to load student results.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="exam-module-page">
      <h2>Student Result View</h2>

      <div>
        <label>Search Student: </label>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') searchStudents()
          }}
          placeholder="Enter ID, Name, Email, Phone or Roll Number"
        />

        <button onClick={searchStudents} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {message && <p>{message}</p>}

      {/* Student Search Results */}
      {students.length > 0 && (
        <>
          <h3>Student List</h3>

          <table border="1" cellPadding="10" cellSpacing="0">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Class</th>
                <th>Section</th>
                <th>Roll</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.student_id}>
                  <td>{student.student_id}</td>
                  <td>{student.student_code || '-'}</td>
                  <td>{student.full_name}</td>
                  <td>{student.email || '-'}</td>
                  <td>{student.phone || '-'}</td>
                  <td>{student.class_name || '-'}</td>
                  <td>{student.section_name || '-'}</td>
                  <td>{student.roll_number ?? '-'}</td>
                  <td>
                    <button
                      onClick={() => viewStudentResult(student)}
                      disabled={loading}
                    >
                      View Result
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Selected Student Details */}
      {selectedStudent && (
        <>
          <h3>Selected Student Details</h3>

          <p><strong>Name:</strong> {selectedStudent.full_name}</p>
          <p><strong>Student ID:</strong> {selectedStudent.student_id}</p>
          <p><strong>Student Code:</strong> {selectedStudent.student_code || '-'}</p>
          <p><strong>Email:</strong> {selectedStudent.email || '-'}</p>
          <p><strong>Phone:</strong> {selectedStudent.phone || '-'}</p>
          <p><strong>Class:</strong> {selectedStudent.class_name || '-'}</p>
          <p><strong>Section:</strong> {selectedStudent.section_name || '-'}</p>
          <p><strong>Roll Number:</strong> {selectedStudent.roll_number ?? '-'}</p>
        </>
      )}

      {/* Published Results */}
      {results.length > 0 && (
        <>
          <h3>Published Results</h3>

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
        </>
      )}
    </div>
  )
}

export default StudentResult
