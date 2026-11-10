
const test = require('node:test')
const assert = require('node:assert/strict')

const db = require('../config/db')
const teacherModel = require('../models/teacherModel')

// Mock database query
const mockDbQuery = (t, implementation) => {
    const originalQuery = db.query

    db.query = async (...args) => implementation(...args)

    t.after(() => {
        db.query = originalQuery
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

    mockDbQuery(t, async (sql, values) => {
        assert.match(sql, /SELECT \* FROM teachers ORDER BY teacher_id DESC/)
        assert.deepEqual(values, undefined)

        return [mockTeachers, []]
    })

    const result = await teacherModel.getAllTeachers()

    assert.deepEqual(result, mockTeachers)
})

test('getAllTeachers - should handle database error', async (t) => {
    mockDbQuery(t, async () => {
        throw new Error('Database connection failed')
    })

    await assert.rejects(
        teacherModel.getAllTeachers(),
        /Database connection failed/
    )
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

    mockDbQuery(t, async (sql, values) => {
        assert.match(sql, /SELECT \* FROM teachers WHERE teacher_id = \?/)
        assert.deepEqual(values, [1])

        return [[mockTeacher], []]
    })

    const result = await teacherModel.getTeacherById(1)

    assert.deepEqual(result, mockTeacher)
})

test('getTeacherById - should return undefined when teacher does not exist', async (t) => {
    mockDbQuery(t, async () => {
        return [[], []]
    })

    const result = await teacherModel.getTeacherById(999)

    assert.equal(result, undefined)
})

test('getTeacherById - should handle database error', async (t) => {
    mockDbQuery(t, async () => {
        throw new Error('Select query failed')
    })

    await assert.rejects(
        teacherModel.getTeacherById(1),
        /Select query failed/
    )
})

// =====================================
// CREATE TEACHER TESTS
// =====================================

test('createTeacher - should create teacher with default values', async (t) => {
    const teacherData = {
        employee_code: 'T003',
        full_name: 'Hasan'
    }

    mockDbQuery(t, async (sql, values) => {
        assert.match(sql, /INSERT INTO teachers/)

        assert.deepEqual(values, [
            null,
            'T003',
            'Hasan',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'active'
        ])

        return [{ insertId: 3 }, []]
    })

    const result = await teacherModel.createTeacher(teacherData)

    assert.equal(result, 3)
})

test('createTeacher - should insert all provided teacher information', async (t) => {
    const teacherData = {
        user_id: 5,
        employee_code: 'T004',
        full_name: 'Karim',
        gender: 'male',
        phone: '01712345678',
        email: 'karim@example.com',
        address: 'Dhaka',
        joining_date: '2026-01-01',
        designation: 'Assistant Teacher',
        salary: 25000,
        status: 'active'
    }

    mockDbQuery(t, async (sql, values) => {
        assert.match(sql, /INSERT INTO teachers/)

        assert.deepEqual(values, [
            5,
            'T004',
            'Karim',
            'male',
            '01712345678',
            'karim@example.com',
            'Dhaka',
            '2026-01-01',
            'Assistant Teacher',
            25000,
            'active'
        ])

        return [{ insertId: 4 }, []]
    })

    const result = await teacherModel.createTeacher(teacherData)

    assert.equal(result, 4)
})

test('createTeacher - should handle database error', async (t) => {
    mockDbQuery(t, async () => {
        throw new Error('Insert query failed')
    })

    await assert.rejects(
        teacherModel.createTeacher({
            employee_code: 'T005',
            full_name: 'Nayeem'
        }),
        /Insert query failed/
    )
})

// =====================================
// UPDATE TEACHER TESTS
// =====================================

test('updateTeacher - should update allowed teacher fields', async (t) => {
    const updateData = {
        full_name: 'Updated Rahim',
        salary: 30000
    }

    mockDbQuery(t, async (sql, values) => {
        assert.equal(
            sql,
            'UPDATE teachers SET full_name = ?, salary = ? WHERE teacher_id = ?'
        )

        assert.deepEqual(values, [
            'Updated Rahim',
            30000,
            1
        ])

        return [{ affectedRows: 1 }, []]
    })

    const result = await teacherModel.updateTeacher(1, updateData)

    assert.equal(result, 1)
})

test('updateTeacher - should ignore fields that are not allowed', async (t) => {
    const updateData = {
        full_name: 'Updated Karim',
        unknown_field: 'Not Allowed'
    }

    mockDbQuery(t, async (sql, values) => {
        assert.equal(
            sql,
            'UPDATE teachers SET full_name = ? WHERE teacher_id = ?'
        )

        assert.deepEqual(values, [
            'Updated Karim',
            2
        ])

        return [{ affectedRows: 1 }, []]
    })

    const result = await teacherModel.updateTeacher(2, updateData)

    assert.equal(result, 1)
})

test('updateTeacher - should return 0 when no allowed fields are provided', async (t) => {
    let queryCalled = false

    mockDbQuery(t, async () => {
        queryCalled = true
        return [{ affectedRows: 1 }, []]
    })

    const result = await teacherModel.updateTeacher(1, {
        unknown_field: 'Test'
    })

    assert.equal(result, 0)
    assert.equal(queryCalled, false)
})

test('updateTeacher - should handle database error', async (t) => {
    mockDbQuery(t, async () => {
        throw new Error('Update query failed')
    })

    await assert.rejects(
        teacherModel.updateTeacher(1, {
            full_name: 'New Name'
        }),
        /Update query failed/
    )
})

// =====================================
// DELETE TEACHER TESTS
// =====================================

test('deleteTeacher - should delete teacher successfully', async (t) => {
    mockDbQuery(t, async (sql, values) => {
        assert.match(sql, /DELETE FROM teachers WHERE teacher_id = \?/)

        assert.deepEqual(values, [1])

        return [{ affectedRows: 1 }, []]
    })

    const result = await teacherModel.deleteTeacher(1)

    assert.equal(result, 1)
})

test('deleteTeacher - should return 0 when teacher does not exist', async (t) => {
    mockDbQuery(t, async () => {
        return [{ affectedRows: 0 }, []]
    })

    const result = await teacherModel.deleteTeacher(999)

    assert.equal(result, 0)
})

test('deleteTeacher - should handle database error', async (t) => {
    mockDbQuery(t, async () => {
        throw new Error('Delete query failed')
    })

    await assert.rejects(
        teacherModel.deleteTeacher(1),
        /Delete query failed/
    )
})
