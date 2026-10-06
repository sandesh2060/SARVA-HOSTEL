import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Page, Button, Empty, ErrorState, StatCard, PillTabs } from '../components/UI';
import StudentCard, { StudentCardSkeleton } from '../components/StudentCard';
import { useAuth } from '../context/Auth';
import { Search, Plus, Users, UserCheck, Clock, LogOut as LogOutIcon, Send, Copy, ExternalLink, Share2, X, Check } from 'lucide-react';

const STATUS_TONE = {
  active: 'success',
  on_leave: 'warning',
  on_hold: 'muted',
  suspended: 'danger',
  checked_out: 'muted',
};

const STATUS_LABEL = {
  active: 'Active',
  on_leave: 'On leave',
  on_hold: 'On hold',
  suspended: 'Suspended',
  checked_out: 'Checked out',
};

// NOTE: these are the real status values the API returns. No "Outstanding"
// filter is included here because there is no due-balance field on the
// student payload yet -- adding one would be fabricated UI per the
// no-fake-data rule. Wire it in once a real balance/due field exists.
const STATUS_FILTERS = [
  ['all', 'All'],
  ['active', 'Active'],
  ['on_leave', 'On leave'],
  ['on_hold', 'On hold'],
  ['suspended', 'Suspended'],
  ['checked_out', 'Checked out'],
];

export default function Students() {
  const { hostel } = useAuth();
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [beds, setBeds] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);

  const debounceRef = useRef(null);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/students', { params: q ? { q } : {} });
      setRows(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/rooms/overview');
      setRooms(data.rooms || []);
      setBeds(data.beds || []);
    } catch {
      // Room management may be disabled -- Room/Bed info simply won't render.
    }
  }, []);

  useEffect(() => {
    void load();
    void loadRooms();
  }, [load, loadRooms]);

  // Debounced live search, same server-side query as the old submit handler.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(query);
    }, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const roomById = useMemo(() => {
    const map = new Map();
    for (const r of rooms) map.set(r._id, r);
    return map;
  }, [rooms]);

  const bedByStudent = useMemo(() => {
    const map = new Map();
    for (const b of beds) {
      if (b.studentId) map.set(b.studentId._id || b.studentId, b);
    }
    return map;
  }, [beds]);

  const roomLabel = (bed) => {
    if (!bed) return null;
    const roomIdValue = bed.roomId?._id || bed.roomId;
    const room = roomById.get(roomIdValue);
    const name = room ? [room.building, room.floor, room.name].filter(Boolean).join(' \u00b7 ') : null;
    return name ? `${name} \u00b7 ${bed.label}` : `Bed ${bed.label}`;
  };

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return rows;
    return rows.filter((s) => s.status === statusFilter);
  }, [rows, statusFilter]);

  const counts = useMemo(() => {
    const c = { total: rows.length, active: 0, on_leave: 0, checked_out: 0 };
    for (const s of rows) {
      if (s.status === 'active') c.active++;
      if (s.status === 'on_leave') c.on_leave++;
      if (s.status === 'checked_out') c.checked_out++;
    }
    return c;
  }, [rows]);

  const openStudent = (id) => nav(`/students/${id}`);

  const openInvitation = async () => {
    try {
      const { data } = await api.get('/public-admission/settings');
      setInviteInfo(data);
      setInviteOpen(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load the student invitation link.');
    }
  };

  const invitationUrl = inviteInfo?.publicUrl || '';

  const copyInvitation = async () => {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // The visible link remains selectable when clipboard access is unavailable.
    }
  };

  const shareInvitation = async () => {
    if (!invitationUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${hostel?.name || 'Hostel'} student admission`,
          text: `Please complete your student admission request for ${hostel?.name || 'the hostel'}.`,
          url: invitationUrl,
        });
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return;
      }
    }
    await copyInvitation();
  };

  const openPublicForm = () => {
    if (invitationUrl) window.open(invitationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Page
      title="Students"
      subtitle="Manage hostel students and records."
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onClick={openInvitation}>
            <Send size={16} /> Send Invitation
          </Button>
          <Button variant="gold" onClick={() => nav('/students/new')}>
            <Plus size={16} /> Add Student
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total students" value={counts.total} icon={Users} tone="primary" />
        <StatCard label="Active" value={counts.active} icon={UserCheck} tone="success" />
        <StatCard label="On leave" value={counts.on_leave} icon={Clock} tone="warning" />
        <StatCard label="Checked out" value={counts.checked_out} icon={LogOutIcon} tone="gold" />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); load(query); }}
        className="mt-4 flex flex-col gap-2 rounded-full bg-sarva-surface p-2 shadow-premium-sm sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sarva-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, student ID, phone or email\u2026"
            className="w-full rounded-full bg-transparent py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-sarva-muted"
          />
        </div>
        <Button type="submit" variant="gold" className="sm:px-6">
          <Search size={15} /> Search
        </Button>
      </form>

      <div className="mt-4">
        <PillTabs options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState message={error} onRetry={() => load(query)} />
        ) : loading ? (
          <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <StudentCardSkeleton key={i} />
            ))}
          </div>
        ) : !filtered.length ? (
          rows.length ? (
            <Empty>No students match your search.</Empty>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-sarva-text">No students yet</p>
              <p className="mt-1 text-sm text-sarva-muted">Register your first student to start managing billing, rooms and hostel records.</p>
              <Button variant="gold" className="mt-4" onClick={() => nav('/students/new')}>
                <Plus size={16} /> Register Student
              </Button>
            </div>
          )
        ) : (
          <>
            <div className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-sarva-muted">
              Students ({filtered.length})
            </div>
            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((s) => {
                const bed = bedByStudent.get(s._id);
                const feeAmount = Number(s.monthlyFee?.$numberDecimal ?? s.monthlyFee ?? 0);
                const roomText = bed ? roomLabel(bed) : 'Not assigned';
                return (
                  <StudentCard
                    key={s._id}
                    student={s}
                    roomText={roomText}
                    feeAmount={feeAmount}
                    currency={hostel?.currency || 'NPR'}
                    status={{ tone: STATUS_TONE[s.status] || 'muted', label: STATUS_LABEL[s.status] || s.status }}
                    onClick={() => openStudent(s._id)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </Page>
  );
}