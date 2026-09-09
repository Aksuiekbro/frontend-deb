# Account profile parity: findings and decisions

Doer: primary Codex agent. Independent reviewers: backend_audit and competitor_research.

ProfileClient renders account identity as static text. The API client exposes PATCH /users/{id}, but the backend mapper ignores username. Merely adding a form would report success without changing the nickname. Update validation differs from registration and admits malformed email and blank names. These defects must be corrected together.

The existing password update contract already checks the old password, but has no user interface. A separate owner-only password form can reuse it without introducing recovery infrastructure. The profile footer currently shows Logout and disabled Delete on every profile; those controls belong only to the current owner's account. A Forgot password link points to # and has no recovery backend, so removing that broken action is a bounded truthful fix.

Two authentication bugs surfaced during inspection: incorrect passwords produce a null authentication yet a successful HTTP response; remember-me opt-in is JSON while the configured service checks form parameters. They directly affect editing credentials and logging back in, so they are included.

Retain the existing user-ID-based permissions and API shape. Nickname changes preserve the ID and tournament relationships. Persistent tokens are username-indexed, so old tokens must be revoked before an old username can be reused. Current session identity must remain usable and an admin editing another account must retain the admin identity. This warrants the repository's complete artifact and independent review path.

Do not broaden this fix into public-profile privacy, email verification, or account recovery architecture: those have distinct product and data contracts. Subsequent inspection found missing JDBC token storage; the independently reviewed backend token addendum adds the required persistent_logins table migration. Match existing username case semantics and password rules.
