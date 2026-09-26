# Capability system

`server/src/config/capabilities.js` defines, per plan, the capability
list a hostel gets by default:

- **simple**: dashboard, students, documents, payments, credit, expenses,
  stock, email_notifications, settings, reports, basic_reports
- **medium**: everything in simple, plus rooms, attendance, staff, salary,
  broadcast, operational_analytics
- **advanced**: everything in medium, plus student_portal,
  advanced_analytics, advanced_reports, automations

`Hostel.capabilityOverrides` is a `Map<string, boolean>` that a SARVA
Super Admin sets through `PATCH /integration/sarva/hostels/:id/capabilities`.
`capabilitiesFor(hostel)` starts from the plan's list and then applies
overrides (`true` adds a capability even if the plan doesn't include it,
`false` removes one even if the plan does).

Every capability-gated route uses the `requireCap('name')` middleware
(`server/src/middleware/capability.js`), which re-checks the *server's*
computed capability list — the frontend sidebar hides disabled modules,
but a disabled capability is also rejected at the API layer with
`{"code":"FEATURE_NOT_ENABLED"}`, so a hidden button can never be
worked around by calling the API directly.
