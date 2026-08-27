export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>
      <div className="mt-8 space-y-6 text-slate-600 dark:text-slate-400">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Information We Collect</h2>
          <p className="mt-2">We collect information you provide when creating an account, including your name, email, username, major, year, and university. We also collect content you post and messages you send.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">How We Use Your Information</h2>
          <p className="mt-2">We use your information to provide and improve our services, connect you with classmates, display your profile, and send you notifications about activity related to your account.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Data Security</h2>
          <p className="mt-2">We use row-level security on every database table to ensure your private data — including messages and notifications — is only accessible to you and authorized parties.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your Rights</h2>
          <p className="mt-2">You can update or delete your account at any time. You control your profile visibility and privacy settings from the Settings page.</p>
        </section>
      </div>
    </div>
  );
}
