# ADR-009: Cypher AI Tool Architecture & Security (Phase 0 — Revision 4.2 Implementation-Readiness Patch)

## 1. Problem Statement
Cypher AI translates natural language prompts into ecosystem actions. Allowing an LLM direct database write access or unrestricted system calls introduces prompt injection and multi-tenant security risks.

## 2. Alternatives Evaluated
1. **Schema-Constrained Tools with Server RBAC [FINAL SELECTION]**: Cypher executes typed API tool functions with mandatory server-side `home_id` RBAC checks.
2. **Direct Text-to-SQL Generation**: LLM generates raw SQL queries executed directly against PostgreSQL.
3. **Open Agentic Command Shell**: LLM executes open-ended shell/CLI scripts.

## 3. Selected Approach & Technical Reason
We select **Schema-Constrained Tools with Server-Side Authorization**. Restricting Cypher to deterministic API tool invocations validated server-side ensures that natural language ambiguity or prompt injection attacks cannot breach multi-tenant data barriers or trigger unauthorized hardware states.

## 4. Operational Consequences
- **Positive**: 100% deterministic safety; strict multi-tenant isolation; audit log clarity; stale-state awareness.
- **Negative**: Tool definitions must be updated as new capabilities are added to the product catalog.

## 5. Migration Consequences
Tools conform to standard OpenAI / Anthropic JSON function calling schemas.
