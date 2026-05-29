const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');

require('dotenv').config({ path: '.env.testing' });
const { createApp } = require('../app');

const app = createApp();

test('GET / responds with Hello World', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.equal(res.text, 'Hello World!');
});

test('GET /api/v1/health responds with JSON structure', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.ok([200, 503].includes(res.status));
  assert.equal(typeof res.body.error, 'boolean');
  assert.equal(typeof res.body.service, 'string');
  assert.equal(typeof res.body.timestamp, 'string');
});

test.after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
