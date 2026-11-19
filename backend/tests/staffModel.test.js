
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const db = require('../config/db')
const staffModel = require('../models/staffModel')

// Mock database query
let mockResult

beforeEach(() => {
  mockResult = null

  db.query = async () => mockResult
})

// 1. GET ALL STAFF

test('getAllStaff - should return all staff', async () => {
  mockResult = [[
    { staff_id: 1, full_name: 'Rahim Ahmed' },
    { staff_id: 2, full_name: 'Karim Ahmed' }
  ]]

  const result = await staffModel.getAllStaff()

  assert.equal(result.length, 2)
  assert.equal(result[0].full_name, 'Rahim Ahmed')
})

test('getAllStaff - should return empty array', async () => {
  mockResult = [[]]

  const result = await staffModel.getAllStaff()

  assert.deepEqual(result, [])
})

// 2. GET STAFF BY ID

test('getStaffById - should return staff by ID', async () => {
  mockResult = [[
    { staff_id: 1, full_name: 'Rahim Ahmed' }
  ]]

  const result = await staffModel.getStaffById(1)

  assert.equal(result.staff_id, 1)
  assert.equal(result.full_name, 'Rahim Ahmed')
})

test('getStaffById - should return undefined for missing ID', async () => {
  mockResult = [[]]

  const result = await staffModel.getStaffById(999)

  assert.equal(result, undefined)
})

// 3. CREATE STAFF

test('createStaff - should return inserted staff ID', async () => {
  mockResult = [{ insertId: 5 }]

  const result = await staffModel.createStaff({
    employee_code: 'STF005',
    full_name: 'Test Staff'
  })

  assert.equal(result, 5)
})

test('createStaff - should use default active status', async () => {
  let capturedValues = []

  db.query = async (query, values) => {
    capturedValues = values
    return [{ insertId: 6 }]
  }

  await staffModel.createStaff({
    employee_code: 'STF006',
    full_name: 'New Staff'
  })

  assert.equal(capturedValues[9], 'active')
})

// 4. UPDATE STAFF

test('updateStaff - should return affected rows', async () => {
  mockResult = [{ affectedRows: 1 }]

  const result = await staffModel.updateStaff(1, {
    employee_code: 'STF001',
    full_name: 'Updated Staff'
  })

  assert.equal(result, 1)
})

test('updateStaff - should return zero for missing staff', async () => {
  mockResult = [{ affectedRows: 0 }]

  const result = await staffModel.updateStaff(999, {
    employee_code: 'STF999',
    full_name: 'Unknown Staff'
  })

  assert.equal(result, 0)
})

// 5. DELETE STAFF

test('deleteStaff - should return affected rows', async () => {
  mockResult = [{ affectedRows: 1 }]

  const result = await staffModel.deleteStaff(1)

  assert.equal(result, 1)
})

test('deleteStaff - should return zero for missing staff', async () => {
  mockResult = [{ affectedRows: 0 }]

  const result = await staffModel.deleteStaff(999)

  assert.equal(result, 0)
})

// 6. ADDITIONAL MODEL TESTS

test('createStaff - should use provided status', async () => {
  let capturedValues = []

  db.query = async (query, values) => {
    capturedValues = values
    return [{ insertId: 7 }]
  }

  await staffModel.createStaff({
    employee_code: 'STF007',
    full_name: 'Inactive Staff',
    status: 'inactive'
  })

  assert.equal(capturedValues[9], 'inactive')
})

test('getAllStaff - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    staffModel.getAllStaff(),
    /Database error/
  )
})

test('createStaff - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    staffModel.createStaff({
      employee_code: 'STF008',
      full_name: 'Test Staff'
    }),
    /Database error/
  )
})

test('deleteStaff - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    staffModel.deleteStaff(1),
    /Database error/
  )
})

test('getStaffById - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    staffModel.getStaffById(1),
    /Database error/
  )
})

test('updateStaff - should handle database error', async () => {
  db.query = async () => {
    throw new Error('Database error')
  }

  await assert.rejects(
    staffModel.updateStaff(1, {
      employee_code: 'STF001',
      full_name: 'Updated Staff'
    }),
    /Database error/
  )
})
