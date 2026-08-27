import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { Logo } from '../components/Logo';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      show(error.message, 'error');
    } else {
      setSent(true);
      show('Password reset link sent to your email.', 'success');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 px-4 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check your email</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">We sent a password reset link to {email}.</p>
              <Link to="/login" className="btn-secondary mt-6 inline-flex">
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot Password</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your email and we will send you a reset link.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <Link to="/login" className="mt-4 flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-primary-600">
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
