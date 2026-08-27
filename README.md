# Quad — The College Social Network

A modern, full-stack social platform for college students: connect with classmates, join study groups, discover campus events, and message friends — all in one beautiful place.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (dark/light mode, glassmorphism, gradients)
- **Icons:** lucide-react
- **Routing:** react-router-dom (lazy-loaded, code-split routes)
- **Backend:** Supabase (Postgres + Auth + Realtime + Storage)
  - Row-level security on every table
  - Email/password authentication
  - Realtime messaging via Postgres changes
  - Image storage for avatars and post images

## Getting Started

The Supabase project is already provisioned and credentials are in `.env`. To run locally:

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
npm run typecheck  # type-check the project
```

## Environment Variables

All Supabase variables are pre-populated in `.env`. See `.env.example` for reference. Never commit the service-role key to the client.

## Database Schema

The schema is applied via Supabase migrations (run automatically during setup):

| Table | Purpose |
|---|---|
| `profiles` | Public student profiles (username, bio, major, year, university) |
| `posts` | Campus feed posts (text + optional image) |
| `comments` | Replies on posts |
| `likes` | Likes on posts (unique per user) |
| `study_groups` | Study groups with course tagging |
| `group_members` | Membership join table |
| `events` | Campus events with location and time |
| `event_rsvps` | RSVP status (going / maybe / not going) |
| `friendships` | Friend requests (pending / accepted / declined) |
| `conversations` | 1:1 or group chat containers |
| `conversation_participants` | Who is in a conversation |
| `messages` | Realtime chat messages |
| `notifications` | In-app notifications |

### Security

- RLS enabled on every table.
- Profiles and feed content are readable by all authenticated users; writable only by the owner.
- Conversations and messages are only visible to participants.
- Notifications are private to the owning user.
- Owner columns default to `auth.uid()` so inserts work without threading the user ID.

## Project Structure

```
src/
  components/      Reusable UI (Avatar, Logo, Spinner, Skeleton, layouts, nav)
  lib/             Supabase client, auth context, theme, toast, types, utils
  pages/           Route components (marketing + app)
  App.tsx          Router with lazy-loaded app routes
  main.tsx         Entry point
  index.css        Tailwind layers + design system
```

## Pages

- **Public:** Home, About, Features, Pricing, Contact, Privacy, Terms, Login, Sign Up, Forgot Password, 404
- **App (auth required):** Dashboard, Campus Feed, Study Groups, Events, Messages, Notifications, Profile, Settings, Search

## Features

- Student authentication (email/password)
- User profiles with image upload
- Campus feed with posts, likes, comments, and sharing
- Study group creation and joining
- Campus event management with RSVPs
- Real-time messaging with live delivery
- Friend requests and notifications
- Student search
- Dark / light mode with system preference
- Responsive, mobile-first layout
- Loading skeletons and toast notifications
- Code splitting and lazy loading
- SEO meta tags and accessible (WCAG-minded) components

## Deployment

Quad is a static SPA plus a Supabase backend — deploy the frontend anywhere that hosts static sites.

### Vercel / Netlify / Cloudflare Pages

1. Build command: `npm run build`
2. Output directory: `dist`
3. Add the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your host's dashboard.
4. SPA fallback: redirect all routes to `index.html` (Vercel and Netlify do this automatically; for others add a `/* -> /index.html` 200 redirect rule).

### Supabase

The database, auth, realtime, and storage are already provisioned. No additional backend deployment is needed. Edge functions (if added later) deploy via the Supabase MCP tools.
