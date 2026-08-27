import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Moon, Sun, Bell, Eye, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { useToast } from '../lib/toast';
import { getStoredTheme, setStoredTheme, applyTheme } from '../lib/theme';
import { Spinner } from '../components/Spinner';

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme());
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
    major: profile?.major ?? '',
    year: profile?.year ?? '',
    university: profile?.university ?? '',
    presence_status: profile?.presence_status ?? 'offline',
    read_receipts_enabled: profile?.read_receipts_enabled ?? true,
    last_seen_visible: profile?.last_seen_visible ?? true,
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      username: form.username,
      bio: form.bio || null,
      major: form.major || null,
      year: form.year || null,
      university: form.university || null,
      presence_status: form.presence_status,
      read_receipts_enabled: form.read_receipts_enabled,
      last_seen_visible: form.last_seen_visible,
    }).eq('id', user?.id ?? '');
    setSaving(false);
    if (error) { show(error.message, 'error'); return; }
    show('Settings saved!', 'success');
    refreshProfile();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { setUploading(false); show(uploadError.message, 'error'); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    setUploading(false);
    if (updateError) { show(updateError.message, 'error'); return; }
    show('Avatar updated!', 'success');
    refreshProfile();
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    applyTheme(next);
  };

  if (!profile) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      {/* Profile section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={profile.full_name} url={profile.avatar_url} size="xl" />
          <label className="cursor-pointer">
            <span className="btn-secondary">
              {uploading ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Upload Photo'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
            <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
            <input className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
            <textarea className="input-field resize-none" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell others about yourself" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Major</label>
            <input className="input-field" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} placeholder="Computer Science" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
            <input className="input-field" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Junior" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">University</label>
            <input className="input-field" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} placeholder="Stanford University" />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card mt-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
        <button onClick={toggleTheme} className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="h-5 w-5 text-primary-500" /> : <Sun className="h-5 w-5 text-amber-500" />}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span className="text-xs text-slate-400">Click to toggle</span>
        </button>
      </div>

      {/* Privacy */}
      <div className="card mt-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Privacy</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Read Receipts</p>
                <p className="text-xs text-slate-400">Show others when you have read their messages</p>
              </div>
            </div>
            <input type="checkbox" checked={form.read_receipts_enabled} onChange={(e) => setForm({ ...form, read_receipts_enabled: e.target.checked })} className="h-5 w-5 rounded accent-primary-600" />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Seen Visible</p>
                <p className="text-xs text-slate-400">Let others see when you were last active</p>
              </div>
            </div>
            <input type="checkbox" checked={form.last_seen_visible} onChange={(e) => setForm({ ...form, last_seen_visible: e.target.checked })} className="h-5 w-5 rounded accent-primary-600" />
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Presence Status</label>
            <select className="input-field" value={form.presence_status} onChange={(e) => setForm({ ...form, presence_status: e.target.value })}>
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="busy">Busy</option>
              <option value="invisible">Invisible</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between">
        <button onClick={async () => { await signOut(); navigate('/'); }} className="btn-danger">Sign Out</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
