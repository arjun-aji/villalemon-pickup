import React, { useState } from 'react';
import {
  Settings,
  Database,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Building,
  Save,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const [businessName, setBusinessName] = useState('VillaLemon Pickup');
  const [placardPrefix, setPlacardPrefix] = useState('VILLALEMON PICKUP');
  const [location, setLocation] = useState('Varkala, Kerala');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings & System Info</h1>
        <p className="text-sm text-text-secondary">
          Configure business details, placard branding, and inspect database connectivity
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-green-light border border-green-primary/30 text-green-primary rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Configuration saved successfully!</span>
        </div>
      )}

      {/* Database Status Card */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
          <Database className="h-5 w-5 text-green-primary" />
          Database & Cloud Architecture
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Status of Supabase PostgreSQL, Authentication, and private storage integration
        </p>

        <div className="p-4 rounded-xl border border-border bg-gray-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSupabaseConfigured ? 'bg-green-primary' : 'bg-warning animate-pulse'
                }`}
              />
              <span className="text-sm font-bold text-text-primary">
                {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Local Demo & Persistence Mode'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 max-w-lg">
              {isSupabaseConfigured
                ? 'Production backend connected with live Row Level Security (RLS) and Auth tokens.'
                : 'Running with interactive mock repository and localStorage persistence. To switch to live cloud Supabase, update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.'}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isSupabaseConfigured ? 'bg-green-light text-green-primary' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isSupabaseConfigured ? 'Production Live' : 'Active Demo'}
          </span>
        </div>
      </div>

      {/* Business Details Form */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Building className="h-5 w-5 text-green-primary" />
          Business Branding
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Application Name</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Placard / Board Prefix</label>
            <input
              type="text"
              value={placardPrefix}
              onChange={e => setPlacardPrefix(e.target.value)}
              className="input-field font-mono font-bold"
            />
          </div>

          <div>
            <label className="label">Base Operations Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Logged In Administrator</label>
            <input
              type="text"
              disabled
              value={`${profile?.full_name || 'Admin'} (${profile?.email || 'admin@villalemon.in'})`}
              className="input-field bg-gray-50 text-text-secondary"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button type="submit" className="btn-primary text-xs py-2 px-4 shadow-sm">
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;

