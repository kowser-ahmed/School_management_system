
import { useEffect, useState } from 'react'
import API from '../api/axios'

function ResultPublication() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchExams = async () => {
    try {
      const response = await API.get('/exams')
      setExams(response.data.data || [])
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to load exams.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const handlePublication = async (examId, action) => {
    const actionText = action === 'publish' ? 'publish' : 'unpublish'

    if (!window.confirm(`Are you sure you want to ${actionText} this result?`)) {
      return
    }

    try {
      setMessage('')

      await API.put(`/exams/${examId}/${action}`)

      setMessage(
        action === 'publish'
          ? 'Result published successfully.'
          : 'Result unpublished successfully.'
      )

      await fetchExams()
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Publication action failed.'
      )
    }
  }

  if (loading) {
    return <p>Loading exams...</p>
  }

  return (
    <div>
      <h2>Result Publication</h2>

      {message && <p>{message}</p>}

      {exams.length === 0 ? (
        <p>No exams found.</p>
      ) : (
        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Academic Year</th>
              <th>Result Status</th>
              <th>Published At</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {exams.map((exam) => (
              <tr key={exam.exam_id}>
                <td>{exam.exam_name}</td>
                <td>{exam.academic_year}</td>

                <td>
                  {exam.result_status || 'draft'}
                </td>

                <td>
                  {exam.published_at
                    ? new Date(exam.published_at).toLocaleString()
                    : 'Not published'}
                </td>

                <td>
                  {exam.result_status === 'published' ? (
                    <button
                      onClick={() =>
                        handlePublication(exam.exam_id, 'unpublish')
                      }
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handlePublication(exam.exam_id, 'publish')
                      }
                    >
                      Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ResultPublication
