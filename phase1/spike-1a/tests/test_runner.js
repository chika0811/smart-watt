/**
 * Phase 1A.1 Automated Test Runner (Node.js)
 * Connects to PostgreSQL, executes migrations, seed data, runs RLS adversarial & security suites, and benchmark.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runPhase1ASpike() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'noskytech_spike',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespassword',
  };

  console.log('===================================================================');
  console.log('  NOSKYTECH PHASE 1A.1 — SECURITY, CONCURRENCY & RLS BENCHMARK');
  console.log('===================================================================');
  console.log(`Connecting to PostgreSQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('[OK] Connected to PostgreSQL server.');

    // Capture PostgreSQL NOTICE outputs
    client.on('notice', (msg) => {
      console.log(`  └─ ${msg.message}`);
    });

    // 1. Run Schema Migration
    const schemaPath = path.join(__dirname, '../migrations/001_schema.sql');
    console.log(`[EXEC] Applying schema migration: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('[OK] Schema, Roles, Partitioning, and RLS policies created.');

    // 2. Run Seed Data
    const seedPath = path.join(__dirname, '../seeds/001_seed.sql');
    console.log(`[EXEC] Populating seed dataset: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('[OK] Seed dataset populated successfully.');

    // 3. Run Adversarial RLS Test Suite
    const testPath = path.join(__dirname, './rls_adversarial_test.sql');
    console.log(`[EXEC] Running RLS Adversarial Test Suite: ${testPath}`);
    const testSql = fs.readFileSync(testPath, 'utf8');
    await client.query(testSql);
    console.log('[OK] Basic RLS Adversarial Test Suite passed.');

    // 4. Run Security & Concurrency Test Suite (Phase 1A.1)
    const secTestPath = path.join(__dirname, './security_concurrency_test.sql');
    console.log(`[EXEC] Running Security, Privilege & Partitioning Suite: ${secTestPath}`);
    const secTestSql = fs.readFileSync(secTestPath, 'utf8');
    await client.query(secTestSql);
    console.log('[OK] Security, Privilege Boundary & Partitioning Test Suite passed.');

    console.log('===================================================================');
    console.log('  [PASS] ALL PHASE 1A.1 SECURITY & RLS TESTS PASSED!');
    console.log('  Zero client access to device_credentials. Multi-tenancy proven.');
    console.log('===================================================================');
  } catch (err) {
    console.error('===================================================================');
    console.error('  [FAIL] PHASE 1A.1 SPIKE TEST FAILED!');
    console.error('  Details:', err.message);
    console.error('===================================================================');
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runPhase1ASpike();
}
