# Environment variables

## Server (`server/.env` or root `.env`)
| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | no | `development` / `production` |
| `PORT` | no | defaults to 4000 |
| `HOSTEL_MONGODB_URI` | yes | dedicated DB, never share with other SARVA products |
| `JWT_SECRET` | yes | server refuses to issue/verify tokens without it |
| `JWT_EXPIRES_IN` | no | defaults to 7d |
| `CLIENT_URL` | yes in prod | used for CORS and for links in emails (reset password, reminders) |
| `HOSTEL_CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | yes for uploads | photo/document uploads return 503 if missing |
| `HOSTEL_CLOUDINARY_ROOT` | no | folder prefix, defaults to `sarva-hostel` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | yes for email | reminders, broadcast, receipts on request, forgot-password |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | not yet used | Google login button exists in the UI but is not wired up |
| `ESEWA_*` | not yet used | eSewa is selectable as a payment method but has no callback verification route yet |
| `SARVA_ADMIN_URL` | informational | not called by this service |
| `SARVA_INTEGRATION_SECRET` | yes for SA integration | required header `X-SARVA-Integration-Secret` on `/integration/sarva/*` |

## Client (`client/.env`)
| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | e.g. `http://localhost:4000/api` |
| `VITE_GOOGLE_CLIENT_ID` | unused until Google login is implemented |

Never commit real secrets in any `.env` file.
