# SIA1 TripMate

## Local development

1. Run `schema.sql` in the Neon SQL Editor.
2. Copy `.env.example` to `.env`.
3. Put your Neon Data API key in `.env` as `NEON_API_KEY`. Never put this key in browser JavaScript.
4. Start the app from this folder:

```powershell
npm start
```

5. Open `http://localhost:3000`.

The Node server serves the HTML files and exposes the browser-safe API routes under `/api`. Authentication, users, listings, bookings, wishlists, profile updates, and host booking data are routed through Neon. The browser token is not a Neon secret.

The server creates or refreshes the Neon admin account on startup:

```text
Username: admin
Password: admin1234
```

Change these values in `server.js` before production if this is more than a school/demo deployment.

## Production deployment

Netlify hosts the static frontend. The Node API must run separately because Netlify does not keep `server.js` running as a normal server.

1. Deploy the repository to Render using `render.yaml`, or create a Render Node web service manually.
2. Set these Render environment variables:

```text
NEON_API_URL=https://ep-super-king-b3dwl2jz.apirest.c-4.ap-southeast-1.aws.neon.tech/neondb/rest/v1
NEON_API_KEY=<your Neon Data API key>
JWT_SECRET=<long random secret>
FRONTEND_URL=https://<your-site>.netlify.app
```

3. Push the repository and deploy the project to Netlify. `netlify.toml` proxies `/api/*` to the Render service, so the browser continues using the same `/api` paths locally and in production.
4. If Render assigns a different service URL than `https://tripmate-api.onrender.com`, update the `to` value for the `/api/*` redirect in `netlify.toml` before deploying Netlify.
5. Run `schema.sql` in Neon before registering users or creating listings.

Check the API deployment at `https://<your-render-service>.onrender.com/api/health`.

Never commit `.env` or the Neon API key. The included `.gitignore` protects the local secret file.

