const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const db = require('../config/db')
const sectionModel = require('../models/sectionModel')

let mockResult
beforeEach(() => {
  mockResult = null
  db.query = async () => mockResult
})

// GET ALL SECTIONS
test('getAllSections - returns all rows', async () => {
  mockResult = [[
    { section_id: 2, class_id: 1, section_name: 'B', capacity: 40 },
    { section_id: 1, class_id: 1, section_name: 'A', capacity: 35 }
  ]]
  const result = await sectionModel.getAllSections()
  assert.equal(result.length, 2)
  assert.equal(result[0].section_name, 'B')
})

test('getAllSections - returns empty array when no sections exist', async () => {
  mockResult = [[]]
  const result = await sectionModel.getAllSections()
  assert.deepEqual(result, [])
})

// GET SECTION BY ID
test('getSectionById - returns section by ID', async () => {
  mockResult = [[{ section_id: 4, class_id: 1, section_name: 'A' }]]
  const result = await sectionModel.getSectionById(4)
  assert.equal(result.section_id, 4)
})

test('getSectionById - returns undefined for missing section', async () => {
  mockResult = [[]]
  const result = await sectionModel.getSectionById(999)
  assert.equal(result, undefined)
})

// CREATE SECTION
test('createSection - returns inserted section ID', async () => {
  mockResult = [{ insertId: 25 }]
  const result = await sectionModel.createSection({
    class_id: 1, section_name: 'A', capacity: 30
  })
  assert.equal(result, 25)
})

test('createSection - defaults capacity to 40 when omitted', async () => {
  let values
  db.query = async (_sql, queryValues) => {
    values = queryValues
    return [{ insertId: 26 }]
  }
  await sectionModel.createSection({ class_id: 1, section_name: 'B' })
  assert.equal(values[2], 40)
})

// UPDATE SECTION
test('updateSection - returns affected row count', async () => {
  mockResult = [{ affectedRows: 1 }]
  const result = await sectionModel.updateSection(1, {
    class_id: 1, section_name: 'A', capacity: 40
  })
  assert.equal(result, 1)
})

test('updateSection - returns zero when section ID is not found', async () => {
  mockResult = [{ affectedRows: 0 }]
  const result = await sectionModel.updateSection(999, {
    class_id: 1, section_name: 'A', capacity: 40
  })
  assert.equal(result, 0)
})

// DELETE SECTION
test('deleteSection - returns affected row count', async () => {
  mockResult = [{ affectedRows: 1 }]
  const result = await sectionModel.deleteSection(1)
  assert.equal(result, 1)
})

test('deleteSection - returns zero when section does not exist', async () => {
  mockResult = [{ affectedRows: 0 }]
  const result = await sectionModel.deleteSection(999)
  assert.equal(result, 0)
})

// DATABASE ERROR BEHAVIOUR
test('getAllSections - rejects when database query fails', async () => {
  db.query = async () => { throw new Error('Database error') }
  await assert.rejects(sectionModel.getAllSections(), /Database error/)
})

test('createSection - rejects when database query fails', async () => {
  db.query = async () => { throw new Error('Database error') }
  await assert.rejects(
    sectionModel.createSection({ class_id: 1, section_name: 'A', capacity: 40 }),
    /Database error/
  )
})
