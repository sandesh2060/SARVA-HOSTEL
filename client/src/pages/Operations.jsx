import {useEffect,useState} from 'react';import {Link} from 'react-router-dom';import api from '../services/api';import {Page,Card,KPI,Input,Select,Button,Table,Badge,Empty,money} from '../components/UI';import {useAuth} from '../context/Auth';
const useData=(path)=>{const[d,setD]=useState([]),[loading,setL]=useState(true),[err,setE]=useState('');const load=()=>{setL(true);api.get('/'+path).then(r=>setD(r.data)).catch(e=>setE(e.response?.data?.message||e.message)).finally(()=>setL(false))};useEffect(load,[path]);return{d,loading,err,load}};
export function Credits(){const{hostel}=useAuth();const{d,loading,err,load}=useData('credits/summary');const[amount,setAmount]=useState({});const repay=async id=>{await api.post('/credits/'+id+'/repay',{amount:Number(amount[id]||0),method:'cash'});load()};return <Page title="Credit Ledger" subtitle="Outstanding student receivables derived from invoices—no duplicate debt records."><Card>{err&&<p>{err}</p>}{!loading&&!d.length?<Empty/>:<Table heads={['Student','Phone','Outstanding','Oldest due','Collect']} >{d.map(x=><tr key={x.studentId}><td className="p-3 font-medium">{x.name}</td><td className="p-3">{x.phone||'—'}</td><td className="p-3 font-semibold">{money(x.outstanding,hostel.currency)}</td><td className="p-3">{x.oldestDue?new Date(x.oldestDue).toLocaleDateString():'—'}</td><td className="p-3"><div className="flex gap-2"><Input type="number" value={amount[x.studentId]||''} onChange={e=>setAmount({...amount,[x.studentId]:e.target.value})}/><Button onClick={()=>repay(x.studentId)}>Collect</Button></div></td></tr>)}</Table>}</Card></Page>}
function Crud({title,path,fields,heads}){const{d,loading,err,load}=useData(path),[f,setF]=useState({}),[msg,setMsg]=useState('');const add=async()=>{try{await api.post('/'+path,f);setF({});setMsg('Saved.');load()}catch(e){setMsg(e.response?.data?.message||e.message)}};return <Page title={title}><Card title={`Add ${title.replace(/s$/,'')}`}><div className="grid gap-3 md:grid-cols-3">{fields.map(([k,label,type='text'])=><Input key={k} type={type} placeholder={label} value={f[k]||''} onChange={e=>setF({...f,[k]:e.target.value})}/>)}</div><div className="mt-3 flex items-center gap-3"><Button onClick={add}>Save</Button>{msg&&<span className="text-sm text-slate-500">{msg}</span>}</div></Card><Card>{err&&<p>{err}</p>}{!loading&&!d.length?<Empty/>:<Table heads={heads.map(x=>x[1])}>{d.map(x=><tr key={x._id}>{heads.map(([k])=><td className="p-3" key={k}>{k==='amount'||k==='monthlySalary'?money(x[k]?.$numberDecimal||x[k]):String(x[k]??'—')}</td>)}</tr>)}</Table>}</Card></Page>}
export const Expenses=()=> <Crud title="Expenses" path="expenses" fields={[["category","Category"],["amount","Amount","number"],["date","Date","date"],["description","Description"],["vendor","Vendor"]]} heads={[["category","Category"],["amount","Amount"],["date","Date"],["description","Description"]]}/>;
export const Stock=()=> <Crud title="Stock" path="stock" fields={[["name","Item name"],["category","Category"],["unit","Unit"],["quantity","Quantity","number"],["minimumQuantity","Minimum","number"]]} heads={[["name","Item"],["category","Category"],["unit","Unit"],["quantity","Qty"],["minimumQuantity","Minimum"]]}/>;
export const Rooms=()=> <Crud title="Rooms" path="rooms" fields={[["building","Building"],["floor","Floor"],["name","Room"],["type","Type"],["price","Price","number"]]} heads={[["building","Building"],["floor","Floor"],["name","Room"],["type","Type"],["status","Status"]]}/>;
export const Attendance=()=> <Crud title="Attendance" path="attendance" fields={[["studentId","Student ObjectId"],["date","Date","date"],["status","present / absent / leave"]]} heads={[["studentId","Student"],["date","Date"],["status","Status"]]}/>;
const STAFF_STATUS_TONE = { active: 'success', inactive: 'muted' };

const asNum = (v) => Number(v?.$numberDecimal ?? v ?? 0);

