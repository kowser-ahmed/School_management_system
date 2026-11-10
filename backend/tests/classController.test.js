const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const classModel = require('../models/classModel')
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} = require('../controllers/classController')

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

beforeEach(() => {
  classModel.getAllClasses = async () => []
  classModel.getClassById = async () => null
  classModel.createClass = async () => 1
  classModel.updateClass = async () => 1
  classModel.deleteClass = async () => 1
})

// GET ALL CLASSES
test('getAllClasses - returns class list', async () => {
  classModel.getAllClasses = async () => [
    { class_id: 1, class_name: 'Class 6', academic_year: '2026' }
  ]
  const res = createResponse()
  await getAllClasses({}, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data.length, 1)
})

test('getAllClasses - returns 500 when model fails', async () => {
  classModel.getAllClasses = async () => { throw new Error('Database error') }
  const res = createResponse()
  await getAllClasses({}, res)
  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// GET CLASS BY ID
test('getClassById - returns class when found', async () => {
  classModel.getClassById = async (id) => ({ class_id: Number(id), class_name: 'Class 6' })
  const res = createResponse()
  await getClassById({ params: { id: '1' } }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.class_id, 1)
})

test('getClassById - returns 404 when class is missing', async () => {
  classModel.getClassById = async () => null
  const res = createResponse()
  await getClassById({ params: { id: '999' } }, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Class not found')
})

// CREATE CLASS
test('createClass - creates class with required fields', async () => {
  classModel.createClass = async (data) => {
    assert.equal(data.class_name, 'Class 7')
    assert.equal(data.academic_year, '2026')
    return 12
  }
  const res = createResponse()
  await createClass({ body: { class_name: 'Class 7', academic_year: '2026' } }, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.class_id, 12)
})

test('createClass - rejects missing class name', async () => {
  const res = createResponse()
  await createClass({ body: { academic_year: '2026' } }, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'Class name is required')
})

test('createClass - rejects missing academic year', async () => {
  const res = createResponse()
  await createClass({ body: { class_name: 'Class 7' } }, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'Academic year is required')
})

test('createClass - returns 500 when model fails', async () => {
  classModel.createClass = async () => { throw new Error('Database error') }
  const res = createResponse()
  await createClass({ body: { class_name: 'Class 7', academic_year: '2026' } }, res)
  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// UPDATE CLASS
test('updateClass - updates existing class', async () => {
  classModel.updateClass = async (id) => {
    assert.equal(id, '1')
    return 1
  }
  const res = createResponse()
  await updateClass({
    params: { id: '1' },
    body: { class_name: 'Class Seven', academic_year: '2026', status: 'active' }
  }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('updateClass - returns 404 when no class is updated', async () => {
  classModel.updateClass = async () => 0
  const res = createResponse()
  await updateClass({
    params: { id: '999' },
    body: { class_name: 'Unknown', academic_year: '2026', status: 'active' }
  }, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Class not found')
})

test('updateClass - returns 500 when model fails', async () => {
  classModel.updateClass = async () => { throw new Error('Database error') }
  const res = createResponse()
  await updateClass({
    params: { id: '1' },
    body: { class_name: 'Updated', academic_year: '2026', status: 'active' }
  }, res)
  assert.equal(res.statusCode, 500)
})

// DELETE CLASS
test('deleteClass - deletes existing class', async () => {
  classModel.deleteClass = async (id) => {
    assert.equal(id, '1')
    return 1
  }
  const res = createResponse()
  await deleteClass({ params: { id: '1' } }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('deleteClass - returns 404 when class does not exist', async () => {
  classModel.deleteClass = async () => 0
  const res = createResponse()
  await deleteClass({ params: { id: '999' } }, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Class not found')
})

test('deleteClass - returns 500 when model fails', async () => {
  classModel.deleteClass = async () => { throw new Error('Database error') }
  const res = createResponse()
  await deleteClass({ params: { id: '1' } }, res)
  assert.equal(res.statusCode, 500)
})
