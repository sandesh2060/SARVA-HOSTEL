import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Page, Card, Input, Select, Button, money } from '../components/UI';
import { useAuth } from '../context/Auth';
import { ArrowLeft, UserRound, MapPin, Users2, GraduationCap, BedDouble, FileText, ImagePlus, Trash2 } from 'lucide-react';

const initial = {
  name: '', email: '', phone: '', alternatePhone: '', dob: '', gender: '', bloodGroup: '',
  permanentAddress: '', currentAddress: '', sameAddress: true,
  guardianName: '', guardianPhone: '', guardianRelation: 'Parent',
  localGuardianName: '', localGuardianPhone: '', localGuardianAddress: '',
  institution: '', course: '', year: '',
  monthlyFee: '', admissionDate: new Date().toISOString().slice(0, 10), billingMode: 'anniversary',
  notes: '',
};

const documentTypes = [
  ['citizenship', 'Citizenship'],
  ['nid', 'National ID (NID)'],
  ['passport', 'Passport'],
  ['birth_certificate', 'Birth Certificate'],
  ['student_id', 'Student ID'],
  ['driving_licence', 'Driving Licence'],
  ['other', 'Other'],
];

export default function StudentRegister() {
  const { hostel } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState(initial);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [docs, setDocs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [bedId, setBedId] = useState('');
  const [roomLoading, setRoomLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((x) => ({ ...x, [k]: v }));

  const loadRooms = useCallback(async () => {
    setRoomLoading(true);
    try {
      const { data } = await api.get('/rooms/overview');
      setRooms(data.rooms || []);
      setBeds(data.beds || []);
    } catch (e) {
      if (e.response?.status !== 403) setError(e.response?.data?.message || e.message);
    } finally {
      setRoomLoading(false);
    }
  }, []);

  useEffect(() => { void loadRooms(); }, [loadRooms]);

  const selectedRoom = rooms.find((r) => r._id === roomId);
  const roomBeds = beds.filter((b) => b.roomId === roomId || b.roomId?._id === roomId);
  const availableBeds = roomBeds.filter((b) => b.status === 'available' && !b.studentId);
  const occupiedCount = roomBeds.filter((b) => b.status === 'occupied' || b.studentId).length;

  const addDoc = () =>
    setDocs((x) => [...x, { id: `${Date.now()}-${Math.random()}`, type: 'citizenship', side: 'front', number: '', file: null }]);
  const editDoc = (id, p) => setDocs((x) => x.map((d) => (d.id === id ? { ...d, ...p } : d)));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (!form.name.trim() || !form.phone.trim() || !form.permanentAddress.trim() || !form.guardianName.trim() || !form.guardianPhone.trim()) {
        throw new Error('Complete all fields marked *');
      }
      const fee = Number(form.monthlyFee);
      if (!Number.isFinite(fee) || fee < 0) throw new Error('Enter a valid monthly fee');

      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        alternatePhone: form.alternatePhone,
        dob: form.dob || undefined,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        address: { permanent: form.permanentAddress, current: form.sameAddress ? form.permanentAddress : form.currentAddress },
        guardian: { name: form.guardianName, phone: form.guardianPhone, relation: form.guardianRelation },
        localGuardian: { name: form.localGuardianName, phone: form.localGuardianPhone, address: form.localGuardianAddress },
        academic: { institution: form.institution, course: form.course, year: form.year },
        monthlyFee: fee,
        admissionDate: form.admissionDate,
        billingMode: form.billingMode,
        notes: form.notes,
      };

      const { data: s } = await api.post('/students', payload);

      if (bedId) {
        try {
          await api.post('/rooms/assign', { studentId: s._id, bedId, reason: 'Initial assignment during student registration' });
        } catch (assignError) {
          // Student was created; surface the room-assignment failure on their profile instead of blocking navigation.
          nav(`/students/${s._id}`, { state: { justRegistered: true, roomAssignFailed: true } });
          return;
        }
      }

      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        await api.post(`/students/${s._id}/photo`, fd);
      }

      for (const d of docs) {
        if (!d.file) continue;
        const fd = new FormData();
        fd.append('file', d.file);
        fd.append('type', d.type);
        fd.append('side', d.side);
        fd.append('number', d.number);
        await api.post(`/students/${s._id}/documents`, fd);
      }

      nav(`/students/${s._id}`, { state: { justRegistered: true } });
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title={
        <div className="space-y-1">
          <Link to="/students" className="flex items-center gap-1 text-xs font-medium text-sarva-muted hover:text-sarva-primary">
            <ArrowLeft size={14} /> Students
          </Link>
          <div>Register Student</div>
        </div>
      }
      subtitle="Create a new hostel student record."
    >
      <Card className="sarva-register-card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold text-sarva-text">Student details</h2>
          <span className="text-xs text-sarva-muted">Fields marked * are required</span>
        </div>

        <form onSubmit={submit} className="sarva-register-form space-y-6">
          <Section icon={UserRound} title="Personal">
            <Input required placeholder="Student name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input required placeholder="Phone *" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input placeholder="Alternate phone" value={form.alternatePhone} onChange={(e) => set('alternatePhone', e.target.value)} />
            <Input type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
            <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Gender (optional)</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </Select>
            <Input placeholder="Blood group" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} />
            <div className="flex items-center gap-3 rounded-xl border border-sarva-border bg-white px-3 py-2.5">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sarva-primarySoft text-sarva-primary">
                  <ImagePlus size={16} />
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-sarva-primarySoft file:px-2 file:py-1 file:text-sarva-primary"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPhoto(file);
                  setPhotoPreview((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return file ? URL.createObjectURL(file) : null;
                  });
                }}
              />
            </div>
          </Section>

          <Section icon={MapPin} title="Address">
            <Input required placeholder="Permanent address *" value={form.permanentAddress} onChange={(e) => set('permanentAddress', e.target.value)} />
            <label className="flex items-center gap-2 rounded-xl border border-sarva-border bg-white px-3 py-2.5 text-sm">
              <input type="checkbox" checked={form.sameAddress} onChange={(e) => set('sameAddress', e.target.checked)} />
              Same current address
            </label>
            {!form.sameAddress && (
              <Input placeholder="Current address" value={form.currentAddress} onChange={(e) => set('currentAddress', e.target.value)} />
            )}
          </Section>

          <Section icon={Users2} title="Parent / guardian">
            <Input required placeholder="Parent / guardian name *" value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} />
            <Input required placeholder="Parent / guardian phone *" value={form.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} />
            <Input placeholder="Relationship" value={form.guardianRelation} onChange={(e) => set('guardianRelation', e.target.value)} />
            <Input placeholder="Local guardian name" value={form.localGuardianName} onChange={(e) => set('localGuardianName', e.target.value)} />
            <Input placeholder="Local guardian phone" value={form.localGuardianPhone} onChange={(e) => set('localGuardianPhone', e.target.value)} />
            <Input placeholder="Local guardian address" value={form.localGuardianAddress} onChange={(e) => set('localGuardianAddress', e.target.value)} />
          </Section>

          <Section icon={GraduationCap} title="Academic & billing">
            <Input placeholder="School / college" value={form.institution} onChange={(e) => set('institution', e.target.value)} />
            <Input placeholder="Course / faculty" value={form.course} onChange={(e) => set('course', e.target.value)} />
            <Input placeholder="Year / semester" value={form.year} onChange={(e) => set('year', e.target.value)} />
            <Input required type="number" min="0" step="0.01" placeholder="Monthly fee *" value={form.monthlyFee} onChange={(e) => set('monthlyFee', e.target.value)} />
            <Input required type="date" value={form.admissionDate} onChange={(e) => set('admissionDate', e.target.value)} />
            <Select value={form.billingMode} onChange={(e) => set('billingMode', e.target.value)}>
              <option value="anniversary">Admission-date cycle</option>
              <option value="calendar">Calendar-month cycle</option>
            </Select>
          </Section>

          <div className="sarva-register-block rounded-2xl border border-sarva-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <BedDouble size={16} className="text-sarva-primary" />
              <b className="text-sm text-sarva-text">Room assignment (optional)</b>
            </div>
            <p className="mb-3 text-xs text-sarva-muted">
              Assign an available bed now, or leave this blank and assign the student later from Rooms & Beds.
            </p>
            {roomLoading ? (
              <div className="text-sm text-sarva-muted">Loading rooms and beds…</div>
            ) : !rooms.length ? (
              <div className="rounded-xl bg-sarva-primarySoft/40 p-3 text-sm text-sarva-muted">
                No rooms exist yet. Create rooms and beds from{' '}
                <Link className="font-semibold text-sarva-primary underline" to="/rooms">Rooms & Beds</Link>, then return here.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <Select value={roomId} onChange={(e) => { setRoomId(e.target.value); setBedId(''); }}>
                  <option value="">No room selected</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {[r.building, r.floor, r.name].filter(Boolean).join(' · ')} —{' '}
                      {beds.filter((b) => b.roomId === r._id || b.roomId?._id === r._id).filter((b) => b.status === 'available' && !b.studentId).length} available
                    </option>
                  ))}
                </Select>
                <Select value={bedId} disabled={!roomId} onChange={(e) => setBedId(e.target.value)}>
                  <option value="">{roomId ? 'Select available bed' : 'Select room first'}</option>
                  {availableBeds.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.label}{b.price ? ` · ${money(b.price?.$numberDecimal ?? b.price, hostel?.currency || 'NPR')}` : ''}
                    </option>
                  ))}
                </Select>
                {selectedRoom && (
                  <div className="rounded-xl bg-sarva-primarySoft/40 px-3 py-2 text-xs text-sarva-muted md:col-span-2">
                    Room {selectedRoom.name} · {roomBeds.length} beds · {occupiedCount} occupied · {availableBeds.length} available
                    {bedId ? ' · Bed selected' : ''}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sarva-register-block rounded-2xl border border-sarva-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-sarva-primary" />
                <div>
                  <b className="text-sm text-sarva-text">Documents (optional)</b>
                  <p className="text-xs text-sarva-muted">Citizenship/NID: add Front and Back separately. JPG/PNG/WEBP/PDF, max 8 MB.</p>
                </div>
              </div>
              <Button type="button" variant="ghost" onClick={addDoc}>+ Add document</Button>
            </div>
            {docs.map((d) => (
              <div key={d.id} className="mb-2 grid gap-2 md:grid-cols-5">
                <Select
                  value={d.type}
                  onChange={(e) => editDoc(d.id, { type: e.target.value, side: ['citizenship', 'nid'].includes(e.target.value) ? 'front' : 'single' })}
                >
                  {documentTypes.map(([v, l]) => (
                    <option value={v} key={v}>{l}</option>
                  ))}
                </Select>
                <Select value={d.side} onChange={(e) => editDoc(d.id, { side: e.target.value })}>
                  {['citizenship', 'nid'].includes(d.type) ? (
                    <>
                      <option value="front">Front</option>
                      <option value="back">Back</option>
                    </>
                  ) : (
                    <option value="single">Document</option>
                  )}
                </Select>
                <Input placeholder="Document number" value={d.number} onChange={(e) => editDoc(d.id, { number: e.target.value })} />
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => editDoc(d.id, { file: e.target.files?.[0] || null })}
                />
                <button
                  type="button"
                  className="flex items-center justify-center gap-1 rounded-xl border border-sarva-border px-3 text-sm text-sarva-danger hover:bg-rose-50"
                  onClick={() => setDocs((x) => x.filter((a) => a.id !== d.id))}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>

          <textarea
            className="w-full rounded-xl border border-sarva-border bg-white p-3 text-sm outline-none focus:border-sarva-primary focus:ring-2 focus:ring-sarva-primary/20"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />

          {error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-sarva-danger">{error}</div>}

          <div className="sarva-register-actions flex items-center gap-3">
            <Button disabled={saving}>{saving ? 'Registering & uploading…' : 'Register Student'}</Button>
            <Button type="button" variant="ghost" onClick={() => nav('/students')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="sarva-register-section">
      <div className="sarva-register-section__title mb-3 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-sarva-primary" />}
        <h3 className="text-sm font-semibold text-sarva-text">{title}</h3>
      </div>
      <div className="sarva-register-section__grid grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  );
}
