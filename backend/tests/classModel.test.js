const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const db = require('../config/db')
const classModel = require('../models/classModel')

let mockResult
beforeEach(() => {
  mockResult = null
  db.query = async () => mockResult
})

// GET ALL CLASSES
test('getAllClasses - returns rows from database', async () => {
  mockResult = [[
    { class_id: 2, class_name: 'Class 7', academic_year: '2026' },
    { class_id: 1, class_name: 'Class 6', academic_year: '2026' }
  ]]
  const result = await classModel.getAllClasses()
  assert.equal(result.length, 2)
  assert.equal(result[0].class_id, 2)
})

test('getAllClasses - returns empty array when table has no rows', async () => {
  mockResult = [[]]
  const result = await classModel.getAllClasses()
  assert.deepEqual(result, [])
})

// GET CLASS BY ID
test('getClassById - returns matching class', async () => {
  mockResult = [[{ class_id: 3, class_name: 'Class 8' }]]
  const result = await classModel.getClassById(3)
  assert.equal(result.class_id, 3)
})

test('getClassById - returns undefined when class does not exist', async () => {
  mockResult = [[]]
  const result = await classModel.getClassById(999)
  assert.equal(result, undefined)
})

// CREATE CLASS
test('createClass - returns inserted ID', async () => {
  mockResult = [{ insertId: 15 }]
  const result = await classModel.createClass({
    class_name: 'Class 9',
    academic_year: '2026',
    status: 'active'
  })
  assert.equal(result, 15)
})

test('createClass - uses active as default status', async () => {
  let values
  db.query = async (_sql, queryValues) => {
    values = queryValues
    return [{ insertId: 16 }]
  }
  await classModel.createClass({ class_name: 'Class 10', academic_year: '2026' })
  assert.equal(values[2], 'active')
})

// UPDATE CLASS
test('updateClass - returns affected row count', async () => {
  mockResult = [{ affectedRows: 1 }]
  const result = await classModel.updateClass(1, {
    class_name: 'Updated Class',
    academic_year: '2026',
    status: 'active'
  })
  assert.equal(result, 1)
})

test('updateClass - returns zero when no class matches ID', async () => {
  mockResult = [{ affectedRows: 0 }]
  const result = await classModel.updateClass(999, {
    class_name: 'Unknown',
    academic_year: '2026',
    status: 'active'
  })
  assert.equal(result, 0)
})

// DELETE CLASS
test('deleteClass - returns affected row count', async () => {
  mockResult = [{ affectedRows: 1 }]
  const result = await classModel.deleteClass(1)
  assert.equal(result, 1)
})

test('deleteClass - returns zero when class does not exist', async () => {
  mockResult = [{ affectedRows: 0 }]
  const result = await classModel.deleteClass(999)
  assert.equal(result, 0)
})

// DATABASE ERROR BEHAVIOUR
test('getAllClasses - rejects when database query fails', async () => {
  db.query = async () => { throw new Error('Database error') }
  await assert.rejects(classModel.getAllClasses(), /Database error/)
})

test('createClass - rejects when database query fails', async () => {
  db.query = async () => { throw new Error('Database error') }
  await assert.rejects(
    classModel.createClass({ class_name: 'Class 6', academic_year: '2026' }),
    /Database error/
  )
})
