export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Terms of Service</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>
      <div className="mt-8 space-y-6 text-slate-600 dark:text-slate-400">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Acceptance of Terms</h2>
          <p className="mt-2">By creating an account and using Quad, you agree to these terms. If you do not agree, please do not use the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Eligibility</h2>
          <p className="mt-2">Quad is designed for college students. You must be at least 18 years old to create an account.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Acceptable Use</h2>
          <p className="mt-2">You agree not to post harmful, offensive, or illegal content, harass other users, or use the platform for unauthorized commercial purposes.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Termination</h2>
          <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </section>
      </div>
    </div>
  );
}
