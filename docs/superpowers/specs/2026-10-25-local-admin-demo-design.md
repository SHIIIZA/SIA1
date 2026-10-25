# Local Admin Demo Login Design

## Goal

Let a developer enter the existing browser-local TripMate admin demo from the
login page when running the site on localhost, without configuring or changing
Neon.

## Approach

- Add a clearly labeled local-demo entry to the login page, visible only when
  the page hostname is `localhost` or `127.0.0.1`.
- The entry creates the existing `local-demo-admin` browser token and a
  browser-local admin user/session, then opens `admin.html`.
- Update the shared auth helper so it preserves this explicit demo session
  instead of immediately clearing it.
- Reuse the admin page's existing localStorage-backed demo behavior, which
  already skips Neon-backed admin-data synchronization for this token.
- Keep remote-host login and normal Neon-backed authentication unchanged.

## Security and limitations

This is a UI-only demo session, not an authenticated Neon account and not a
way to grant production privileges. It is available only on loopback hostnames
and stores its demo state in the current browser. Listings, bookings, account
management, and other Neon-backed operations remain unavailable in this mode.
No database credentials, account roles, or Neon data are read or modified.

## Verification

- Test that the demo entry is available on `localhost` and `127.0.0.1`, but
  hidden for remote hostnames.
- Test that choosing demo entry stores the expected admin user, session, and
  `local-demo-admin` token, then navigates to `admin.html`.
- Test that loading the shared auth helper preserves this demo session.
- Test that regular API login and normal auth refresh behavior are unchanged.
- Run the focused UI regression tests and manually verify the localhost demo
  flow; confirm Neon is not contacted by the demo entry.
