
import { useState, useEffect } from 'react'
import API from '../api/axios'

function MarksEntry() {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [message, setMessage] = useState('')

  const [filters, setFilters] = useState({
    exam_id: '',
    class_id: '',
    section_id: '',
    subject_id: ''
  })

  useEffect(() => {
    loadDropdowns()
  }, [])

  const loadDropdowns = async () => {
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

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const loadStudents = async () => {
    if (
      !filters.exam_id ||
      !filters.class_id ||
      !filters.section_id ||
      !filters.subject_id
    ) {
      setMessage('Please select all fields first.')
      return
    }

    try {
      const response = await API.get('/students', {
        params: {
          class_id: filters.class_id,
          section_id: filters.section_id
        }
      })

      const studentList = response.data.data || []
      setStudents(studentList)

      const initialMarks = {}

      studentList.forEach(student => {
        initialMarks[student.student_id] = {
          written_marks: '',
          mcq_marks: '',
          practical_marks: ''
        }
      })

      setMarks(initialMarks)
      setMessage('')
    } catch (error) {
      console.error('Student loading error:', error)
      setMessage('Failed to load students.')
    }
  }

  const handleMarkChange = (studentId, field, value) => {
    setMarks(previous => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        [field]: value
      }
    }))
  }

  const getTotal = (studentId) => {
    const studentMarks = marks[studentId] || {}

    return (
      Number(studentMarks.written_marks || 0) +
      Number(studentMarks.mcq_marks || 0) +
      Number(studentMarks.practical_marks || 0)
    )
  }

  const handleSaveMarks = async () => {
        for (const student of students) {
      const total = getTotal(student.student_id)

      if (total > 100) {
        setMessage(
          `${student.full_name} এর মোট নম্বর 100-এর বেশি হতে পারবে না।`
        )
        return
      }
    }
    try {
      const payload = students.map(student => ({
        student_id: student.student_id,
        exam_id: Number(filters.exam_id),
        subject_id: Number(filters.subject_id),
        written_marks: Number(
          marks[student.student_id]?.written_marks || 0
        ),
        mcq_marks: Number(
          marks[student.student_id]?.mcq_marks || 0
        ),
        practical_marks: Number(
          marks[student.student_id]?.practical_marks || 0
        )
      }))

      if (payload.length === 0) {
        setMessage('No students available.')
        return
      }

      for (const result of payload) {
  const totalMarks =
    result.written_marks +
    result.mcq_marks +
    result.practical_marks

  await API.post('/results', {
    exam_id: result.exam_id,
    student_id: result.student_id,
    subject_id: result.subject_id,
    marks: totalMarks,
    grade: null,
    grade_point: null,
    remarks: null
  })
}

      setMessage('Marks saved successfully.')
    } catch (error) {
      console.error('Save marks error:', error)
      setMessage(
        error.response?.data?.message ||
        'Failed to save marks. Check your backend API.'
      )
    }
  }

  return (
    <div className="dashboard-content">

      <div className="dashboard-section-heading">
        <div>
          <h2>Subject-wise Marks Entry</h2>
          <p>Enter and manage student examination marks.</p>
        </div>
      </div>

      {message && <p>{message}</p>}

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h3>Select Examination Details</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>

          <div>
            <label>Examination</label>
            <select name="exam_id" value={filters.exam_id}
              onChange={handleFilterChange}>
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
            <select name="class_id" value={filters.class_id}
              onChange={handleFilterChange}>
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
            <select name="section_id" value={filters.section_id}
              onChange={handleFilterChange}>
              <option value="">Select Section</option>
              {sections.map(item => (
                <option key={item.section_id} value={item.section_id}>
                  {item.section_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Subject</label>
            <select name="subject_id" value={filters.subject_id}
              onChange={handleFilterChange}>
              <option value="">Select Subject</option>
              {subjects.map(item => (
                <option key={item.subject_id} value={item.subject_id}>
                  {item.subject_name}
                </option>
              ))}
            </select>
          </div>

        </div>

        <button
          onClick={loadStudents}
          style={{ marginTop: '20px' }}
        >
          Load Students
        </button>
      </div>

      <div className="dashboard-card"
        style={{ padding: '24px', marginTop: '24px' }}>

        <h3>Student Marks List</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Written</th>
                <th>MCQ</th>
                <th>Practical</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6">No students loaded.</td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.student_id}>
                    <td>{student.student_id}</td>
                    <td>{student.full_name}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        value={
                          marks[student.student_id]?.written_marks ?? ''
                        }
                        onChange={e => handleMarkChange(
                          student.student_id,
                          'written_marks',
                          e.target.value
                        )}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        value={
                          marks[student.student_id]?.mcq_marks ?? ''
                        }
                        onChange={e => handleMarkChange(
                          student.student_id,
                          'mcq_marks',
                          e.target.value
                        )}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        value={
                          marks[student.student_id]?.practical_marks ?? ''
                        }
                        onChange={e => handleMarkChange(
                          student.student_id,
                          'practical_marks',
                          e.target.value
                        )}
                      />
                    </td>

                    <td>{getTotal(student.student_id)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleSaveMarks}
          disabled={students.length === 0}
          style={{ marginTop: '20px' }}
        >
          Save Marks
        </button>

      </div>
    </div>
  )
}

export default MarksEntry
