import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Invoice, Payment } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const OrganizationInvoices: React.FC = () => {
  const { organization } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    completedTripValue: 0,
    invoicedAmount: 0,
    totalPaid: 0,
    outstanding: 0,
    creditStatus: 'OK',
  });

  useEffect(() => {
    loadBillingData();
  }, [organization?.id]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const orgId = organization?.id;

      if (isSupabaseConfigured && orgId) {
        // Fetch invoices
        const { data: invData } = await supabase
          .from('invoices')
          .select('*')
          .eq('organization_id', orgId)
          .order('invoice_date', { ascending: false });

        if (invData) setInvoices(invData as Invoice[]);

        // Fetch payments
        const { data: payData } = await supabase
          .from('payments')
          .select('*')
          .eq('organization_id', orgId)
          .order('payment_date', { ascending: false });

        if (payData) setPayments(payData as Payment[]);

        // Fetch client summary view
        const { data: sumData } = await supabase
          .from('v_client_summary')
          .select('*')
          .eq('organization_id', orgId)
          .maybeSingle();

        if (sumData) {
          setSummary({
            completedTripValue: Number(sumData.completed_trip_value) || 0,
            invoicedAmount: Number(sumData.invoiced_issued_amount) || 0,
            totalPaid: Number(sumData.total_paid) || 0,
            outstanding: Number(sumData.outstanding_amount) || 0,
            creditStatus: sumData.credit_status || 'OK',
          });
        }
      }
    } catch (err) {
      console.error('Error loading billing records:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Invoices & Account Statement</h1>
        <p className="text-xs text-slate-500">
          Review billed transport duties, payment receipts, and current outstanding reconciliation
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Completed Trip Value
          </span>
          <p className="text-xl font-black text-slate-900">{formatINR(summary.completedTripValue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sum of finished duties</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Invoiced Amount
          </span>
          <p className="text-xl font-black text-blue-900">{formatINR(summary.invoicedAmount)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Formal bills issued</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Payments Received
          </span>
          <p className="text-xl font-black text-emerald-600">{formatINR(summary.totalPaid)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Direct + On-trip cash</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Outstanding Balance
          </span>
          <p className="text-xl font-black text-slate-900">{formatINR(summary.outstanding)}</p>
          <div className="flex items-center justify-between text-[11px] mt-0.5">
            <span className="text-slate-400">Limit: {formatINR(organization?.credit_limit || 0)}</span>
            <span className={`font-bold ${summary.creditStatus === 'OVER LIMIT' ? 'text-red-600' : 'text-emerald-600'}`}>
              {summary.creditStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Issued Invoices</h2>
            <p className="text-xs text-slate-500">Official tax invoices for your completed pickups</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No invoices issued yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Invoices are generated periodically based on your {organization?.payment_terms || 'settlement terms'}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Invoice Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {formatDate(inv.invoice_date)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.period_from ? `${formatDate(inv.period_from)} → ${formatDate(inv.period_to || '')}` : 'Duty Batch'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.invoice_type}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(inv.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">
                      {formatINR(inv.paid_amount || inv.paid_against_invoice || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(inv.balance_due || inv.balance || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Payment History & Receipts</h2>
          <p className="text-xs text-slate-500">Recorded payments and bank receipts credited to your account</p>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No payments recorded yet for this partner account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / Notes</th>
                  <th className="py-3 px-4 text-right">Amount Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.receipt_number || `REC-${p.id.slice(0, 6)}`}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {formatDate(p.payment_date || p.date_received || '')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {p.payment_method}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[250px] truncate">
                      {p.reference_number || p.reference_notes || p.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 font-mono">
                      {formatINR(p.amount || p.amount_received || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationInvoices;
