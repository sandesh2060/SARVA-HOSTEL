import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../services/api';
import {Page,Card,KPI,Input,Select,Button,Table,Empty,Badge,StatCard,Modal,SkeletonRows,money} from '../components/UI';
import {UserCheck,UserX,Clock3,CalendarOff,HelpCircle} from 'lucide-react';
import {useAuth} from '../context/Auth';
const err=e=>e.response?.data?.message||e.message;
const useLoad=(url,initial=[])=>{const[data,setData]=useState(initial),[loading,setLoading]=useState(true),[error,setError]=useState('');const load=async()=>{setLoading(true);setError('');try{setData((await api.get(url)).data)}catch(e){setError(err(e))}finally{setLoading(false)}};useEffect(()=>{void load()},[url]);return{data,loading,error,load}};
export function Billing(){
 const{hostel}=useAuth(),[data,setData]=useState({summary:{},invoices:[]}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState(''),[status,setStatus]=useState('all');
 const load=async()=>{setLoading(true);setError('');try{setData((await api.get('/billing/overview',{params:{status}})).data)}catch(e){setError(err(e))}finally{setLoading(false)}};
 useEffect(()=>{void load()},[status]);
 const rows=useMemo(()=>{const q=search.trim().toLowerCase();if(!q)return data.invoices||[];return (data.invoices||[]).filter(i=>[i.studentId?.name,i.studentId?.studentCode,i.periodKey].some(v=>String(v||'').toLowerCase().includes(q)))},[data.invoices,search]);
 const cur=data.currency||hostel?.currency||'NPR',sum=data.summary||{};
 return <Page title="Billing & Invoices" subtitle="Complete billing overview with immutable invoice history and automatic late fines.">
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><KPI label="Billed this month" value={money(sum.billedThisMonth||0,cur)}/><KPI label="Collected" value={money(sum.collectedThisMonth||0,cur)}/><KPI label="Outstanding" value={money(sum.outstanding||0,cur)}/><KPI label="Overdue" value={money(sum.overdue||0,cur)}/><KPI label="Late fines" value={money(sum.finesThisMonth||0,cur)}/></div>
  <Card className="mt-4"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input placeholder="Search student, ID or billing period…" value={search} onChange={e=>setSearch(e.target.value)}/><Select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="open">Open</option><option value="partial">Partial</option><option value="overdue">Overdue</option><option value="paid">Paid</option><option value="void">Void</option></Select></div></Card>
  {error&&<p className="mt-3 text-sm text-red-600">{error}</p>}
  <Card className="mt-4">{loading?<SkeletonRows rows={7}/>:!rows.length?<Empty>No invoices match these filters.</Empty>:<Table heads={['Student','Period','Due','Base','Fine','Paid','Outstanding','Status']}>{rows.map(i=>{const fine=Number(i.fineTotal?.$numberDecimal??i.fineTotal??0),total=Number(i.total?.$numberDecimal??i.total??0),base=Number(i.baseTotal?.$numberDecimal??i.baseTotal??(total-fine));return <tr key={i._id}><td className="p-3"><Link className="font-semibold text-sarva-primary hover:underline" to={`/students/${i.studentId?._id}`}>{i.studentId?.name||'Unknown'}</Link><div className="text-xs text-sarva-muted">{i.studentId?.studentCode||'—'}</div></td><td className="p-3">{i.periodKey}</td><td className="p-3">{i.dueDate?new Date(i.dueDate).toLocaleDateString():'—'}</td><td className="p-3">{money(base,i.currency||cur)}</td><td className="p-3">{money(fine,i.currency||cur)}</td><td className="p-3">{money(i.paid?.$numberDecimal??i.paid??0,i.currency||cur)}</td><td className="p-3 font-semibold">{money(i.balance?.$numberDecimal??i.balance??0,i.currency||cur)}</td><td className="p-3"><Badge tone={i.status==='paid'?'success':i.status==='overdue'?'danger':i.status==='partial'?'warning':'muted'}>{i.status}</Badge></td></tr>})}</Table>}</Card>
 </Page>
}
export function RoomBeds(){const{data,load,error}=useLoad('/rooms/overview',{rooms:[],beds:[],assignments:[]}),{data:students}=useLoad('/students'),[room,setRoom]=useState({building:'',floor:'',name:'',type:'',price:''}),[bed,setBed]=useState({roomId:'',label:''}),[assign,setAssign]=useState({studentId:'',bedId:''}),[msg,setMsg]=useState('');const available=(data.beds||[]).filter(b=>b.status==='available'&&!b.studentId);const run=async(fn)=>{setMsg('');try{await fn();setMsg('Saved successfully.');await load()}catch(e){setMsg(err(e))}};return <Page title="Rooms & Beds" subtitle="Building → floor → room → bed, with occupancy protection and assignment history."><div className="grid gap-4 xl:grid-cols-3"><Card title="Add room"><div className="space-y-2"><Input placeholder="Building" value={room.building} onChange={e=>setRoom({...room,building:e.target.value})}/><Input placeholder="Floor" value={room.floor} onChange={e=>setRoom({...room,floor:e.target.value})}/><Input placeholder="Room number *" value={room.name} onChange={e=>setRoom({...room,name:e.target.value})}/><Input placeholder="Type" value={room.type} onChange={e=>setRoom({...room,type:e.target.value})}/><Input type="number" placeholder="Monthly price" value={room.price} onChange={e=>setRoom({...room,price:e.target.value})}/><Button onClick={()=>run(()=>api.post('/rooms',room))}>Add Room</Button></div></Card><Card title="Add bed"><div className="space-y-2"><Select value={bed.roomId} onChange={e=>setBed({...bed,roomId:e.target.value})}><option value="">Choose room</option>{(data.rooms||[]).map(r=><option value={r._id} key={r._id}>{r.building} {r.floor} · {r.name}</option>)}</Select><Input placeholder="Bed number *" value={bed.label} onChange={e=>setBed({...bed,label:e.target.value})}/><Button onClick={()=>run(()=>api.post(`/rooms/${bed.roomId}/beds`,bed))}>Add Bed</Button></div></Card><Card title="Assign bed"><div className="space-y-2"><Select value={assign.studentId} onChange={e=>setAssign({...assign,studentId:e.target.value})}><option value="">Choose student</option>{students.filter(s=>s.status==='active').map(s=><option value={s._id} key={s._id}>{s.studentCode} · {s.name}</option>)}</Select><Select value={assign.bedId} onChange={e=>setAssign({...assign,bedId:e.target.value})}><option value="">Available bed</option>{available.map(b=><option value={b._id} key={b._id}>{(data.rooms||[]).find(r=>r._id===b.roomId)?.name||'Room'} · {b.label}</option>)}</Select><Button onClick={()=>run(()=>api.post('/rooms/assign',assign))}>Assign</Button></div></Card></div>{(msg||error)&&<p className="my-4 text-sm">{msg||error}</p>}<Card title="Current occupancy">{!(data.assignments||[]).length?<Empty/>:<Table heads={['Student','Building/Floor','Room','Bed','Since']}>{data.assignments.map(a=><tr key={a._id}><td className="p-3">{a.studentId?.name} <span className="text-xs text-slate-500">{a.studentId?.studentCode}</span></td><td className="p-3">{a.roomId?.building||'—'} / {a.roomId?.floor||'—'}</td><td className="p-3">{a.roomId?.name}</td><td className="p-3">{a.bedId?.label}</td><td className="p-3">{new Date(a.startDate).toLocaleDateString()}</td></tr>)}</Table>}</Card></Page>}
function AttendanceDetailModal({ student, onClose }) {
  const [history, setHistory] = useState(null);
  const [histErr, setHistErr] = useState('');

  useEffect(() => {
    if (!student) return;
    setHistory(null);
    setHistErr('');
    api.get(`/attendance/student/${student._id}`)
      .then(({ data }) => setHistory(data))
      .catch((e) => setHistErr(e.response?.data?.message || e.message));
  }, [student]);

  if (!student) return null;
  const STATUS_TONE = { present: 'success', absent: 'danger', late: 'warning', leave: 'muted' };

  return (
    <Modal open={!!student} onClose={onClose} title={student.name} wide>
      <div className="mb-4 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-sarva-primary to-sarva-primaryDark">
          {student.photo?.url ? (
            <img src={student.photo.url} alt={student.name} className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-xl font-semibold text-white/90">
              {student.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div>
          <div className="font-semibold text-sarva-text">{student.name}</div>
          <div className="text-xs text-sarva-muted">{student.studentCode}</div>
        </div>
      </div>

      {histErr && <p className="text-sm text-sarva-danger">{histErr}</p>}

      {!history && !histErr ? (
        <SkeletonRows rows={4} />
      ) : history ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ['Present', history.summary.present],
              ['Absent', history.summary.absent],
              ['Late', history.summary.late],
              ['Leave', history.summary.leave],
              ['Total marked', history.summary.total],
            ].map(([label, val]) => (
              <div key={label} className="rounded-xl border border-sarva-border p-3 text-center">
                <div className="text-lg font-bold text-sarva-text">{val}</div>
                <div className="text-[11px] text-sarva-muted">{label}</div>
              </div>
            ))}
          </div>

          {!history.records.length ? (
            <Empty>No attendance recorded yet.</Empty>
          ) : (
            <Table heads={['Date', 'Status', 'Method', 'Note']}>
              {history.records.map((r) => (
                <tr key={r._id}>
                  <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-3"><Badge tone={STATUS_TONE[r.status] || 'muted'}>{r.status}</Badge></td>
                  <td className="p-3 capitalize">{(r.method || 'manual').replaceAll('_', ' ')}</td>
                  <td className="p-3 text-sarva-muted">{r.note || '\u2014'}</td>
                </tr>
              ))}
            </Table>
          )}
        </>
      ) : null}
    </Modal>
  );
}

export function AttendancePage(){
  const today=new Date().toISOString().slice(0,10);
  const [date,setDate]=useState(today);
  const {data,load,error}=useLoad('/attendance/day?date='+date);
  const [msg,setMsg]=useState('');
  const [selected,setSelected]=useState(null);

  const mark=async(id,status)=>{try{await api.put(`/attendance/${id}/day`,{date,status});setMsg('Attendance saved.');load()}catch(e){setMsg(err(e))}};

  const counts = data.reduce((acc, x) => {
    const s = x.attendance?.status;
    if (s && acc[s] !== undefined) acc[s]++; else acc.notMarked++;
    return acc;
  }, { present: 0, absent: 0, late: 0, leave: 0, notMarked: 0 });

  return (
    <Page title="Attendance" subtitle="Daily manual attendance with QR/biometric-ready method fields. Click a row for full history.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Present" value={counts.present} icon={UserCheck} tone="success" />
        <StatCard label="Absent" value={counts.absent} icon={UserX} tone="warning" />
        <StatCard label="Late" value={counts.late} icon={Clock3} tone="gold" />
        <StatCard label="Leave" value={counts.leave} icon={CalendarOff} tone="primary" />
        <StatCard label="Not marked" value={counts.notMarked} icon={HelpCircle} tone="primary" />
      </div>

      <Card className="mt-4">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          <Button className="w-full sm:w-auto" onClick={load}>Load</Button>
        </div>
      </Card>

      {(msg||error)&&<p className="my-3 text-sm">{msg||error}</p>}

      <Card className="mt-4">
        {!data.length?<Empty/>:<>
          <div className="sarva-mobile-only sarva-mobile-card-list">
            {data.map(x=>(
              <article key={x.student._id} className="sarva-mobile-card" onClick={() => setSelected(x.student)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-sarva-text">{x.student.name}</div>
                    <div className="mt-0.5 text-xs text-sarva-muted">{x.student.studentCode}</div>
                  </div>
                  <Badge tone={{present:'success',absent:'danger',late:'warning',leave:'muted'}[x.attendance?.status] || 'muted'}>{x.attendance?.status||'Not marked'}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  {['present','absent','leave','late'].map(s=><button key={s} onClick={()=>mark(x.student._id,s)} className={`min-h-10 rounded-xl border px-2 py-2 text-xs font-semibold capitalize ${x.attendance?.status===s?'border-sarva-primary bg-sarva-primary text-white':'border-sarva-border bg-white text-sarva-text'}`}>{s}</button>)}
                </div>
              </article>
            ))}
          </div>
          <div className="sarva-desktop-only">
            <Table heads={['Student','ID','Status','Mark']}>
              {data.map(x=>(
                <tr key={x.student._id} onClick={() => setSelected(x.student)} className="cursor-pointer hover:bg-sarva-primarySoft/30">
                  <td className="p-3 font-medium">{x.student.name}</td><td className="p-3">{x.student.studentCode}</td><td className="p-3"><Badge tone={{present:'success',absent:'danger',late:'warning',leave:'muted'}[x.attendance?.status] || 'muted'}>{x.attendance?.status||'Not marked'}</Badge></td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}><div className="flex flex-wrap gap-1">{['present','absent','leave','late'].map(s=><button key={s} onClick={()=>mark(x.student._id,s)} className="rounded-lg border border-sarva-border px-2 py-1 text-xs capitalize hover:bg-sarva-primarySoft">{s}</button>)}</div></td>
                </tr>
              ))}
            </Table>
          </div>
        </>}
      </Card>

      <AttendanceDetailModal student={selected} onClose={() => setSelected(null)} />
    </Page>
  );
}
export function Salaries(){const{hostel}=useAuth(),{data:staff}=useLoad('/staff'),{data,load}=useLoad('/salaries'),[f,setF]=useState({staffId:'',periodKey:new Date().toISOString().slice(0,7),amount:'',method:'cash',createExpense:true}),[msg,setMsg]=useState('');const save=async()=>{try{await api.post('/salaries/pay',{...f,amount:Number(f.amount)});setMsg('Salary payment recorded.');load()}catch(e){setMsg(err(e))}};return <Page title="Salary" subtitle="Partial/full salary payments with optional linked expense to avoid double counting."><Card title="Record salary payment"><div className="grid gap-3 md:grid-cols-5"><Select value={f.staffId} onChange={e=>setF({...f,staffId:e.target.value})}><option value="">Staff</option>{staff.map(s=><option value={s._id} key={s._id}>{s.name} · {s.role}</option>)}</Select><Input type="month" value={f.periodKey} onChange={e=>setF({...f,periodKey:e.target.value})}/><Input type="number" placeholder="Amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/><Select value={f.method} onChange={e=>setF({...f,method:e.target.value})}><option value="cash">Cash</option><option value="manual_qr">Manual QR</option></Select><Button onClick={save}>Record</Button></div><label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={f.createExpense} onChange={e=>setF({...f,createExpense:e.target.checked})}/>Create linked salary expense</label>{msg&&<p className="mt-2 text-sm">{msg}</p>}</Card><Card>{!data.length?<Empty/>:<Table heads={['Staff','Month','Net','Paid','Remaining','Status']}>{data.map(x=><tr key={x._id}><td className="p-3">{x.staffId?.name}</td><td className="p-3">{x.periodKey}</td><td className="p-3">{money(x.net?.$numberDecimal||x.net,x.currency||hostel.currency)}</td><td className="p-3">{money(x.paid?.$numberDecimal||x.paid,x.currency||hostel.currency)}</td><td className="p-3">{money(x.remaining?.$numberDecimal||x.remaining,x.currency||hostel.currency)}</td><td className="p-3 capitalize">{x.status}</td></tr>)}</Table>}</Card></Page>}
export function Broadcast(){const{data:students}=useLoad('/students'),[f,setF]=useState({subject:'',message:'',studentIds:[]}),[msg,setMsg]=useState('');const send=async()=>{try{const r=await api.post('/broadcast',f);setMsg(`Sent ${r.data.sent}; failed ${r.data.failed}.`)}catch(e){setMsg(err(e))}};return <Page title="Broadcast" subtitle="Send announcements to all active students or selected students by email."><Card><div className="space-y-3"><Input placeholder="Subject" value={f.subject} onChange={e=>setF({...f,subject:e.target.value})}/><textarea className="min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Message" value={f.message} onChange={e=>setF({...f,message:e.target.value})}/><Select multiple className="min-h-40" value={f.studentIds} onChange={e=>setF({...f,studentIds:[...e.target.selectedOptions].map(o=>o.value)})}>{students.map(s=><option key={s._id} value={s._id}>{s.name} · {s.studentCode}</option>)}</Select><p className="text-xs text-slate-500">Leave selection empty to send to all active students with email addresses.</p><Button onClick={send}>Send Broadcast</Button>{msg&&<p className="text-sm">{msg}</p>}</div></Card></Page>}
export function Audit(){const{data}=useLoad('/audit');return <Page title="Activity & Audit" subtitle="Critical operational history is append-only and tenant scoped."><Card>{!data.length?<Empty/>:<Table heads={['Time','Action','Entity','Actor','Details']}>{data.map(x=><tr key={x._id}><td className="p-3">{new Date(x.createdAt).toLocaleString()}</td><td className="p-3 font-medium">{x.action}</td><td className="p-3">{x.entity}</td><td className="p-3">{x.actorRole||'system'}</td><td className="p-3 text-xs">{x.meta?JSON.stringify(x.meta).slice(0,120):'—'}</td></tr>)}</Table>}</Card></Page>}
export function ReportCenter(){const types=['students','payments','expenses','stock','attendance','salary','occupancy'],[type,setType]=useState('students'),[report,setReport]=useState(null),[error,setError]=useState('');const load=async()=>{try{setReport((await api.get('/reports/'+type)).data)}catch(e){setError(err(e))}};const csv=()=>{if(!report?.rows?.length)return;const flat=report.rows.map(r=>Object.fromEntries(Object.entries(r).filter(([,v])=>typeof v!=='object'||v===null)));const keys=[...new Set(flat.flatMap(Object.keys))];const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;const body=[keys.join(','),...flat.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/csv'}));a.download=`sarva-${type}-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href)};return <Page title="Report Center" subtitle="Database-backed operational reports with CSV export."><Card><div className="flex flex-wrap gap-2"><Select value={type} onChange={e=>setType(e.target.value)}>{types.map(t=><option key={t}>{t}</option>)}</Select><Button onClick={load}>Generate</Button><Button onClick={csv} disabled={!report?.rows?.length}>Download CSV</Button><Button onClick={()=>window.print()} disabled={!report}>Print</Button></div>{error&&<p className="mt-2 text-sm text-red-600">{error}</p>}</Card>{report&&<Card title={`${report.type} · ${report.rows.length} rows`}><pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(report.rows,null,2)}</pre></Card>}</Page>}
export function StudentPortal(){const{data,loading,error}=useLoad('/student-portal/me',{});if(loading)return <Page title="My Hostel"><Card>Loading…</Card></Page>;if(error)return <Page title="My Hostel"><Card>{error}</Card></Page>;return <Page title={`Welcome, ${data.student?.name||'Student'}`} subtitle="Your own hostel information only."><div className="grid gap-3 md:grid-cols-4"><KPI label="Room" value={data.assignment?.roomId?.name||'—'}/><KPI label="Bed" value={data.assignment?.bedId?.label||'—'}/><KPI label="Outstanding" value={money(data.outstanding,data.invoices?.[0]?.currency||'NPR')}/><KPI label="Invoices" value={data.invoices?.length||0}/></div><Card title="Recent invoices"><Table heads={['Period','Total','Paid','Balance','Status']}>{(data.invoices||[]).slice(0,12).map(i=><tr key={i._id}><td className="p-3">{i.periodKey}</td><td className="p-3">{money(i.total?.$numberDecimal||i.total,i.currency)}</td><td className="p-3">{money(i.paid?.$numberDecimal||i.paid,i.currency)}</td><td className="p-3">{money(i.balance?.$numberDecimal||i.balance,i.currency)}</td><td className="p-3">{i.status}</td></tr>)}</Table></Card></Page>}
