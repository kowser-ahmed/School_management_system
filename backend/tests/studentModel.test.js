
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const db = require('../config/db')
const studentModel = require('../models/studentModel')

// Mock database query
let mockResult

beforeEach(() => {
  mockResult = null

  db.query = async () => mockResult
})

// 1. GET ALL STUDENTS

test('getAllStudents - should return all students', async () => {
  mockResult = [[
    { student_id: 1, full_name: 'Rahim Ahmed' },
    { student_id: 2, full_name: 'Karim Ahmed' }
  ]]

  const result = await studentModel.getAllStudents()

  assert.equal(result.length, 2)
  assert.equal(result[0].full_name, 'Rahim Ahmed')
})

test('getAllStudents - should return empty array', async () => {
  mockResult = [[]]

  const result = await studentModel.getAllStudents()

  assert.deepEqual(result, [])
})

// 2. GET STUDENT BY ID

test('getStudentById - should return student by ID', async () => {
  mockResult = [[
    { student_id: 1, full_name: 'Rahim Ahmed' }
  ]]

  const result = await studentModel.getStudentById(1)

  assert.equal(result.student_id, 1)
  assert.equal(result.full_name, 'Rahim Ahmed')
})

test('getStudentById - should return undefined for missing ID', async () => {
  mockResult = [[]]

  const result = await studentModel.getStudentById(999)

  assert.equal(result, undefined)
})

// 3. CREATE STUDENT

test('createStudent - should return inserted student ID', async () => {
  mockResult = [{ insertId: 5 }]

  const result = await studentModel.createStudent({
    student_code: 'STU005',
    full_name: 'Test Student'
  })

  assert.equal(result, 5)
})

test('createStudent - should use default active status', async () => {
  let capturedValues = []

  db.query = async (query, values) => {
    capturedValues = values
    return [{ insertId: 6 }]
  }

  await studentModel.createStudent({
    student_code: 'STU006',
    full_name: 'New Student'
  })

  assert.equal(capturedValues[14], 'active')
})

// 4. UPDATE STUDENT

test('updateStudent - should return affected rows', async () => {
  mockResult = [{ affectedRows: 1 }]

  const result = await studentModel.updateStudent(1, {
    student_code: 'STU001',
    full_name: 'Updated Student'
  })

  assert.equal(result, 1)
})

test('updateStudent - should return zero for missing student', async () => {
  mockResult = [{ affectedRows: 0 }]

  const result = await studentModel.updateStudent(999, {
    student_code: 'STU999',
    full_name: 'Unknown Student'
  })

  assert.equal(result, 0)
})

// 5. DELETE STUDENT

test('deleteStudent - should return affected rows', async () => {
  mockResult = [{ affectedRows: 1 }]

  const result = await studentModel.deleteStudent(1)

  assert.equal(result, 1)
})

test('deleteStudent - should return zero for missing student', async () => {
  mockResult = [{ affectedRows: 0 }]

  const result = await studentModel.deleteStudent(999)

  assert.equal(result, 0)
})
// 6. ADDITIONAL MODEL TESTS

test('createStudent - should use provided status', async () => {
  let capturedValues = []

  db.query = async (query, values) => {
    capturedValues = values
    return [{ insertId: 7 }]
  }

  await studentModel.createStudent({
    student_code: 'STU007',
    full_name: 'Inactive Student',
    status: 'Inactive'
  })

  assert.equal(capturedValues[14], 'Inactive')
})

test('getAllStudents - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    studentModel.getAllStudents(),
    /Database error/
  )
})

test('createStudent - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    studentModel.createStudent({
      student_code: 'STU008',
      full_name: 'Test Student'
    }),
    /Database error/
  )
})

test('deleteStudent - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    studentModel.deleteStudent(1),
    /Database error/
  )
})
test('getStudentById - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    studentModel.getStudentById(1),
    /Database error/
  )
})

test('updateStudent - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    studentModel.updateStudent(1, {
      student_code: 'STU001',
      full_name: 'Updated Student'
    }),
    /Database error/
  )
})

test('deleteStudent - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    studentModel.deleteStudent(1),
    /Database error/
  )
})