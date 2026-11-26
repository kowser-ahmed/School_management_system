
import { useState, useEffect } from 'react'
import API from '../api/axios'
import './ExamModules.css'

function ExamSchedule() {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [schedules, setSchedules] = useState([])

  const initialForm = {
    exam_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    room_number: ''
  }

  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDropdownData()
    fetchSchedules()
  }, [])

  const fetchDropdownData = async () => {
    try {
      const [examRes, classRes, sectionRes, subjectRes] =
        await Promise.all([
          API.get('/exams'),
          API.get('/classes'),
          API.get('/sections'),
          API.get('/subjects')
        ])

      setExams(examRes.data.data || [])
      setClasses(classRes.data.data || [])
      setSections(sectionRes.data.data || [])
      setSubjects(subjectRes.data.data || [])
    } catch (error) {
      console.error('Dropdown loading error:', error)
      setMessage('Failed to load dropdown data.')
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await API.get('/exam-schedules')
      setSchedules(response.data.data || [])
    } catch (error) {
      console.error('Schedule loading error:', error)
      setMessage('Failed to load exam schedules.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleExamChange = (e) => {
    const examId = e.target.value
    const selectedExam = exams.find(
      item => String(item.exam_id) === String(examId)
    )

    setForm(prev => ({
      ...prev,
      exam_id: examId,
      class_id: selectedExam ? String(selectedExam.class_id) : '',
      section_id: '',
      subject_id: ''
    }))
  }

  const handleClassChange = (e) => {
    const classId = e.target.value

    setForm(prev => ({
      ...prev,
      class_id: classId,
      section_id: '',
      subject_id: ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!form.exam_id || !form.class_id || !form.subject_id) {
      setMessage('Please select examination, class and subject.')
      return
    }

    if (!form.section_id) {
      setMessage('Please select a section.')
      return
    }

    if (form.start_time >= form.end_time) {
      setMessage('End time must be later than start time.')
      return
    }

    try {
      setLoading(true)

      await API.post('/exam-schedules', {
        exam_id: Number(form.exam_id),
        subject_id: Number(form.subject_id),
        exam_date: form.exam_date,
        start_time: form.start_time,
        end_time: form.end_time,
        room_number: form.room_number
      })

      setMessage(
        'Exam schedule created successfully. Section was selected but is not stored in the database.'
      )

      setForm(initialForm)
      await fetchSchedules()
    } catch (error) {
      console.error('Create schedule error:', error)

      setMessage(
        error.response?.data?.message ||
        'Failed to create exam schedule.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return
    }

    try {
      await API.delete(`/exam-schedules/${id}`)
      setMessage('Schedule deleted successfully.')
      await fetchSchedules()
    } catch (error) {
      console.error('Delete schedule error:', error)
      setMessage('Failed to delete schedule.')
    }
  }

  const filteredSections = sections.filter(
    item => String(item.class_id) === String(form.class_id)
  )

  const filteredSubjects = subjects.filter(
    item => String(item.class_id) === String(form.class_id)
  )

  return (
    <div className="dashboard-content">

      <div className="dashboard-section-heading">
        <div>
          <h2>Exam Schedule Management</h2>
          <p>Create and manage examination schedules.</p>
        </div>
      </div>

      {message && <p>{message}</p>}

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h3>Create Exam Schedule</h3>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            <div>
              <label>Examination</label>
              <select
                name="exam_id"
                value={form.exam_id}
                onChange={handleExamChange}
                required
              >
                <option value="">Select Examination</option>
                {exams.map(exam => (
                  <option key={exam.exam_id} value={exam.exam_id}>
                    {exam.exam_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Class</label>
              <select
                name="class_id"
                value={form.class_id}
                onChange={handleClassChange}
                required
              >
                <option value="">Select Class</option>
                {classes.map(item => (
                  <option key={item.class_id} value={item.class_id}>
                    {item.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Section</label>
              <select
                name="section_id"
                value={form.section_id}
                onChange={handleChange}
                required
                disabled={!form.class_id}
              >
                <option value="">Select Section</option>
                {filteredSections.map(item => (
                  <option key={item.section_id} value={item.section_id}>
                    {item.section_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Subject</label>
              <select
                name="subject_id"
                value={form.subject_id}
                onChange={handleChange}
                required
                disabled={!form.class_id}
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map(item => (
                  <option key={item.subject_id} value={item.subject_id}>
                    {item.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Exam Date</label>
              <input
                type="date"
                name="exam_date"
                value={form.exam_date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Start Time</label>
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>End Time</label>
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Room Number</label>
              <input
                type="text"
                name="room_number"
                value={form.room_number}
                onChange={handleChange}
                placeholder="Enter room number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '20px' }}
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </form>
      </div>

      <div
        className="dashboard-card"
        style={{ padding: '24px', marginTop: '24px' }}
      >
        <h3>Exam Schedule List</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Examination</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Room</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="8">No exam schedules found.</td>
                </tr>
              ) : (
                schedules.map(item => (
                  <tr key={item.schedule_id}>
                    <td>{item.exam_name}</td>
                    <td>{item.class_name}</td>
                    <td>{item.subject_name}</td>
                    <td>{item.exam_date?.slice(0, 10)}</td>
                    <td>{item.start_time}</td>
                    <td>{item.end_time}</td>
                    <td>{item.room || '-'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.schedule_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ExamSchedule
