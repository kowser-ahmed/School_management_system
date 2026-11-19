
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const staffModel = require('../models/staffModel')

const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staffController')

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
  staffModel.getAllStaff = async () => []
  staffModel.getStaffById = async () => null
  staffModel.createStaff = async () => 1
  staffModel.updateStaff = async () => 1
  staffModel.deleteStaff = async () => 1
})

// Valid staff data
const validStaff = {
  employee_code: 'STF001',
  full_name: 'Rahim Ahmed',
  gender: 'male',
  phone: '01712345678',
  email: 'rahim@gmail.com',
  designation: 'Office Assistant',
  joining_date: '2026-01-01',
  salary: 20000,
  status: 'active',
  user_id: null
}

// 1. GET ALL STAFF

test('getAllStaff - should return staff list', async () => {
  staffModel.getAllStaff = async () => [
    { staff_id: 1, full_name: 'Rahim Ahmed' }
  ]

  const res = createResponse()

  await getAllStaff({}, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.length, 1)
})

test('getAllStaff - should handle database error', async () => {
  staffModel.getAllStaff = async () => {
    throw new Error('Database error')
  }

  const res = createResponse()

  await getAllStaff({}, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// 2. GET STAFF BY ID

test('getStaffById - should return staff when found', async () => {
  staffModel.getStaffById = async () => ({
    staff_id: 1,
    full_name: 'Rahim Ahmed'
  })

  const req = { params: { id: '1' } }
  const res = createResponse()

  await getStaffById(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.full_name, 'Rahim Ahmed')
})

test('getStaffById - should return 404 when staff not found', async () => {
  staffModel.getStaffById = async () => null

  const req = { params: { id: '999' } }
  const res = createResponse()

  await getStaffById(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Staff not found')
})

test('getStaffById - should handle database error', async () => {
  staffModel.getStaffById = async () => {
    throw new Error('Database error')
  }

  const req = { params: { id: '1' } }
  const res = createResponse()

  await getStaffById(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// 3. CREATE STAFF

test('createStaff - should create staff with valid data', async () => {
  const req = {
    body: { ...validStaff }
  }

  const res = createResponse()

  await createStaff(req, res)

  assert.equal(res.statusCode, 201)
  assert.equal(res.body.success, true)
  assert.equal(res.body.staff_id, 1)
})

test('createStaff - should reject missing employee code', async () => {
  const req = {
    body: {
      ...validStaff,
      employee_code: ''
    }
  }

  const res = createResponse()

  await createStaff(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'Employee code is required')
})

test('createStaff - should reject missing staff name', async () => {
  const req = {
    body: {
      ...validStaff,
      full_name: ''
    }
  }

  const res = createResponse()

  await createStaff(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'Staff name is required')
})

test('createStaff - should handle database error', async () => {
  staffModel.createStaff = async () => {
    throw new Error('Database error')
  }

  const req = {
    body: { ...validStaff }
  }

  const res = createResponse()

  await createStaff(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// 4. UPDATE STAFF

test('updateStaff - should update existing staff', async () => {
  staffModel.updateStaff = async () => 1

  const req = {
    params: { id: '1' },
    body: {
      ...validStaff,
      full_name: 'Updated Staff'
    }
  }

  const res = createResponse()

  await updateStaff(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.message, 'Staff updated successfully')
})

test('updateStaff - should return 404 for missing staff', async () => {
  staffModel.updateStaff = async () => 0

  const req = {
    params: { id: '999' },
    body: { ...validStaff }
  }

  const res = createResponse()

  await updateStaff(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Staff not found')
})

test('updateStaff - should handle database error', async () => {
  staffModel.updateStaff = async () => {
    throw new Error('Database error')
  }

  const req = {
    params: { id: '1' },
    body: { ...validStaff }
  }

  const res = createResponse()

  await updateStaff(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// 5. DELETE STAFF

test('deleteStaff - should delete existing staff', async () => {
  staffModel.deleteStaff = async () => 1

  const req = { params: { id: '1' } }
  const res = createResponse()

  await deleteStaff(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('deleteStaff - should return 404 when staff does not exist', async () => {
  staffModel.deleteStaff = async () => 0

  const req = { params: { id: '999' } }
  const res = createResponse()

  await deleteStaff(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Staff not found')
})

test('deleteStaff - should handle database error', async () => {
  staffModel.deleteStaff = async () => {
    throw new Error('Database error')
  }

  const req = { params: { id: '1' } }
  const res = createResponse()

  await deleteStaff(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// 6. ADDITIONAL VALIDATION TESTS

test('createStaff - should reject empty employee code', async () => {
  const req = {
    body: {
      ...validStaff,
      employee_code: '   '
    }
  }

  const res = createResponse()

  await createStaff(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'Employee code is required')
})

test('createStaff - should reject empty staff name', async () => {
  const req = {
    body: {
      ...validStaff,
      full_name: '   '
    }
  }

  const res = createResponse()

  await createStaff(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'Staff name is required')
})
