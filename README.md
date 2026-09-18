# SIA1 TripMate

## Local development

1. Run `schema.sql` in the Neon SQL Editor.
2. Copy `.env.example` to `.env`.
3. Put the pooled Neon PostgreSQL connection string in `.env` as `NETLIFY_DATABASE_URL`. `DATABASE_URL` is also accepted locally. Never put this secret in browser JavaScript.
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

## Netlify deployment

Netlify hosts both the static frontend and the API bridge. The function keeps Neon credentials out of browser JavaScript.

1. Run `schema.sql` in the Neon SQL Editor.
2. Create a Netlify site from this repository. Netlify automatically detects `netlify.toml` and deploys `netlify/functions/api.js`.
3. Set these Netlify environment variables for the site and deploy contexts:

```text
NETLIFY_DATABASE_URL=<your Neon pooled PostgreSQL connection string>
JWT_SECRET=<long random secret>
FRONTEND_URL=https://<your-site>.netlify.app
```

4. The `/api/*` rewrite in `netlify.toml` forwards to the `api` Netlify Function, so frontend calls continue using the existing relative `/api` paths.
5. Verify the deployed bridge at `https://<your-site>.netlify.app/api/health`.

For local Netlify-style testing, install the Netlify CLI and run `npm run netlify:dev`. The existing `npm start` command remains available for testing the local Node server directly.

Never commit `.env` or the Neon connection string. The included `.gitignore` protects the local secret file. Do not add Neon variables to frontend JavaScript.

