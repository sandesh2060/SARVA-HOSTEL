import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { money } from '../components/UI';

export default function Receipt() {
  const { paymentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/payments/${paymentId}/receipt`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || e.message));
  }, [paymentId]);

  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;
  if (!data) return <div className="p-8 text-sm text-slate-500">Loading receipt…</div>;

  const { hostel, payment, allocations, receiptNumber } = data;
  const amount = payment.amount?.$numberDecimal ?? payment.amount;

  return (
    <div className="mx-auto max-w-lg p-8 print:p-0">
      <div className="rounded-2xl border border-slate-200 p-6 print:border-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-black">{hostel.name}</div>
            <div className="text-xs text-slate-500">{hostel.address}</div>
            <div className="text-xs text-slate-500">{hostel.phone}</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Receipt #{receiptNumber}</div>
            <div>{new Date(payment.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <div className="border-t border-dashed border-slate-300 py-4 text-sm">
          <div className="flex justify-between">
            <span>Student</span>
            <span>
              {payment.studentId?.name} ({payment.studentId?.studentCode})
            </span>
          </div>
          <div className="flex justify-between">
            <span>Method</span>
            <span className="capitalize">{payment.method?.replaceAll('_', ' ')}</span>
          </div>
          {payment.reference && (
            <div className="flex justify-between">
              <span>Reference</span>
              <span>{payment.reference}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-base font-bold">
            <span>Amount paid</span>
            <span>{money(amount, hostel.currency)}</span>
          </div>
        </div>
        {allocations?.length > 0 && (
          <div className="border-t border-dashed border-slate-300 py-4 text-xs">
            <div className="mb-2 font-semibold">Allocated to</div>
            {allocations.map((a) => (
              <div key={a._id} className="flex justify-between py-0.5">
                <span>{a.invoiceId?.periodKey}</span>
                <span>{money(a.amount?.$numberDecimal ?? a.amount, hostel.currency)}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => window.print()}
          className="mt-4 w-full rounded-xl bg-sarva-primary py-2 text-sm font-semibold text-white print:hidden"
        >
          Print receipt
        </button>
      </div>
    </div>
  );
}
