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

Run the focused payment-webhook checks with `node --test server.test.js tests/netlify-api.test.js`. Keep test files outside `netlify/functions/`, where Netlify discovers deployable functions.

## Android mobile app

The app in `mobile-app/` uses Node.js build scripts, Sass/SCSS for a small native-WebView layer, Capacitor, and a Gradle Android project. Its web bundle is built directly from the existing website HTML, CSS, JavaScript, images, and host pages so mobile uses the same TripMate design and existing account flows rather than a duplicate UI. The bundled pages call the same Netlify `/api` backend as the website; account, bookings, wishlist, and wallet data remain in Neon, and no database/payment secrets are shipped in the APK.

Install the Node dependencies with `npm.cmd install` from `mobile-app/`, then create/update and build the APK with `npm.cmd run android:build`. This generates the Android launcher icon from the logo mark in `images/tripmate.svg` (without the wordmark), builds the website/SCSS bundle, syncs Capacitor, and uses Gradle to create `mobile-app/android/app/build/outputs/tripmate/TripMate.apk`. Android SDK Platform 35 and Build Tools 35.0.0 are required. Changes to the website files or logo are picked up on the next Android build. The mobile WebView origin `https://localhost` is explicitly allowed by the API for Capacitor requests; unrelated origins remain disallowed.
