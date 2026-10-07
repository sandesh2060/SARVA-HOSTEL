import { useEffect, useState } from 'react';
import api from '../services/api';
import { Page, Card, Input, Select, Button, Switch, PillTabs } from '../components/UI';
import { Building2, QrCode, Nfc, Fingerprint, Copy, ExternalLink, ClipboardList, CalendarDays } from 'lucide-react';

const TABS = [
  ['profile', 'Hostel Profile'],
  ['regional', 'Regional & Billing'],
  ['payments', 'Payment Methods'],
  ['attendance', 'Attendance Methods'],
  ['admission', 'Public Admission'],
];

const TIMEZONES = ['Asia/Kathmandu', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Dubai', 'UTC'];
const CURRENCIES = ['NPR', 'INR', 'USD', 'BDT', 'AED'];

export default function Settings() {
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('profile');
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [billingPreview, setBillingPreview] = useState(null);

  const load = () =>
    api.get('/settings').then(({ data: h }) => {
      setF({
        name: h.name || '',
        currency: h.currency || 'NPR',
        logo: h.logo || null,
        contactEmail: h.contact?.email || '',
        contactPhone: h.contact?.phone || '',
        contactAddress: h.contact?.address || '',
        contactLocation: h.contact?.location || '',
        billingMode: h.settings?.billingMode || 'calendar',
        billingCalendar: h.settings?.billingCalendar || 'BS',
        billingDay: h.settings?.billingDay ?? 1,
        firstBillPolicy: h.settings?.firstBillPolicy || 'prorate',
        graceDays: h.settings?.graceDays ?? 0,
        lateFeeEnabled: h.settings?.lateFee?.enabled ?? false,
        lateFeeType: h.settings?.lateFee?.type || 'daily_fixed',
        lateFeeAmount: h.settings?.lateFee?.amount ?? 0,
        lateFeeMaxAmount: h.settings?.lateFee?.maxAmount ?? 0,
        reminderDays: (h.settings?.reminderDays || [7, 3, 2, 1]).join(', '),
        timezone: h.settings?.timezone || 'Asia/Kathmandu',
        payCash: h.settings?.paymentMethods?.cash ?? true,
        payManualQr: h.settings?.paymentMethods?.manualQr ?? true,
        payEsewa: h.settings?.paymentMethods?.esewa ?? false,
        manualQrImage: h.settings?.manualQrImage || '',
        publicAdmissionEnabled: h.settings?.publicAdmissionEnabled ?? false,
        publicSlug: h.slug || '',
        attManual: h.settings?.attendanceMethods?.manual ?? true,
        attQr: h.settings?.attendanceMethods?.qr ?? false,
        attNfc: h.settings?.attendanceMethods?.nfc ?? false,
        attFingerprint: h.settings?.attendanceMethods?.fingerprint ?? false,
        qrRefreshSeconds: h.settings?.attendanceMethods?.qrConfig?.refreshSeconds ?? 30,
        nfcReaderId: h.settings?.attendanceMethods?.nfcConfig?.readerId || '',
        fingerprintDeviceId: h.settings?.attendanceMethods?.fingerprintConfig?.deviceId || '',
        fingerprintVendor: h.settings?.attendanceMethods?.fingerprintConfig?.vendor || '',
      });
    });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!f?.billingCalendar || !f?.billingDay) return;
    const t = setTimeout(() => api.get('/calendar/preview', { params: { calendar: f.billingCalendar, day: f.billingDay, graceDays: f.graceDays } }).then(({ data }) => setBillingPreview(data)).catch(() => setBillingPreview(null)), 250);
    return () => clearTimeout(t);
  }, [f?.billingCalendar, f?.billingDay, f?.graceDays]);

  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }));
  const toggle = (key) => (val) => setF((prev) => ({ ...prev, [key]: val }));

  const uploadLogo = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const { data } = await api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setF((prev) => ({ ...prev, logo: data }));
      setMsg('Logo updated. Reload the page to see it in the sidebar.');
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const uploadQr = async (file) => {
    if (!file) return;
    setQrUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('qr', file);
      const { data } = await api.post('/settings/qr-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setF((prev) => ({ ...prev, manualQrImage: data.manualQrImage }));
      setMsg('Payment QR image updated.');
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
    } finally {
      setQrUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.patch('/settings', {
        name: f.name,
        currency: f.currency,
        contact: { email: f.contactEmail, phone: f.contactPhone, address: f.contactAddress, location: f.contactLocation },
        settings: {
          billingMode: 'calendar',
          billingCalendar: f.billingCalendar,
          billingDay: Math.max(1, Number(f.billingDay) || 1),
          firstBillPolicy: f.firstBillPolicy,
          graceDays: Math.max(0, Number(f.graceDays) || 0),
          lateFee: { enabled: f.lateFeeEnabled, type: f.lateFeeType, amount: Math.max(0, Number(f.lateFeeAmount) || 0), maxAmount: Math.max(0, Number(f.lateFeeMaxAmount) || 0) },
          reminderDays: f.reminderDays.split(',').map((x) => Number(x.trim())).filter((n) => Number.isFinite(n)),
          timezone: f.timezone,
          paymentMethods: { cash: f.payCash, manualQr: f.payManualQr, esewa: f.payEsewa },
          manualQrImage: f.manualQrImage,
          publicAdmissionEnabled: f.publicAdmissionEnabled,
          attendanceMethods: {
            manual: f.attManual,
            qr: f.attQr,
            nfc: f.attNfc,
            fingerprint: f.attFingerprint,
            qrConfig: { refreshSeconds: Number(f.qrRefreshSeconds) || 30 },
            nfcConfig: { readerId: f.nfcReaderId },
            fingerprintConfig: { deviceId: f.fingerprintDeviceId, vendor: f.fingerprintVendor },
          },
        },
      });
      setMsg('Saved.');
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!f) return <Page title="Hostel Settings"><div className="skeleton h-64 rounded-[1.75rem]" /></Page>;

  return (
    <Page title="Hostel Settings" subtitle="Profile, regional, payment and attendance configuration for your hostel.">
      <PillTabs options={TABS} value={tab} onChange={setTab} />

      <div className="mt-6 max-w-3xl space-y-6">
        {tab === 'admission' && (() => {
          const publicUrl = `${window.location.origin}/join/${f.publicSlug}`;
          return (
            <Card title="Public Student Admission">
              <div className="space-y-5">
                <Switch checked={f.publicAdmissionEnabled} onChange={toggle('publicAdmissionEnabled')} label="Accept public admission requests" help="Students with your public link can submit a pending application. Nothing is admitted until you approve it." />
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-sarva-muted">Public link</div>
                  <div className="break-all rounded-xl border border-sarva-border bg-sarva-bg p-3 text-sm text-sarva-text">{publicUrl}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" onClick={() => navigator.clipboard.writeText(publicUrl)}><Copy size={15}/> Copy Link</Button>
                  <Button type="button" variant="ghost" onClick={() => window.open(publicUrl, '_blank', 'noopener')}><ExternalLink size={15}/> Open Public Page</Button>
                  <Button type="button" variant="ghost" onClick={() => window.location.assign('/admissions')}><ClipboardList size={15}/> Admission Requests</Button>
                </div>
                <div className="rounded-2xl bg-sarva-primarySoft p-4 text-xs leading-5 text-sarva-muted">Save settings after changing the admission switch. The public form never creates a student directly; approval is required.</div>
              </div>
            </Card>
          );
        })()}

        {tab === 'profile' && (
          <Card title="Hostel Profile">
            <div className="mb-5 flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-sarva-primarySoft">
                {f.logo?.url ? (
                  <img src={f.logo.url} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sarva-primary">
                    <Building2 size={26} />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-full bg-sarva-primarySoft px-4 py-2 text-xs font-semibold text-sarva-primary hover:bg-sarva-primary hover:text-white">
                  {logoUploading ? 'Uploading\u2026' : 'Change logo'}
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={logoUploading}
                  onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; uploadLogo(file); }} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Hostel name</span>
                <Input value={f.name} onChange={set('name')} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Contact email</span>
                <Input type="email" value={f.contactEmail} onChange={set('contactEmail')} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Contact phone</span>
                <Input value={f.contactPhone} onChange={set('contactPhone')} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Location</span>
                <Input value={f.contactLocation} onChange={set('contactLocation')} placeholder="City, area" />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-sarva-text">Address</span>
                <Input value={f.contactAddress} onChange={set('contactAddress')} />
              </label>
            </div>
          </Card>
        )}

        {tab === 'regional' && (
          <Card title="Regional & Billing">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Currency</span>
                <Select value={f.currency} onChange={set('currency')}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Timezone</span>
                <Select value={f.timezone} onChange={set('timezone')}>
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </Select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Billing calendar</span>
                <Select value={f.billingCalendar} onChange={set('billingCalendar')}>
                  <option value="BS">Nepali (Bikram Sambat)</option>
                  <option value="AD">English (Gregorian)</option>
                </Select>
                <span className="mt-1 block text-[11px] text-sarva-muted">This controls the real monthly billing boundary, not only the displayed date.</span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Monthly payment day</span>
                <Select value={f.billingDay} onChange={set('billingDay')}>
                  {Array.from({ length: f.billingCalendar === 'BS' ? 32 : 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}{f.billingCalendar === 'BS' ? ' गते' : ''}</option>)}
                </Select>
                <span className="mt-1 block text-[11px] text-sarva-muted">If a selected day does not exist in a month, SARVA uses that month's last valid day.</span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">First billing policy</span>
                <Select value={f.firstBillPolicy} onChange={set('firstBillPolicy')}>
                  <option value="prorate">Prorate first period</option>
                  <option value="full">Charge full monthly fee</option>
                  <option value="next_cycle">Start from next billing cycle</option>
                </Select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-sarva-text">Grace days</span>
                <Input type="number" min="0" value={f.graceDays} onChange={set('graceDays')} />
              </label>
              {billingPreview && <div className="sm:col-span-2 rounded-2xl border border-sarva-border bg-white p-4 shadow-premium-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sarva-text"><CalendarDays size={17} className="text-sarva-primary"/> Billing preview</div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div><div className="text-[11px] uppercase tracking-wide text-sarva-muted">Next payment</div><div className="mt-1 font-semibold text-sarva-text">{billingPreview.nextBilling?.primary}</div><div className="text-xs text-sarva-muted">{billingPreview.nextBilling?.secondary}</div></div>
                  <div><div className="text-[11px] uppercase tracking-wide text-sarva-muted">Payment day</div><div className="mt-1 font-semibold text-sarva-text">{billingPreview.billingDay}{billingPreview.calendar === 'BS' ? ' गते' : ''}</div><div className="text-xs text-sarva-muted">{billingPreview.calendar === 'BS' ? 'Nepali BS' : 'English AD'}</div></div>
                  <div><div className="text-[11px] uppercase tracking-wide text-sarva-muted">Late from</div><div className="mt-1 font-semibold text-sarva-text">{billingPreview.lateFrom?.primary}</div><div className="text-xs text-sarva-muted">After {billingPreview.graceDays} grace day(s)</div></div>
                </div>
              </div>}
              <div className="sm:col-span-2 rounded-2xl border border-sarva-border bg-sarva-bg p-4">
                <Switch label="Automatic late fine" help="Automatically add a fine after the configured grace period. Existing invoices keep their original fine policy." checked={f.lateFeeEnabled} onChange={toggle('lateFeeEnabled')} />
                {f.lateFeeEnabled && <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="block text-sm"><span className="mb-1 block font-medium text-sarva-text">Fine rule</span><Select value={f.lateFeeType} onChange={set('lateFeeType')}><option value="daily_fixed">Fixed amount per overdue day</option><option value="one_time">One-time fixed fine</option></Select></label>
                  <label className="block text-sm"><span className="mb-1 block font-medium text-sarva-text">Fine amount</span><Input type="number" min="0" step="0.01" value={f.lateFeeAmount} onChange={set('lateFeeAmount')} /></label>
                  <label className="block text-sm"><span className="mb-1 block font-medium text-sarva-text">Maximum fine (0 = no cap)</span><Input type="number" min="0" step="0.01" value={f.lateFeeMaxAmount} onChange={set('lateFeeMaxAmount')} /></label>
                </div>}
              </div>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-sarva-text">Reminder days before due (comma-separated)</span>
                <Input value={f.reminderDays} onChange={set('reminderDays')} placeholder="7, 3, 2, 1" />
              </label>
            </div>
          </Card>
        )}

        {tab === 'payments' && (
          <Card title="Payment Methods">
            <div className="divide-y divide-sarva-border">
              <Switch label="Cash" help="Accept in-person cash payments." checked={f.payCash} onChange={toggle('payCash')} />
              <Switch label="Manual QR" help="Show a QR code for bank/wallet transfer." checked={f.payManualQr} onChange={toggle('payManualQr')} />
              <Switch label="eSewa" help="Accept eSewa digital wallet payments." checked={f.payEsewa} onChange={toggle('payEsewa')} />
            </div>

            {f.payManualQr && (
              <div className="mt-5 flex items-center gap-4 rounded-2xl bg-sarva-bg p-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white">
                  {f.manualQrImage ? (
                    <img src={f.manualQrImage} alt="Payment QR" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sarva-muted">
                      <QrCode size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-sarva-text">Payment QR image</div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-full bg-sarva-primarySoft px-4 py-2 text-xs font-semibold text-sarva-primary hover:bg-sarva-primary hover:text-white">
                      {qrUploading ? 'Uploading\u2026' : 'Upload QR'}
                    </span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={qrUploading}
                      onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; uploadQr(file); }} />
                  </label>
                </div>
              </div>
            )}
          </Card>
        )}

        {tab === 'attendance' && (
          <Card title="Attendance Methods">
            <p className="mb-4 text-xs text-sarva-muted">
              Enable the check-in methods your hostel actually has hardware or a process for. Manual stays available
              as a fallback on the Attendance page regardless of these toggles.
            </p>
            <div className="divide-y divide-sarva-border">
              <Switch label="Manual" help="Owner/staff marks attendance by hand." checked={f.attManual} onChange={toggle('attManual')} />
              <Switch label="QR Code" help="Students check in by scanning a rotating QR code." checked={f.attQr} onChange={toggle('attQr')} />
              <Switch label="NFC" help="Students tap an NFC card/tag at a reader." checked={f.attNfc} onChange={toggle('attNfc')} />
              <Switch label="Fingerprint" help="Biometric device confirms identity at entry." checked={f.attFingerprint} onChange={toggle('attFingerprint')} />
            </div>

            {(f.attQr || f.attNfc || f.attFingerprint) && (
              <div className="mt-5 space-y-4 rounded-2xl bg-sarva-bg p-4">
                {f.attQr && (
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-sarva-text"><QrCode size={15} /> QR settings</div>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs text-sarva-muted">Code refresh interval (seconds)</span>
                      <Input type="number" min="5" className="max-w-[160px]" value={f.qrRefreshSeconds} onChange={set('qrRefreshSeconds')} />
                    </label>
                  </div>
                )}
                {f.attNfc && (
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-sarva-text"><Nfc size={15} /> NFC settings</div>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs text-sarva-muted">Reader device ID</span>
                      <Input value={f.nfcReaderId} onChange={set('nfcReaderId')} placeholder="e.g. gate-reader-01" />
                    </label>
                  </div>
                )}
                {f.attFingerprint && (
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-sarva-text"><Fingerprint size={15} /> Fingerprint settings</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs text-sarva-muted">Device ID</span>
                        <Input value={f.fingerprintDeviceId} onChange={set('fingerprintDeviceId')} />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs text-sarva-muted">Vendor / model</span>
                        <Input value={f.fingerprintVendor} onChange={set('fingerprintVendor')} placeholder="e.g. ZKTeco K40" />
                      </label>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-sarva-muted">
                  These fields store device configuration only. Actually wiring a reader to submit live attendance
                  is a separate integration once you tell me which hardware/SDK it uses.
                </p>
              </div>
            )}
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={save} loading={saving}>Save changes</Button>
          {msg && <span className="animate-fade-in text-sm text-sarva-muted">{msg}</span>}
        </div>
      </div>
    </Page>
  );
}
