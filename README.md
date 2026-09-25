# SARVA Hostel

Standalone MERN Hostel Management SaaS designed to integrate with the existing SARVA Super Admin while keeping a separate MongoDB and dedicated Cloudinary configuration.

## Included architecture
- Hostel registration and SA approval status
- Simple / Medium / Advanced entitlement model
- Per-hostel SA capability overrides
- Owner authentication
- Student model and flexible billing cycle
- Idempotent monthly invoice generation
- Full/partial payment API and remaining-credit flow
- Credit ledger
- Expenses and stock movements
- Rooms/beds
- Attendance
- Staff/salary models and APIs
- Email reminder job via Gmail SMTP
- Dynamic hostel currency (NPR default; invoices/payments snapshot currency)
- Analytics API
- Separate SARVA integration API
- Vite + React + Tailwind frontend
- Express + MongoDB/Mongoose backend
- Render API blueprint and Vercel-ready frontend structure

## Setup
1. `cp .env.example .env`
2. Fill MongoDB, JWT and optional Cloudinary/SMTP/Google/eSewa placeholders locally.
3. `npm install`
4. `npm run dev`
5. Web: http://localhost:5173
6. API: http://localhost:4000

## Important
This starter intentionally contains no secrets. Google OAuth, Cloudinary multipart upload UI, eSewa production signing/callback verification, PDF/Excel reports and the actual patches to the existing SARVA Admin should be completed after credentials/deployment URLs are configured. The schemas and integration boundary are prepared for them.
# SARVA-HOSTEL
