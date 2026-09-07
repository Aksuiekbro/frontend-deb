# Participant Results Visibility

## Goal

Correct the `Hidden from participants` switch so that it controls published
standings and bracket outcomes, not access to the tournament itself.

## Acceptance Criteria

- A tournament with `disabled=true` remains listed and its detail page and
  ordinary tournament resources remain reachable.
- Only completed outcomes/standings are withheld from non-organizers while the
  switch is off; organizer result entry and exact score access are unchanged.
- When the switch is on, non-organizers can see published win/loss outcomes,
  but not private speaker scores or participant-score details.
- The Results tab tells non-organizers that results are not published instead
  of rendering an empty or misleading table.
- The switch, toasts, and accessibility label describe results visibility.

## Scope

`frontend-deb` and `debetter-backend-sync`; no schema migration is required.
