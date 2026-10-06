import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../services/api';
import {Page,Card,KPI,Input,Select,Button,Table,Empty,Badge,StatCard,Modal,SkeletonRows,money} from '../components/UI';
import {UserCheck,UserX,Clock3,CalendarOff,HelpCircle,Building2,BedDouble,UsersRound,DoorOpen,Search,Plus,UserRound,MapPin,CheckCircle2,Wrench,ChevronDown} from 'lucide-react';
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
export function RoomBeds(){
 const{data,loading,load,error}=useLoad('/rooms/overview',{rooms:[],beds:[],assignments:[]}),{data:students}=useLoad('/students'),[room,setRoom]=useState({building:'',floor:'',name:'',capacity:'',price:''}),[bed,setBed]=useState({roomId:'',label:''}),[assign,setAssign]=useState({studentId:'',bedId:''}),[msg,setMsg]=useState(''),[busy,setBusy]=useState(''),[search,setSearch]=useState(''),[building,setBuilding]=useState('all'),[showSetup,setShowSetup]=useState(false),[editingRoom,setEditingRoom]=useState(null),[editRoom,setEditRoom]=useState({building:'',floor:'',name:'',capacity:'',price:''}),[deleteRoom,setDeleteRoom]=useState(null);
 const rooms=data.rooms||[],beds=data.beds||[],assignments=data.assignments||[];
 const roomById=useMemo(()=>Object.fromEntries(rooms.map(r=>[r._id,r])),[rooms]);
 const assignedStudentIds=useMemo(()=>new Set(assignments.map(a=>a.studentId?._id).filter(Boolean)),[assignments]);
 const available=beds.filter(b=>b.status==='available'&&!b.studentId);
 const assignableStudents=(students||[]).filter(s=>s.status==='active'&&!assignedStudentIds.has(s._id));
 const occupied=rooms.reduce((n,r)=>n+Number(r.occupiedCount||0),0);
 const totalCapacity=rooms.reduce((n,r)=>n+Number(r.capacity||0),0);
 const maintenance=beds.filter(b=>b.status==='maintenance').length;
 const buildings=[...new Set(rooms.map(r=>r.building||'Unspecified'))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const visibleRooms=rooms.filter(r=>{const q=search.trim().toLowerCase();const matchesBuilding=building==='all'||(r.building||'Unspecified')===building;const matchesSearch=!q||[r.name,r.building,r.floor,r.type,...beds.filter(b=>(b.roomId?._id||b.roomId)===r._id).flatMap(b=>[b.label,b.studentId?.name,b.studentId?.studentCode])].some(v=>String(v||'').toLowerCase().includes(q));return matchesBuilding&&matchesSearch});
 const grouped=visibleRooms.reduce((acc,r)=>{const b=r.building||'Unspecified',f=r.floor||'Unspecified';acc[b]??={};acc[b][f]??=[];acc[b][f].push(r);return acc},{});
 const run=async(key,fn,success='Saved successfully.')=>{if(busy)return;setBusy(key);setMsg('');try{await fn();setMsg(success);await load()}catch(e){setMsg(err(e))}finally{setBusy('')}};
 const addRoom=()=>{if(!room.name.trim())return setMsg('Room number is required.');if(!Number.isInteger(Number(room.capacity))||Number(room.capacity)<1)return setMsg('Capacity must be a whole number greater than 0.');if(room.price!==''&&(!Number.isFinite(Number(room.price))||Number(room.price)<0))return setMsg('Enter a valid monthly price.');run('room',()=>api.post('/rooms',{...room,name:room.name.trim(),price:room.price===''?undefined:Number(room.price)}),'Room added successfully.').then?.(()=>{});};
 const addBed=()=>{if(!bed.roomId)return setMsg('Choose a room first.');if(!bed.label.trim())return setMsg('Bed number is required.');run('bed',()=>api.post(`/rooms/${bed.roomId}/beds`,{label:bed.label.trim()}),'Bed added successfully.');};
 const assignBed=()=>{if(!assign.studentId||!assign.bedId)return setMsg('Choose both a student and an available bed.');run('assign',()=>api.post('/rooms/assign',assign),'Bed assigned successfully.');};
 const beginEditRoom=r=>{setEditRoom({building:r.building||'',floor:r.floor||'',name:r.name||'',capacity:r.capacity||'',price:r.price??''});setEditingRoom(r)};
 const saveRoom=async()=>{if(!editingRoom||busy)return;if(!editRoom.name.trim())return setMsg('Room number is required.');if(!Number.isInteger(Number(editRoom.capacity))||Number(editRoom.capacity)<1)return setMsg('Capacity must be a whole number greater than 0.');if(editRoom.price!==''&&(!Number.isFinite(Number(editRoom.price))||Number(editRoom.price)<0))return setMsg('Enter a valid monthly price.');setBusy('edit-room');setMsg('');try{await api.patch(`/rooms/${editingRoom._id}`,{...editRoom,name:editRoom.name.trim(),price:editRoom.price===''?'':Number(editRoom.price)});setEditingRoom(null);setMsg('Room updated successfully.');await load()}catch(e){setMsg(err(e))}finally{setBusy('')}};
 const removeRoom=async()=>{if(!deleteRoom||busy)return;setBusy('delete-room');setMsg('');try{await api.delete(`/rooms/${deleteRoom._id}`);setDeleteRoom(null);setMsg('Room deleted successfully.');await load()}catch(e){setMsg(err(e))}finally{setBusy('')}};
 return <Page title="Rooms & Beds" subtitle="A live room inventory with bed availability, occupancy and student assignments.">
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
   <RoomStat label="Rooms" value={rooms.length} icon={DoorOpen}/>
   <RoomStat label="Total capacity" value={totalCapacity} icon={BedDouble}/>
   <RoomStat label="Occupied" value={occupied} icon={UsersRound}/>
   <RoomStat label="Available" value={Math.max(0,totalCapacity-occupied)} icon={CheckCircle2}/>
  </div>

  <Card className="!p-3 sm:!p-4">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
    <div className="relative min-w-0 flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sarva-muted"/><Input className="pl-9" placeholder="Search room, building, floor or type…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <Select value={building} onChange={e=>setBuilding(e.target.value)} className="lg:w-48"><option value="all">All buildings</option>{buildings.map(x=><option key={x} value={x}>{x}</option>)}</Select>
    <Button onClick={()=>setShowSetup(v=>!v)}><Plus size={16}/>{showSetup?'Close setup':'Manage rooms'}</Button>
   </div>
  </Card>

  {showSetup&&<div className="grid gap-4 xl:grid-cols-3">
   <SetupCard icon={Building2} title="Add room" subtitle="Create a room inside a building and floor.">
    <Input placeholder="Building" value={room.building} onChange={e=>setRoom({...room,building:e.target.value})}/><Input placeholder="Floor" value={room.floor} onChange={e=>setRoom({...room,floor:e.target.value})}/><Input placeholder="Room number *" value={room.name} onChange={e=>setRoom({...room,name:e.target.value})}/><Input type="number" min="1" step="1" placeholder="Capacity (e.g. 2) *" value={room.capacity} onChange={e=>setRoom({...room,capacity:e.target.value})}/><Input type="number" min="0" placeholder="Monthly price" value={room.price} onChange={e=>setRoom({...room,price:e.target.value})}/><Button disabled={busy==='room'} onClick={addRoom}>{busy==='room'?'Adding…':'Add Room'}</Button>
   </SetupCard>
   <SetupCard icon={BedDouble} title="Add bed" subtitle="Add a uniquely numbered bed to an existing room.">
    <Select value={bed.roomId} onChange={e=>setBed({...bed,roomId:e.target.value})}><option value="">Choose room</option>{rooms.map(r=><option value={r._id} key={r._id}>{r.building||'Building'} · {r.floor||'Floor'} · Room {r.name}</option>)}</Select><Input placeholder="Bed number *" value={bed.label} onChange={e=>setBed({...bed,label:e.target.value})}/><Button disabled={busy==='bed'} onClick={addBed}>{busy==='bed'?'Adding…':'Add Bed'}</Button>
   </SetupCard>
   <SetupCard icon={UserRound} title="Assign bed" subtitle="Only unassigned active students and free beds are shown.">
    <Select value={assign.studentId} onChange={e=>setAssign({...assign,studentId:e.target.value})}><option value="">Choose student</option>{assignableStudents.map(s=><option value={s._id} key={s._id}>{s.studentCode} · {s.name}</option>)}</Select><Select value={assign.bedId} onChange={e=>setAssign({...assign,bedId:e.target.value})}><option value="">Choose available bed</option>{available.map(b=>{const r=roomById[b.roomId?._id||b.roomId];return <option value={b._id} key={b._id}>{r?.building||'Building'} · Room {r?.name||'—'} · Bed {b.label}</option>})}</Select><Button disabled={busy==='assign'} onClick={assignBed}>{busy==='assign'?'Assigning…':'Assign Bed'}</Button>
   </SetupCard>
  </div>}

  {(msg||error)&&<div className={`rounded-xl px-4 py-3 text-sm ${error||/required|choose|valid|failed|error/i.test(msg)?'bg-rose-50 text-rose-700':'bg-emerald-50 text-emerald-700'}`}>{msg||error}</div>}

  <section className="space-y-4">
   <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-xl font-semibold text-sarva-text">Room inventory</h2><p className="mt-1 text-sm text-sarva-muted">{visibleRooms.length} of {rooms.length} rooms · {occupied}/{totalCapacity||0} seats occupied{maintenance?` · ${maintenance} maintenance`:''}</p></div></div>
   {loading?<SkeletonRows rows={5}/>:!visibleRooms.length?<Card><Empty>{rooms.length?'No rooms match these filters.':'No rooms yet. Use Manage rooms to create your first room.'}</Empty></Card>:Object.entries(grouped).map(([buildingName,floors])=><div key={buildingName} className="overflow-hidden rounded-[1.75rem] border border-sarva-border bg-white shadow-[0_12px_35px_rgba(43,20,29,.05)]">
    <div className="flex items-center gap-3 border-b border-sarva-border bg-sarva-bg/60 px-4 py-4 sm:px-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sarva-primarySoft text-sarva-primary"><Building2 size={18}/></span><div><h3 className="font-bold text-sarva-text">{buildingName}</h3><p className="text-xs text-sarva-muted">{Object.values(floors).flat().length} rooms</p></div></div>
    <div className="space-y-5 p-3 sm:p-5">{Object.entries(floors).map(([floorName,floorRooms])=><div key={floorName}><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-sarva-muted"><MapPin size={13}/>{floorName==='Unspecified'?'Floor not specified':`Floor ${floorName}`}</div><div className="grid gap-4 xl:grid-cols-2">{floorRooms.map(r=><RoomCard key={r._id} room={r} beds={beds.filter(b=>(b.roomId?._id||b.roomId)===r._id)} assignments={assignments} onEdit={()=>beginEditRoom(r)} onDelete={()=>setDeleteRoom(r)}/>)}</div></div>)}</div>
   </div>)}
  </section>

  <section className="space-y-3"><div><h2 className="font-display text-xl font-semibold text-sarva-text">Current occupancy</h2><p className="mt-1 text-sm text-sarva-muted">Students with an active room and bed assignment.</p></div>
   {!assignments.length?<Card><Empty>No students are currently assigned to a bed.</Empty></Card>:<div className="grid gap-3 lg:grid-cols-2">{assignments.map(a=><Link to={a.studentId?._id?`/students/${a.studentId._id}`:'#'} key={a._id} className="group rounded-2xl border border-sarva-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sarva-primarySoft font-bold text-sarva-primary">{a.studentId?.name?.[0]?.toUpperCase()||'?'}</span><div className="min-w-0 flex-1"><div className="truncate font-bold text-sarva-text">{a.studentId?.name||'Student record unavailable'}</div><div className="text-xs text-sarva-muted">{a.studentId?.studentCode||'No student code'}</div></div><Badge tone="success">Occupied</Badge></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><MiniRoom label="Building" value={a.roomId?.building}/><MiniRoom label="Floor" value={a.roomId?.floor}/><MiniRoom label="Room" value={a.roomId?.name}/><MiniRoom label="Bed" value={a.bedId?.label}/></div><div className="mt-3 text-xs text-sarva-muted">Assigned {a.startDate?new Date(a.startDate).toLocaleDateString():'—'}</div></Link>)}</div>}
  </section>
  <Modal open={!!editingRoom} onClose={()=>busy!=='edit-room'&&setEditingRoom(null)} title="Edit room">
   <div className="space-y-4">
    <div className="rounded-xl bg-sarva-bg p-3 text-xs leading-5 text-sarva-muted">Update the room details. Existing beds and student assignments stay connected to this room.</div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Building<Input value={editRoom.building} onChange={e=>setEditRoom({...editRoom,building:e.target.value})}/></label><label className="grid gap-1 text-sm font-medium">Floor<Input value={editRoom.floor} onChange={e=>setEditRoom({...editRoom,floor:e.target.value})}/></label><label className="grid gap-1 text-sm font-medium">Room number *<Input value={editRoom.name} onChange={e=>setEditRoom({...editRoom,name:e.target.value})}/></label><label className="grid gap-1 text-sm font-medium">Capacity *<Input type="number" min="1" step="1" value={editRoom.capacity} onChange={e=>setEditRoom({...editRoom,capacity:e.target.value})}/><span className="text-[11px] font-normal text-sarva-muted">{Number(editRoom.capacity)===1?'Single Seater':editRoom.capacity?`${editRoom.capacity} Seater`:'Set maximum occupants'}</span></label><label className="grid gap-1 text-sm font-medium sm:col-span-2">Monthly price<Input type="number" min="0" value={editRoom.price} onChange={e=>setEditRoom({...editRoom,price:e.target.value})}/></label></div>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={busy==='edit-room'} onClick={()=>setEditingRoom(null)}>Cancel</Button><Button disabled={busy==='edit-room'} onClick={saveRoom}>{busy==='edit-room'?'Saving…':'Save Changes'}</Button></div>
   </div>
  </Modal>
  <Modal open={!!deleteRoom} onClose={()=>busy!=='delete-room'&&setDeleteRoom(null)} title="Delete room">
   {deleteRoom&&<div className="space-y-4"><div className="rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-rose-800"><b>Delete Room {deleteRoom.name}?</b><br/>This also removes its empty bed records. A room with an occupied bed or active student assignment cannot be deleted.</div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={busy==='delete-room'} onClick={()=>setDeleteRoom(null)}>Keep Room</Button><Button variant="danger" disabled={busy==='delete-room'} onClick={removeRoom}>{busy==='delete-room'?'Deleting…':'Delete Room'}</Button></div></div>}
  </Modal>
 </Page>
}

function RoomStat({label,value,icon:Icon}){return <div className="rounded-2xl border border-sarva-border bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><div className="text-[10px] font-bold uppercase tracking-wider text-sarva-muted">{label}</div><span className="grid h-8 w-8 place-items-center rounded-lg bg-sarva-primarySoft text-sarva-primary"><Icon size={15}/></span></div><div className="mt-2 text-2xl font-bold tabular-nums text-sarva-text">{value}</div></div>}
function SetupCard({icon:Icon,title,subtitle,children}){return <Card><div className="mb-4 flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sarva-primarySoft text-sarva-primary"><Icon size={18}/></span><div><h3 className="font-bold text-sarva-text">{title}</h3><p className="mt-0.5 text-xs leading-5 text-sarva-muted">{subtitle}</p></div></div><div className="space-y-2">{children}</div></Card>}
function RoomCard({room,beds,assignments,onEdit,onDelete}){const capacity=Number(room.capacity||0),occupied=Number(room.occupiedCount??beds.filter(b=>b.status==='occupied'||b.studentId).length),available=Math.max(0,Number(room.availableCount??capacity-occupied)),pct=Number(room.occupancyPercentage??(capacity?Math.round(occupied/capacity*100):0)),sorted=[...beds].sort((a,b)=>String(a.label).localeCompare(String(b.label),undefined,{numeric:true}));return <article className="overflow-hidden rounded-[1.4rem] border border-sarva-border bg-white shadow-sm transition hover:shadow-md"><div className="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg font-bold text-sarva-text">Room {room.name}</h4><Badge tone={available===0&&capacity?'danger':'muted'}>{capacity===1?'Single Seater':`${capacity||'?'} Seater`}</Badge>{available===0&&capacity>0&&<Badge tone="danger">FULL</Badge>}</div><p className="mt-1 text-xs text-sarva-muted">{room.building||'Building not set'} · {room.floor?`Floor ${room.floor}`:'Floor not set'} · {room.price!=null&&Number(room.price)>0?`NPR ${Number(room.price).toLocaleString()} / month`:'Monthly price not set'}</p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={onEdit} className="rounded-lg border border-sarva-border bg-white px-3 py-2 text-xs font-bold text-sarva-primary transition hover:bg-sarva-primarySoft">Edit</button><button type="button" onClick={onDelete} className="rounded-lg border border-rose-100 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50">Delete</button></div></div>{room.integrityWarning&&<div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">{room.integrityWarning}</div>}<div className="mt-4 flex items-end justify-between gap-3"><div><div className="text-lg font-bold tabular-nums text-sarva-text">{occupied}/{capacity||0}</div><div className="text-[10px] font-bold uppercase tracking-wider text-sarva-muted">occupied</div></div><div className="text-right"><div className="text-sm font-bold text-sarva-text">{available}</div><div className="text-[10px] font-bold uppercase tracking-wider text-sarva-muted">available</div></div></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-sarva-primarySoft"><div className="h-full rounded-full bg-sarva-primary transition-all" style={{width:`${Math.min(100,pct)}%`}}/></div><div className="mt-2 text-[11px] text-sarva-muted">{pct}% occupancy</div></div><div className="border-t border-sarva-border bg-sarva-bg/35 p-3 sm:p-4">{!sorted.length?<div className="rounded-xl border border-dashed border-sarva-border p-5 text-center text-xs text-sarva-muted">No beds added yet. This room allows up to {capacity||'—'} occupants.</div>:<div className="grid gap-3 md:grid-cols-2">{sorted.map(b=><BedTile key={b._id} bed={b} assignments={assignments}/>)}</div>}</div></article>}
function BedTile({bed,assignments}){const assignment=assignments.find(a=>(a.bedId?._id||a.bedId)===bed._id);const occupied=bed.status==='occupied'||!!bed.studentId,maintenance=bed.status==='maintenance',student=bed.studentId?.name?bed.studentId:assignment?.studentId,photo=student?.photo?.url||student?.photo;return <div className={`rounded-2xl border p-3.5 ${occupied?'border-sarva-primary/20 bg-white':maintenance?'border-amber-200 bg-amber-50':'border-emerald-100 bg-emerald-50/60'}`}><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><BedDouble size={15} className={occupied?'text-sarva-primary':maintenance?'text-amber-600':'text-emerald-600'}/><span className="text-sm font-bold text-sarva-text">Bed {bed.label}</span></div><Badge tone={occupied?'muted':maintenance?'warning':'success'}>{occupied?'Occupied':maintenance?'Maintenance':'Available'}</Badge></div>{occupied&&student?<div className="mt-3 flex items-center gap-3"><div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-sarva-primarySoft">{photo?<img src={photo} alt="" className="h-full w-full object-cover"/>:<div className="grid h-full w-full place-items-center font-bold text-sarva-primary">{student.name?.[0]?.toUpperCase()||'?'}</div>}</div><div className="min-w-0 flex-1"><Link to={`/students/${student._id}`} className="block truncate text-sm font-bold text-sarva-text hover:text-sarva-primary hover:underline">{student.name}</Link><div className="truncate text-[11px] text-sarva-muted">{student.studentCode||'No student ID'}{student.phone?` · ${student.phone}`:''}</div>{assignment?.startDate&&<div className="mt-0.5 text-[10px] text-sarva-muted">Assigned {new Date(assignment.startDate).toLocaleDateString()}</div>}</div></div>:<div className="mt-3 text-xs text-sarva-muted">{maintenance?'This bed cannot accept an assignment.':'No student assigned.'}</div>}</div>}
function MiniRoom({label,value}){return <div className="rounded-xl bg-sarva-bg p-2.5"><div className="text-[9px] font-bold uppercase tracking-wider text-sarva-muted">{label}</div><div className="mt-1 truncate text-sm font-bold text-sarva-text">{value||'—'}</div></div>}
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
