import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  PlusCircle,
  Search,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  Receipt,
  X,
} from 'lucide-react';
import { paymentService, organizationService, invoiceService } from '../../services/adminOperationsService';
import { Payment, Organization, Invoice, PaymentMethod } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PAYMENT_METHODS: PaymentMethod[] = [
  'Bank transfer',
  'UPI',
  'Cash',
  'Card',
  'Cheque',
];

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date_received: new Date().toISOString().split('T')[0],
    organization_id: '',
    invoice_id: '',
    amount_received: 0,
    payment_method: 'Bank transfer' as PaymentMethod,
    reference_notes: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [payList, orgList, invList] = await Promise.all([
        paymentService.getAll(),
        organizationService.getAll(),
        invoiceService.getAll(),
      ]);
      setPayments(payList);
      setOrganizations(orgList);
      setInvoices(invList);
      if (orgList.length > 0 && !formData.organization_id) {
        setFormData(prev => ({ ...prev, organization_id: orgList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      date_received: new Date().toISOString().split('T')[0],
      organization_id: organizations[0]?.id || '',
      invoice_id: '',
      amount_received: 0,
      payment_method: 'Bank transfer',
      reference_notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount_received <= 0) {
      alert('Amount must be greater than zero');
      return;
    }

    try {
      await paymentService.create({
        ...formData,
        invoice_id: formData.invoice_id || null as any,
        amount_received: Number(formData.amount_received),
      });
      setIsModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    }
  };

  const filtered = payments.filter(p => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRec = (p.receipt_number || '').toLowerCase().includes(q);
      const matchOrg = (p.organization?.name || '').toLowerCase().includes(q);
      const matchRef = (p.reference_notes || p.notes || '').toLowerCase().includes(q);
      return matchRec || matchOrg || matchRef;
    }
    return true;
  });

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount_received || p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments Received</h1>
          <p className="text-xs text-slate-500">
            Official client remittances, bank transfers, UPI credits, and printable payment receipts
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Payments Credited
          </span>
          <p className="text-2xl font-black text-emerald-600">{formatINR(totalCollected)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{payments.length} remittance records</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Primary Method
          </span>
          <p className="text-xl font-bold text-slate-900">Bank Transfer / UPI</p>
          <p className="text-[11px] text-slate-500 mt-1">Direct to business accounts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Official Receipts
          </span>
          <p className="text-xl font-bold text-blue-900">REC-XXXX Sequence</p>
          <p className="text-[11px] text-slate-500 mt-1">Automated counter generation</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search receipt #, client, reference..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No payment records found</p>
            <p className="text-xs text-slate-500 mt-1">Click "Record New Payment" to log a client remittance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date Received</th>
                  <th className="py-3 px-4">Client / Organization</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Invoice Linked</th>
                  <th className="py-3 px-4">Reference Notes</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {p.receipt_number || `REC-${p.id.slice(0, 6)}`}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {formatDate(p.date_received || p.payment_date || '')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.organization?.name || 'Client'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.invoice ? (
                        <span className="font-mono text-blue-700 font-bold">{p.invoice.invoice_number}</span>
                      ) : (
                        <span className="text-slate-400 italic">General Credit</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {p.reference_notes || p.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 font-mono text-sm">
                      {formatINR(p.amount_received || p.amount || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-semibold"
                        title="Print Official Payment Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Client Payment</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client / Organization *</label>
                <select
                  value={formData.organization_id}
                  onChange={e => setFormData({ ...formData, organization_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Received *</label>
                  <input
                    type="date"
                    value={formData.date_received}
                    onChange={e => setFormData({ ...formData, date_received: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Received (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.amount_received || ''}
                    onChange={e => setFormData({ ...formData, amount_received: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apply to Invoice (Optional)</label>
                  <select
                    value={formData.invoice_id}
                    onChange={e => setFormData({ ...formData, invoice_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="">-- General Account Balance --</option>
                    {invoices
                      .filter(i => i.organization_id === formData.organization_id)
                      .map(i => (
                        <option key={i.id} value={i.id}>{i.invoice_number} ({formatINR(i.balance || i.total_amount)})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference / UTR Number / Notes</label>
                <input
                  type="text"
                  value={formData.reference_notes}
                  onChange={e => setFormData({ ...formData, reference_notes: e.target.value })}
                  placeholder="e.g. IMPS UTR 3284920492 / GPay ref"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Save Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center border-b pb-4">
              <h2 className="text-lg font-black text-slate-900">VILLALEMON PICKUP</h2>
              <p className="text-xs text-slate-500">Official Payment Receipt</p>
              <span className="font-mono font-bold text-blue-900 text-sm block mt-1">
                {selectedReceipt.receipt_number || 'REC-RECEIPT'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date Received:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedReceipt.date_received || selectedReceipt.payment_date || '')}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Received From:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.organization?.name || 'Client'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.payment_method}</span>
              </div>

              {selectedReceipt.reference_notes && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.reference_notes}</span>
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between text-emerald-900 mt-2">
                <span className="font-bold">Total Amount Credited:</span>
                <span className="text-lg font-black font-mono">
                  {formatINR(selectedReceipt.amount_received || selectedReceipt.amount || 0)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