export function Staff() {
  const { hostel } = useAuth();
  const { d, loading, err, load } = useData('staff');
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', monthlySalary: '', joiningDate: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [rowBusy, setRowBusy] = useState(null);

  const add = async () => {
    setMsg('');
    if (!form.name.trim() || !form.role.trim() || !form.phone.trim()) {
      setMsg('Name, role and phone are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/staff', form);
      setForm({ name: '', role: '', email: '', phone: '', monthlySalary: '', joiningDate: '' });
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setEditForm({
      name: s.name || '',
      role: s.role || '',
      email: s.email || '',
      phone: s.phone || '',
      monthlySalary: asNum(s.monthlySalary),
      status: s.status || 'active',
    });
  };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveRow = async (id) => {
    setMsg('');
    setRowBusy(id);
    try {
      await api.patch('/staff/' + id, editForm);
      setEditingId(null);
      setEditForm({});
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
    } finally {
      setRowBusy(null);
    }
  };

  const toggleStatus = async (s) => {
    setMsg('');
    setRowBusy(s._id);
    try {
      await api.patch('/staff/' + s._id, { status: s.status === 'inactive' ? 'active' : 'inactive' });
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
    } finally {
      setRowBusy(null);
    }
  };

  const remove = async (s) => {
    if (!confirm(`Remove ${s.name}?`)) return;
    setMsg('');
    setRowBusy(s._id);
    try {
      await api.delete('/staff/' + s._id);
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
    } finally {
      setRowBusy(null);
    }
  };

  const activeCount = d.filter((s) => s.status !== 'inactive').length;
  const payroll = d.filter((s) => s.status !== 'inactive').reduce((a, s) => a + asNum(s.monthlySalary), 0);

  return (
    <Page title="Staff" subtitle="Manage hostel staff and their monthly pay.">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <KPI label="Total staff" value={d.length} />
        <KPI label="Active" value={activeCount} />
        <KPI label="Monthly payroll" value={money(payroll, hostel.currency)} />
      </div>

      <Card title="Add Staff" className="mb-6">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input type="number" min="0" step="0.01" placeholder="Monthly salary" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
          <Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={add} loading={saving}>Save</Button>
          {msg && <span className="text-sm text-sarva-danger">{msg}</span>}
        </div>
      </Card>

      <Card>
        {err && <p className="text-sm text-sarva-danger">{err}</p>}
        {loading ? (
          <div className="text-sm text-sarva-muted">Loading\u2026</div>
        ) : !d.length ? (
          <Empty>No staff added yet.</Empty>
        ) : (
          <Table heads={['Name', 'Role', 'Contact', 'Salary', 'Status', 'Joined', 'Actions']}>
            {d.map((s) => {
              const isEditing = editingId === s._id;
              const busy = rowBusy === s._id;
              return (
                <tr key={s._id}>
                  {isEditing ? (
                    <>
                      <td className="p-3"><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                      <td className="p-3"><Input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} /></td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <Input placeholder="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                          <Input placeholder="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                        </div>
                      </td>
                      <td className="p-3"><Input type="number" min="0" step="0.01" value={editForm.monthlySalary} onChange={(e) => setEditForm({ ...editForm, monthlySalary: e.target.value })} /></td>
                      <td className="p-3">
                        <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Select>
                      </td>
                      <td className="p-3 text-sarva-muted">{s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '\u2014'}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" onClick={() => saveRow(s._id)} loading={busy}>Save</Button>
                          <Button variant="ghost" onClick={cancelEdit} disabled={busy}>Cancel</Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 font-medium text-sarva-text">{s.name}</td>
                      <td className="p-3">{s.role || '\u2014'}</td>
                      <td className="p-3 text-sarva-muted">
                        <div>{s.phone || '\u2014'}</div>
                        {s.email && <div className="text-xs">{s.email}</div>}
                      </td>
                      <td className="p-3 font-semibold">{money(asNum(s.monthlySalary), hostel.currency)}</td>
                      <td className="p-3"><Badge tone={STAFF_STATUS_TONE[s.status] || 'muted'}>{s.status || 'active'}</Badge></td>
                      <td className="p-3 text-sarva-muted">{s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '\u2014'}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" onClick={() => startEdit(s)} disabled={busy}>Edit</Button>
                          <Button variant="ghost" onClick={() => toggleStatus(s)} loading={busy}>
                            {s.status === 'inactive' ? 'Activate' : 'Deactivate'}
                          </Button>
                          <Button variant="danger" onClick={() => remove(s)} loading={busy}>Delete</Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </Page>
  );
}
export function Notifications(){return <Crud title="Notifications" path="notifications" fields={[["recipient","Recipient email"],["subject","Subject"],["message","Message"]]} heads={[["recipient","Recipient"],["subject","Subject"],["status","Status"],["createdAt","Created"]]}/>};
export function Reports(){const{hostel}=useAuth();const{d}=useData('reports/monthly');return <Page title="Reports" subtitle="Operational monthly summary from real database records."><div className="grid gap-4 md:grid-cols-4"><KPI label="Billed" value={money(d.billed,hostel.currency)}/><KPI label="Collected" value={money(d.collected,hostel.currency)}/><KPI label="Outstanding" value={money(d.outstanding,hostel.currency)}/><KPI label="Expenses" value={money(d.expenses,hostel.currency)}/></div></Page>}
