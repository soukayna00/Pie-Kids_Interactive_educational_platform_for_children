const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const courseRoutes = require('../Routes/CoursRoutes');
const { Cours } = require('../Models/Cours');
const Chapitre = require('../Models/Chapitre');
const Utilisateur = require('../Models/Utilisateur');

const teacher = '1'.repeat(24);
const otherTeacher = '2'.repeat(24);
const student = '3'.repeat(24);
const courseId = '4'.repeat(24);
const chapterId = '5'.repeat(24);
const testKey = 'pie-kidz-test-only-key';
const originalKey = process.env.JWT_PRIVATEKEY;
const lesson = { _id: courseId, titre: 'Save for a Goal', description: 'Make a savings plan.' };
let server;
let baseUrl;

before(async () => {
  process.env.JWT_PRIVATEKEY = testKey;
  const app = express();
  app.use(express.json());
  app.use('/cours', courseRoutes);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/cours`;
});

after(async () => {
  if (originalKey === undefined) delete process.env.JWT_PRIVATEKEY;
  else process.env.JWT_PRIVATEKEY = originalKey;
  if (server) await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

function authenticate(t) {
  return t.mock.method(Utilisateur, 'findById', (id) => ({
    select(fields) {
      assert.equal(fields, '_id nom role');
      return {
        lean: async () => ({
          _id: id,
          role: id === student ? 'Etudiant' : 'Enseignant',
        }),
      };
    },
  }));
}

async function request(path = '', { method = 'GET', actor, fields } = {}) {
  const headers = actor ? { Authorization: `Bearer ${jwt.sign({ _id: actor }, testKey)}` } : {};
  let body;
  if (fields) {
    body = new FormData();
    for (const [name, value] of Object.entries(fields)) body.set(name, value);
  }

  const response = await fetch(baseUrl + path, { method, headers, body });
  return { status: response.status, headers: response.headers, data: await response.json() };
}

function query(result, checkFields = () => {}) {
  const chain = {
    select(fields) {
      checkFields(fields);
      return chain;
    },
    populate(path) {
      assert.ok(path !== 'Etudiants' && path !== 'enseignant');
      return chain;
    },
    lean: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

test('public catalog selects course fields without account data', async (t) => {
  t.mock.method(Cours, 'find', (filter) => {
    assert.deepEqual(filter, {});
    return query([lesson], (fields) => {
      assert.ok(fields.includes('titre'));
      assert.doesNotMatch(fields, /Etudiants|enseignant/);
    });
  });
  const response = await request();
  assert.equal(response.status, 200);
  assert.deepEqual(response.data, [lesson]);
});

test('My Courses requires a student session and returns that student’s courses', async (t) => {
  authenticate(t);
  const find = t.mock.method(Cours, 'find', (filter) => {
    assert.deepEqual(filter, { Etudiants: student });
    return query([lesson], (fields) => assert.equal(fields, '_id titre description'));
  });

  assert.equal((await request('/mine')).status, 401);
  assert.equal((await request('/mine', { actor: teacher })).status, 403);
  assert.equal(find.mock.callCount(), 0);
  const response = await request('/mine', { actor: student });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(response.data, [lesson]);
  assert.equal(find.mock.callCount(), 1);
});

test('the teaching list filters by the authenticated teacher', async (t) => {
  authenticate(t);
  t.mock.method(Cours, 'find', (filter) => {
    assert.deepEqual(filter, { enseignant: teacher });
    return query([lesson]);
  });

  const response = await request('/teaching', { actor: teacher });
  assert.equal(response.status, 200);
  assert.deepEqual(response.data, [lesson]);
});

test('creating a course requires a teacher and assigns the authenticated owner', async (t) => {
  authenticate(t);
  const create = t.mock.method(Cours, 'create', async (fields) => {
    assert.equal(fields.enseignant, teacher);
    assert.equal(fields.titre, lesson.titre);
    assert.deepEqual(fields.Competences, []);
    return lesson;
  });
  const fields = { titre: `  ${lesson.titre}  `, description: lesson.description, enseignant: otherTeacher };

  assert.equal((await request('', { method: 'POST', fields })).status, 401);
  assert.equal((await request('', { method: 'POST', actor: student, fields })).status, 403);
  assert.equal(create.mock.callCount(), 0);
  const response = await request('', { method: 'POST', actor: teacher, fields: { ...fields, Competences: '[]' } });
  assert.equal(response.status, 201);
  assert.deepEqual(response.data, lesson);
  assert.equal(create.mock.callCount(), 1);
});

for (const [caseName, fields, message] of [
  ['a blank title', { titre: '   ', description: 'Lesson' }, /titre/],
  ['a missing description', { titre: 'Lesson' }, /description/],
  ['an invalid age-range ID', { titre: 'Lesson', description: 'Text', trancheAge: 'bad' }, /trancheAge/],
  ['malformed skills', { titre: 'Lesson', description: 'Text', Competences: 'not-json' }, /JSON array/],
]) {
  test(`course creation rejects ${caseName} before writing`, async (t) => {
    authenticate(t);
    const create = t.mock.method(Cours, 'create', async () => assert.fail('Unexpected write'));
    const response = await request('', { method: 'POST', actor: teacher, fields });
    assert.equal(response.status, 400);
    assert.match(response.data.message, message);
    assert.equal(create.mock.callCount(), 0);
  });
}

test('editing is owner-scoped and supports clearing optional fields', async (t) => {
  authenticate(t);
  t.mock.method(Cours, 'exists', async ({ _id, enseignant }) => _id === courseId && enseignant === teacher);
  const update = t.mock.method(Cours, 'findOneAndUpdate', (filter, changes) => {
    assert.deepEqual(filter, { _id: courseId, enseignant: teacher });
    assert.deepEqual(changes, { $set: { trancheAge: null, Competences: [] } });
    return query(lesson);
  });
  const path = `/editCourse/${courseId}`;
  const fields = { trancheAge: '', Competences: '[]', enseignant: otherTeacher };

  assert.equal((await request(path, { method: 'PUT', actor: otherTeacher, fields })).status, 404);
  assert.equal(update.mock.callCount(), 0);
  assert.equal((await request(path, { method: 'PUT', actor: teacher, fields })).status, 200);
  assert.equal(update.mock.callCount(), 1);
});

test('deletion is restricted to the course owner', async (t) => {
  authenticate(t);
  t.mock.method(Cours, 'exists', async ({ enseignant }) => enseignant === teacher);
  const remove = t.mock.method(Cours, 'findOneAndDelete', async (filter) => {
    assert.deepEqual(filter, { _id: courseId, enseignant: teacher });
    return lesson;
  });
  const path = `/deleteCourse/${courseId}`;

  assert.equal((await request(path, { method: 'DELETE', actor: otherTeacher })).status, 404);
  assert.equal(remove.mock.callCount(), 0);
  assert.equal((await request(path, { method: 'DELETE', actor: teacher })).status, 200);
  assert.equal(remove.mock.callCount(), 1);
});

test('chapter creation validates content and links a chapter to the owned course', async (t) => {
  authenticate(t);
  t.mock.method(Cours, 'exists', async () => true);
  const create = t.mock.method(Chapitre, 'create', async (fields) => {
    assert.deepEqual(fields, { titre: 'Start Saving', content: '<p>Set a goal.</p>', resources: [] });
    return { _id: chapterId };
  });
  t.mock.method(Cours, 'findOneAndUpdate', (filter, update) => {
    assert.deepEqual(filter, { _id: courseId, enseignant: teacher });
    assert.deepEqual(update, { $push: { chapitres: chapterId } });
    return query(lesson);
  });

  const path = `/${courseId}/chapitres`;
  const invalid = await request(path, { method: 'PATCH', actor: teacher, fields: { titre: 'Start Saving' } });
  assert.equal(invalid.status, 400);
  assert.equal(create.mock.callCount(), 0);
  const valid = await request(path, {
    method: 'PATCH', actor: teacher, fields: { titre: 'Start Saving', content: '<p>Set a goal.</p>' },
  });
  assert.equal(valid.status, 200);
  assert.equal(create.mock.callCount(), 1);
});

test('enrollment uses the student session and an atomic set update', async (t) => {
  authenticate(t);
  const enrolled = new Set();
  const update = t.mock.method(Cours, 'updateOne', async (filter, changes) => {
    assert.deepEqual(filter, { _id: courseId });
    assert.deepEqual(changes, { $addToSet: { Etudiants: student } });
    const previousSize = enrolled.size;
    enrolled.add(changes.$addToSet.Etudiants);
    return { matchedCount: 1, modifiedCount: enrolled.size - previousSize };
  });
  const method = 'POST';
  const path = `/enroller/${courseId}`;

  assert.equal((await request(path, { method })).status, 401);
  assert.equal((await request(path, { method, actor: teacher })).status, 403);
  assert.equal((await request('/enroller/invalid', { method, actor: student })).status, 400);
  assert.equal(update.mock.callCount(), 0);
  const first = await request(path, { method, actor: student });
  const second = await request(path, { method, actor: student });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(second.data, { enrolled: true });
  assert.equal(enrolled.size, 1);
});
