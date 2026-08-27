import { useState } from 'react';
import { Mail, MapPin } from 'lucide-react';
import { useToast } from '../lib/toast';

export default function Contact() {
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    show('Thanks for reaching out! We will get back to you soon.', 'success');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Contact Us</h1>
      <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">Have questions? We are here to help.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card p-6">
          <Mail className="h-6 w-6 text-primary-500" />
          <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">Email</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">support@quad.app</p>
        </div>
        <div className="card p-6">
          <MapPin className="h-6 w-6 text-primary-500" />
          <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">Location</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">San Francisco, CA</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
          <textarea rows={4} className="input-field" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        </div>
        <button type="submit" className="btn-primary w-full">Send Message</button>
      </form>
    </div>
  );
}
