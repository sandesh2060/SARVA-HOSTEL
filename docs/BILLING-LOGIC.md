# Billing logic

## Invariants
- An `Invoice` is an immutable snapshot: `total` is fixed at creation
  time from the student's fee at that moment. Changing
  `Student.monthlyFee` later never rewrites past invoices.
- `Invoice.paid` + `Invoice.balance` always equals `Invoice.total`.
- Monthly invoice generation (`server/src/jobs/billing.js`) is
  idempotent: it upserts on `{hostelId, studentId, periodKey}` with
  `$setOnInsert`, so running the cron twice (or after a crash) never
  creates a duplicate invoice for the same month.
- A `Payment` is never edited to represent a different amount. A wrong
  payment is reversed (`POST /payments/:id/reverse`, requires a reason)
  which restores the invoice's outstanding balance and keeps the
  original payment row, marked `status: reversed`, in history.
- Outstanding balance is never re-invoiced as a new charge — it is read
  directly from `Invoice.balance` and, in aggregate across students,
  surfaced as the credit ledger (`GET /credits/summary`).

## Split / partial payments
`POST /payments/split` accepts multiple tenders (e.g. cash + manual QR)
in one call, allocates them oldest-invoice-first, and creates one
`Payment` row per tender plus a `PaymentAllocation` row per
invoice/tender pairing — so a single collection event that splits across
methods still shows up as distinct, auditable payment records.

## Multi-record consistency
Payment creation/reversal, credit repayment, room assignment/transfer,
and student checkout each run inside a MongoDB session
(`session.withTransaction`), so a Payment is never created without its
matching Invoice update, and a bed is never marked occupied without a
committed `RoomAssignment`.
