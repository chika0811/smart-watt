# Phase 1A.1 — PostgreSQL + RLS Security & Concurrency Hardening Spike

## 1. Objective
Validate the core database security boundary, multi-tenant isolation, Role-Based Access Control (RBAC), privilege boundary separation, device credential isolation, cross-home composite binding protection, command idempotency, range partitioning, and functional execution performance in PostgreSQL 15+.

This spike MUST prove that multi-tenancy is enforced at the database layer via PostgreSQL RLS policies (`auth.uid() = home_members.user_id`), and that ordinary client roles (`authenticated_user`, `anon`) have **zero access** to hardware device credentials (`device_credentials`).

---

## 2. Directory Structure

```text
phase1/spike-1a/
├── README.md
├── docker-compose.yml
├── migrations/
│   └── 001_schema.sql
├── seeds/
│   └── 001_seed.sql
├── tests/
│   ├── rls_adversarial_test.sql
│   ├── security_concurrency_test.sql
│   ├── load_benchmark_test.js
│   └── test_runner.js
└── scripts/
    └── run_tests.ps1
```

---

## 3. Comprehensive Phase 1A.1 Security & Concurrency Test Matrix

| Area | Test ID | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **A1. Privilege Boundary** | `PRIV-01` | Client attempts `SET ROLE postgres` | `permission denied` |
| | `PRIV-02` | Client attempts `ALTER ROLE BYPASSRLS` | `permission denied` |
| **A2. JWT Claim Security** | `JWT-01` | Client attempts setting invalid JWT sub | Restricted by RLS policies |
| **A3. Credential Isolation**| `SEC-01` | Client `SELECT` on `device_credentials` | `insufficient_privilege` (Table REVOKE) |
| | `SEC-02` | Client `INSERT` on `device_credentials` | `insufficient_privilege` |
| | `SEC-03` | Client `UPDATE` on `device_credentials` | `insufficient_privilege` |
| | `SEC-04` | Client `DELETE` on `device_credentials` | `insufficient_privilege` |
| **A4. Service-Role Boundary**| `SRV-01` | `service_role` query on `device_credentials` | Success (`1 row`) |
| **A5. Cross-Home Bindings** | `BIND-01` | User A binds Home A appliance → Home B endpoint | Blocked by RLS `EXISTS` check (`0 rows`) |
| | `BIND-02` | User A deletes Home B appliance binding | Blocked by RLS (`0 rows`) |
| **A6. Command Idempotency** | `IDEM-01` | Insert duplicate `command_id` (`ON CONFLICT`) | Exactly `1 logical command` created |
| **A7. Concurrency & FKs** | `CONC-01` | Foreign Key violation on non-existent `device_id` | `foreign_key_violation` error |
| **A9. Range Partitioning** | `PART-01` | Telemetry logs inserted into Aug 2026 / Sept 2026 | Land in `y2026m08` / `y2026m09` partitions |
| **A10. Load Benchmark** | `LOAD-01` | 1,000 concurrent RLS queries benchmark | QPS, p50, p95, p99 latency recorded |

---

## 4. Execution Instructions

### Prerequisites
- Docker & Docker Compose OR PostgreSQL 15+ instance.
- Node.js (v18+) for running `test_runner.js` and `load_benchmark_test.js`.

### Running the Full Test & Benchmark Suite
```powershell
# 1. Start PostgreSQL container
docker-compose up -d

# 2. Execute automated test harness (Runs migrations, seeds, RLS suite, and security suite)
powershell ./scripts/run_tests.ps1

# 3. Run RLS Load Benchmark
node ./tests/load_benchmark_test.js
```
