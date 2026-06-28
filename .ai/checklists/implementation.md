# Implementation Checklist

The build doer runs through this before `/gate4-build`.

- [ ] Change is one small, logically coherent slice from the approved plan.
- [ ] Scope matches the task, plan, and design.
- [ ] Every changed line traces to the task.
- [ ] No drive-by refactors, style churn, or speculative abstractions.
- [ ] Existing conventions and helpers are reused.
- [ ] Accessibility is considered for any UI: keyboard navigation, focus states, labels, contrast,
      and responsive layouts.
- [ ] `make verify` passes, or failing checks are proven pre-existing on the base branch.
- [ ] No debug code, stray logs, commented-out blocks, leftover TODOs, secrets, or credentials.
- [ ] Diff is small enough to review well; otherwise split the slice.
