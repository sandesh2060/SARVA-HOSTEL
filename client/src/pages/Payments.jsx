import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Page, Card, StatCard, Button, Input, Badge, Empty, ErrorState, SkeletonRows, Modal, money } from '../components/UI';
import { useAuth } from '../context/Auth';
import { emitDashboardChange } from '../utils/dashboardBus';
import {
  Search, Wallet, CreditCard, AlertTriangle, CalendarClock, QrCode, Banknote,
  Smartphone, CheckCircle2, ArrowLeft, ChevronRight,
} from 'lucide-react';

const num = (v) => Number(v?.$numberDecimal ?? v ?? 0);
const dayMs = 86400000;

const INVOICE_TONE = { open: 'muted', partial: 'warning', overdue: 'danger', paid: 'success', void: 'muted' };

function sortInvoicesByDue(invoices) {
  return [...invoices].sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (da !== db) return da - db;
    return String(a.periodKey).localeCompare(String(b.periodKey));
  });
}

export default function Payments() {
  const { hostel } = useAuth();
  const cur = hostel?.currency || 'NPR';
  const nav = useNavigate();

  // --- Top summary -----------------------------------------------------
  const [todaySummary, setTodaySummary] = useState(null);
  const [monthSummary, setMonthSummary] = useState(null);
  const [summaryErr, setSummaryErr] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);

  // --- Hostel payment settings (methods + QR image) ---------------------
  const [hostelSettings, setHostelSettings] = useState(null);

  // --- Needs collection --------------------------------------------------
  const [needsCollection, setNeedsCollection] = useState([]);
  const [needsErr, setNeedsErr] = useState('');
  const [needsLoading, setNeedsLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryErr('');
    try {
      const [{ data: today }, { data: month }] = await Promise.all([
        api.get('/dashboard/summary', { params: { period: 'today' } }),
        api.get('/dashboard/summary', { params: { period: 'this_month' } }),
      ]);
      setTodaySummary(today);
      setMonthSummary(month);
    } catch (e) {
      setSummaryErr(e.response?.data?.message || e.message);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadNeedsCollection = useCallback(async () => {
    setNeedsLoading(true);
    setNeedsErr('');
    try {
      const { data } = await api.get('/credits/summary');
      setNeedsCollection(data);
    } catch (e) {
      // Capability may be off (403) -- section simply doesn't render.
      if (e.response?.status !== 403) setNeedsErr(e.response?.data?.message || e.message);
    } finally {
      setNeedsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
    void loadNeedsCollection();
    api.get('/settings').then(({ data }) => setHostelSettings(data)).catch(() => {});
  }, [loadSummary, loadNeedsCollection]);

  const paymentMethods = hostelSettings?.settings?.paymentMethods || { cash: true, manualQr: true, esewa: false };
  const manualQrImage = hostelSettings?.settings?.manualQrImage || '';

  // --- Search --------------------------------------------------------
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setSearching(true);
    setSearchErr('');
    try {
      const { data } = await api.get('/students', { params: { q } });
      setResults(data);
      setSearched(true);
    } catch (e) {
      setSearchErr(e.response?.data?.message || e.message);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  // --- Selected student workspace ----------------------------------------
  const [selected, setSelected] = useState(null); // full /students/:id payload
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState(new Set());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(null);
  const [reference, setReference] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState('');
  const [success, setSuccess] = useState(null); // { receipts: [{invoiceId,paymentId}], totalPaid }
  const processingRef = useRef(false);

  const openInvoices = useMemo(() => {
    if (!selected) return [];
    return sortInvoicesByDue((selected.invoices || []).filter((i) => i.status !== 'paid' && i.status !== 'void' && num(i.balance) > 0));
  }, [selected]);

  const totalOutstanding = useMemo(() => openInvoices.reduce((s, i) => s + num(i.balance), 0), [openInvoices]);

  const selectedInvoices = useMemo(
    () => openInvoices.filter((i) => selectedInvoiceIds.has(i._id)),
    [openInvoices, selectedInvoiceIds]
  );
  const selectedTotal = useMemo(() => selectedInvoices.reduce((s, i) => s + num(i.balance), 0), [selectedInvoices]);

  const overdueTotal = useMemo(
    () => openInvoices.filter((i) => i.dueDate && new Date(i.dueDate) < new Date()).reduce((s, i) => s + num(i.balance), 0),
    [openInvoices]
  );
  const nextDue = useMemo(() => {
    const upcoming = openInvoices.filter((i) => i.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return upcoming[0]?.dueDate ? new Date(upcoming[0].dueDate).toLocaleDateString() : '\u2014';
  }, [openInvoices]);

  const creditOutstanding = useMemo(() => {
    const charged = (selected?.credits || []).filter((c) => c.type === 'charge').reduce((s, c) => s + num(c.amount), 0);
    const repaid = (selected?.credits || []).filter((c) => c.type === 'repayment' || c.type === 'reversal').reduce((s, c) => s + num(c.amount), 0);
    return Math.max(0, charged - repaid);
  }, [selected]);

  const selectStudentRecord = useCallback(async (id) => {
    setPayError('');
    setSuccess(null);
    try {
      const { data } = await api.get('/students/' + id);
      setSelected(data);
      const open = sortInvoicesByDue((data.invoices || []).filter((i) => i.status !== 'paid' && i.status !== 'void' && num(i.balance) > 0));
      const first = open[0];
      setSelectedInvoiceIds(first ? new Set([first._id]) : new Set());
      setAmount(first ? String(num(first.balance)) : '');
      setMethod(null);
      setReference('');
      setCashReceived('');
    } catch (e) {
      setPayError(e.response?.data?.message || e.message);
    }
  }, []);

  const changeStudent = () => {
    setSelected(null);
    setSelectedInvoiceIds(new Set());
    setAmount('');
    setMethod(null);
    setSuccess(null);
    setPayError('');
  };

  const toggleInvoice = (id) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    // Keep the amount in sync with selection when the user hasn't overridden it above the total.
    const amt = Number(amount);
    if (!amount || amt > selectedTotal) setAmount(selectedTotal ? String(selectedTotal) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTotal]);

  const amountNum = Number(amount) || 0;
  const amountValid = amountNum > 0 && amountNum <= selectedTotal + 0.0001;

  const allocationPreview = useMemo(() => {
    let remaining = amountNum;
    const rows = [];
    for (const inv of sortInvoicesByDue(selectedInvoices)) {
      if (remaining <= 0) break;
      const bal = num(inv.balance);
      const alloc = Math.min(remaining, bal);
      if (alloc > 0) rows.push({ invoice: inv, alloc });
      remaining -= alloc;
    }
    return rows;
  }, [selectedInvoices, amountNum]);

  const cashChange = method === 'cash' && cashReceived ? Math.max(0, Number(cashReceived) - amountNum) : 0;

  const canConfirm = amountValid && method && (method !== 'manual_qr' || reference.trim());

  const openConfirm = () => {
    if (!canConfirm) return;
    setConfirmOpen(true);
  };

  const doConfirmPay = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    setPayError('');
    const receipts = [];
    try {
      let remaining = amountNum;
      for (const { invoice, alloc } of allocationPreview) {
        if (alloc <= 0) continue;
        const { data } = await api.post(`/invoices/${invoice._id}/pay`, {
          amount: alloc,
          method,
          reference: reference || undefined,
        });
        receipts.push({ invoiceId: invoice._id, paymentId: data.payment?._id });
        remaining -= alloc;
      }
      setSuccess({ receipts, totalPaid: amountNum });
      setConfirmOpen(false);
      await selectStudentRecordSilently(selected.student._id);
      emitDashboardChange();
      loadSummary();
      loadNeedsCollection();
    } catch (e) {
      setPayError(
        (e.response?.data?.message || e.message) +
          (receipts.length ? ` (Note: ${receipts.length} of ${allocationPreview.length} invoice payment(s) already went through before this failed -- check the student's Payments tab before retrying.)` : '')
      );
      setConfirmOpen(false);
    } finally {
      setProcessing(false);
      processingRef.current = false;
    }
  };

  // Reload the selected student's data without resetting the success screen.
  const selectStudentRecordSilently = async (id) => {
    try {
      const { data } = await api.get('/students/' + id);
      setSelected(data);
    } catch {
      /* keep last known state if refresh fails */
    }
  };

  const collectAnother = () => {
    changeStudent();
    setQuery('');
    setResults([]);
  };

  // --- Render ------------------------------------------------------------
  return (
    <Page title="Payments" subtitle="Collect payments, settle outstanding balances and manage receipts.">
      {/* Summary cards */}
      {summaryErr ? (
        <ErrorState message={summaryErr} onRetry={loadSummary} />
      ) : summaryLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-[1.5rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Collected Today" value={money(todaySummary?.finance?.collected, cur)} icon={Wallet} tone="success" />
          <StatCard label="Collected This Month" value={money(monthSummary?.finance?.collected, cur)} icon={Wallet} tone="primary" />
          <StatCard label="Outstanding" value={money(monthSummary?.finance?.outstanding, cur)} icon={CreditCard} tone="warning" />
          <StatCard
            label="Overdue"
            value={money(monthSummary?.overdueStudents?.reduce((s, x) => s + x.outstanding, 0), cur)}
            icon={AlertTriangle}
            tone="gold"
          />
        </div>
      )}

      {/* Main workspace + summary panel */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card title={selected ? undefined : 'Collect Payment'}>
            {!selected && !success && (
              <>
                <p className="mb-4 text-sm text-sarva-muted">Search for a student to view outstanding balances.</p>
                <div className="flex gap-2 rounded-full bg-sarva-bg p-2">
                  <div className="relative flex-1">
                    <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sarva-muted" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search name, student ID, phone or email\u2026"
                      className="w-full rounded-full bg-white py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-sarva-muted"
                    />
                  </div>
                  <Button onClick={() => runSearch(query)}>Search</Button>
                </div>

                <div className="mt-4">
                  {searchErr ? (
                    <ErrorState message={searchErr} onRetry={() => runSearch(query)} />
                  ) : searching ? (
                    <SkeletonRows rows={2} className="h-20 w-full rounded-2xl" />
                  ) : searched && !results.length ? (
                    <Empty>No students found.</Empty>
                  ) : (
                    <div className="space-y-2">
                      {results.map((s) => (
                        <button
                          key={s._id}
                          onClick={() => selectStudentRecord(s._id)}
                          className="flex w-full items-center gap-4 rounded-2xl border border-sarva-border p-3 text-left transition hover:-translate-y-0.5 hover:border-sarva-primary hover:shadow-premium-sm"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-sarva-primary to-sarva-primaryDark">
                            {s.photo?.url ? (
                              <img src={s.photo.url} alt={s.name} className="h-full w-full object-cover object-top" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/90">
                                {s.name?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold text-sarva-text">{s.name}</span>
                              <Badge tone={s.status === 'active' ? 'success' : 'muted'}>{s.status?.replaceAll('_', ' ')}</Badge>
                            </div>
                            <div className="text-xs text-sarva-muted">{[s.studentCode, s.phone].filter(Boolean).join(' \u00b7 ')}</div>
                          </div>
                          <ChevronRight size={18} className="shrink-0 text-sarva-muted" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {selected && !success && (
              <div className="space-y-5">
                <button onClick={changeStudent} className="flex items-center gap-1 text-xs font-medium text-sarva-muted hover:text-sarva-primary">
                  <ArrowLeft size={14} /> Change Student
                </button>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-sarva-primary to-sarva-primaryDark">
                    {selected.student.photo?.url ? (
                      <img src={selected.student.photo.url} alt="" className="h-full w-full object-cover object-top" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-lg font-semibold text-white/90">
                        {selected.student.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-semibold text-sarva-text">{selected.student.name}</span>
                      <Badge tone={selected.student.status === 'active' ? 'success' : 'muted'}>{selected.student.status}</Badge>
                    </div>
                    <div className="text-xs text-sarva-muted">{selected.student.studentCode} \u00b7 {selected.student.phone}</div>
                  </div>
                  <button onClick={() => nav(`/students/${selected.student._id}`)} className="text-xs font-semibold text-sarva-primary hover:underline">
                    View Student Profile
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Outstanding" value={money(totalOutstanding, cur)} icon={CreditCard} tone={totalOutstanding > 0 ? 'warning' : 'success'} />
                  <StatCard label="Overdue" value={money(overdueTotal, cur)} icon={AlertTriangle} tone="gold" />
                  <StatCard label="Credit" value={money(creditOutstanding, cur)} icon={Wallet} tone="primary" />
                  <StatCard label="Next Due" value={nextDue} icon={CalendarClock} tone="primary" />
                </div>

                {/* Invoices */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-sarva-text">Outstanding Invoices</h3>
                  {!openInvoices.length ? (
                    <Empty>No outstanding invoices. This student is fully paid up.</Empty>
                  ) : (
                    <div className="space-y-2">
                      {openInvoices.map((inv) => {
                        const overdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                        return (
                          <label
                            key={inv._id}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                              selectedInvoiceIds.has(inv._id) ? 'border-sarva-primary bg-sarva-primarySoft/30' : 'border-sarva-border'
                            }`}
                          >
                            <input type="checkbox" checked={selectedInvoiceIds.has(inv._id)} onChange={() => toggleInvoice(inv._id)} className="h-4 w-4 accent-sarva-primary" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-sarva-text">
                                {inv.periodKey}
                                <Badge tone={overdue ? 'danger' : INVOICE_TONE[inv.status] || 'muted'}>{overdue ? 'Overdue' : inv.status}</Badge>
                              </div>
                              <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-sarva-muted">
                                <span>Total: {money(num(inv.total), inv.currency)}</span>
                                <span>Paid: {money(num(inv.paid), inv.currency)}</span>
                                <span className="font-semibold text-sarva-text">Remaining: {money(num(inv.balance), inv.currency)}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {openInvoices.length > 0 && (
                  <>
                    {/* Amount */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-sarva-text">Amount to Collect</h3>
                      <div className="mb-2 text-xs text-sarva-muted">Selected outstanding: <span className="font-semibold text-sarva-text">{money(selectedTotal, cur)}</span></div>
                      <div className="flex flex-wrap gap-2">
                        <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="max-w-[200px]" />
                        <Button variant="ghost" onClick={() => setAmount(String(selectedTotal))}>Pay Full</Button>
                      </div>
                      {!amountValid && amount !== '' && (
                        <p className="mt-1 text-xs text-sarva-danger">Amount must be greater than 0 and cannot exceed the selected outstanding total.</p>
                      )}
                    </div>

                    {/* Method */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-sarva-text">Payment Method</h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {paymentMethods.cash && (
                          <button
                            onClick={() => setMethod('cash')}
                            className={`rounded-2xl border-2 p-4 text-left transition ${method === 'cash' ? 'border-sarva-primary bg-sarva-primarySoft/30' : 'border-sarva-border hover:border-sarva-primary/40'}`}
                          >
                            <Banknote size={20} className="mb-2 text-sarva-primary" />
                            <div className="text-sm font-semibold text-sarva-text">Cash</div>
                            <div className="text-xs text-sarva-muted">In-person cash payment</div>
                          </button>
                        )}
                        {paymentMethods.manualQr && (
                          <button
                            onClick={() => setMethod('manual_qr')}
                            className={`rounded-2xl border-2 p-4 text-left transition ${method === 'manual_qr' ? 'border-sarva-primary bg-sarva-primarySoft/30' : 'border-sarva-border hover:border-sarva-primary/40'}`}
                          >
                            <QrCode size={20} className="mb-2 text-sarva-primary" />
                            <div className="text-sm font-semibold text-sarva-text">Manual QR</div>
                            <div className="text-xs text-sarva-muted">Scan & verify manually</div>
                          </button>
                        )}
                        {paymentMethods.esewa && (
                          <button
                            onClick={() => setMethod('esewa')}
                            className={`rounded-2xl border-2 p-4 text-left transition ${method === 'esewa' ? 'border-sarva-primary bg-sarva-primarySoft/30' : 'border-sarva-border hover:border-sarva-primary/40'}`}
                          >
                            <Smartphone size={20} className="mb-2 text-sarva-primary" />
                            <div className="text-sm font-semibold text-sarva-text">eSewa</div>
                            <div className="text-xs text-sarva-muted">Recorded manually for now</div>
                          </button>
                        )}
                      </div>
                    </div>

                    {method === 'cash' && (
                      <div className="rounded-2xl bg-sarva-bg p-4">
                        <label className="block text-sm">
                          <span className="mb-1 block text-xs font-medium text-sarva-muted">Amount received (optional, for change only)</span>
                          <Input type="number" min="0" step="0.01" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="max-w-[200px]" />
                        </label>
                        <div className="mt-2 text-sm">Change: <span className="font-semibold">{money(cashChange, cur)}</span></div>
                      </div>
                    )}

                    {method === 'manual_qr' && (
                      <div className="rounded-2xl bg-sarva-bg p-4">
                        <div className="mb-3 text-sm font-medium text-sarva-text">Scan to Pay</div>
                        {manualQrImage ? (
                          <img src={manualQrImage} alt="Payment QR" className="mb-3 h-40 w-40 rounded-xl bg-white object-contain p-2" />
                        ) : (
                          <p className="mb-3 text-xs text-sarva-muted">No QR image configured yet -- add one on Settings &rsaquo; Payment Methods.</p>
                        )}
                        <label className="block text-sm">
                          <span className="mb-1 block text-xs font-medium text-sarva-muted">Reference / Transaction ID</span>
                          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Required before confirming" className="max-w-[280px]" />
                        </label>
                      </div>
                    )}

                    {method === 'esewa' && (
                      <div className="rounded-2xl bg-sarva-bg p-4">
                        <p className="mb-3 text-xs text-sarva-muted">
                          Live eSewa checkout isn't wired to a verified merchant callback yet. This will record the
                          amount against a reference you provide, exactly like Manual QR, until that integration is built.
                        </p>
                        <label className="block text-sm">
                          <span className="mb-1 block text-xs font-medium text-sarva-muted">Transaction reference</span>
                          <Input value={reference} onChange={(e) => setReference(e.target.value)} className="max-w-[280px]" />
                        </label>
                      </div>
                    )}

                    {payError && <p className="text-sm text-sarva-danger">{payError}</p>}
                  </>
                )}
              </div>
            )}

            {success && (
              <div className="py-6 text-center">
                <CheckCircle2 size={40} className="mx-auto mb-3 text-sarva-success" />
                <h3 className="font-display text-lg font-semibold text-sarva-text">Payment Successful</h3>
                <p className="mt-1 text-sm text-sarva-muted">{selected.student.name} \u00b7 {money(success.totalPaid, cur)}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {success.receipts.filter((r) => r.paymentId).map((r) => (
                    <Button key={r.paymentId} variant="ghost" onClick={() => window.open(`/payments/${r.paymentId}/receipt`, '_blank')}>
                      View Receipt
                    </Button>
                  ))}
                  <Button variant="ghost" onClick={() => nav(`/students/${selected.student._id}`)}>View Student</Button>
                  <Button onClick={collectAnother}>Collect Another Payment</Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Summary panel */}
        <div className="xl:col-span-1">
          <Card className="bg-sarva-primary text-white" title={undefined}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/70">Payment Summary</h2>
            {!selected ? (
              <p className="text-sm text-white/70">Select a student to see a payment summary here.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-white/70">Student</span><span className="font-semibold">{selected.student.name}</span></div>
                <div className="flex items-center justify-between"><span className="text-white/70">Invoices</span><span className="font-semibold">{selectedInvoices.map((i) => i.periodKey).join(', ') || '\u2014'}</span></div>
                <div className="flex items-center justify-between"><span className="text-white/70">Method</span><span className="font-semibold capitalize">{method ? method.replaceAll('_', ' ') : '\u2014'}</span></div>
                <div className="my-3 border-t border-white/15" />
                <div className="flex items-center justify-between"><span className="text-white/70">Selected Outstanding</span><span className="font-semibold">{money(selectedTotal, cur)}</span></div>
                <div className="flex items-center justify-between"><span className="text-white/70">Paying Now</span><span className="font-bold text-sarva-gold">{money(amountNum, cur)}</span></div>
                <div className="flex items-center justify-between"><span className="text-white/70">Remaining</span><span className="font-semibold">{money(Math.max(0, selectedTotal - amountNum), cur)}</span></div>
                <Button variant="gold" className="mt-3 w-full justify-center" disabled={!canConfirm || !!success} onClick={openConfirm}>
                  Confirm Payment
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent payments + Needs collection */}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card title="Recent Payments">
          {summaryErr ? (
            <ErrorState message="Unable to load recent payments." onRetry={loadSummary} />
          ) : summaryLoading ? (
            <SkeletonRows rows={4} />
          ) : !monthSummary?.recentPayments?.length ? (
            <Empty>No payments recorded yet.</Empty>
          ) : (
            <div className="space-y-2">
              {monthSummary.recentPayments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => p.status !== 'reversed' && window.open(`/payments/${p.id}/receipt`, '_blank')}
                  className="flex w-full items-center justify-between rounded-xl border border-sarva-border p-3 text-left text-sm hover:bg-sarva-primarySoft/30"
                >
                  <div>
                    <div className="font-medium text-sarva-text">{p.student?.name || 'Student'}</div>
                    <div className="text-xs capitalize text-sarva-muted">{p.method?.replaceAll('_', ' ')} \u00b7 {new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className={p.status === 'reversed' ? 'font-semibold text-sarva-danger line-through' : 'font-semibold'}>{money(p.amount, p.currency || cur)}</div>
                    <Badge tone={p.status === 'reversed' ? 'danger' : 'success'}>{p.status === 'reversed' ? 'Reversed' : 'Paid'}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Needs Collection">
          {needsErr ? (
            <ErrorState message={needsErr} onRetry={loadNeedsCollection} />
          ) : needsLoading ? (
            <SkeletonRows rows={4} />
          ) : !needsCollection.length ? (
            <Empty>No outstanding balances right now.</Empty>
          ) : (
            <div className="space-y-2">
              {needsCollection.slice(0, 8).map((x) => {
                const daysOverdue = x.oldestDue ? Math.max(0, Math.floor((new Date() - new Date(x.oldestDue)) / dayMs)) : null;
                return (
                  <div key={x.studentId} className="flex items-center justify-between rounded-xl border border-sarva-border p-3 text-sm">
                    <div>
                      <div className="font-medium text-sarva-text">{x.name}</div>
                      <div className="text-xs text-sarva-muted">
                        {money(x.outstanding, cur)} {daysOverdue !== null && daysOverdue > 0 ? `\u00b7 ${daysOverdue}d overdue` : ''}
                      </div>
                    </div>
                    <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => selectStudentRecord(x.studentId)}>
                      Collect
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Confirmation modal */}
      <Modal open={confirmOpen} onClose={() => !processing && setConfirmOpen(false)} title="Confirm Payment">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-sarva-muted">Student</span><span className="font-semibold">{selected.student.name}</span></div>
            <div className="flex justify-between"><span className="text-sarva-muted">Amount</span><span className="font-semibold">{money(amountNum, cur)}</span></div>
            <div className="flex justify-between"><span className="text-sarva-muted">Method</span><span className="font-semibold capitalize">{method?.replaceAll('_', ' ')}</span></div>
            <div className="rounded-xl bg-sarva-bg p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sarva-muted">Allocation</div>
              {allocationPreview.map(({ invoice, alloc }) => (
                <div key={invoice._id} className="flex justify-between text-sm">
                  <span>{invoice.periodKey}</span>
                  <span className="font-medium">{money(alloc, cur)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={processing}>Cancel</Button>
              <Button onClick={doConfirmPay} loading={processing}>
                {processing ? 'Processing\u2026' : `Confirm ${money(amountNum, cur)}`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
