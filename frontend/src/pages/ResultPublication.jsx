
import { useEffect, useState } from 'react'
import API from '../api/axios'
import './ExamModules.css'

function ResultPublication() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState(null)

  const fetchExams = async () => {
    try {
      setError('')

      const response = await API.get('/exams')

      setExams(response.data.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load examinations.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const handlePublication = async (examId, action) => {
    const actionText =
      action === 'publish' ? 'publish' : 'unpublish'

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} this result?`
    )

    if (!confirmed) return

    try {
      setProcessingId(examId)
      setMessage('')
      setError('')

      const response = await API.put(
        `/exams/${examId}/${action}`
      )

      setMessage(
        response.data.message ||
        (
          action === 'publish'
            ? 'Result published successfully.'
            : 'Result unpublished successfully.'
        )
      )

      await fetchExams()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Publication action failed.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const getResultStatus = (status) => {
    if (status === 'published') {
      return 'Published'
    }

    if (status === 'completed') {
      return 'Draft'
    }

    return 'Not Ready'
  }

  if (loading) {
    return (
      <div className="exam-module-page">
        <h2>Result Publication</h2>
        <p>Loading examinations...</p>
      </div>
    )
  }

  return (
    <div className="exam-module-page">
      <h2>Result Publication</h2>

      <p>
        Manage examination results and publish completed results.
      </p>

      {message && (
        <p className="success-message">
          {message}
        </p>
      )}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {exams.length === 0 ? (
        <p>No examinations found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            border="1"
            cellPadding="10"
            cellSpacing="0"
            style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}
          >
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Class</th>
                <th>Academic Year</th>
                <th>Exam Status</th>
                <th>Result Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {exams.map((exam) => {
                const isPublished =
                  exam.status === 'published'

                const isCompleted =
                  exam.status === 'completed'

                const isProcessing =
                  processingId === exam.exam_id

                return (
                  <tr key={exam.exam_id}>
                    <td>{exam.exam_name || 'N/A'}</td>

                    <td>{exam.class_name || 'N/A'}</td>

                    <td>{exam.academic_year || 'N/A'}</td>

                    <td>
                      {exam.status
                        ? exam.status.charAt(0).toUpperCase() +
                          exam.status.slice(1)
                        : 'N/A'}
                    </td>

                    <td>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: isPublished
                            ? 'green'
                            : isCompleted
                              ? '#b7791f'
                              : '#666'
                        }}
                      >
                        {getResultStatus(exam.status)}
                      </span>
                    </td>

                    <td>
                      {isPublished ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handlePublication(
                              exam.exam_id,
                              'unpublish'
                            )
                          }
                        >
                          {isProcessing
                            ? 'Please wait...'
                            : 'Unpublish'}
                        </button>
                      ) : isCompleted ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handlePublication(
                              exam.exam_id,
                              'publish'
                            )
                          }
                        >
                          {isProcessing
                            ? 'Please wait...'
                            : 'Publish'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                        >
                          Complete Exam First
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ResultPublication
