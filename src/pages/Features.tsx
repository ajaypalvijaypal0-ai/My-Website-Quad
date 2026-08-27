import { Newspaper, Users, Calendar, MessageSquare, Bell, Search, Moon, Shield, Zap } from 'lucide-react';

export default function Features() {
  const features = [
    { icon: Newspaper, title: 'Campus Feed', desc: 'Post text, images, polls, and code snippets. React with multiple emoji reactions. Comment with nested replies.' },
    { icon: Users, title: 'Study Groups', desc: 'Create and join study groups tagged by course. See member counts and group descriptions.' },
    { icon: Calendar, title: 'Campus Events', desc: 'Create events with location and time. RSVP as going, maybe, or not going. See who is attending.' },
    { icon: MessageSquare, title: 'Realtime Messaging', desc: '1:1 and group chats with live message delivery, typing indicators, read receipts, and message reactions.' },
    { icon: Bell, title: 'Notifications', desc: 'Stay up to date with in-app notifications for likes, comments, friend requests, and messages.' },
    { icon: Search, title: 'Student Search', desc: 'Find classmates by name, username, major, or university. Send and accept friend requests.' },
    { icon: Moon, title: 'Dark Mode', desc: 'Beautiful dark and light themes with automatic system preference detection.' },
    { icon: Shield, title: 'Privacy First', desc: 'Row-level security on every table. Your messages and notifications are private to you.' },
    { icon: Zap, title: 'Fast & Modern', desc: 'Built with React, Vite, and Tailwind for a blazing-fast, responsive experience on any device.' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Features</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">Everything Quad has to offer.</p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
