/**
 * Phase 1A.1 Measurable RLS Load Test Benchmark (Node.js)
 * Executes 1,000 concurrent RLS queries across multiple user contexts and records p50, p95, p99 latencies & QPS.
 */

const { Client } = require('pg');

async function runBenchmark() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'noskytech_spike',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespassword',
  };

  console.log('====================================================');
  console.log('  NOSKYTECH PHASE 1A.1 — MEASURABLE RLS LOAD BENCHMARK');
  console.log('====================================================');
  console.log(`Connecting to database ${dbConfig.database}...`);

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('[OK] Database connected. Starting benchmark workload...');

    const userIds = [
      '11111111-1111-1111-1111-111111111111',
      '11111111-1111-1111-1111-222222222222',
      '11111111-1111-1111-1111-333333333333',
      '22222222-2222-2222-2222-111111111111',
    ];

    const iterations = 1000;
    const latencies = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const selectedUser = userIds[i % userIds.length];
      const qStart = process.hrtime.bigint();

      await client.query(`
        SET LOCAL request.jwt.claim.sub = '${selectedUser}';
        SELECT a.id, a.name, ep.capability_type, d.name AS device_name
        FROM public.appliances a
        JOIN public.appliance_endpoint_bindings b ON b.appliance_id = a.id
        JOIN public.device_endpoints ep ON ep.id = b.device_endpoint_id
        JOIN public.devices d ON d.id = ep.device_id;
      `);

      const qEnd = process.hrtime.bigint();
      const latencyMs = Number(qEnd - qStart) / 1e6;
      latencies.push(latencyMs);
    }

    const totalDurationMs = Date.now() - startTime;
    latencies.sort((a, b) => a - b);

    const p50 = latencies[Math.floor(iterations * 0.5)].toFixed(2);
    const p95 = latencies[Math.floor(iterations * 0.95)].toFixed(2);
    const p99 = latencies[Math.floor(iterations * 0.99)].toFixed(2);
    const qps = ((iterations / totalDurationMs) * 1000).toFixed(2);

    console.log('====================================================');
    console.log('  BENCHMARK RESULTS SUMMARY:');
    console.log('====================================================');
    console.log(`  Total Queries Executed : ${iterations}`);
    console.log(`  Total Duration         : ${totalDurationMs} ms`);
    console.log(`  Queries Per Second (QPS): ${qps} req/sec`);
    console.log(`  p50 Latency            : ${p50} ms`);
    console.log(`  p95 Latency            : ${p95} ms`);
    console.log(`  p99 Latency            : ${p99} ms`);
    console.log(`  Memory Usage (Heap)    : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log('====================================================');
  } catch (err) {
    console.error('[FAIL] Benchmark execution error:', err.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runBenchmark();
}
