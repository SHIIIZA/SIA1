# Local Admin Demo Login Design

## Goal

Allow the TripMate admin interface to be opened locally without connecting to
Neon, while keeping the demo account isolated from deployed environments and
real user data.

## Scope

- Add an opt-in local demo authentication mode to the existing Node API.
- Configure the demo username and password through the developer's local
  `.env`; never commit or expose those credentials in frontend code.
- In demo mode, bind the server to `127.0.0.1` and issue the same kind of
  authenticated session the admin page expects.
- Leave regular Neon-backed authentication and API behavior unchanged when
  demo mode is disabled.
- Keep the admin interface's existing browser-local settings, content, and
  audit data usable in demo mode.

## Explicit limitations

Demo mode does not create or promote a Neon account, write to Neon, or provide
database-backed listings, bookings, or account management. Those API-backed
views remain unavailable without a configured Neon connection. The deployed
site is unaffected unless someone separately enables demo mode in its
environment, which must not be done.

## Verification

- Test that demo credentials authenticate and return an admin user and token.
- Test that incorrect credentials are rejected.
- Test that demo mode is disabled by default and does not change existing
  Neon-backed login behavior.
- Test that the local server binds to loopback when demo mode is enabled.
- Start the local server in demo mode and verify `/api/health`, login, and the
  admin page; confirm database-backed API operations still report unavailable.
