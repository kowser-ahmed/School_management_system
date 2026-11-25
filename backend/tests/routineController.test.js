
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const routineModel = require('../models/routineModel')

const {
  getAllRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine
} = require('../controllers/routineController')

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
  routineModel.getAllRoutines = async () => []
  routineModel.getRoutineById = async () => null
  routineModel.createRoutine = async () => 1
  routineModel.updateRoutine = async () => 1
  routineModel.deleteRoutine = async () => 1
})

// GET ALL ROUTINES
test('getAllRoutines - returns routine list', async () => {
  routineModel.getAllRoutines = async () => [
    {
      routine_id: 1,
      class_id: 6,
      class_name: 'Class 6',
      subject_id: 2,
      subject_name: 'English',
      teacher_id: 1,
      teacher_name: 'Arpita',
      day_of_week: 'Saturday',
      start_time: '09:00:00',
      end_time: '10:00:00',
      room: '101'
    }
  ]

  const res = createResponse()

  await getAllRoutines({}, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data.length, 1)
  assert.equal(res.body.data[0].class_name, 'Class 6')
})

test('getAllRoutines - returns 500 when model fails', async () => {
  routineModel.getAllRoutines = async () => {
    throw new Error('Database error')
  }

  const res = createResponse()

  await getAllRoutines({}, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// GET ROUTINE BY ID
test('getRoutineById - returns routine when found', async () => {
  routineModel.getRoutineById = async (id) => ({
    routine_id: Number(id),
    class_name: 'Class 6',
    subject_name: 'English'
  })

  const res = createResponse()

  await getRoutineById({
    params: { id: '1' }
  }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data.routine_id, 1)
})

test('getRoutineById - returns 404 when routine is missing', async () => {
  routineModel.getRoutineById = async () => null

  const res = createResponse()

  await getRoutineById({
    params: { id: '999' }
  }, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Routine not found.')
})

// CREATE ROUTINE
test('createRoutine - creates routine with required fields', async () => {
  routineModel.createRoutine = async (data) => {
    assert.equal(data.class_id, 6)
    assert.equal(data.subject_id, 2)
    assert.equal(data.day_of_week, 'Saturday')
    return 12
  }

  const res = createResponse()

  await createRoutine({
    body: {
      class_id: 6,
      section_id: 1,
      subject_id: 2,
      teacher_id: 1,
      day_of_week: 'Saturday',
      start_time: '09:00:00',
      end_time: '10:00:00',
      room: '101'
    }
  }, res)

  assert.equal(res.statusCode, 201)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data.routine_id, 12)
})

test('createRoutine - rejects missing required fields', async () => {
  const res = createResponse()

  await createRoutine({
    body: {
      class_id: 6,
      subject_id: 2
    }
  }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(
    res.body.message,
    'Class, subject, day, start time and end time are required.'
  )
})

test('createRoutine - returns 500 when model fails', async () => {
  routineModel.createRoutine = async () => {
    throw new Error('Database error')
  }

  const res = createResponse()

  await createRoutine({
    body: {
      class_id: 6,
      subject_id: 2,
      day_of_week: 'Saturday',
      start_time: '09:00:00',
      end_time: '10:00:00'
    }
  }, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// UPDATE ROUTINE
test('updateRoutine - updates existing routine', async () => {
  routineModel.updateRoutine = async (id) => {
    assert.equal(id, '1')
    return 1
  }

  const res = createResponse()

  await updateRoutine({
    params: { id: '1' },
    body: {
      class_id: 6,
      subject_id: 2,
      day_of_week: 'Monday',
      start_time: '10:00:00',
      end_time: '11:00:00'
    }
  }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('updateRoutine - returns 404 when no routine is updated', async () => {
  routineModel.updateRoutine = async () => 0

  const res = createResponse()

  await updateRoutine({
    params: { id: '999' },
    body: {
      class_id: 6,
      subject_id: 2,
      day_of_week: 'Monday',
      start_time: '10:00:00',
      end_time: '11:00:00'
    }
  }, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Routine not found.')
})

test('updateRoutine - returns 500 when model fails', async () => {
  routineModel.updateRoutine = async () => {
    throw new Error('Database error')
  }

  const res = createResponse()

  await updateRoutine({
    params: { id: '1' },
    body: {
      class_id: 6,
      subject_id: 2,
      day_of_week: 'Monday',
      start_time: '10:00:00',
      end_time: '11:00:00'
    }
  }, res)

  assert.equal(res.statusCode, 500)
})

// DELETE ROUTINE
test('deleteRoutine - deletes existing routine', async () => {
  routineModel.deleteRoutine = async (id) => {
    assert.equal(id, '1')
    return 1
  }

  const res = createResponse()

  await deleteRoutine({
    params: { id: '1' }
  }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

test('deleteRoutine - returns 404 when routine does not exist', async () => {
  routineModel.deleteRoutine = async () => 0

  const res = createResponse()

  await deleteRoutine({
    params: { id: '999' }
  }, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.message, 'Routine not found.')
})

test('deleteRoutine - returns 500 when model fails', async () => {
  routineModel.deleteRoutine = async () => {
    throw new Error('Database error')
  }

  const res = createResponse()

  await deleteRoutine({
    params: { id: '1' }
  }, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})
