# RFC2119 in Specs — Cheatsheet

Use these terms in their RFC2119 senses. Capitalize when normative.

| Term | Meaning | When to use |
|---|---|---|
| **MUST** / **REQUIRED** / **SHALL** | Absolute requirement | The thing breaks if this isn't followed. |
| **MUST NOT** / **SHALL NOT** | Absolute prohibition | Doing this violates the contract. |
| **SHOULD** / **RECOMMENDED** | Strong preference; exceptions need a reason | Sensible default; deviation must be deliberate. |
| **SHOULD NOT** / **NOT RECOMMENDED** | Strong negative preference | Deviating is allowed in known edge cases. |
| **MAY** / **OPTIONAL** | True optionality | Implementations may freely include or exclude. |

## Patterns

- **Stating a guarantee**: "The system MUST reject uploads larger than 2 GiB with error code `UPLOAD_TOO_LARGE`."
- **Stating a default with permitted variation**: "Implementations SHOULD return results in upload-time order; reverse-chronological MAY be offered as an option."
- **Stating a prohibition**: "The upload path MUST NOT perform full table scans."
- **Stating a negotiation**: "If the client requests format `X`, the server MUST respond with `X` if supported and SHOULD respond with the closest supported format otherwise."

## Common mistakes

- **Lowercase "should"**: ambiguous. Use SHOULD when you mean it normatively, plain English otherwise (in non-normative sections).
- **MUST mixed with implementation detail**: "The system MUST use Postgres" — wrong. "The system MUST persist records durably across restarts" — right.
- **MAY for things that are actually MUST**: "Implementations MAY validate inputs" — usually a hidden MUST. Be honest.
- **MUST without an observation**: "The system MUST be efficient" — not testable. Restate as an externally observable contract ("p99 < 100 ms at 10k QPS").

## Negative wording

Prefer positive form when possible. "MUST reject" is clearer than "MUST NOT accept". But for prohibitions on the system's behavior (vs. the input it receives), MUST NOT is correct: "The upload path MUST NOT perform full scans."

## In code-as-spec doc comments

Same rules. Native doc format (rustdoc / jsdoc / javadoc), RFC2119 capitalization.

```rust
/// REQ-INF-014: Submit an inference job.
///
/// The implementation MUST validate `payload.size` before enqueueing.
/// The implementation MUST NOT block the caller for longer than `submit_timeout`.
/// The implementation MAY batch concurrent submissions internally.
pub fn submit(payload: Payload) -> Result<JobId, SubmitError>;
```
