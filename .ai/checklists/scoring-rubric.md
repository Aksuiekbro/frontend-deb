# Review Scoring Rubric

Every review by Opus or GPT Codex ends with a score out of 10 and a status.

## Bands

| Score | Status | Meaning |
|-------|--------|---------|
| 9.0-10.0 | APPROVED | Good to proceed. |
| 8.0-8.9 | BLOCKED | Close, but Must Fix items remain. |
| 6.0-7.9 | BLOCKED | Meaningful correctness, design, privacy, or test gaps. |
| 0.0-5.9 | BLOCKED | Failed review; significant rework likely needed. |

## Hard Caps

- Any Must Fix caps the score at `8.9`.
- Any security, privacy, data-loss, or build/test-breaking issue caps the score at
  `7.9` or lower.
- A review may score `>= 9.0` only when no Must Fix issues remain.

## Principle Violations

| Principle violated | Severity |
|--------------------|----------|
| Surgical Changes - unrelated edits, drive-by refactors, style churn | Must Fix |
| Surgical Changes - misunderstood edits that break behavior | `7.9` or lower |
| Goal-Driven Execution - new behavior without verifiable success criteria or tests | Must Fix |
| Think Before Coding - silent wrong assumption affecting correctness | Must Fix |
| Simplicity First - speculative abstraction | Should Consider, unless it harms correctness or maintainability enough to rework |

## Findings Discipline

- Must Fix findings require exact evidence: `file:line`, command output, or the missing artifact.
- Uncertain issues belong in Should Consider and must not block a `9.0`.
- Failing or skipped checks count as pre-existing only if proven on the base branch.
- PR text, handoffs, examples, fixtures, and logs must contain no secrets or credentials.
