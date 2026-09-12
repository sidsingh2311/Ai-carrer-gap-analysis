import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/applicationApi';
import {
  Briefcase,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Edit2,
  Calendar,
  ChevronRight,
  TrendingUp,
  MapPin,
  DollarSign,
  AlertCircle,
  FileText,
  Video,
  Sparkles,
  Loader2,
} from 'lucide-react';

const STATUS_COLUMNS = [
  { id: 'wishlist', label: 'Wishlist', color: 'border-gray-200 bg-gray-50/50 text-gray-700' },
  { id: 'applied', label: 'Applied', color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
  { id: 'interviewing', label: 'Interviewing', color: 'border-amber-200 bg-amber-50/50 text-amber-700' },
  { id: 'offer', label: 'Offer Received', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' },
  { id: 'rejected', label: 'Archived / Rejected', color: 'border-rose-200 bg-rose-50/50 text-rose-700' },
];

const ApplicationTracker = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    location: 'Remote',
    salary: '',
    jobUrl: '',
    matchScore: 75,
    status: 'applied',
    notes: '',
  });

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationApi.getApplications();
      if (res?.data) {
        setApplications(res.data.applications || []);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await applicationApi.createApplication(formData);
      setFormData({
        company: '',
        role: '',
        location: 'Remote',
        salary: '',
        jobUrl: '',
        matchScore: 75,
        status: 'applied',
        notes: '',
      });
      setShowModal(false);
      await loadApplications();
    } catch (err) {
      console.error('Error creating application:', err);
      alert(err.response?.data?.message || 'Failed to save application');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await applicationApi.updateStatus(id, newStatus);
      await loadApplications();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this application record?')) {
      try {
        await applicationApi.deleteApplication(id);
        await loadApplications();
      } catch (err) {
        console.error('Error deleting application:', err);
      }
    }
  };

  const filteredApps = applications.filter(
    (app) =>
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.role.toLowerCase().includes(search.toLowerCase()) ||
      app.notes.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24 font-sans">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide">
              <Briefcase size={14} className="text-indigo-400" />
              <span>OPPORTUNITY PIPELINE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Application Tracker
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Track your job applications, interviews, match scores, and offer stages in one unified board.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus size={16} />
              <span>Log Application</span>
            </button>

            <button
              onClick={() => navigate('/resume')}
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              <FileText size={14} />
              <span>JD Matcher</span>
            </button>
          </div>
        </div>
      </header>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tracked', val: stats?.total || 0, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Applied', val: stats?.applied || 0, color: 'text-blue-600', bg: 'bg-blue-50/40' },
          { label: 'Interviewing', val: stats?.interviewing || 0, color: 'text-amber-600', bg: 'bg-amber-50/40' },
          { label: 'Offers', val: stats?.offer || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/40' },
          { label: 'Wishlist', val: stats?.wishlist || 0, color: 'text-gray-500', bg: 'bg-gray-50/40' },
        ].map((item, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border border-gray-200 shadow-2xs ${item.bg}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
            <div className={`text-2xl font-extrabold mt-1 ${item.color}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, role, or notes..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Showing {filteredApps.length} opportunities</span>
        </div>
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
          <Loader2 size={30} className="animate-spin text-indigo-600" />
          <span className="text-sm">Loading applications...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
          {STATUS_COLUMNS.map((col) => {
            const colApps = filteredApps.filter((a) => a.status === col.id);

            return (
              <div key={col.id} className="space-y-4">
                {/* Column Header */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${col.color}`}>
                  <span className="font-bold text-xs uppercase tracking-wider">{col.label}</span>
                  <span className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-xs font-extrabold shadow-2xs">
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 min-h-[300px]">
                  {colApps.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-xs">
                      No applications
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app._id}
                        className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs hover:shadow-md transition-all space-y-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">
                              {app.role}
                            </h4>
                            <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                              {app.company}
                            </p>
                          </div>

                          {app.matchScore > 0 && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                app.matchScore >= 75
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {app.matchScore}% ATS
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          {app.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              <span>{app.location}</span>
                            </span>
                          )}
                          {app.salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign size={11} />
                              <span>{app.salary}</span>
                            </span>
                          )}
                        </div>

                        {app.notes && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 line-clamp-2">
                            {app.notes}
                          </p>
                        )}

                        {/* Status Mover & Quick Action Dropdown */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            className="text-[11px] font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="wishlist">Wishlist</option>
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Rejected</option>
                          </select>

                          <div className="flex items-center gap-1">
                            {app.jobUrl && (
                              <a
                                href={app.jobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                title="Open Job Posting"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}

                            <button
                              onClick={() => {
                                navigate('/interview');
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                              title="Mock Interview for this role"
                            >
                              <Video size={13} />
                            </button>

                            <button
                              onClick={() => handleDelete(app._id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete application"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Log Job Opportunity</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Netflix / Stripe"
                    className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Senior Backend Eng"
                    className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Remote / New York"
                    className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Salary (Est.)
                  </label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g. $160k - $190k"
                    className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="wishlist">Wishlist</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer Received</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Estimated Match Score %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.matchScore}
                    onChange={(e) => setFormData({ ...formData, matchScore: Number(e.target.value) })}
                    className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Job URL
                </label>
                <input
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                  placeholder="https://linkedin.com/jobs/view/..."
                  className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Notes / Referral Info
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Applied with referral from Alex. Recruiter screen scheduled."
                  className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  Save to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationTracker;
