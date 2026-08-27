import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { Logo } from '../components/Logo';

export default function SignUp() {
  const { signUp } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, form.username);
    setLoading(false);
    if (error) {
      show(error, 'error');
    } else {
      show('Account created! Welcome to Quad.', 'success');
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 px-4 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Join the Quad community today.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Jane Doe" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
              <input className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="janedoe" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@university.edu" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" minLength={6} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>
          <div className="mt-6 border-t border-slate-200 pt-4 text-center text-sm dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
