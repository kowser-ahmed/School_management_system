const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const sectionModel = require('../models/sectionModel')
const {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection
} = require('../controllers/sectionController')

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
  sectionModel.getAllSections = async () => []
  sectionModel.getSectionById = async () => null
  sectionModel.createSection = async () => 1
  sectionModel.updateSection = async () => 1
  sectionModel.deleteSection = async () => 1
})

// GET ALL SECTIONS
test('getAllSections - returns section list and count', async () => {
  sectionModel.getAllSections = async () => [
    { section_id: 1, class_id: 2, section_name: 'A', capacity: 40 }
  ]
  const res = createResponse()
  await getAllSections({}, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.count, 1)
  assert.equal(res.body.data[0].section_name, 'A')
})

test('getAllSections - returns 500 when model fails', async () => {
  sectionModel.getAllSections = async () => { throw new Error('Database error') }
  const res = createResponse()
  await getAllSections({}, res)
  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// GET SECTION BY ID
test('getSectionById - returns section when found', async () => {
  sectionModel.getSectionById = async (id) => ({
    section_id: Number(id), class_id: 1, section_name: 'A'
  })
  const res = createResponse()
  await getSectionById({ params: { id: '1' } }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.section_id, 1)
})

test('getSectionById - returns 404 when section is missing', async () => {
  sectionModel.getSectionById = async () => null
  const res = createResponse()
  await getSectionById({ params: { id: '999' } }, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Section not found.')
})

// CREATE SECTION
test('createSection - creates section and applies default capacity', async () => {
  sectionModel.createSection = async (data) => {
    assert.deepEqual(data, { class_id: 2, section_name: 'A', capacity: 40 })
    return 21
  }
  const res = createResponse()
  await createSection({ body: { class_id: '2', section_name: ' A ' } }, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.section_id, 21)
})

test('createSection - rejects invalid class ID', async () => {
  const res = createResponse()
  await createSection({ body: { class_id: 0, section_name: 'A' } }, res)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /class_id/)
})

test('createSection - rejects blank section name', async () => {
  const res = createResponse()
  await createSection({ body: { class_id: 2, section_name: '   ' } }, res)
  assert.equal(res.statusCode, 400)
})

test('createSection - rejects non-positive capacity', async () => {
  const res = createResponse()
  await createSection({ body: { class_id: 2, section_name: 'A', capacity: 0 } }, res)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /Capacity/)
})

test('createSection - maps duplicate entry to 409', async () => {
  sectionModel.createSection = async () => {
    const error = new Error('Duplicate')
    error.code = 'ER_DUP_ENTRY'
    throw error
  }
  const res = createResponse()
  await createSection({ body: { class_id: 2, section_name: 'A' } }, res)
  assert.equal(res.statusCode, 409)
})

test('createSection - maps missing referenced class to 400', async () => {
  sectionModel.createSection = async () => {
    const error = new Error('Foreign key')
    error.code = 'ER_NO_REFERENCED_ROW_2'
    throw error
  }
  const res = createResponse()
  await createSection({ body: { class_id: 999, section_name: 'A' } }, res)
  assert.equal(res.statusCode, 400)
})

// UPDATE SECTION
test('updateSection - updates valid section', async () => {
  sectionModel.updateSection = async (id, data) => {
    assert.equal(id, '1')
    assert.equal(data.capacity, 35)
    return 1
  }
  const res = createResponse()
  await updateSection({
    params: { id: '1' },
    body: { class_id: 2, section_name: 'B', capacity: 35 }
  }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('updateSection - rejects invalid capacity', async () => {
  const res = createResponse()
  await updateSection({
    params: { id: '1' },
    body: { class_id: 2, section_name: 'B', capacity: 0 }
  }, res)
  assert.equal(res.statusCode, 400)
})

test('updateSection - returns 404 when section does not exist', async () => {
  sectionModel.updateSection = async () => 0
  sectionModel.getSectionById = async () => null
  const res = createResponse()
  await updateSection({
    params: { id: '999' },
    body: { class_id: 2, section_name: 'B', capacity: 35 }
  }, res)
  assert.equal(res.statusCode, 404)
})

test('updateSection - returns 400 when referenced class is missing', async () => {
  sectionModel.updateSection = async () => {
    const error = new Error('Foreign key')
    error.code = 'ER_NO_REFERENCED_ROW_2'
    throw error
  }
  const res = createResponse()
  await updateSection({
    params: { id: '1' },
    body: { class_id: 999, section_name: 'B', capacity: 35 }
  }, res)
  assert.equal(res.statusCode, 400)
})

// DELETE SECTION
test('deleteSection - deletes existing section', async () => {
  sectionModel.deleteSection = async () => 1
  const res = createResponse()
  await deleteSection({ params: { id: '1' } }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('deleteSection - returns 404 when section is missing', async () => {
  sectionModel.deleteSection = async () => 0
  const res = createResponse()
  await deleteSection({ params: { id: '999' } }, res)
  assert.equal(res.statusCode, 404)
})

test('deleteSection - returns 409 when students reference section', async () => {
  sectionModel.deleteSection = async () => {
    const error = new Error('Referenced row')
    error.code = 'ER_ROW_IS_REFERENCED_2'
    throw error
  }
  const res = createResponse()
  await deleteSection({ params: { id: '1' } }, res)
  assert.equal(res.statusCode, 409)
})
