const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const studentModel = require('../models/studentModel')

const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController')

// Mock response object
const createResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.body = data
      return this
    }
  }
  return res
}

// Reset mock methods before each test
beforeEach(() => {
  studentModel.getAllStudents = async () => []
  studentModel.getStudentById = async () => null
  studentModel.createStudent = async () => 1
  studentModel.updateStudent = async () => 1
  studentModel.deleteStudent = async () => 1
})

// 1. GET ALL STUDENTS
test('getAllStudents - should return student list', async () => {
  studentModel.getAllStudents = async () => [
    { student_id: 1, full_name: 'Rahim Ahmed' }
  ]

  const res = createResponse()
  await getAllStudents({}, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.length, 1)
})

test('getAllStudents - should handle database error', async () => {
  studentModel.getAllStudents = async () => {
    throw new Error('Database error')
  }

  const res = createResponse()
  await getAllStudents({}, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// 2. GET STUDENT BY ID
test('getStudentById - should return student when found', async () => {
  studentModel.getStudentById = async () => ({
    student_id: 1,
    full_name: 'Rahim Ahmed'
  })

  const req = { params: { id: '1' } }
  const res = createResponse()

  await getStudentById(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.full_name, 'Rahim Ahmed')
})

test('getStudentById - should return 404 when student not found', async () => {
  studentModel.getStudentById = async () => null

  const req = { params: { id: '999' } }
  const res = createResponse()

  await getStudentById(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Student not found')
})

// 3. CREATE STUDENT
test('createStudent - should create student with valid name', async () => {
  const req = {
    body: {
      student_code: 'STU001',
      full_name: 'Karim Ahmed'
    }
  }

  const res = createResponse()
  await createStudent(req, res)

  assert.equal(res.statusCode, 201)
  assert.equal(res.body.student_id, 1)
})

test('createStudent - should reject missing student name', async () => {
  const req = {
    body: {
      student_code: 'STU001'
    }
  }

  const res = createResponse()
  await createStudent(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'Student name is required')
})

// 4. UPDATE STUDENT
test('updateStudent - should update existing student', async () => {
  studentModel.updateStudent = async () => 1

  const req = {
    params: { id: '1' },
    body: {
      student_code: 'STU001',
      full_name: 'Updated Student'
    }
  }

  const res = createResponse()
  await updateStudent(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('updateStudent - should return 404 for missing student', async () => {
  studentModel.updateStudent = async () => 0

  const req = {
    params: { id: '999' },
    body: {
      student_code: 'STU999',
      full_name: 'Unknown Student'
    }
  }

  const res = createResponse()
  await updateStudent(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Student not found')
})

// 5. DELETE STUDENT
test('deleteStudent - should delete existing student', async () => {
  studentModel.deleteStudent = async () => 1

  const req = { params: { id: '1' } }
  const res = createResponse()

  await deleteStudent(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('deleteStudent - should return 404 when student does not exist', async () => {
  studentModel.deleteStudent = async () => 0

  const req = { params: { id: '999' } }
  const res = createResponse()

  await deleteStudent(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Student not found')
})

// 6. ADDITIONAL TESTS AFTER BLACK BOX TESTING
test('createStudent - should reject empty student name', async () => {
  const req = {
    body: {
      student_code: 'STU001',
      full_name: ''
    }
  }

  const res = createResponse()
  await createStudent(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'Student name is required')
})

test('createStudent - should handle database error', async () => {
  studentModel.createStudent = async () => {
    throw new Error('Database error')
  }

  const req = {
    body: {
      student_code: 'STU002',
      full_name: 'Test Student'
    }
  }

  const res = createResponse()
  await createStudent(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

test('getStudentById - should handle database error', async () => {
  studentModel.getStudentById = async () => {
    throw new Error('Database error')
  }

  const req = { params: { id: '1' } }
  const res = createResponse()

  await getStudentById(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

test('updateStudent - should handle database error', async () => {
  studentModel.updateStudent = async () => {
    throw new Error('Database error')
  }

  const req = {
    params: { id: '1' },
    body: {
      student_code: 'STU001',
      full_name: 'Updated Student'
    }
  }

  const res = createResponse()
  await updateStudent(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

test('deleteStudent - should handle database error', async () => {
  studentModel.deleteStudent = async () => {
    throw new Error('Database error')
  }

  const req = { params: { id: '1' } }
  const res = createResponse()

  await deleteStudent(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})