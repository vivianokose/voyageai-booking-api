'use strict';

const assert = require('assert');
const http = require('http');

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
  });
}

async function runTests() {
  const server = require('../src/app');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (e) {
      console.log(`  FAIL: ${name}: ${e.message}`);
      failed++;
    }
  }

  await new Promise(r => setTimeout(r, 100));

  await test('GET /health returns 200', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  await test('GET /bookings returns bookings array', async () => {
    const res = await request('/bookings');
    assert(Array.isArray(res.body.bookings));
  });

  await test('GET /unknown returns 404', async () => {
    const res = await request('/unknown-route');
    assert.strictEqual(res.status, 404);
  });

  server.close();
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => { console.error(e); process.exit(1); });
