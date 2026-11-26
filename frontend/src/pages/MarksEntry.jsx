
import { useState, useEffect } from 'react'
import API from '../api/axios'
import './ExamModules.css'

function MarksEntry() {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [saving, setSaving] = useState(false)

  // Total marks = 100
  const MAX_MARKS = {
    written_marks: 60,
    mcq_marks: 20,
    practical_marks: 20
  }

  const [filters, setFilters] = useState({
    exam_id: '',
    class_id: '',
    subject_id: ''
  })

  useEffect(() => {
    loadDropdowns()
  }, [])

  const loadDropdowns = async () => {
    try {
      const [examRes, classRes, subjectRes] = await Promise.all([
        API.get('/exams'),
        API.get('/classes'),
        API.get('/subjects')
      ])

      setExams(examRes.data.data || [])
      setClasses(classRes.data.data || [])
      setSubjects(subjectRes.data.data || [])

    } catch (error) {
      console.error('Dropdown loading error:', error)
      setMessage('Failed to load dropdown data.')
      setMessageType('error')
    }
  }

  const selectedExam = exams.find(
    exam => String(exam.exam_id) === String(filters.exam_id)
  )

  const filteredClasses = classes.filter(
    item => String(item.class_id) === String(selectedExam?.class_id)
  )

  const filteredSubjects = subjects.filter(
    item => String(item.class_id) === String(filters.class_id)
  )

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    if (name === 'exam_id') {
      const selected = exams.find(
        exam => String(exam.exam_id) === String(value)
      )

      setFilters({
        exam_id: value,
        class_id: selected?.class_id
          ? String(selected.class_id)
          : '',
        subject_id: ''
      })
    } else if (name === 'class_id') {
      setFilters({
        ...filters,
        class_id: value,
        subject_id: ''
      })
    } else {
      setFilters({
        ...filters,
        [name]: value
      })
    }

    setStudents([])
    setMarks({})
    setMessage('')
    setMessageType('')
  }

  // Load all students from selected class
  const loadStudents = async () => {
    if (
      !filters.exam_id ||
      !filters.class_id ||
      !filters.subject_id
    ) {
      setMessage('Please select examination, class and subject.')
      setMessageType('error')
      return
    }

    if (String(filters.class_id) !== String(selectedExam?.class_id)) {
      setMessage('Selected class does not match the examination class.')
      setMessageType('error')
      return
    }

    try {
      setStudents([])
      setMarks({})
      setMessage('')
      setMessageType('')

      const response = await API.get('/students', {
        params: {
          class_id: filters.class_id
        }
      })

      const allStudents = response.data.data || []

      // Show all sections of selected class
      const studentList = allStudents.filter(student =>
        Number(student.class_id) === Number(filters.class_id)
      )

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

      setMessage(
        studentList.length > 0
          ? `${studentList.length} student(s) loaded successfully.`
          : 'No students found in the selected class.'
      )

      setMessageType(studentList.length > 0 ? 'success' : 'error')

    } catch (error) {
      console.error('Student loading error:', error)

      setStudents([])
      setMarks({})

      setMessage('Failed to load students.')
      setMessageType('error')
    }
  }

  // Handle marks input
  const handleMarkChange = (studentId, field, value) => {
    const maxMark = MAX_MARKS[field]

    if (value !== '' && Number(value) > maxMark) {
      setMessage(
        `${field.replace('_marks', '')} marks cannot exceed ${maxMark}.`
      )
      setMessageType('error')
      return
    }

    if (value !== '' && Number(value) < 0) {
      return
    }

    setMarks(previous => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        [field]: value
      }
    }))

    setMessage('')
    setMessageType('')
  }

  // Calculate total marks
  const getTotal = (studentId) => {
    const studentMarks = marks[studentId] || {}

    return (
      Number(studentMarks.written_marks || 0) +
      Number(studentMarks.mcq_marks || 0) +
      Number(studentMarks.practical_marks || 0)
    )
  }

  // Save marks
  const handleSaveMarks = async () => {
    if (!students.length) {
      setMessage('No students available.')
      setMessageType('error')
      return
    }

    if (
      !filters.exam_id ||
      !filters.class_id ||
      !filters.subject_id
    ) {
      setMessage('Please select examination, class and subject first.')
      setMessageType('error')
      return
    }

    if (String(filters.class_id) !== String(selectedExam?.class_id)) {
      setMessage('Selected class does not match the examination class.')
      setMessageType('error')
      return
    }

    for (const student of students) {
      const studentMarks = marks[student.student_id] || {}

      if (Number(student.class_id) !== Number(filters.class_id)) {
        setMessage(
          `${student.full_name} does not belong to the selected class.`
        )
        setMessageType('error')
        return
      }

      if (!student.section_id) {
        setMessage(
          `${student.full_name} has no section assigned. Cannot save marks.`
        )
        setMessageType('error')
        return
      }

      for (const field of Object.keys(MAX_MARKS)) {
        const rawValue = studentMarks[field]

        if (rawValue === '' || rawValue === undefined) {
          setMessage(
            `Please enter all marks for ${student.full_name}.`
          )
          setMessageType('error')
          return
        }

        const value = Number(rawValue)

        if (
          !Number.isFinite(value) ||
          value < 0 ||
          value > MAX_MARKS[field]
        ) {
          setMessage(
            `${student.full_name}: ${field.replace('_marks', '')} marks cannot exceed ${MAX_MARKS[field]}.`
          )
          setMessageType('error')
          return
        }
      }

      if (getTotal(student.student_id) > 100) {
        setMessage(`${student.full_name} total marks cannot exceed 100.`)
        setMessageType('error')
        return
      }
    }

    try {
      setSaving(true)
      setMessage('')
      setMessageType('')

      for (const student of students) {
        const totalMarks = getTotal(student.student_id)

        await API.post('/results', {
          exam_id: Number(filters.exam_id),
          student_id: Number(student.student_id),
          subject_id: Number(filters.subject_id),
          section_id: Number(student.section_id),
          marks: totalMarks,
          grade: null,
          grade_point: null,
          remarks: null
        })
      }

      setMessage('Marks saved successfully!')
      setMessageType('success')

    } catch (error) {
      console.error('Save marks error:', error)

      setMessage(
        error.response?.data?.message ||
        'Failed to save marks. Check your backend API.'
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
          <h2>Subject-wise Marks Entry</h2>
          <p>
            Enter marks for all students of the selected class.
          </p>
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
        <h3>Select Examination Details</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}
        >
          <div>
            <label>Examination</label>
            <select
              name="exam_id"
              value={filters.exam_id}
              onChange={handleFilterChange}
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
              value={filters.class_id}
              onChange={handleFilterChange}
              disabled={!filters.exam_id}
            >
              <option value="">Select Class</option>
              {filteredClasses.map(item => (
                <option key={item.class_id} value={item.class_id}>
                  {item.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Subject</label>
            <select
              name="subject_id"
              value={filters.subject_id}
              onChange={handleFilterChange}
              disabled={!filters.class_id}
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map(item => (
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
          disabled={
            !filters.exam_id ||
            !filters.class_id ||
            !filters.subject_id
          }
        >
          Load Students
        </button>
      </div>

      <div
        className="dashboard-card"
        style={{ padding: '24px', marginTop: '24px' }}
      >
        <h3>Student Marks List</h3>

        <p style={{ marginBottom: '15px' }}>
          Written: 60 | MCQ: 20 | Practical: 20 | Total: 100
        </p>

        <p style={{ marginBottom: '15px' }}>
          All sections of the selected class will be displayed together.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Section</th>
                <th>Roll Number</th>
                <th>Written (Max 60)</th>
                <th>MCQ (Max 20)</th>
                <th>Practical (Max 20)</th>
                <th>Total / 100</th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center' }}>
                    No students loaded.
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.student_id}>
                    <td>{student.student_id}</td>
                    <td>{student.full_name}</td>
                    <td>{student.section_name || student.section_id || '-'}</td>
                    <td>
                      {student.roll_number ??
                        student.roll_no ??
                        'Not available'}
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        step="1"
                        value={marks[student.student_id]?.written_marks ?? ''}
                        onChange={e =>
                          handleMarkChange(
                            student.student_id,
                            'written_marks',
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="1"
                        value={marks[student.student_id]?.mcq_marks ?? ''}
                        onChange={e =>
                          handleMarkChange(
                            student.student_id,
                            'mcq_marks',
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="1"
                        value={marks[student.student_id]?.practical_marks ?? ''}
                        onChange={e =>
                          handleMarkChange(
                            student.student_id,
                            'practical_marks',
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <strong>
                        {getTotal(student.student_id)} / 100
                      </strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleSaveMarks}
          disabled={students.length === 0 || saving}
          style={{
            marginTop: '20px',
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Marks'}
        </button>
      </div>
    </div>
  )
}

export default MarksEntry
