// Simple pub/sub so other parts of the app can tell the Dashboard to refresh
const listeners = new Set();

export function onDashboardChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback); // unsubscribe function
}

export function emitDashboardChange(payload) {
  listeners.forEach((cb) => cb(payload));
}
