
import React, { useEffect, useState } from 'react'
import API from '../api/axios'
import './Examinations.css'
import './ExamModules.css'

const Examinations = () => {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    exam_name: '',
    class_id: '',
    subject_id: '',
    section_id: '',
    academic_year: new Date().getFullYear().toString(),
    start_date: '',
    end_date: '',
    status: 'scheduled',
  })

  // Load exams, classes, subjects and sections
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        examResponse,
        classResponse,
        subjectResponse,
        sectionResponse
      ] = await Promise.all([
        API.get('/exams'),
        API.get('/classes'),
        API.get('/subjects'),
        API.get('/sections')
      ])

      setExams(examResponse.data.data || [])
      setClasses(classResponse.data.data || [])
      setSubjects(subjectResponse.data.data || [])
      setSections(sectionResponse.data.data || [])

    } catch (err) {
      console.error('Load Examination Error:', err)

      setError(
        err.response?.data?.message ||
        'Failed to load examination data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter subjects by selected class
  const filteredSubjects = subjects.filter(
    item => String(item.class_id) === String(form.class_id)
  )

  // Filter sections by selected class
  const filteredSections = sections.filter(
    item => String(item.class_id) === String(form.class_id)
  )

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'class_id') {
      setForm(prev => ({
        ...prev,
        class_id: value,
        subject_id: '',
        section_id: ''
      }))
      return
    }

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  // Create examination
  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')

    if (!form.exam_name.trim()) {
      setError('Exam name is required.')
      return
    }

    if (!form.class_id) {
      setError('Please select a class.')
      return
    }

    if (!form.subject_id) {
      setError('Please select a subject.')
      return
    }

    if (!form.section_id) {
      setError('Please select a section.')
      return
    }

    if (!form.academic_year.trim()) {
      setError('Academic year is required.')
      return
    }

    if (!form.start_date || !form.end_date) {
      setError('Start date and end date are required.')
      return
    }

    if (form.end_date < form.start_date) {
      setError('End date cannot be before start date.')
      return
    }

    try {
      setSubmitting(true)

      // Only existing exam table fields are saved.
      // Subject and section are not stored in the database.
      const response = await API.post('/exams', {
        exam_name: form.exam_name,
        class_id: Number(form.class_id),
        academic_year: form.academic_year,
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status
      })

      setMessage(
        response.data.message ||
        'Examination created successfully!'
      )

      setForm({
        exam_name: '',
        class_id: '',
        subject_id: '',
        section_id: '',
        academic_year: new Date().getFullYear().toString(),
        start_date: '',
        end_date: '',
        status: 'scheduled',
      })

      await loadData()

    } catch (err) {
      console.error('Create Examination Error:', err)

      setError(
        err.response?.data?.message ||
        'Failed to create examination.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Delete examination
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this examination?'
    )

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      await API.delete(`/exams/${id}`)

      setMessage('Examination deleted successfully!')

      await loadData()

    } catch (err) {
      console.error('Delete Examination Error:', err)

      setError(
        err.response?.data?.message ||
        'Failed to delete examination.'
      )
    }
  }

  return (
    <div className="examinations-page">

      <div className="exam-page-header">
        <h2>Examinations Management</h2>
        <p>
          Create, organize and manage school examinations.
        </p>
      </div>

      {message && (
        <div className="exam-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="exam-alert error">
          {error}
        </div>
      )}

      {/* Create Examination Form */}
      <div className="exam-card">

        <h3>Create New Examination</h3>

        <form onSubmit={handleSubmit}>

          <div className="exam-form-grid">

            <div className="exam-form-group">
              <label>Exam Name *</label>

              <input
                type="text"
                name="exam_name"
                value={form.exam_name}
                onChange={handleChange}
                placeholder="Enter exam name"
                required
              />
            </div>

            {/* Class Dropdown */}
            <div className="exam-form-group">
              <label>Class *</label>

              <select
                name="class_id"
                value={form.class_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Class</option>

                {classes.map(item => (
                  <option
                    key={item.class_id}
                    value={item.class_id}
                  >
                    {item.class_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Dropdown */}
            <div className="exam-form-group">
              <label>Subject *</label>

              <select
                name="subject_id"
                value={form.subject_id}
                onChange={handleChange}
                disabled={!form.class_id}
                required
              >
                <option value="">Select Subject</option>

                {filteredSubjects.map(item => (
                  <option
                    key={item.subject_id}
                    value={item.subject_id}
                  >
                    {item.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Dropdown */}
            <div className="exam-form-group">
              <label>Section *</label>

              <select
                name="section_id"
                value={form.section_id}
                onChange={handleChange}
                disabled={!form.class_id}
                required
              >
                <option value="">Select Section</option>

                {filteredSections.map(item => (
                  <option
                    key={item.section_id}
                    value={item.section_id}
                  >
                    {item.section_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="exam-form-group">
              <label>Academic Year *</label>

              <input
                type="text"
                name="academic_year"
                value={form.academic_year}
                onChange={handleChange}
                placeholder="Example: 2026"
                required
              />
            </div>

            <div className="exam-form-group">
              <label>Start Date *</label>

              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="exam-form-group">
              <label>End Date *</label>

              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                min={form.start_date || undefined}
                required
              />
            </div>

            <div className="exam-form-group">
              <label>Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            className="exam-primary-btn"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : '+ Create Examination'}
          </button>

        </form>
      </div>

      {/* Examination List */}
      <div className="exam-list-header">
        <h3>Examination List</h3>
      </div>

      {loading ? (

        <div className="exam-loading">
          Loading examinations...
        </div>

      ) : exams.length === 0 ? (

        <div className="exam-empty">
          No examinations found.
          Create your first examination above.
        </div>

      ) : (

        <div className="exam-table-wrapper">

          <table className="exam-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Exam Name</th>
                <th>Class</th>
                <th>Academic Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {exams.map(exam => {

                const selectedClass = classes.find(
                  item =>
                    Number(item.class_id) === Number(exam.class_id)
                )

                const className =
                  exam.class_name ||
                  selectedClass?.class_name ||
                  '-'

                return (
                  <tr key={exam.exam_id}>

                    <td>{exam.exam_id}</td>
                    <td>{exam.exam_name}</td>
                    <td>{className}</td>
                    <td>{exam.academic_year}</td>

                    <td>
                      {exam.start_date
                        ? String(exam.start_date).slice(0, 10)
                        : '-'}
                    </td>

                    <td>
                      {exam.end_date
                        ? String(exam.end_date).slice(0, 10)
                        : '-'}
                    </td>

                    <td>
                      <span className={`exam-status ${exam.status}`}>
                        {exam.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="exam-delete-btn"
                        onClick={() => handleDelete(exam.exam_id)}
                      >
                        Delete
                      </button>
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

export default Examinations
