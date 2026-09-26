# Setup

1. `cp .env.example .env` at the project root and fill in real values
   (never commit `.env`).
2. Required for local dev: `HOSTEL_MONGODB_URI`, `JWT_SECRET`.
3. Optional but needed for full functionality: `HOSTEL_CLOUDINARY_*`
   (student photos/documents), `SMTP_*` (email — reminders, receipts,
   password reset, broadcast), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
   (Google login — not yet wired into the UI), `ESEWA_*` (not yet
   implemented), `SARVA_INTEGRATION_SECRET` (server-to-server only,
   never expose to the browser).
4. `npm install` at the root (workspaces install both `client` and
   `server`).
5. `npm run dev` — starts the API on :4000 and the Vite dev server on
   :5173 concurrently.
6. Register the first hostel at `/register-hostel`, then approve it via
   the SARVA integration API (`PATCH /integration/sarva/hostels/:id/status`
   with `{"status":"approved"}`) since there is no admin UI in this repo.
