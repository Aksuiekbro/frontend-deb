# Profile and password editing

The profile owner can open **Edit profile** to change their nickname, first name, last name and email, or **Change password** to update their password using the current one. Both forms validate input, preserve useful error feedback, and discard drafts when the active account or profile changes. Account-management controls are shown only on the owner's profile.

The screenshots below were captured from a production frontend build with synthetic local API responses. They show UI behavior and layout, not a production user's account or deployed backend integration.

- [Saved profile on desktop](profile-saved-desktop.png)
- [Russian profile editor on mobile](profile-edit-ru-mobile.png)
- [Kazakh password editor on mobile](password-edit-kk-mobile.png)

The isolated Playwright account suite covers these forms, save/reload behavior, rejected updates, password clearing and owner boundaries. Run it with `npx playwright test --config playwright.account.config.ts` after building with `NEXT_PUBLIC_API_URL=/api` and preview/demo modes disabled. It starts a local frontend on port 3108 and fulfills API calls with test fixtures.

The frontend requires the companion backend account fixes, including nickname persistence and the persistent-login migration. The removed Forgot password link did not have a recovery backend; email-based recovery is a separate future capability.
