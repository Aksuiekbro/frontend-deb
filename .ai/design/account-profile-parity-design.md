# Account profile parity: design contract

Doer: primary Codex agent. Independent review required before build.

## Profile UI and API

Retain PATCH /users/{id} returning UserResponse. EditProfileForm receives the current user and an async onSave(UserUpdateRequest) callback from ProfileClient. It opens from an owner-only Edit profile control, with nickname, first name, last name, and email fields, labeled inputs, Save/Cancel, pending state, and accessible error/success feedback. Cancel discards edits. Trim account text only. Send changed fields, avoiding accidental writes of unrelated profile/password properties. No-op edits do not issue a PATCH.

Validate nickname against ASCII alphanumeric 3–20, email format/max50, names nonblank/max50. Match backend boundaries. Preserve typed input on errors; prevent duplicate submissions. The parent uses api.updateUser(user.id, patch), requires an OK response, and refreshes both the viewed profile and current-user SWR state. Saving must not depend on a page reload. Revalidation failure after successful persistence must not be misreported as an unsaved mutation. Retain meaningful 400/401/403/409/network feedback without exposing server internals.

Only a resolved authenticated owner can render profile editing, password editing, logout, and the existing disabled delete action. Leave existing public data visibility unchanged. Profile controls should not flash while the current user is loading. English/Russian/Kazakh copy follows existing translation catalogs.

Key owner forms by authenticated user ID and viewed profile ID so navigation or account changes remount them. Reset unsaved fields and clear password secrets on cancellation, unmount, or identity change. Guard asynchronous results with an active-request generation or equivalent: a response to a canceled, replaced, or unmounted form must not set success/error in the new form or mutate a different account's current-user cache. Check the current owner identity before applying a response; an in-flight server mutation is not undone by dismissing a form. Tests must resolve a pending request after route/account changes and after cancel/reopen.

## Password UI

ChangePasswordForm receives userId and, if needed, an optional success callback. It owns its api.updateUser call with exactly oldPassword/newPassword. Use current/new/confirm fields, appropriate autocomplete, 8–32 bounds, exact untrimmed password comparison, confirmation validation, pending/error/success feedback, and clearing secrets on success/cancel. It also clears fields and invalidates pending UI callbacks when its userId prop changes, even if a caller does not remount it. Never place passwords in URL, logs, storage, or SWR. Parent renders this component only for the owner. Remove the href=# recovery link and its unused translations from the auth form; no recovery functionality is implied.

## Backend profile mutation

Normalize supplied nickname/email/names without altering case semantics; preserve omitted/null fields. Validate supplied values only. Align first/last name bounds with registration. Permit nickname mapper changes while explicitly keeping password assignment in the password service path. Detect conflicting nickname/email excluding the same user, retain DB uniqueness protection, and make updates atomic, including mixed password/profile failures. Keep current-user cache invalidation keyed by stable ID.

For a rename, invalidate persistent tokens indexed by the prior username. Refresh the current owner's security principal and save the updated context, preserving ID and authorities. Document clearing or renewing the current remember-me cookie. An admin editing another user must not adopt that identity. Verify subsequent new-name login and rejection of old-name login. Tests must cover real mapper behavior and persistence, not mocks that repeat the implementation.

## Login and persistent authentication

AuthProvider must throw a consistent bad-credentials error for unknown username/wrong password and return authenticated tokens with no plaintext credentials on success. Handle absent credentials with deliberate 4xx, never a null-pointer 500. Only authenticated results may be saved to the security context or passed to remember-me success. Active JSON authentication error handling returns safe identical 401 messages for incorrect credentials. Preserve successful registration auto-login.

Honor only the existing explicit JSON rememberMe opt-in when issuing persistent tokens, without requiring a hidden query parameter. False/omitted opt-in does not create a persistent cookie. Verify cookie-only login, failed authentication, logout revocation, expiry, and coordination with rename token revocation. Use installed Spring APIs or primary documentation; avoid speculative framework changes.

## Delivery and review

Inspection confirmed that JDBC remember-me storage lacks a tracked table migration. The backend implementer authored backend/.ai/design/account-profile-parity-token-addendum.md, independently approved in review 03. It specifies an additive idempotent persistent_logins table/index migration and narrow token/session helpers, including a shared provider key and JSON-only opt-in. Verify migration inclusion and preservation of compatible existing tables. Frontend and backend must be deployed together for nickname persistence; deployment is not performed in this task. A return to the prior frontend removes the new controls; the additive token table can remain on rollback, and backend API changes remain compatible with existing clients. Review all seven issue acceptance criteria, ownership, original clean baselines, test logs, and browser screenshots before handoff.
