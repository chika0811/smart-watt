# ADR-002: Backend Architecture & Gateway Infrastructure (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
The cloud backend must manage identity, multi-tenant RBAC permissions, high-frequency device telemetry ingestion, real-time command dispatching, and Cypher AI tool execution while scaling to 1,000,000+ connected nodes without database connection pool exhaustion.

## 2. Alternatives Evaluated
1. **Hybrid Supabase + EMQX Enterprise Broker [FINAL SELECTION]**: Managed Supabase PostgreSQL & Auth paired with clustered EMQX Enterprise MQTT Broker.
2. **AWS IoT Core + AWS DynamoDB**: Fully managed AWS IoT infrastructure.
3. **Monolithic Go/Rust MQTT Backend**: Custom monolithic broker handling both TCP sockets and database access.

## 3. Selected Approach & Technical Reason
We select **Hybrid Supabase + EMQX Enterprise Broker**. EMQX clusters terminate 1M+ TCP/MQTT hardware connections using Redis in-memory SASL authentication, while Supabase provides RLS database security and serverless Edge Functions for API routes. Decoupling hardware MQTT sockets from database pools prevents DB pool exhaustion during mass reconnect storms.

## 4. Operational Consequences
- **Positive**: Exceptional scale (EMQX handles 1M+ MQTT nodes); robust database-enforced tenant security; cost-effective serverless API execution.
- **Negative**: Requires orchestrating two primary cloud elements (Supabase project & EMQX cluster).

## 5. Migration Consequences
Low vendor lock-in; open-source PostgreSQL and standard MQTT protocol can be migrated to self-hosted infrastructure if needed.
