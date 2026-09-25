# Existing SARVA Super Admin Integration

The uploaded SARVA project already has `apps/admin-panel` and `apps/backend`. Keep Hostel operational data in the standalone Hostel MongoDB.

## Integration boundary
SARVA Super Admin should call the Hostel API server-to-server using `X-SARVA-Integration-Secret`. Never expose this secret in the browser.

Endpoints:
- `GET /integration/sarva/hostels`
- `GET /integration/sarva/hostels/:id`
- `PATCH /integration/sarva/hostels/:id/status`
- `PATCH /integration/sarva/hostels/:id/plan`
- `PATCH /integration/sarva/hostels/:id/capabilities`
- `GET /integration/sarva/plans`

Recommended SARVA Admin pages later:
- `/hostels`
- `/hostels/:id`
- `/hostel-plans`

Do not connect the browser directly to the Hostel DB. Add proxy/service routes in the existing SARVA backend, authenticate the current `superadmin`, then call these integration endpoints from the backend.
