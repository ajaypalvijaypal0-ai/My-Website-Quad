export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">About Quad</h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
        Quad was built to bring college students together. We believe the best college experience comes from meaningful connections — with classmates, study partners, and the campus community.
      </p>
      <div className="mt-8 space-y-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Our Mission</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            To create a safe, engaging, and productive social platform exclusively for college students — where academics and social life come together seamlessly.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">What We Offer</h2>
          <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-400">
            <li>Campus feed for sharing updates and engaging with peers</li>
            <li>Study groups organized by course and subject</li>
            <li>Campus event discovery and RSVP management</li>
            <li>Real-time messaging with friends and groups</li>
            <li>Student search and friend connections</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
