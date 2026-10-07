import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Page, Card, StatCard, Button, Table, Badge, Empty, PillTabs, Input, Select, money } from '../components/UI';
import { useAuth } from '../context/Auth';
import { Wallet, CreditCard, BedDouble, Calendar, ArrowLeft, Phone, Pencil, FileText, X, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

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

const STATUS_OPTIONS = ['active', 'on_leave', 'on_hold', 'suspended', 'checked_out'];
const BILLING_OPTIONS = ['anniversary', 'calendar'];

const TABS = [
  ['overview', 'Overview'],
  ['room', 'Room'],
  ['invoices', 'Invoices'],
  ['payments', 'Payments'],
  ['credit', 'Credit'],
];

const DOC_TYPES = [
  ['citizenship', 'Citizenship'],
  ['nid', 'National ID'],
  ['passport', 'Passport'],
  ['birth_certificate', 'Birth Certificate'],
  ['student_id', 'Student ID'],
  ['driving_licence', 'Driving Licence'],
  ['other', 'Other'],
];
const sidesFor = (type) => (['citizenship', 'nid'].includes(type) ? [['front', 'Front'], ['back', 'Back']] : [['single', 'Document']]);

const bedLabel = (value) => {
  const label = String(value || '').trim();
  if (!label) return '\u2014';
  return /^bed\b/i.test(label) ? label : `Bed ${label}`;
};

const num = (v) => Number(v?.$numberDecimal ?? v ?? 0);

export default function StudentProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { hostel } = useAuth();

  const [d, setD] = useState(null);
  const [room, setRoom] = useState({ current: null, history: [], rooms: [], beds: [] });
  const [roomLoading, setRoomLoading] = useState(true);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferRoomId, setTransferRoomId] = useState('');
  const [transferBedId, setTransferBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferReview, setTransferReview] = useState(false);
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [newDocType, setNewDocType] = useState('citizenship');
  const [newDocSide, setNewDocSide] = useState('front');

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
      setRoom({ current, history, rooms: data.rooms || [], beds: data.beds || [] });
    } catch (e) {
      // Room management may be disabled (403) -- leave section hidden, not an error.
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
  if (!d) return <Page title="Student"><div className="skeleton h-40 rounded-[1.75rem]" /></Page>;

  const s = d.student;
  const outstanding = (d.invoices || []).reduce((a, x) => a + num(x.balance), 0);
  const totalCredit = (d.credits || [])
    .filter((c) => c.type === 'charge')
    .reduce((a, x) => a + num(x.amount), 0);
  const totalRepaid = (d.credits || [])
    .filter((c) => c.type === 'repayment')
    .reduce((a, x) => a + num(x.amount), 0);

  const roomParts = room.current
    ? {
        building: room.current.roomId?.building || '\u2014',
        floor: room.current.roomId?.floor || '\u2014',
        room: room.current.roomId?.name || '\u2014',
        bed: room.current.bedId?.label || '\u2014',
      }
    : null;
  const roomText = roomParts ? `${roomParts.room} \u00b7 ${bedLabel(roomParts.bed)}` : 'Not assigned';

  const currentBedId = String(room.current?.bedId?._id || room.current?.bedId || '');
  const transferRooms = room.rooms.filter((r) => Number(r.availableCount || 0) > 0);
  const transferBeds = room.beds.filter((b) =>
    String(b.roomId?._id || b.roomId) === transferRoomId &&
    String(b._id) !== currentBedId &&
    b.status === 'available' && !b.studentId
  );
  const selectedTransferRoom = room.rooms.find((r) => String(r._id) === transferRoomId);
  const selectedTransferBed = transferBeds.find((b) => String(b._id) === transferBedId);

  const openTransfer = () => {
    setTransferRoomId('');
    setTransferBedId('');
    setTransferReason('');
    setTransferReview(false);
    setTransferError('');
    setTransferOpen(true);
  };

  const confirmTransfer = async () => {
    if (!transferBedId || !transferReason.trim() || transferSaving) return;
    setTransferSaving(true);
    setTransferError('');
    try {
      await api.post('/rooms/transfer', { studentId: id, bedId: transferBedId, reason: transferReason.trim() });
      await Promise.all([load(), loadRoom()]);
      setTransferOpen(false);
      setTransferReview(false);
    } catch (e) {
      setTransferError(e.response?.data?.message || e.message || 'Room transfer failed.');
      setTransferReview(false);
      if (e.response?.status === 409) await loadRoom();
    } finally {
      setTransferSaving(false);
    }
  };

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

  const startEdit = () => {
    setForm({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      alternatePhone: s.alternatePhone || '',
      status: s.status || 'active',
      monthlyFee: num(s.monthlyFee),
      billingMode: s.billingMode || 'anniversary',
      dob: s.dob ? String(s.dob).slice(0, 10) : '',
      gender: s.gender || '',
      bloodGroup: s.bloodGroup || '',
      addressPermanent: s.address?.permanent || '',
      addressCurrent: s.address?.current || '',
      guardianName: s.guardian?.name || '',
      guardianRelation: s.guardian?.relation || '',
      guardianPhone: s.guardian?.phone || '',
      lgName: s.localGuardian?.name || '',
      lgRelation: s.localGuardian?.relation || '',
      lgPhone: s.localGuardian?.phone || '',
      lgAddress: s.localGuardian?.address || '',
      institution: s.academic?.institution || '',
      course: s.academic?.course || '',
      year: s.academic?.year || '',
      ecName: s.emergencyContact?.name || '',
      ecPhone: s.emergencyContact?.phone || '',
      ecRelation: s.emergencyContact?.relation || '',
      notes: s.notes || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.patch(`/students/${id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        alternatePhone: form.alternatePhone,
        status: form.status,
        monthlyFee: Number(form.monthlyFee),
        billingMode: form.billingMode,
        dob: form.dob || undefined,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        address: { permanent: form.addressPermanent, current: form.addressCurrent },
        guardian: { name: form.guardianName, relation: form.guardianRelation, phone: form.guardianPhone },
        localGuardian: { name: form.lgName, relation: form.lgRelation, phone: form.lgPhone, address: form.lgAddress },
        academic: { institution: form.institution, course: form.course, year: form.year },
        emergencyContact: { name: form.ecName, phone: form.ecPhone, relation: form.ecRelation },
        notes: form.notes,
      });
      setEditing(false);
      setForm(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await api.post(`/students/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const uploadDocument = async (type, side, file) => {
    if (!file) return;
    const key = `${type}:${side}`;
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      fd.append('side', side);
      await api.post(`/students/${id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/students" className="flex w-fit items-center gap-1 text-xs font-medium text-sarva-muted hover:text-sarva-primary">
        <ArrowLeft size={14} /> Students
      </Link>

      {/* Hero profile card */}
      <div className="card rounded-[1.75rem] bg-sarva-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-sarva-primary to-sarva-primaryDark">
              {s.photo?.url ? (
                <img src={s.photo.url} alt={s.name} className="h-full w-full object-cover object-top" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-white/90">
                  {s.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-transparent transition hover:bg-black/40 hover:text-white">
                <span className="text-[10px] font-semibold">{photoUploading ? '\u2026' : 'Change'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={photoUploading}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; uploadPhoto(f); }}
                />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-semibold text-sarva-text">{s.name}</h1>
                <Badge tone={STATUS_TONE[s.status] || 'muted'}>{s.status}</Badge>
              </div>
              <div className="mt-1 text-sm text-sarva-muted">{s.studentCode}</div>
              {s.phone && (
                <div className="mt-1 flex items-center gap-1 text-sm text-sarva-muted">
                  <Phone size={13} /> {s.phone}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:self-start">
            {!editing && (
              <Button variant="ghost" onClick={startEdit}>
                <Pencil size={14} /> Edit
              </Button>
            )}
            {s.status !== 'checked_out' && (
              <Button variant="gold" onClick={checkout}>
                Checkout Student
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Edit form -- covers every field on the student record */}
      {editing && form && (
        <Card title="Edit student">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-sarva-muted">Basic</h3>
              <Input placeholder="Full name" value={form.name} onChange={set('name')} />
              <Input placeholder="Email" value={form.email} onChange={set('email')} />
              <Input placeholder="Phone" value={form.phone} onChange={set('phone')} />
              <Input placeholder="Alternate phone" value={form.alternatePhone} onChange={set('alternatePhone')} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.status} onChange={set('status')}>
                  {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o.replaceAll('_', ' ')}</option>)}
                </Select>
                <Select value={form.billingMode} onChange={set('billingMode')}>
                  {BILLING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" step="0.01" placeholder="Monthly fee" value={form.monthlyFee} onChange={set('monthlyFee')} />
                <Input type="date" value={form.dob} onChange={set('dob')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Gender" value={form.gender} onChange={set('gender')} />
                <Input placeholder="Blood group" value={form.bloodGroup} onChange={set('bloodGroup')} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-sarva-muted">Address</h3>
              <Input placeholder="Permanent address" value={form.addressPermanent} onChange={set('addressPermanent')} />
              <Input placeholder="Current address" value={form.addressCurrent} onChange={set('addressCurrent')} />

              <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-sarva-muted">Parent / Guardian</h3>
              <Input placeholder="Name" value={form.guardianName} onChange={set('guardianName')} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Relation" value={form.guardianRelation} onChange={set('guardianRelation')} />
                <Input placeholder="Phone" value={form.guardianPhone} onChange={set('guardianPhone')} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-sarva-muted">Local Guardian</h3>
              <Input placeholder="Name" value={form.lgName} onChange={set('lgName')} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Relation" value={form.lgRelation} onChange={set('lgRelation')} />
                <Input placeholder="Phone" value={form.lgPhone} onChange={set('lgPhone')} />
              </div>
              <Input placeholder="Address" value={form.lgAddress} onChange={set('lgAddress')} />

              <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-sarva-muted">Emergency Contact</h3>
              <Input placeholder="Name" value={form.ecName} onChange={set('ecName')} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Relation" value={form.ecRelation} onChange={set('ecRelation')} />
                <Input placeholder="Phone" value={form.ecPhone} onChange={set('ecPhone')} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-sarva-muted">Academic</h3>
              <Input placeholder="Institution" value={form.institution} onChange={set('institution')} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Course" value={form.course} onChange={set('course')} />
                <Input placeholder="Year" value={form.year} onChange={set('year')} />
              </div>

              <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-sarva-muted">Notes</h3>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                className="w-full rounded-xl border border-sarva-border bg-white px-3 py-2.5 text-sm outline-none focus:border-sarva-primary focus:ring-2 focus:ring-sarva-primary/20"
                placeholder="Notes"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
              <X size={14} /> Cancel
            </Button>
            <Button onClick={saveEdit} loading={saving}>
              Save changes
            </Button>
          </div>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Monthly fee" value={money(num(s.monthlyFee), hostel.currency)} icon={Wallet} tone="primary" />
        <StatCard label="Outstanding" value={money(outstanding, hostel.currency)} icon={CreditCard} tone={outstanding > 0 ? 'warning' : 'success'} />
        <StatCard label="Room / Bed" value={roomText} icon={BedDouble} tone="gold" />
        <StatCard label="Admission" value={new Date(s.admissionDate).toLocaleDateString()} icon={Calendar} tone="primary" />
      </div>

      {/* Tab navigation */}
      <PillTabs options={TABS} value={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Personal & Guardian">
            <div className="space-y-2 text-sm">
              <p><b>Permanent address:</b> {s.address?.permanent || '\u2014'}</p>
              <p><b>Current address:</b> {s.address?.current || '\u2014'}</p>
              <p><b>Parent/guardian:</b> {s.guardian?.name || '—'} · {s.guardian?.phone || '—'}</p>
              <p><b>Local guardian:</b> {s.localGuardian?.name || '—'} · {s.localGuardian?.phone || '—'}</p>
              <p><b>Institution:</b> {s.academic?.institution || '—'}{s.academic?.course ? ` · ${s.academic.course}` : ''}</p>
            </div>
          </Card>

          <Card title="Documents">
            {!d.documents?.length ? (
              <Empty>No documents uploaded.</Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {d.documents.map((doc) => {
                  const typeLabel = DOC_TYPES.find(([t]) => t === doc.type)?.[1] || doc.type;
                  const sideLabel = sidesFor(doc.type).find(([sv]) => sv === doc.side)?.[1] || doc.side;
                  const key = `${doc.type}:${doc.side}`;
                  const isImage = doc.file?.resourceType === 'image';
                  const previewSrc = doc.file?.previewUrl || doc.file?.url;
                  return (
                    <div key={doc._id} className="overflow-hidden rounded-xl border border-sarva-border bg-white">
                      <div className="flex h-32 items-center justify-center bg-sarva-bg">
                        {isImage ? (
                          <img src={previewSrc} alt={`${typeLabel} ${sideLabel}`} className="h-full w-full object-cover" />
                        ) : (
                          <a href={previewSrc} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-sarva-primary">
                            <FileText size={26} />
                            <span className="text-xs font-medium">Open file</span>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="text-xs text-sarva-muted">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-sarva-text">{typeLabel}</div>
                          {sideLabel}
                          {doc.number && <div className="text-[11px]">{doc.number}</div>}
                        </div>
                        <label className="cursor-pointer text-xs font-semibold text-sarva-primary hover:underline">
                          {uploadingKey === key ? 'Uploading\u2026' : 'Replace'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            disabled={uploadingKey === key}
                            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; uploadDocument(doc.type, doc.side, f); }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-sarva-bg p-3">
              <Select
                value={newDocType}
                onChange={(e) => { setNewDocType(e.target.value); setNewDocSide(sidesFor(e.target.value)[0][0]); }}
                className="w-auto"
              >
                {DOC_TYPES.map(([t, l]) => <option key={t} value={t}>{l}</option>)}
              </Select>
              <Select value={newDocSide} onChange={(e) => setNewDocSide(e.target.value)} className="w-auto">
                {sidesFor(newDocType).map(([sv, sl]) => <option key={sv} value={sv}>{sl}</option>)}
              </Select>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-sarva-primary px-4 py-2 text-xs font-semibold text-white hover:bg-sarva-primaryHover">
                  {uploadingKey === `${newDocType}:${newDocSide}` ? 'Uploading\u2026' : 'Add document'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  disabled={uploadingKey === `${newDocType}:${newDocSide}`}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; uploadDocument(newDocType, newDocSide, f); }}
                />
              </label>
            </div>
          </Card>
        </div>
      )}

      {tab === 'room' && (
        <Card title="Room">
          {roomParts && s.status !== 'checked_out' && !roomLoading && (
            <div className="mb-4 flex justify-end">
              <Button onClick={openTransfer} className="w-full sm:w-auto">
                <ArrowRightLeft size={14} /> Transfer Room
              </Button>
            </div>
          )}
          {roomLoading ? (
            <div className="text-sm text-sarva-muted">Loading room details\u2026</div>
          ) : (
            <div className="space-y-4">
              {roomParts ? (
                <div className="rounded-2xl bg-sarva-bg p-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-sarva-muted">Building</div>
                      <div className="mt-1 text-sm font-semibold text-sarva-text">{roomParts.building}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-sarva-muted">Floor</div>
                      <div className="mt-1 text-sm font-semibold text-sarva-text">{roomParts.floor}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-sarva-muted">Room</div>
                      <div className="mt-1 text-sm font-semibold text-sarva-text">{roomParts.room}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-sarva-muted">Bed</div>
                      <div className="mt-1 text-sm font-semibold text-sarva-text">{bedLabel(roomParts.bed)}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-sarva-muted">
                    Assigned {new Date(room.current.startDate).toLocaleDateString()}
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
                      <div key={h._id} className="rounded-2xl bg-sarva-bg p-3 text-sm">
                        <div className="font-medium text-sarva-text">
                          Building {h.roomId?.building || '—'} · Floor {h.roomId?.floor || '—'} · Room {h.roomId?.name || '—'} · {bedLabel(h.bedId?.label)}
                        </div>
                        <div className="text-xs text-sarva-muted">
                          {new Date(h.startDate).toLocaleDateString()} \u2192 {h.endDate ? new Date(h.endDate).toLocaleDateString() : 'present'}
                          {h.endReason ? ` \u00b7 ${h.endReason}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {transferOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && !transferSaving) setTransferOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label="Transfer room" className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-[1.75rem] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-sarva-primary">Room transfer</div><h2 className="mt-1 text-xl font-semibold text-sarva-text">{s.name}</h2><p className="mt-1 text-sm text-sarva-muted">Move the student while preserving billing and payment history.</p></div>
              <button type="button" onClick={() => !transferSaving && setTransferOpen(false)} className="rounded-full p-2 text-sarva-muted hover:bg-sarva-bg" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="mt-5 rounded-2xl border border-sarva-border bg-sarva-bg p-4"><div className="text-[11px] font-semibold uppercase tracking-wide text-sarva-muted">Current assignment</div><div className="mt-2 font-semibold text-sarva-text">{roomParts?.building} · {roomParts?.floor} · Room {roomParts?.room} · {bedLabel(roomParts?.bed)}</div></div>
            {!transferReview ? (
              <div className="mt-5 space-y-4">
                <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sarva-muted">New room</label><Select value={transferRoomId} onChange={(e) => { setTransferRoomId(e.target.value); setTransferBedId(''); setTransferError(''); }}><option value="">Select destination room</option>{transferRooms.map((r) => <option key={r._id} value={r._id}>{r.building || 'Building'} · {r.floor || 'Floor'} · Room {r.name} — {r.availableCount || 0} {Number(r.availableCount) === 1 ? 'bed' : 'beds'} available</option>)}</Select></div>
                <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sarva-muted">Available bed</label><Select value={transferBedId} disabled={!transferRoomId} onChange={(e) => { setTransferBedId(e.target.value); setTransferError(''); }}><option value="">{transferRoomId ? 'Select available bed' : 'Select a room first'}</option>{transferBeds.map((b) => <option key={b._id} value={b._id}>{bedLabel(b.label)}</option>)}</Select>{transferRoomId && !transferBeds.length && <p className="mt-2 text-xs font-medium text-sarva-danger">No available bed in this room.</p>}</div>
                <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sarva-muted">Transfer reason</label><textarea value={transferReason} onChange={(e) => { setTransferReason(e.target.value); setTransferError(''); }} rows={3} maxLength={300} placeholder="Example: Student requested room change" className="w-full resize-none rounded-xl border border-sarva-border bg-white px-3 py-2.5 text-sm outline-none focus:border-sarva-primary focus:ring-2 focus:ring-sarva-primary/20" /></div>
                {transferError && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-sarva-danger">{transferError}</div>}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setTransferOpen(false)}>Cancel</Button><Button disabled={!transferRoomId || !transferBedId || !transferReason.trim()} onClick={() => setTransferReview(true)}>Review Transfer</Button></div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-sarva-border p-4"><div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div><div className="text-[11px] font-semibold uppercase tracking-wide text-sarva-muted">From</div><div className="mt-1 font-semibold">Room {roomParts?.room} · {bedLabel(roomParts?.bed)}</div></div><ArrowRightLeft size={20} className="text-sarva-primary"/><div><div className="text-[11px] font-semibold uppercase tracking-wide text-sarva-muted">To</div><div className="mt-1 font-semibold">Room {selectedTransferRoom?.name || '—'} · {bedLabel(selectedTransferBed?.label)}</div></div></div><div className="mt-4 border-t border-sarva-border pt-3 text-sm text-sarva-muted">Reason: <span className="font-medium text-sarva-text">{transferReason.trim()}</span></div></div>
                <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0"/>Invoices and payment history remain unchanged.</div>
                {transferError && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-sarva-danger">{transferError}</div>}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={transferSaving} onClick={() => setTransferReview(false)}>Back</Button><Button loading={transferSaving} onClick={confirmTransfer}>Confirm Transfer</Button></div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <Card title="Invoices">
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
      )}

      {tab === 'payments' && (
        <Card title="Payments">
          {!d.payments?.length ? (
            <Empty>No payments recorded yet.</Empty>
          ) : (
            <Table heads={['Date', 'Amount', 'Method', 'Reference', 'Status']}>
              {d.payments.map((p) => (
                <tr key={p._id}>
                  <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 font-semibold">{money(num(p.amount), p.currency)}</td>
                  <td className="p-3 capitalize">{(p.method || '\u2014').replaceAll('_', ' ')}</td>
                  <td className="p-3 text-sarva-muted">{p.reference || '\u2014'}</td>
                  <td className="p-3">
                    <Badge tone={PAYMENT_STATUS_TONE[p.status] || 'muted'}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === 'credit' && (
        <Card title="Credit">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-sarva-bg p-3">
              <div className="text-xs uppercase tracking-wide text-sarva-muted">Total charged</div>
              <div className="mt-1 text-lg font-bold tabular-nums text-sarva-text">{money(totalCredit, hostel.currency)}</div>
            </div>
            <div className="rounded-2xl bg-sarva-bg p-3">
              <div className="text-xs uppercase tracking-wide text-sarva-muted">Total repaid</div>
              <div className="mt-1 text-lg font-bold tabular-nums text-sarva-text">{money(totalRepaid, hostel.currency)}</div>
            </div>
            <div className="rounded-2xl bg-sarva-bg p-3">
              <div className="text-xs uppercase tracking-wide text-sarva-muted">Remaining (outstanding)</div>
              <div className="mt-1 text-lg font-bold tabular-nums text-sarva-danger">{money(outstanding, hostel.currency)}</div>
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
                  <td className="p-3 text-sarva-muted">{c.reason || '\u2014'}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
