import { ArrowRight, BedDouble, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import SarvaMark from '../components/SarvaMark';

export default function GetStarted() {
  return (
    <main className="sarva-onboarding">
      <div className="sarva-onboarding__glow sarva-onboarding__glow--one" />
      <div className="sarva-onboarding__glow sarva-onboarding__glow--two" />
      <header className="sarva-onboarding__brand"><SarvaMark style={{ width: 38, height: 38 }} /><span>SARVA <b>Hostel</b></span></header>
      <section className="sarva-onboarding__visual" aria-hidden="true">
        <div className="sarva-onboarding__phone">
          <div className="sarva-onboarding__phone-head"><span /><span /><span /></div>
          <div className="sarva-onboarding__mini-hero"><small>HOSTEL OVERVIEW</small><strong>Simple. Clear. Connected.</strong></div>
          <div className="sarva-onboarding__mini-grid">
            <i><Users size={19}/><span>Students</span></i><i><BedDouble size={19}/><span>Rooms</span></i><i><WalletCards size={19}/><span>Payments</span></i><i><ShieldCheck size={19}/><span>Secure</span></i>
          </div>
        </div>
      </section>
      <section className="sarva-onboarding__copy">
        <span className="sarva-onboarding__eyebrow">SMART HOSTEL MANAGEMENT</span>
        <h1>Run your hostel from your pocket.</h1>
        <p>Manage students, rooms, admissions, payments and daily operations from one clean workspace.</p>
      </section>
      <div className="sarva-onboarding__actions">
        <Link to="/login" className="sarva-onboarding__primary">Get started <ArrowRight size={19}/></Link>
        <p>Already using SARVA? <Link to="/login">Sign in</Link></p>
      </div>
    </main>
  );
}
