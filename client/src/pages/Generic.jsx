import { useEffect, useState } from 'react';
import api from '../services/api';
import { Page, Card, Input, Button, Table, Empty, SkeletonRows } from '../components/UI';

export default function Generic({ title, path, fields = [] }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/' + path).then((r) => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, [path]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/' + path, f);
      setF({});
      await load();
    } finally {
      setSaving(false);
    }
  };

  const heads = rows.length ? Object.keys(rows[0]) : [];

  return (
    <Page title={title}>
      {fields.length > 0 && (
        <form onSubmit={submit}>
          <Card title={`Add ${title.replace(/s$/, '')}`} className="mb-6">
            <div className="grid gap-3 md:grid-cols-3">
              {fields.map((k) => (
                <Input key={k} placeholder={k} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
              ))}
            </div>
            <div className="mt-3">
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </Card>
        </form>
      )}
      <Card>
        {loading ? (
          <SkeletonRows rows={4} />
        ) : !rows.length ? (
          <Empty />
        ) : (
          <Table heads={heads}>
            {rows.map((r, i) => (
              <tr key={r._id || i}>
                {heads.map((k) => <td className="p-3" key={k}>{String(r[k] ?? '—')}</td>)}
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  );
}
