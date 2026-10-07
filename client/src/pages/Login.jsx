import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/Auth';
import SarvaMark from '../components/SarvaMark';

export default function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="sarva-auth-shell">
      <section className="sarva-auth-brand" aria-hidden="true">
        <div className="sarva-auth-brand__logo">
          <SarvaMark style={{ width: 44, height: 44 }} />
          <span>SARVA <b>Hostel</b></span>
        </div>
        <div className="sarva-auth-brand__copy">
          <span className="sarva-auth-eyebrow">HOSTEL MANAGEMENT</span>
          <h1>Everything your hostel needs, in one calm workspace.</h1>
          <p>Students, rooms, payments, admissions and daily operations — designed to stay simple on every screen.</p>
        </div>
        <div className="sarva-auth-trust"><ShieldCheck size={16} /> Secure owner workspace</div>
      </section>

      <section className="sarva-auth-panel">
        <form onSubmit={submit} className="sarva-auth-card">
          <div className="sarva-auth-mobile-logo">
            <span className="sarva-auth-mobile-mark"><SarvaMark style={{ width: 34, height: 34 }} /></span>
            <div><strong>SARVA Hostel</strong><small>Hostel management</small></div>
          </div>

          <div className="sarva-auth-heading">
            <span className="sarva-auth-eyebrow">WELCOME BACK</span>
            <h2>Sign in to your hostel</h2>
            <p>Use your owner or staff account to continue.</p>
          </div>

          {err && <div className="sarva-auth-error" role="alert">{err}</div>}

          <div className="sarva-auth-fields">
            <label className="sarva-auth-field">
              <span>Email address</span>
              <div className="sarva-auth-input">
                <Mail size={18} />
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  required
                />
              </div>
            </label>

            <label className="sarva-auth-field">
              <span>Password</span>
              <div className="sarva-auth-input">
                <LockKeyhole size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <div className="sarva-auth-row">
            <span className="text-xs text-sarva-muted">Secure sign in</span>
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button disabled={loading} className="sarva-auth-submit">
            {loading && <span className="sarva-spinner" aria-hidden="true" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="sarva-auth-footnote">
            SARVA Hostel keeps the login screen focused on accounts already created by your hostel.
          </p>
        </form>
      </section>
    </main>
  );
}
