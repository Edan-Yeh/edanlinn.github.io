# ADR-001 — Separate AI Tutor inference from Spring Boot core API

**Status:** Proposed; not yet validated in deployment.  
**Date:** 2026-10-16  
**Decision owners:** Cloud SA Academy project.

## Context
The Academy currently uses Vue + Spring Boot + PostgreSQL on NAS Docker. AI workloads need Python tooling, model dependencies and variable compute time. Official grades and authentication must remain stable.

## Options
| Option | Benefits | Costs / risks |
|---|---|---|
| A. Implement inference in Spring Boot | One service to deploy; existing Java stack | AI library compatibility, resource contention, coupled release cycle |
| B. Separate Python FastAPI microservice | Python AI ecosystem, fault isolation, independent deployment, clear trust boundary | Extra container, inter-service authentication, networking, tracing and operations |
| C. External hosted AI API only | Minimal local model operations, fast prototype | Variable cost, vendor dependency, latency, external data-transfer governance |

## Decision
**Prefer B for the proposed first iteration**, subject to NAS resource and latency validation. Spring Boot remains the sole authority for official scoring, permissions and database writes. FastAPI returns advisory teaching output and has no direct permission to update grades.

## Consequences
- Add timeout/fallback, service identity, health checks and correlation IDs.
- Keep AI feature behind a toggle to allow rollback without affecting exams.
- Start with a low-cost CPU-based or authorized service approach, measure before buying GPU capacity.
- Reassess if operational complexity outweighs isolation benefits.

## Validation
Test a forced AI timeout, forbidden grade write, safe release rollback, model/prompt version traceability, and fallback completion. Document actual measured results; **none are claimed here**.
