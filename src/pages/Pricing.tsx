import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function Pricing() {
  const plans = [
    { name: 'Free', price: '$0', period: 'forever', features: ['Campus feed', 'Study groups', 'Campus events', 'Realtime messaging', 'Notifications'], cta: 'Get Started', to: '/signup', highlighted: false },
    { name: 'Pro', price: '$4.99', period: '/month', features: ['Everything in Free', 'Advanced search filters', 'Priority support', 'Custom profile themes', 'Unlimited group chats'], cta: 'Upgrade', to: '/signup', highlighted: true },
    { name: 'Campus', price: 'Custom', period: '', features: ['Everything in Pro', 'Campus-wide analytics', 'Admin dashboard', 'Event management tools', 'Dedicated support'], cta: 'Contact Us', to: '/contact', highlighted: false },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Simple, transparent pricing</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">Start free. Upgrade when you need more.</p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`card p-8 ${plan.highlighted ? 'ring-2 ring-primary-500' : ''}`}>
            {plan.highlighted && (
              <div className="mb-4 inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check className="h-4 w-4 text-primary-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to={plan.to} className={`mt-8 w-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
