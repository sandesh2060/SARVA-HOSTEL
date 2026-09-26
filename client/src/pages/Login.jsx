import { useState } from 'react';
import { useAuth } from '../context/Auth';

export default function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(f.email, f.password);
      location.href = '/';
    } catch (x) {
      setErr(x.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-sarva-bg lg:grid-cols-2">
      <div className="animate-fade-in hidden flex-col justify-between bg-sarva-primary p-12 text-white lg:flex">
        <div className="text-3xl font-black">
          SARVA <span className="text-sarva-gold">Hostel</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Run your hostel like a<br />modern hospitality business.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Students, rooms, billing, credit and reports — one SARVA workspace.
          </p>
        </div>
        <div className="text-xs text-white/50">SARVA Ecosystem · Hostel Management</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="animate-fade-in-delay-1 w-full max-w-md card">
          <h1 className="text-2xl font-bold text-sarva-text lg:hidden">
            SARVA <span className="text-sarva-primary">Hostel</span>
          </h1>
          <p className="mb-6 mt-1 text-sm text-sarva-muted">Hostel owner sign in</p>
          {err && <p className="mb-3 animate-fade-in rounded-lg bg-rose-50 px-3 py-2 text-sm text-sarva-danger">{err}</p>}
          <div className="space-y-3">
            <input placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-sarva-primary text-white hover:bg-sarva-primaryHover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <span className="sarva-spinner" aria-hidden="true" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" className="w-full border border-sarva-border text-sarva-text hover:bg-sarva-primarySoft">
              Continue with Google (configure OAuth)
            </button>
          </div>
          <div className="mt-5 flex justify-between text-xs text-sarva-muted">
            <a href="/forgot-password" className="hover:text-sarva-primary">Forgot password?</a>
            <a href="/register-hostel" className="hover:text-sarva-primary">Register your hostel</a>
          </div>
        </form>
      </div>
    </div>
  );
}
