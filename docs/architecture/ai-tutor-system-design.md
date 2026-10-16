# Cloud SA Academy — AI Tutor System Design (Design v1)

**Status:** Proposed architecture / implementation not verified.  
**Date:** 2026-10-16  
**Priorities:** low cost, isolation, auditability, graceful degradation, data integrity.

## 1. Context
Existing application: Vue frontend, Spring Boot API, PostgreSQL, NAS Docker. The AI Tutor is a proposed Python FastAPI microservice. It should augment explanations and practice without becoming the authority for formal grades.

## 2. Requirements
- Authenticate and authorize in Spring Boot, not in the model.
- Protect grades: AI may propose feedback, but must not directly write official grades.
- Do not allow inference failures to block login, official quizzes, or saved progress.
- Trace requests with correlation IDs while minimizing sensitive log content.
- Prefer existing NAS resources and no paid GPU until a measured need exists.
- Only synthetic or authorized anonymized examples; no IBM/CTBC confidential information.

## 3. Request flow
```text
Browser (Vue)
  | HTTPS + session/token
  v
Spring Boot API
  | AuthN/AuthZ, rate limit, request ID, input validation
  |---> PostgreSQL (authorized business writes, grades, audit)
  |
  | internal network / limited service identity
  v
FastAPI AI Tutor
  | prompt template + authorized context
  | inference with timeout and output validation
  v
Spring Boot (policy / response validation)
  |
  v
Vue (explanation or fallback)
```
The diagram describes a target design, not a verified running deployment.

## 4. Reliability and degradation
- Define explicit latency budget and timeout; **5 seconds is an illustrative starting value, not a measured SLO**.
- On timeout, 5xx, invalid response, or overload: return curated static explanation or non-AI study mode.
- Bound concurrency and retries; never retry non-idempotent grade writes as an AI operation.
- Apply circuit breaking if repeated failures; keep existing quiz and grade paths independent.
- Log correlation ID, service/model/prompt/deployment version, duration, outcome and fallback reason; redact inputs and credentials.

## 5. Grade integrity
- FastAPI service has no direct DB write permission for grades.
- Spring Boot enforces RBAC, scoring rules, transaction boundaries and audit records.
- AI-generated feedback is clearly marked advisory; teacher review is separate.
- Use least-privilege DB roles and migration review.

## 6. Rollout, rollback, and data recovery
1. Use backward-compatible schema changes (Expand–Migrate–Contract).
2. Release AI Tutor behind a feature flag; test with synthetic data.
3. Monitor availability, timeouts, invalid output, fallback use, and feedback quality.
4. On regression, disable AI feature and revert its container image to known-good version.
5. Investigate impact using request IDs and version metadata; verify official grades remain unchanged.
6. Correct affected records through authorized, auditable procedures. Do not restore a shared production database solely for a small number of incorrect AI responses.
7. Run smoke tests and review evidence before re-enabling traffic.

## 7. Security boundaries
- Internal-only FastAPI endpoint; no direct browser-to-inference access.
- Authorization for retrieval must be enforced before RAG documents are sent to the model.
- Prompt injection, data leakage, PII, rate limiting, logging retention and dependencies require review.
- Never send confidential banking or employer material to external models.

## 8. Cloud alternatives — non-equivalent
| Need | AWS | Azure | GCP | Trade-off |
|---|---|---|---|---|
| Managed container service | ECS + Fargate | Container Apps | Cloud Run | Different scaling, revision and network models |
| Object storage for authorized docs | S3 | Blob Storage | Cloud Storage | IAM, egress, retention and region considerations |
| Metrics/logs | CloudWatch | Azure Monitor | Cloud Logging/Monitoring | Costs and integrations vary |

The NAS Docker option is the low-cost baseline. Managed cloud is a future comparison, not a current deployment claim.

## 9. Acceptance criteria
- An AI timeout does not prevent core quiz submission.
- A synthetic unauthorized grade-update attempt is rejected.
- A rollback leaves formal grades unchanged.
- Request IDs link a test request to sanitized logs.
- A small synthetic incident can be investigated and reconciled.
- Benchmarks, cost and security checks are recorded before claiming production readiness.

## 10. Open decisions
- Local model vs external model; available RAM/CPU and latency measurements.
- Retrieval storage (Postgres/pgvector vs dedicated vector DB).
- Model quality evaluation set and review criteria.
- Authentication between Spring Boot and FastAPI.
- Data retention and recovery objectives.
