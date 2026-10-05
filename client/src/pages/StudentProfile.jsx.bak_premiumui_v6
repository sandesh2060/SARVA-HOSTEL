import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Page, Card, KPI, Button, Table, Badge, Empty, money } from '../components/UI';
import { useAuth } from '../context/Auth';
import { Link } from 'react-router-dom';
import { Wallet, CreditCard, BedDouble, Phone, Calendar, ArrowLeft } from 'lucide-react';

const PAYMENT_STATUS_TONE = { confirmed: 'success', reversed: 'danger' };
const CREDIT_TYPE_TONE = { charge: 'warning', repayment: 'success', adjustment: 'muted', reversal: 'danger' };
const INVOICE_STATUS_TONE = { open: 'muted', partial: 'warning', paid: 'success', overdue: 'danger', void: 'muted' };

const STATUS_TONE = {
  active: 'success',
  on_leave: 'warning',
  on_hold: 'muted',
  suspended: 'danger',
  checked_out: 'muted',
};
const num = (v) => Number(v?.$numberDecimal ?? v ?? 0);

export default function StudentProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { hostel } = useAuth();

  const [d, setD] = useState(null);
  const [room, setRoom] = useState({ current: null, history: [] });
  const [roomLoading, setRoomLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return api.get('/students/' + id)
      .then((r) => setD(r.data))
      .catch((e) => setError(e.response?.data?.message || e.message));
  }, [id]);

  const loadRoom = useCallback(async () => {
    setRoomLoading(true);
    try {
      const { data } = await api.get('/rooms/overview');
      const mine = (data.assignments || []).filter((a) => (a.studentId?._id || a.studentId) === id);
      const current = mine.find((a) => a.active);
      const history = mine.filter((a) => !a.active).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setRoom({ current, history });
    } catch (e) {
      // Room management may be disabled (403) — leave section hidden, not an error.
      if (e.response?.status !== 403) setError(e.response?.data?.message || e.message);
    } finally {
      setRoomLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    void loadRoom();
  }, [load, loadRoom]);

  if (error) return <Page title="Student"><Card>{error}</Card></Page>;
  if (!d) return <Page title="Student"><Card>Loading…</Card></Page>;

  const s = d.student;
  const outstanding = (d.invoices || []).reduce((a, x) => a + num(x.balance), 0);
  const totalCredit = (d.credits || [])
    .filter((c) => c.type === 'charge')
    .reduce((a, x) => a + num(x.amount), 0);
  const totalRepaid = (d.credits || [])
    .filter((c) => c.type === 'repayment')
    .reduce((a, x) => a + num(x.amount), 0);

  const checkout = async () => {
    const reason = prompt('Checkout reason');
    if (reason === null) return;
    try {
      await api.post(`/students/${id}/checkout`, { reason });
      await Promise.all([load(), loadRoom()]);
    } catch (e) {
      if (e.response?.status === 409 && confirm(`${e.response.data.message}\n\nForce checkout anyway?`)) {
        await api.post(`/students/${id}/checkout`, { reason, force: true });
        await Promise.all([load(), loadRoom()]);
      } else {
        setError(e.response?.data?.message || e.message);
      }
    }
  };

  return (
    <Page
      title={
        <div className="space-y-2">
          <Link to="/students" className="flex items-center gap-1 text-xs font-medium text-sarva-muted hover:text-sarva-primary">
            <ArrowLeft size={14} /> Students
          </Link>
          <div className="flex items-center gap-3">
            {s.photo?.url ? (
              <img src={s.photo.url} alt={s.name} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sarva-primarySoft text-lg font-semibold text-sarva-primary">
                {s.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span>{s.name}</span>
                <Badge tone={STATUS_TONE[s.status] || 'muted'}>{s.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      }
      subtitle={s.studentCode}
    >
      {/* Top summary KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={Wallet} label="Monthly fee" value={money(num(s.monthlyFee), hostel.currency)} />
        <KPI icon={CreditCard} label="Outstanding" value={money(outstanding, hostel.currency)} />
        <KPI icon={Phone} label="Phone" value={s.phone} />
        <KPI icon={Calendar} label="Admission" value={new Date(s.admissionDate).toLocaleDateString()} />
      </div>

      {/* Personal, guardian & documents */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Personal & Guardian">
          <div className="space-y-2 text-sm">
            <p><b>Permanent address:</b> {s.address?.permanent || '—'}</p>
            <p><b>Current address:</b> {s.address?.current || '—'}</p>
            <p><b>Parent/guardian:</b> {s.guardian?.name || '—'} · {s.guardian?.phone || '—'}</p>
            <p><b>Local guardian:</b> {s.localGuardian?.name || '—'} · {s.localGuardian?.phone || '—'}</p>
            <p><b>Institution:</b> {s.academic?.institution || '—'} {s.academic?.course || ''}</p>
          </div>
        </Card>

        <Card title="Documents">
          {!d.documents?.length ? (
            <Empty>No documents uploaded.</Empty>
          ) : (
            <div className="space-y-2">
              {d.documents.map((x) => (
                <div className="rounded-xl border border-sarva-border p-3 text-sm" key={x._id}>
                  <b className="capitalize">{x.type.replaceAll('_', ' ')}</b> · {x.side}
                  <div className="text-xs text-sarva-muted">{x.number || 'No document number'}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Room details */}
      <Card title="Room" className="mt-4">
        {roomLoading ? (
          <div className="text-sm text-sarva-muted">Loading room details…</div>
        ) : (
          <div className="space-y-4">
            {room.current ? (
              <div className="flex items-center gap-3 rounded-xl border border-sarva-border p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sarva-primarySoft text-sarva-primary">
                  <BedDouble size={16} />
                </span>
                <div className="text-sm">
                  <div className="font-semibold text-sarva-text">
                    {[room.current.roomId?.building, room.current.roomId?.floor, room.current.roomId?.name].filter(Boolean).join(' · ')}
                    {' · Bed '}{room.current.bedId?.label}
                  </div>
                  <div className="text-xs text-sarva-muted">
                    Assigned {new Date(room.current.startDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ) : (
              <Empty>No room currently assigned.</Empty>
            )}

            {room.history.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-sarva-text">Room history</h3>
                <div className="space-y-2">
                  {room.history.map((h) => (
                    <div key={h._id} className="rounded-xl border border-sarva-border p-3 text-sm">
                      <div className="font-medium text-sarva-text">
                        {[h.roomId?.building, h.roomId?.floor, h.roomId?.name].filter(Boolean).join(' · ')}
                        {' · Bed '}{h.bedId?.label}
                      </div>
                      <div className="text-xs text-sarva-muted">
                        {new Date(h.startDate).toLocaleDateString()} → {h.endDate ? new Date(h.endDate).toLocaleDateString() : 'present'}
                        {h.endReason ? ` · ${h.endReason}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Invoices */}
      <Card title="Invoices" className="mt-4">
        {!d.invoices?.length ? (
          <Empty>No invoices yet.</Empty>
        ) : (
          <Table heads={['Period', 'Total', 'Paid', 'Balance', 'Status']}>
            {d.invoices.map((i) => (
              <tr key={i._id}>
                <td className="p-3">{i.periodKey}</td>
                <td className="p-3">{money(num(i.total), i.currency)}</td>
                <td className="p-3">{money(num(i.paid), i.currency)}</td>
                <td className="p-3 font-semibold">{money(num(i.balance), i.currency)}</td>
                <td className="p-3">
                  <Badge tone={INVOICE_STATUS_TONE[i.status] || 'muted'}>{i.status}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Payments */}
      <Card title="Payments" className="mt-4">
        {!d.payments?.length ? (
          <Empty>No payments recorded yet.</Empty>
        ) : (
          <Table heads={['Date', 'Amount', 'Method', 'Reference', 'Status']}>
            {d.payments.map((p) => (
              <tr key={p._id}>
                <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-3 font-semibold">{money(num(p.amount), p.currency)}</td>
                <td className="p-3 capitalize">{(p.method || '—').replaceAll('_', ' ')}</td>
                <td className="p-3 text-sarva-muted">{p.reference || '—'}</td>
                <td className="p-3">
                  <Badge tone={PAYMENT_STATUS_TONE[p.status] || 'muted'}>{p.status}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Credit / remaining balance ledger */}
      <Card title="Credit" className="mt-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-sarva-border p-3">
            <div className="text-xs uppercase tracking-wide text-sarva-muted">Total charged</div>
            <div className="mt-1 text-lg font-bold text-sarva-text">{money(totalCredit, hostel.currency)}</div>
          </div>
          <div className="rounded-xl border border-sarva-border p-3">
            <div className="text-xs uppercase tracking-wide text-sarva-muted">Total repaid</div>
            <div className="mt-1 text-lg font-bold text-sarva-text">{money(totalRepaid, hostel.currency)}</div>
          </div>
          <div className="rounded-xl border border-sarva-border p-3">
            <div className="text-xs uppercase tracking-wide text-sarva-muted">Remaining (outstanding)</div>
            <div className="mt-1 text-lg font-bold text-sarva-danger">{money(outstanding, hostel.currency)}</div>
          </div>
        </div>

        {!d.credits?.length ? (
          <Empty>No credit transactions.</Empty>
        ) : (
          <Table heads={['Date', 'Type', 'Amount', 'Reason']}>
            {d.credits.map((c) => (
              <tr key={c._id}>
                <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <Badge tone={CREDIT_TYPE_TONE[c.type] || 'muted'}>{c.type}</Badge>
                </td>
                <td className="p-3 font-semibold">{money(num(c.amount), hostel.currency)}</td>
                <td className="p-3 text-sarva-muted">{c.reason || '—'}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {s.status !== 'checked_out' && (
        <div className="mt-4">
          <Button onClick={checkout}>Checkout Student</Button>
        </div>
      )}
    </Page>
  );
}
