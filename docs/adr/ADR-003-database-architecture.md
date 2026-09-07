# ADR-003: Database Architecture & Row Level Security (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
The ecosystem requires a relational data store for multi-tenant home hierarchies (`Homes -> Rooms -> Appliances`), generic device endpoints, composite capability bindings, versioned authoritative states, scene definitions, command retention, and security audit logs. Database-enforced multi-tenancy is mandatory.

## 2. Alternatives Evaluated
1. **PostgreSQL 15+ with RLS [FINAL SELECTION]**: Relational SQL engine with declarative Row Level Security policies.
2. **MongoDB (NoSQL Document Store)**: Dynamic document database.
3. **CockroachDB (Distributed SQL)**: Distributed relational database.

## 3. Selected Approach & Technical Reason
We select **PostgreSQL 15+ with Row Level Security (RLS)**. RLS enforces tenant isolation at the database layer (`auth.uid() = home_members.user_id`), automatically blocking cross-tenant data access even if application code omits tenancy filters.

## 4. Operational Consequences
- **Positive**: Declarative multi-tenant security; robust relational schema integrity; native JSONB support.
- **Negative**: Requires index tuning for complex multi-table RLS joins.

## 5. Migration Consequences
Standard ANSI SQL schema compatible with any managed PostgreSQL service.
