# SARVA Hostel Master Completion Patch

This patch extends the current SARVA Hostel baseline with production-oriented remaining workflows: payment allocation/split tender APIs, receipt data, room/bed assignment history and transfers, attendance day sheets, salary settlement with optional linked expenses, controlled student checkout, broadcast delivery logging, report center endpoints, audit history, student self-service isolation, billing UI, occupancy UI, salary UI, broadcast UI, report export UI and student profile UI.

## Safety invariants
- Tenant identity is resolved from authenticated user/hostel context.
- Financial history is not hard-deleted.
- Bed assignment prevents an already occupied bed from being assigned again.
- Student portal resolves the logged-in student's profile server-side.
- Salary-linked expenses carry a salary reference to prevent ambiguous duplicate accounting.
- Existing Cloudinary student media configuration remains the single upload path.

## After applying
Run `npm install`, configure the server environment, then run `npm run dev`.
