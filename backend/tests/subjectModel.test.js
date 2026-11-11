
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/db');
const subjectModel = require('../models/subjectModel');

// RESET DATABASE QUERY BEFORE EACH TEST
beforeEach(() => {
    db.query = async () => [[], []];
});


// =====================================================
// GET ALL SUBJECTS
// =====================================================

test('getAllSubjects - returns all subjects', async () => {
    const subjects = [
        {
            subject_id: 1,
            subject_name: 'Mathematics',
            subject_code: 'MATH101',
            class_id: 1
        },
        {
            subject_id: 2,
            subject_name: 'English',
            subject_code: 'ENG101',
            class_id: 1
        }
    ];

    db.query = async (sql) => {
        assert.match(sql, /SELECT subject_id/);
        assert.match(sql, /ORDER BY subject_id DESC/);

        return [subjects, []];
    };

    const result = await subjectModel.getAllSubjects();

    assert.equal(result.length, 2);
    assert.equal(result[0].subject_name, 'Mathematics');
    assert.equal(result[1].subject_name, 'English');
});

test('getAllSubjects - throws error when database fails', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        subjectModel.getAllSubjects(),
        { message: 'Database error' }
    );
});


// =====================================================
// GET SUBJECT BY ID
// =====================================================

test('getSubjectById - returns subject when ID exists', async () => {
    const subject = {
        subject_id: 1,
        subject_name: 'Mathematics',
        subject_code: 'MATH101',
        class_id: 1
    };

    db.query = async (sql, params) => {
        assert.match(sql, /WHERE subject_id = \?/);
        assert.deepEqual(params, [1]);

        return [[subject], []];
    };

    const result = await subjectModel.getSubjectById(1);

    assert.equal(result.subject_id, 1);
    assert.equal(result.subject_name, 'Mathematics');
});

test('getSubjectById - returns undefined when subject is missing', async () => {
    db.query = async () => [[], []];

    const result = await subjectModel.getSubjectById(999);

    assert.equal(result, undefined);
});

test('getSubjectById - throws error when database fails', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        subjectModel.getSubjectById(1),
        { message: 'Database error' }
    );
});


// =====================================================
// CREATE SUBJECT
// =====================================================

test('createSubject - inserts a new subject and returns insert ID', async () => {
    db.query = async (sql, params) => {
        assert.match(sql, /INSERT INTO subjects/);

        assert.deepEqual(params, [
            'Physics',
            'PHY101',
            1
        ]);

        return [{ insertId: 10, affectedRows: 1 }, []];
    };

    const result = await subjectModel.createSubject({
        subject_name: 'Physics',
        subject_code: 'PHY101',
        class_id: 1
    });

    assert.equal(result, 10);
});

test('createSubject - throws error when insertion fails', async () => {
    db.query = async () => {
        throw new Error('Duplicate subject code');
    };

    await assert.rejects(
        subjectModel.createSubject({
            subject_name: 'Physics',
            subject_code: 'PHY101',
            class_id: 1
        }),
        { message: 'Duplicate subject code' }
    );
});


// =====================================================
// UPDATE SUBJECT
// =====================================================

test('updateSubject - updates an existing subject', async () => {
    db.query = async (sql, params) => {
        assert.match(sql, /UPDATE subjects/);
        assert.match(sql, /WHERE subject_id = \?/);

        assert.deepEqual(params, [
            'Advanced Mathematics',
            'MATH201',
            1,
            '1'
        ]);

        return [{ affectedRows: 1 }, []];
    };

    const result = await subjectModel.updateSubject('1', {
        subject_name: 'Advanced Mathematics',
        subject_code: 'MATH201',
        class_id: 1
    });

    assert.equal(result, 1);
});

test('updateSubject - returns zero when no subject is updated', async () => {
    db.query = async () => [
        { affectedRows: 0 },
        []
    ];

    const result = await subjectModel.updateSubject('999', {
        subject_name: 'Physics',
        subject_code: 'PHY101',
        class_id: 1
    });

    assert.equal(result, 0);
});

test('updateSubject - throws error when database fails', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        subjectModel.updateSubject('1', {
            subject_name: 'Physics',
            subject_code: 'PHY101',
            class_id: 1
        }),
        { message: 'Database error' }
    );
});


// =====================================================
// DELETE SUBJECT
// =====================================================

test('deleteSubject - deletes an existing subject', async () => {
    db.query = async (sql, params) => {
        assert.match(sql, /DELETE FROM subjects/);
        assert.match(sql, /WHERE subject_id = \?/);

        assert.deepEqual(params, ['1']);

        return [{ affectedRows: 1 }, []];
    };

    const result = await subjectModel.deleteSubject('1');

    assert.equal(result, 1);
});

test('deleteSubject - returns zero when subject does not exist', async () => {
    db.query = async () => [
        { affectedRows: 0 },
        []
    ];

    const result = await subjectModel.deleteSubject('999');

    assert.equal(result, 0);
});

test('deleteSubject - throws error when database fails', async () => {
    db.query = async () => {
        throw new Error('Database error');
    };

    await assert.rejects(
        subjectModel.deleteSubject('1'),
        { message: 'Database error' }
    );
});
