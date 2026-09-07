# Participant Results Visibility Design

`Tournament.disabled` remains the persisted setting for backwards-compatible
enable/disable endpoints.

```text
disabled = false or null -> tournament is public; non-organizers receive published outcomes
disabled = true          -> tournament is public; non-organizers receive pairings but not outcomes
organizer with EDIT/FULL -> receives exact results regardless of disabled
```

Public outcome data is limited to winners and completion needed for standings
and brackets. Speaker scores, participant-score details, organizer contact
details, and other exact score fields remain redacted for non-organizers.

The frontend keeps the Results tab available. With results hidden it replaces
the table with a localized publication notice; organizers continue to see and
edit results. The switch wording consistently names results visibility.
