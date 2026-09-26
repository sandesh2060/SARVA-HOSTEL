import { useEffect, useState } from 'react';
import api from '../services/api';
import { Page, Card, Empty, Skeleton, money } from '../components/UI';
import { useAuth } from '../context/Auth';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#0f766e', '#d97706', '#2563eb', '#dc2626', '#7c3aed'];

export default function Analytics() {
  const { hostel } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/analytics'), api.get('/analytics/trend')])
      .then(([a, t]) => {
        setSummary(a.data);
        setTrend(t.data);
      })
      .catch((e) => setError(e.response?.data?.message || e.message));
  }, []);

  const cur = summary?.currency || hostel?.currency || 'NPR';

  const chartData = trend
    ? trend.months.map((m, i) => ({
        month: m,
        Billed: trend.billed[i],
        Collected: trend.collected[i],
        Expenses: trend.expenses[i],
      }))
    : [];

  return (
    <Page title="Analytics" subtitle="Operational insight computed server-side from real database records.">
      {error && (
        <Card>
          <p className="text-sarva-danger">{error}</p>
        </Card>
      )}

      {!error && !summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!error && summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(summary)
            .filter(([k]) => k !== 'currency')
            .map(([k, v], i) => (
              <div key={k} className={`animate-fade-in-delay-${Math.min(i, 4)}`}>
                <Card hover>
                  <p className="text-xs font-medium uppercase tracking-wide text-sarva-muted">
                    {k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-sarva-text">
                    {typeof v === 'number' && k !== 'students' && k !== 'activeStudents' ? money(v, cur) : String(v)}
                  </p>
                </Card>
              </div>
            ))}
        </div>
      )}

      {!error && trend && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card title="Revenue vs collections vs expenses (last 6 months)" className="lg:col-span-2">
            {chartData.every((d) => !d.Billed && !d.Collected && !d.Expenses) ? (
              <Empty>No financial activity in this period yet.</Empty>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--sarva-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => money(v, cur)} />
                    <Legend />
                    <Line type="monotone" dataKey="Billed" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Collected" stroke="#0f766e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Expenses" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card title="Collections by payment method">
            {!trend.byMethod?.length ? (
              <Empty>No confirmed payments in this period yet.</Empty>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={trend.byMethod}
                      dataKey="total"
                      nameKey="method"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {trend.byMethod.map((entry, i) => (
                        <Cell key={entry.method} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => money(v, cur)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}
