# SARVA Hostel flow verification

This checklist must pass before production release. It complements automated validation and prevents a UI-only feature from being treated as complete.

## Student and room flow
- Register a student without a room.
- Register a student with an available bed.
- Confirm the bed becomes occupied and the active assignment is visible.
- Attempt to assign the same bed from a second session; expect HTTP 409.
- Transfer the student with a reason; confirm old bed is released and history is preserved.
- Checkout the student; confirm the active assignment closes and the bed is released.

## Finance flow
- Generate one monthly invoice and rerun billing; no duplicate invoice.
- Pay partially, then by a second method; paid + balance must always equal invoice total.
- Settle the remaining receivable and verify all payment rows remain in history.
- Reverse a mistaken payment and verify outstanding is restored.

## Tenant and capability security
- A Hostel A token must not read or mutate Hostel B records.
- Disable a capability and verify both UI and API access are blocked.
- Suspended hostels must be blocked from operational APIs.
- Student portal users must resolve only their own student record server-side.

## Operational flow
- Expense creation, stock in/out, low-stock threshold, attendance, salary payment, broadcast, reports and audit history must use real API data and surface backend failures.

## Production gate
- Run `npm run build`.
- Verify required environment variables without committing secrets.
- Test responsive layouts on desktop and mobile.
- Verify SMTP, Cloudinary, Google OAuth and eSewa with deployment credentials in their respective test/sandbox environments before enabling them in production.
