# Specifying User Interfaces

How to express screens, forms, editors, and dashboards as observable behavior inside the existing `SPEC.yaml` sections. UI gets no new keys.

Specify what the component code can't show: which states exist, which transitions are legal, what an interaction guarantees, when an error or progress signal must appear. Don't transcribe props or markup.

- Transcription (cut): "the SaveButton has props `disabled`, `loading`, `label`."
- Contract (keep): "While a save is in flight, the surface MUST reject a second save submission and MUST show progress until the save resolves or fails."

## Where UI lives

| Section | UI content |
|---------|------------|
| `actors_and_surfaces` | Each surface: purpose, entry/exit, and what it MUST let the user do or see. Not layout. |
| `state_and_lifecycle` | State machines, in the notation below. |
| `requirements` | Event → effect interaction contracts; widget guarantees; progress and responsiveness. |
| `failure_modes` | Each failure's condition and what the user observes — not just an HTTP code. |

A widget needs a requirement only when it carries a guarantee clients depend on ("the amount field MUST reject non-monetary input inline without discarding other values"). A keyboard shortcut is normative only when it is a guaranteed binding ("Esc MUST cancel an in-progress capture"), not when it mirrors a visible control.

## State machines

Name the initial and terminal states, transitions as `event [guard] → target / effect`, and transitions that must be impossible. The most valuable content is async and timing semantics: what happens to input during a save, whether stale responses are ignored, how rapid events are coalesced.

## Cross-cutting rules

State these as requirements or invariants — contracts, not mechanisms like web workers:

- Errors are never swallowed (console-only or silent).
- Any operation with a perceptible delay reports progress — determinate when the total is known — and is cancelable where applicable.
- The surface stays interactive while work is in flight.

## Worked example

```yaml
state_and_lifecycle: |
  States: Empty, Extracting, Review, Saving, Error. Initial: Empty.
  Transitions (event [guard] → target / effect):
    addReceipt        → Extracting   / extraction begins, progress shown, UI stays interactive
    extracted         → Review       / fields prefilled; low-confidence flagged (ERR-EXP-001)
    extractFailed     → Error        / ERR-EXP-003 surfaced; allow manual entry
    save [valid]      → Saving       / persist begins, progress shown
    saved             → (list)
    saveFailed        → Error        / ERR-EXP-002 surfaced; edits preserved; retry offered
  No transition leaves Saving except saved or saveFailed. During Extracting/Saving
  the surface MUST stay interactive and MUST ignore stale extraction responses for
  a receipt the user has replaced.

requirements:
  - id: REQ-EXP-001
    summary: Invalid amount handling
    level: MUST
    text: |
      Submitting with a non-monetary amount MUST surface ERR-EXP-004 inline at the
      amount field, keep the user on Review, and preserve all other fields.

failure_modes:
  - code: ERR-EXP-001
    condition: OCR extraction returns low-confidence fields
    behavior: Surface affected fields as warnings inline; allow save; do not block.
  - code: ERR-EXP-002
    condition: Save fails (network/permission)
    behavior: Enter Error; show actionable message; preserve edits; offer retry.
```
