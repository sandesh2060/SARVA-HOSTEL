import { ArrowLeft, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import SarvaMark from '../components/SarvaMark';

export default function SignUp() {
  return (
    <main className="sarva-signup-shell">
      <section className="sarva-signup-card">
        <Link to="/login" className="sarva-auth-back" aria-label="Back to sign in"><ArrowLeft size={19}/></Link>
        <div className="sarva-auth-mobile-logo">
          <span className="sarva-auth-mobile-mark"><SarvaMark style={{ width: 34, height: 34 }} /></span>
          <div><strong>SARVA Hostel</strong><small>Hostel management</small></div>
        </div>
        <div className="sarva-auth-heading">
          <span className="sarva-auth-eyebrow">GET SARVA HOSTEL</span>
          <h2>Set up your hostel workspace</h2>
          <p>New hostel accounts are provisioned securely before the owner receives sign-in access.</p>
        </div>
        <div className="sarva-signup-steps">
          <div><span><Building2 size={18}/></span><p><b>Hostel setup</b><small>Your hostel workspace and owner access are created together.</small></p></div>
          <div><span><ShieldCheck size={18}/></span><p><b>Secure owner account</b><small>Only approved credentials can access hostel records.</small></p></div>
          <div><span><CheckCircle2 size={18}/></span><p><b>Ready to operate</b><small>Sign in and start managing students, rooms and payments.</small></p></div>
        </div>
        <div className="sarva-signup-note">Online self-registration is not enabled by the current SARVA Hostel API, so this screen does not create fake or unsecured accounts.</div>
        <Link to="/login" className="sarva-auth-submit">I already have an account</Link>
      </section>
    </main>
  );
}
