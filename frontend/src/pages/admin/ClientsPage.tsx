import React, { useEffect, useState } from 'react';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Edit2,
  X,
  CreditCard,
} from 'lucide-react';
import { organizationService } from '../../services/adminOperationsService';
import { Organization, OrganizationType, PaymentTerms } from '../../types';
import { formatINR } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ORG_TYPES: OrganizationType[] = [
  'Travel agency',
  'Tour operator',
  'Hotel / Homestay',
  'Corporate',
  'Individual',
  'Other',
];

const PAYMENT_TERMS: PaymentTerms[] = [
  'Pay after each trip',
  'Weekly settlement',
  'Monthly settlement',
];

const ClientsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'Hotel / Homestay' as OrganizationType,
    contact_person: '',
    phone: '',
    whatsapp: '',
    email: '',
    billing_address: '',
    gst_number: '',
    payment_terms: 'Weekly settlement' as PaymentTerms,
    credit_limit: 15000,
    notes: '',
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getAll();
      setOrganizations(data);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingOrg(null);
    setFormData({
      name: '',
      type: 'Hotel / Homestay',
      contact_person: '',
      phone: '',
      whatsapp: '',
      email: '',
      billing_address: '',
      gst_number: '',
      payment_terms: 'Weekly settlement',
      credit_limit: 15000,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      type: org.type,
      contact_person: org.contact_person,
      phone: org.phone,
      whatsapp: org.whatsapp || org.phone,
      email: org.email || '',
      billing_address: org.billing_address || '',
      gst_number: org.gst_number || '',
      payment_terms: org.payment_terms,
      credit_limit: org.credit_limit || 0,
      notes: org.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await organizationService.update(editingOrg.id, formData);
      } else {
        await organizationService.create(formData);
      }
      setIsModalOpen(false);
      loadOrganizations();
    } catch (err: any) {
      alert(err.message || 'Error saving organization');
    }
  };

  const filtered = organizations.filter(org => {
    if (typeFilter !== 'all' && org.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (org.name || '').toLowerCase().includes(q);
      const matchContact = (org.contact_person || '').toLowerCase().includes(q);
      const matchPhone = (org.phone || '').includes(q);
      return matchName || matchContact || matchPhone;
    }
    return true;
  });

  const totalOutstanding = organizations.reduce((sum, o) => sum + (o.outstanding_balance || 0), 0);
  const overLimitCount = organizations.filter(o => o.credit_check === 'OVER LIMIT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clients & Organizations</h1>
          <p className="text-xs text-slate-500">
            Partner hotels, homestays, travel agencies, corporate accounts, credit limits and outstanding reconciliation
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Client / Org</span>
        </button>
      </div>

      {/* Top Highlights Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Partners</span>
          <p className="text-2xl font-black text-slate-900">{organizations.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active business accounts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Client Outstanding</span>
          <p className="text-2xl font-black text-slate-900">{formatINR(totalOutstanding)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Unsettled completed trips</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Over Credit Limit</span>
          <p className={`text-2xl font-black ${overLimitCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {overLimitCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Organizations requiring settlement</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Standard Terms</span>
          <p className="text-base font-bold text-slate-800">Weekly & Monthly</p>
          <p className="text-[11px] text-slate-500 mt-1">Pay-after-trip for individual</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search organization, contact, phone..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Organization Types ({organizations.length})</option>
            {ORG_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No organizations found</p>
            <p className="text-xs text-slate-500 mt-1">Click "Add New Client / Org" to register your first business partner.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Organization / Client</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Trip Value</th>
                  <th className="py-3 px-4 text-right">Invoiced</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Credit Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(org => {
                  const isOver = org.credit_check === 'OVER LIMIT';
                  return (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {org.name}
                        {org.gst_number && (
                          <span className="block text-[10px] font-normal text-slate-400 font-mono">
                            GST: {org.gst_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {org.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{org.contact_person}</p>
                        <p className="text-slate-500 text-[11px]">{org.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {org.payment_terms}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {formatINR(org.completed_trip_value || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-blue-900">
                        {formatINR(org.invoiced_issued_amount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">
                        {formatINR(org.total_paid || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                        {formatINR(org.outstanding_balance || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOver ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isOver ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>{org.credit_check || 'OK'}</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Limit: {formatINR(org.credit_limit || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(org)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingOrg ? 'Edit Organization Profile' : 'Add New Client / Organization'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. VillaLemon Homestay"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization Type *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as OrganizationType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {ORG_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    required
                    placeholder="e.g. Manager John"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="+91..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+91..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="accounts@organization.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={formData.gst_number}
                    onChange={e => setFormData({ ...formData, gst_number: e.target.value })}
                    placeholder="32AAAAA0000A1Z5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms *</label>
                  <select
                    value={formData.payment_terms}
                    onChange={e => setFormData({ ...formData, payment_terms: e.target.value as PaymentTerms })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {PAYMENT_TERMS.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.credit_limit}
                    onChange={e => setFormData({ ...formData, credit_limit: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={formData.billing_address}
                  onChange={e => setFormData({ ...formData, billing_address: e.target.value })}
                  placeholder="Street address, city, state, pin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  {editingOrg ? 'Update Organization' : 'Save Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;

