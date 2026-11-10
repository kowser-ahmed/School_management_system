
const test = require('node:test')
const assert = require('node:assert/strict')

const teacherModel = require('../models/teacherModel')
const teacherController = require('../controllers/teacherController')

// Mock response object
const createMockResponse = () => {
    return {
        statusCode: null,
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
}

// Temporarily replace a model method
const mockModelMethod = (t, methodName, implementation) => {
    const originalMethod = teacherModel[methodName]

    teacherModel[methodName] = implementation

    t.after(() => {
        teacherModel[methodName] = originalMethod
    })
}

// =====================================
// GET ALL TEACHERS TESTS
// =====================================

test('getAllTeachers - should return all teachers', async (t) => {
    const mockTeachers = [
        { teacher_id: 1, employee_code: 'T001', full_name: 'Rahim' },
        { teacher_id: 2, employee_code: 'T002', full_name: 'Karim' }
    ]

    mockModelMethod(t, 'getAllTeachers', async () => mockTeachers)

    const req = {}
    const res = createMockResponse()

    await teacherController.getAllTeachers(req, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.deepEqual(res.body.data, mockTeachers)
})

test('getAllTeachers - should handle database error', async (t) => {
    mockModelMethod(t, 'getAllTeachers', async () => {
        throw new Error('Database error')
    })

    const res = createMockResponse()

    await teacherController.getAllTeachers({}, res)

    assert.equal(res.statusCode, 500)
    assert.equal(res.body.success, false)
    assert.equal(res.body.message, 'Database error')
})

// =====================================
// GET TEACHER BY ID TESTS
// =====================================

test('getTeacherById - should return teacher by ID', async (t) => {
    const mockTeacher = {
        teacher_id: 1,
        employee_code: 'T001',
        full_name: 'Rahim'
    }

    mockModelMethod(t, 'getTeacherById', async (id) => {
        assert.equal(id, '1')
        return mockTeacher
    })

    const req = { params: { id: '1' } }
    const res = createMockResponse()

    await teacherController.getTeacherById(req, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.deepEqual(res.body.data, mockTeacher)
})

test('getTeacherById - should return 404 when teacher does not exist', async (t) => {
    mockModelMethod(t, 'getTeacherById', async () => null)

    const req = { params: { id: '999' } }
    const res = createMockResponse()

    await teacherController.getTeacherById(req, res)

    assert.equal(res.statusCode, 404)
    assert.equal(res.body.success, false)
    assert.equal(res.body.message, 'Teacher not found')
})

test('getTeacherById - should handle database error', async (t) => {
    mockModelMethod(t, 'getTeacherById', async () => {
        throw new Error('Database error')
    })

    const req = { params: { id: '1' } }
    const res = createMockResponse()

    await teacherController.getTeacherById(req, res)

    assert.equal(res.statusCode, 500)
    assert.equal(res.body.success, false)
})

// =====================================
// CREATE TEACHER TESTS
// =====================================

test('createTeacher - should create a teacher successfully', async (t) => {
    const teacherData = {
        employee_code: 'T003',
        full_name: 'Hasan',
        gender: 'male',
        email: 'hasan@example.com'
    }

    mockModelMethod(t, 'createTeacher', async (data) => {
        assert.deepEqual(data, teacherData)
        return 3
    })

    const req = { body: teacherData }
    const res = createMockResponse()

    await teacherController.createTeacher(req, res)

    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)
    assert.equal(res.body.teacher_id, 3)
    assert.equal(res.body.message, 'Teacher created successfully')
})

test('createTeacher - should reject missing required fields', async (t) => {
    let modelCalled = false

    mockModelMethod(t, 'createTeacher', async () => {
        modelCalled = true
        return 1
    })

    const req = {
        body: {
            employee_code: '',
            full_name: 'Rahim'
        }
    }

    const res = createMockResponse()

    await teacherController.createTeacher(req, res)

    assert.equal(res.statusCode, 400)
    assert.equal(res.body.success, false)
    assert.equal(
        res.body.message,
        'Employee code and full name are required'
    )
    assert.equal(modelCalled, false)
})

test('createTeacher - should handle database error', async (t) => {
    mockModelMethod(t, 'createTeacher', async () => {
        throw new Error('Insert failed')
    })

    const req = {
        body: {
            employee_code: 'T004',
            full_name: 'Karim'
        }
    }

    const res = createMockResponse()

    await teacherController.createTeacher(req, res)

    assert.equal(res.statusCode, 500)
    assert.equal(res.body.success, false)
    assert.equal(res.body.message, 'Insert failed')
})

// =====================================
// UPDATE TEACHER TESTS
// =====================================

test('updateTeacher - should update an existing teacher', async (t) => {
    const updateData = {
        full_name: 'Updated Rahim',
        designation: 'Senior Teacher'
    }

    mockModelMethod(t, 'getTeacherById', async () => ({
        teacher_id: 1
    }))

    mockModelMethod(t, 'updateTeacher', async (id, data) => {
        assert.equal(id, '1')
        assert.deepEqual(data, updateData)
        return 1
    })

    const req = {
        params: { id: '1' },
        body: updateData
    }

    const res = createMockResponse()

    await teacherController.updateTeacher(req, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.message, 'Teacher updated successfully')
})

test('updateTeacher - should return 404 when teacher does not exist', async (t) => {
    let updateCalled = false

    mockModelMethod(t, 'getTeacherById', async () => null)

    mockModelMethod(t, 'updateTeacher', async () => {
        updateCalled = true
        return 1
    })

    const req = {
        params: { id: '999' },
        body: { full_name: 'Updated Name' }
    }

    const res = createMockResponse()

    await teacherController.updateTeacher(req, res)

    assert.equal(res.statusCode, 404)
    assert.equal(res.body.success, false)
    assert.equal(res.body.message, 'Teacher not found')
    assert.equal(updateCalled, false)
})

test('updateTeacher - should return no changes message', async (t) => {
    mockModelMethod(t, 'getTeacherById', async () => ({
        teacher_id: 1
    }))

    mockModelMethod(t, 'updateTeacher', async () => 0)

    const req = {
        params: { id: '1' },
        body: { full_name: 'Rahim' }
    }

    const res = createMockResponse()

    await teacherController.updateTeacher(req, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.message, 'No changes made')
})

// =====================================
// DELETE TEACHER TESTS
// =====================================

test('deleteTeacher - should delete teacher successfully', async (t) => {
    mockModelMethod(t, 'deleteTeacher', async (id) => {
        assert.equal(id, '1')
        return 1
    })

    const req = { params: { id: '1' } }
    const res = createMockResponse()

    await teacherController.deleteTeacher(req, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.message, 'Teacher deleted successfully')
})

test('deleteTeacher - should return 404 when teacher does not exist', async (t) => {
    mockModelMethod(t, 'deleteTeacher', async () => 0)

    const req = { params: { id: '999' } }
    const res = createMockResponse()

    await teacherController.deleteTeacher(req, res)

    assert.equal(res.statusCode, 404)
    assert.equal(res.body.success, false)
    assert.equal(res.body.message, 'Teacher not found')
})

test('deleteTeacher - should handle database error', async (t) => {
    mockModelMethod(t, 'deleteTeacher', async () => {
        throw new Error('Delete failed')
    })

    const req = { params: { id: '1' } }
    const res = createMockResponse()

    await teacherController.deleteTeacher(req, res)

    assert.equal(res.statusCode, 500)
    assert.equal(res.body.success, false)
    assert.equal(res.body.message, 'Delete failed')
})
