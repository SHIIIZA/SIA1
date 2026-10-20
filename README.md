# SIA1 TripMate

## Local development

1. Run `schema.sql` in the Neon SQL Editor. Re-run it after pulling schema changes; it uses `IF NOT EXISTS` migrations for admin user status fields.
2. Copy `.env.example` to `.env`.
3. Put the pooled Neon PostgreSQL connection string in `.env` as `DATABASE_URL` (or `NEON_DATABASE_URL`). `NETLIFY_DATABASE_URL` is supported only when configuring the same Neon connection as a Netlify deployment variable. Never put this secret in browser JavaScript.
4. Start the app from this folder:

```powershell
npm start
```

5. Open `http://localhost:3000`.

The local Node server serves the HTML files and exposes the same browser-safe TripMate API routes under `/api` for development. In production, those routes run through the Netlify Function in `netlify/functions/api.js`, which uses the Neon serverless HTTP client server-side. The browser token is not a Neon secret.

The server creates or refreshes the Neon admin account on startup:

```text
Username: admin
Password: admin1234
```

Change these values in `server.js` before production if this is more than a school/demo deployment.

The admin panel now includes protected user management endpoints under `/api/admin/users`. They require an admin JWT and never return password hashes.

## Netlify deployment

Netlify hosts both the static frontend and the API bridge. The function keeps Neon credentials out of browser JavaScript.

1. Run `schema.sql` in the Neon SQL Editor.
2. Create a Netlify site from this repository. Netlify automatically detects `netlify.toml` and deploys `netlify/functions/api.js`.
3. Set these Netlify environment variables for the site and deploy contexts:

```text
NETLIFY_DATABASE_URL=<your Neon pooled PostgreSQL connection string>
JWT_SECRET=<long random secret>
PAYMONGO_SECRET_KEY=sk_test_<your PayMongo secret key>
FRONTEND_URL=https://trypmate.netlify.app
```

4. The `/api/*` rewrite in `netlify.toml` forwards to the `api` Netlify Function, so frontend calls continue using the existing relative `/api` paths.
5. Verify the deployed bridge at `https://trypmate.netlify.app/api/health`.
6. In PayMongo's Settings → Webhooks, add `https://trypmate.netlify.app/api/webhooks/paymongo` and subscribe to `checkout_session.payment.paid`. Use a PayMongo secret key in the same test/live mode as the webhook. The handler retrieves the session from PayMongo before marking a booking paid, and repeated deliveries are safe.

For local Netlify-style testing, install the Netlify CLI and run `npm run netlify:dev`. The existing `npm start` command remains available for testing the local Node server directly.

Checkout uses PayMongo Checkout Sessions for cards, GCash, and Maya. Keep `PAYMONGO_SECRET_KEY` and the Neon credentials in server or Netlify environment variables only. Use a `sk_test_` key while testing and switch to a live key for production. Never commit `.env` or add payment/database secrets to frontend JavaScript.

Signed-in users can save, reload, and delete stay-search filters through the `/api/saved-searches` endpoints. These searches are account-backed and require the existing Neon `saved_searches` table from `schema.sql`.

Run the focused payment-webhook checks with `node --test server.test.js tests/netlify-api.test.js`. Keep test files outside `netlify/functions/`, where Netlify discovers deployable functions.

## Offline website and Android branding

The website can be installed as a PWA from its public, account, host, and admin pages. Its service worker caches the static shell and assets only; requests to `/api/*` are always sent to the network and are never stored for offline use. The offline page explains that booking/account data is unavailable without a connection.

The Android Capacitor bundle is synchronized from the repository's current website by `node mobile-app/scripts/build-web.mjs`. The launcher icon and Android 12+ splash use the TripMate palm-tree artwork supplied with the app assets. Run the Android Gradle build only when the Android build workspace is available for modification.
