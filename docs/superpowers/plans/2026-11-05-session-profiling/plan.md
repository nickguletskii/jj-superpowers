# Passive session profiling

Approved design: record tool and exposed model lifecycle timings without changing execution; retain Cargo/Bazel results; export Chrome Trace JSON and summarize bottlenecks. Missing observations remain unknown. No command cache, suppression, or model-body capture.

Implementation: dependency-free Node recorder/exporter; thin opt-in adapters for four harnesses; session-performance skill. Per-event files avoid concurrent append corruption. Session and event names are hashed for safe paths. Durable records are outside the checkout. Tests use temporary roots and synthetic overlapping, incomplete, failed, and background operations. Adapter fixtures validate normalization; live harness support remains separately qualified.

Tasks and verification are described in the graph. Existing unrelated changes must remain intact.

## Verification result

Recorder, four opt-in adapters, documentation, README routing, and the session-performance skill are implemented. Targeted checks passed: `node --test tests/session-profile.test.ts tests/profile-adapters.test.ts tests/skill-consolidation.test.ts`, whitespace checks, and CLI summary/export smoke checks with overlapping parent/child fixtures. Read-only review found ordering, overlap-lane, stderr capture and OMP attribution/correlation issues; all were fixed and the final review had no blocking findings. No live harness end-to-end runs or global settings changes were performed. Skill scenarios were reviewed by its author, not independently baseline-tested; this remains a validation limitation.
