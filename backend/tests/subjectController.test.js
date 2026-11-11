
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const subjectModel = require('../models/subjectModel');

const {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
} = require('../controllers/subjectController');

// CREATE RESPONSE OBJECT
const createResponse = () => {
    const res = {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        }
    };

    return res;
};

// RESET MODEL METHODS BEFORE EACH TEST
beforeEach(() => {
    subjectModel.getAllSubjects = async () => [];

    subjectModel.getSubjectById = async () => null;

    subjectModel.createSubject = async () => 1;

    subjectModel.updateSubject = async () => 1;

    subjectModel.deleteSubject = async () => 1;
});


// =====================================================
// GET ALL SUBJECTS
// =====================================================

test('getAllSubjects - returns subject list', async () => {
    subjectModel.getAllSubjects = async () => [
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

    const res = createResponse();

    await getAllSubjects({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 2);
    assert.equal(res.body.data.length, 2);
});

test('getAllSubjects - returns 500 when model fails', async () => {
    subjectModel.getAllSubjects = async () => {
        throw new Error('Database error');
    };

    const res = createResponse();

    await getAllSubjects({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Failed to get subjects.');
});


// =====================================================
// GET SUBJECT BY ID
// =====================================================

test('getSubjectById - returns subject when found', async () => {
    subjectModel.getSubjectById = async (id) => ({
        subject_id: Number(id),
        subject_name: 'Mathematics',
        subject_code: 'MATH101',
        class_id: 1
    });

    const res = createResponse();

    await getSubjectById({
        params: { id: '1' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.subject_id, 1);
    assert.equal(res.body.data.subject_name, 'Mathematics');
});

test('getSubjectById - returns 404 when subject is missing', async () => {
    subjectModel.getSubjectById = async () => null;

    const res = createResponse();

    await getSubjectById({
        params: { id: '999' }
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Subject not found.');
});

test('getSubjectById - rejects invalid subject ID', async () => {
    const res = createResponse();

    await getSubjectById({
        params: { id: 'abc' }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid subject ID.');
});


// =====================================================
// CREATE SUBJECT
// =====================================================

test('createSubject - creates subject with valid data', async () => {
    subjectModel.createSubject = async (data) => {
        assert.equal(data.subject_name, 'Physics');
        assert.equal(data.subject_code, 'PHY101');
        assert.equal(data.class_id, 1);

        return 12;
    };

    subjectModel.getSubjectById = async (id) => ({
        subject_id: Number(id),
        subject_name: 'Physics',
        subject_code: 'PHY101',
        class_id: 1
    });

    const res = createResponse();

    await createSubject({
        body: {
            subject_name: 'Physics',
            subject_code: 'PHY101',
            class_id: 1
        }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Subject created successfully.');
    assert.equal(res.body.data.subject_id, 12);
});

test('createSubject - rejects missing subject name', async () => {
    const res = createResponse();

    await createSubject({
        body: {
            subject_name: '',
            subject_code: 'PHY101',
            class_id: 1
        }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message);
});

test('createSubject - returns 500 when model fails', async () => {
    subjectModel.createSubject = async () => {
        throw new Error('Database error');
    };

    const res = createResponse();

    await createSubject({
        body: {
            subject_name: 'Physics',
            subject_code: 'PHY101',
            class_id: 1
        }
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Failed to create subject.');
});

test('createSubject - returns 409 for duplicate subject code', async () => {
    const error = new Error('Duplicate entry');
    error.code = 'ER_DUP_ENTRY';

    subjectModel.createSubject = async () => {
        throw error;
    };

    const res = createResponse();

    await createSubject({
        body: {
            subject_name: 'Physics',
            subject_code: 'PHY101',
            class_id: 1
        }
    }, res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.equal(
        res.body.message,
        'This subject code already exists.'
    );
});


// =====================================================
// UPDATE SUBJECT
// =====================================================

test('updateSubject - updates existing subject', async () => {
    let getCallCount = 0;

    subjectModel.getSubjectById = async (id) => {
        getCallCount++;

        if (getCallCount === 1) {
            return {
                subject_id: Number(id),
                subject_name: 'Mathematics',
                subject_code: 'MATH101',
                class_id: 1
            };
        }

        return {
            subject_id: Number(id),
            subject_name: 'Advanced Mathematics',
            subject_code: 'MATH201',
            class_id: 1
        };
    };

    subjectModel.updateSubject = async (id, data) => {
        assert.equal(id, '1');
        assert.equal(data.subject_name, 'Advanced Mathematics');
        assert.equal(data.subject_code, 'MATH201');

        return 1;
    };

    const res = createResponse();

    await updateSubject({
        params: { id: '1' },
        body: {
            subject_name: 'Advanced Mathematics',
            subject_code: 'MATH201',
            class_id: 1
        }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Subject updated successfully.');
    assert.equal(res.body.data.subject_name, 'Advanced Mathematics');
});

test('updateSubject - returns 404 when subject does not exist', async () => {
    subjectModel.getSubjectById = async () => null;

    const res = createResponse();

    await updateSubject({
        params: { id: '999' },
        body: {
            subject_name: 'Physics',
            subject_code: 'PHY101',
            class_id: 1
        }
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Subject not found.');
});

test('updateSubject - rejects invalid subject ID', async () => {
    const res = createResponse();

    await updateSubject({
        params: { id: 'abc' },
        body: {
            subject_name: 'Physics',
            subject_code: 'PHY101',
            class_id: 1
        }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid subject ID.');
});

test('updateSubject - returns 500 when model fails', async () => {
    subjectModel.getSubjectById = async () => ({
        subject_id: 1,
        subject_name: 'Mathematics'
    });

    subjectModel.updateSubject = async () => {
        throw new Error('Database error');
    };

    const res = createResponse();

    await updateSubject({
        params: { id: '1' },
        body: {
            subject_name: 'Physics',
            subject_code: 'PHY101',
            class_id: 1
        }
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Failed to update subject.');
});


// =====================================================
// DELETE SUBJECT
// =====================================================

test('deleteSubject - deletes existing subject', async () => {
    subjectModel.getSubjectById = async () => ({
        subject_id: 1,
        subject_name: 'Mathematics'
    });

    subjectModel.deleteSubject = async (id) => {
        assert.equal(id, '1');
        return 1;
    };

    const res = createResponse();

    await deleteSubject({
        params: { id: '1' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Subject deleted successfully.');
});

test('deleteSubject - returns 404 when subject does not exist', async () => {
    subjectModel.getSubjectById = async () => null;

    const res = createResponse();

    await deleteSubject({
        params: { id: '999' }
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Subject not found.');
});

test('deleteSubject - rejects invalid subject ID', async () => {
    const res = createResponse();

    await deleteSubject({
        params: { id: 'abc' }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid subject ID.');
});

test('deleteSubject - returns 500 when model fails', async () => {
    subjectModel.getSubjectById = async () => ({
        subject_id: 1,
        subject_name: 'Mathematics'
    });

    subjectModel.deleteSubject = async () => {
        throw new Error('Database error');
    };

    const res = createResponse();

    await deleteSubject({
        params: { id: '1' }
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Failed to delete subject.');
});
