# Engineering Evidence & Verification Plan

**Status:** Checklist; not measured results. No production SLO claims.

| Evidence | How to verify | Current state |
|---|---|---|
| API P95 latency | Load test on synthetic tutor requests; report sample size, concurrency, hardware | Not measured |
| AI timeout rate | Fault injection and log aggregation, count timeout / requests | Not measured |
| Fallback success | Force inference unavailable; verify curated teaching content returns | Not verified |
| Grade protection | Attempt grade mutation from AI identity; verify rejection and audit | Not verified |
| Rollback recovery | Deploy synthetic bad revision; disable flag/revert image; smoke test | Not verified |
| Answer quality | Fixed synthetic evaluation set, rubric, human review and source checking | Not measured |
| Cost | Record NAS resource usage, optional cloud cost with budget alerts | Not measured |
| RAG access control | Test unauthorized retrieval with synthetic documents | Not implemented / not verified |

## Evidence levels
1. Designed — architecture and trade-offs documented.
2. Implemented — code and deployment exist.
3. Tested — repeatable commands, outputs, date, environment and results recorded.
4. Operationally verified — production-like monitoring and recovery demonstrated.

## Release gate
Do not claim reliability, security, AI quality or cost performance without repeatable evidence. Publish sanitized screenshots or reports only.
