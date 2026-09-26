import { useEffect, useState } from 'react';
import api from '../services/api';
import { Page, Card, Input, Button } from '../components/UI';

export default function Settings() {
  const [f, setF] = useState({ name: '', currency: 'NPR' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/settings').then((r) => setF({ name: r.data.name, currency: r.data.currency || 'NPR' }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.patch('/settings', f);
      setMsg('Saved.');
    } catch (e2) {
      setMsg(e2.response?.data?.message || e2.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Hostel Settings" subtitle="Profile and regional configuration for your hostel.">
      <form onSubmit={submit} className="max-w-2xl">
        <Card className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-sarva-text">Hostel name</span>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-sarva-text">Currency</span>
            <Input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} />
          </label>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={saving}>Save changes</Button>
            {msg && <span className="animate-fade-in text-sm text-sarva-muted">{msg}</span>}
          </div>
        </Card>
      </form>
    </Page>
  );
}
