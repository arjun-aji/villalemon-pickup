import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Check,
  X,
  Clock,
  Car,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { enrollmentService } from '../../services/enrollmentService';
import { TripEnrollment, EnrollmentStatus } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatTime } from '../../utils/formatters';

const EnrollmentRequestsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<TripEnrollment[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const data = await enrollmentService.getAll();
      setEnrollments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await enrollmentService.approve(id);
      await loadEnrollments();
    } catch (err: any) {
      alert(err.message || 'Failed to approve enrollment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Optional rejection note for driver:') || undefined;
    try {
      setActionLoading(id);
      await enrollmentService.reject(id, reason);
      await loadEnrollments();
    } catch (err: any) {
      alert(err.message || 'Failed to reject enrollment');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = enrollments.filter(e => e.status === activeTab);
  const pendingCount = enrollments.filter(e => e.status === 'pending').length;
  const approvedCount = enrollments.filter(e => e.status === 'approved').length;
  const rejectedCount = enrollments.filter(e => e.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Driver Enrollment Requests</h1>
        <p className="text-sm text-text-secondary">
          Review, approve, or reject open trip enrollments submitted by active drivers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'pending'
              ? 'bg-navy-primary text-white shadow'
              : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
          }`}
        >
          <span>Pending</span>
          <span className="bg-expense text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'approved'
              ? 'bg-navy-primary text-white shadow'
              : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
          }`}
        >
          Approved ({approvedCount})
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'rejected'
              ? 'bg-navy-primary text-white shadow'
              : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* Table (Matching visual layout in screenshot) */}
      <div className="card p-0 overflow-hidden shadow-card">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            No {activeTab} enrollment requests at this moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="table-header">Trip ID</th>
                  <th className="table-header">Trip Details</th>
                  <th className="table-header">Requested By</th>
                  <th className="table-header">Requested On</th>
                  {activeTab === 'pending' && <th className="table-header text-right">Action</th>}
                  {activeTab !== 'pending' && <th className="table-header text-right">Status</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="table-cell font-bold text-navy-primary">
                      {item.trip?.trip_number || 'VH-Trip'}
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-text-primary text-sm">
                          {item.trip?.pickup_location} → {item.trip?.destination}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {formatDate(item.trip?.pickup_date || '')} at {formatTime(item.trip?.pickup_time || '')}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-light text-green-primary flex items-center justify-center font-bold text-xs uppercase">
                          {item.driver?.full_name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-xs">{item.driver?.full_name}</p>
                          <p className="text-[11px] text-text-secondary">{item.driver?.vehicle_number || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-text-secondary">
                      {new Date(item.requested_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="table-cell text-right">
                      {item.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoading === item.id}
                            className="px-3 py-1 bg-green-primary hover:bg-green-secondary text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={actionLoading === item.id}
                            className="px-3 py-1 bg-expense hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <StatusBadge status={item.status} type="enrollment" />
                      )}
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

export default EnrollmentRequestsPage;

