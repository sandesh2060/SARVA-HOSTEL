# API overview

Base path: `/api` (health check at `/api/health` and `/health`).
SARVA Super Admin integration lives under `/integration/sarva` and
requires the `X-SARVA-Integration-Secret` header — never call it from
the browser.

All authenticated routes take `Authorization: Bearer <jwt>`. The hostel
is always resolved server-side from the logged-in user, never trusted
from the request body/query.

## Auth
- `POST /auth/register-hostel`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /me`

## Students
- `GET /students?q=` , `POST /students`, `PATCH /students/:id`, `GET /students/:id`
- `POST /students/:id/photo`, `POST /students/:id/documents`,
  `GET /students/:id/documents`, `DELETE /students/:id/documents/:documentId`
- `POST /students/:id/invoices`, `POST /students/:id/checkout`

## Billing / payments / credit
- `POST /invoices/:id/pay`
- `POST /payments/split`, `GET /payments`, `GET /payments/:id/receipt`,
  `POST /payments/:id/reverse`
- `GET /credits/summary`, `POST /credits/:studentId/repay`

## Rooms
- `GET /rooms/overview`, `POST /rooms`, `POST /rooms/:roomId/beds`,
  `POST /rooms/assign`, `POST /rooms/transfer`

## Operations
- `GET/POST /expenses`, `GET/POST /stock`, `POST /stock/:id/move`
- `GET /attendance/day`, `PUT /attendance/:studentId/day`
- `GET/POST /staff`, `GET /salaries`, `POST /salaries/pay`
- `POST /broadcast`, `GET/POST /notifications`

## Insight
- `GET /dashboard`, `GET /analytics`, `GET /analytics/trend`,
  `GET /reports/:type`, `GET /reports/monthly`, `GET /audit`

## Student portal (requires `student_portal` capability)
- `GET /student-portal/me` — resolves the logged-in student's own
  record server-side; never accepts an arbitrary student id.

## SARVA integration
- `GET /integration/sarva/hostels`, `GET /integration/sarva/hostels/:id`
- `PATCH /integration/sarva/hostels/:id/status`
- `PATCH /integration/sarva/hostels/:id/plan`
- `PATCH /integration/sarva/hostels/:id/capabilities`
- `GET /integration/sarva/plans`
