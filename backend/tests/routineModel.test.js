
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const db = require("../config/db");
const Routine = require("../models/routineModel");

let mockResult;

beforeEach(() => {
    mockResult = null;

    db.query = async () => mockResult;
});

// GET ALL ROUTINES
test("getAllRoutines - returns all routines from database", async () => {
    mockResult = [[
        {
            routine_id: 1,
            class_id: 6,
            class_name: "Class 6",
            subject_id: 2,
            subject_name: "English",
            teacher_id: 1,
            teacher_name: "Arpita",
            day_of_week: "Saturday",
            start_time: "09:00:00",
            end_time: "10:00:00",
            room: "101"
        },
        {
            routine_id: 2,
            class_id: 7,
            class_name: "Class 7",
            subject_id: 3,
            subject_name: "Mathematics",
            teacher_id: 2,
            teacher_name: "MAIDUL ISLAM",
            day_of_week: "Sunday",
            start_time: "10:00:00",
            end_time: "11:00:00",
            room: "102"
        }
    ]];

    const result = await Routine.getAllRoutines();

    assert.equal(result.length, 2);
    assert.equal(result[0].routine_id, 1);
    assert.equal(result[0].class_name, "Class 6");
    assert.equal(result[1].teacher_name, "MAIDUL ISLAM");
});

test("getAllRoutines - returns empty array when no routines exist", async () => {
    mockResult = [[]];

    const result = await Routine.getAllRoutines();

    assert.deepEqual(result, []);
});

// GET ROUTINE BY ID
test("getRoutineById - returns matching routine", async () => {
    mockResult = [[
        {
            routine_id: 5,
            class_id: 6,
            class_name: "Class 6",
            subject_id: 2,
            subject_name: "English",
            teacher_id: 1,
            teacher_name: "Arpita",
            day_of_week: "Monday",
            start_time: "09:00:00",
            end_time: "10:00:00",
            room: "201"
        }
    ]];

    const result = await Routine.getRoutineById(5);

    assert.equal(result.routine_id, 5);
    assert.equal(result.class_name, "Class 6");
    assert.equal(result.teacher_name, "Arpita");
});

test("getRoutineById - returns undefined when routine does not exist", async () => {
    mockResult = [[]];

    const result = await Routine.getRoutineById(999);

    assert.equal(result, undefined);
});

// CREATE ROUTINE
test("createRoutine - returns inserted routine ID", async () => {
    mockResult = [{ insertId: 10 }];

    const result = await Routine.createRoutine({
        class_id: 6,
        section_id: 1,
        subject_id: 2,
        teacher_id: 1,
        day_of_week: "Saturday",
        start_time: "09:00:00",
        end_time: "10:00:00",
        room: "101"
    });

    assert.equal(result, 10);
});

test("createRoutine - uses null for optional fields by default", async () => {
    let values;

    db.query = async (_sql, queryValues) => {
        values = queryValues;
        return [{ insertId: 11 }];
    };

    await Routine.createRoutine({
        class_id: 6,
        subject_id: 2,
        day_of_week: "Sunday",
        start_time: "10:00:00",
        end_time: "11:00:00"
    });

    assert.equal(values[1], null);
    assert.equal(values[3], null);
    assert.equal(values[7], null);
});

// UPDATE ROUTINE
test("updateRoutine - returns affected row count", async () => {
    mockResult = [{ affectedRows: 1 }];

    const result = await Routine.updateRoutine(1, {
        class_id: 7,
        section_id: 2,
        subject_id: 3,
        teacher_id: 2,
        day_of_week: "Monday",
        start_time: "10:00:00",
        end_time: "11:00:00",
        room: "202"
    });

    assert.equal(result, 1);
});

test("updateRoutine - returns zero when routine does not exist", async () => {
    mockResult = [{ affectedRows: 0 }];

    const result = await Routine.updateRoutine(999, {
        class_id: 6,
        subject_id: 2,
        day_of_week: "Tuesday",
        start_time: "09:00:00",
        end_time: "10:00:00"
    });

    assert.equal(result, 0);
});

// DELETE ROUTINE
test("deleteRoutine - returns affected row count", async () => {
    mockResult = [{ affectedRows: 1 }];

    const result = await Routine.deleteRoutine(1);

    assert.equal(result, 1);
});

test("deleteRoutine - returns zero when routine does not exist", async () => {
    mockResult = [{ affectedRows: 0 }];

    const result = await Routine.deleteRoutine(999);

    assert.equal(result, 0);
});

// DATABASE ERROR BEHAVIOUR
test("getAllRoutines - rejects when database query fails", async () => {
    db.query = async () => {
        throw new Error("Database error");
    };

    await assert.rejects(
        Routine.getAllRoutines(),
        /Database error/
    );
});

test("createRoutine - rejects when database query fails", async () => {
    db.query = async () => {
        throw new Error("Database error");
    };

    await assert.rejects(
        Routine.createRoutine({
            class_id: 6,
            subject_id: 2,
            day_of_week: "Saturday",
            start_time: "09:00:00",
            end_time: "10:00:00"
        }),
        /Database error/
    );
});
