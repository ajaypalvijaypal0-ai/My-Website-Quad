import { Link } from 'react-router-dom';
import { Users, Calendar, MessageSquare, Newspaper, GraduationCap, Sparkles, Zap, Shield } from 'lucide-react';

export default function Home() {
  const features = [
    { icon: Newspaper, title: 'Campus Feed', desc: 'Share updates, photos, and polls with your campus community.' },
    { icon: Users, title: 'Study Groups', desc: 'Find and join study groups for any course or subject.' },
    { icon: Calendar, title: 'Campus Events', desc: 'Discover events, RSVP, and see who is going.' },
    { icon: MessageSquare, title: 'Realtime Chat', desc: 'Message friends and groups with live delivery and read receipts.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-900/20" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-200/30 blur-3xl dark:bg-accent-900/20" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              <Sparkles className="h-4 w-4" />
              Built for students, by students
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Your campus, <span className="text-gradient">connected.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Quad is the social network for college students. Connect with classmates, join study groups, discover campus events, and message friends — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary w-full sm:w-auto">
                <GraduationCap className="h-5 w-5" />
                Get Started Free
              </Link>
              <Link to="/features" className="btn-secondary w-full sm:w-auto">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Everything you need on campus</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">One app for your entire college social life.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6 transition-all hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-16 text-center">
          <Zap className="absolute top-6 right-6 h-24 w-24 text-white/10" />
          <Shield className="absolute bottom-6 left-6 h-16 w-16 text-white/10" />
          <h2 className="text-3xl font-bold text-white">Ready to join the Quad?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-100">
            Create your free account and start connecting with your campus today.
          </p>
          <Link to="/signup" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-lg transition-all hover:shadow-xl active:scale-95">
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
}
