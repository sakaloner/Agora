# Agora

Simple directory for teachers, monasteries, and retreats. Minimal Next.js app with an SQLite database, a clean single search bar, item detail pages, and comments.

## Quickstart

1) Install deps

   npm install

2) Set env (Google OAuth)

Create `.env.local` with:

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=any-long-random-string
NEXTAUTH_URL=http://localhost:3000
AGORA_ADMIN_EMAILS=you@example.com,othermod@example.org
AGORA_BANNED_EMAILS=banned1@example.com

3) Dev server

   npm run dev

Then open http://localhost:3000

The first run creates `data.db` in the project root and seeds a few example records.

## API

- GET `/api/items?type=teacher|monastery|retreat|event&q=...&limit=25&offset=0`
  - Optional: `order=name|likes` (default: name; UI defaults to likes)
- POST `/api/items` with JSON `{ type, name, country?, tradition?, website?, description?, bio? }`
- GET `/api/comments?node_id=...`
- POST `/api/comments` with JSON `{ nodeId, authorName?, content }`
- GET `/api/likes?node_id=...`
- POST `/api/likes` with JSON `{ nodeId }` (toggle like; requires sign-in)
- GET `/api/suggestions?node_id=...`
- POST `/api/suggestions` with JSON `{ nodeId, name?, country?, tradition?, website?, description?, bio? }` (requires sign-in)
- GET `/api/duplicates` (admin-only)
- POST `/api/duplicates` with JSON `{ sourceId, targetId, reason? }` (requires sign-in)
- POST `/api/duplicates/:id` with JSON `{ action: 'merge', canonicalId, duplicateId }` or `{ action: 'reject' }` (admin-only)
- GET `/api/contact` (admin-only)
- POST `/api/contact` with JSON `{ name?, email?, message }`
- GET `/api/edges?node_id=...`
- POST `/api/edges` with JSON `{ from_id, to_id, relation }`

Notes:
- Adding items, posting comments, and liking require Google sign-in.
- Sign in/out and Add Item buttons are in the header.
- Set `AGORA_ADMIN_EMAILS` to a comma-separated list of admin emails to enable approvals.
- Suggestions list is visible only to admins; users can still submit suggestions.

## Admin

- Pending suggestions: `/admin/suggestions` (approve or reject; applies changes and records versions).
- Duplicate reports: `/admin/duplicates` (merge duplicates safely; moves likes, comments, edges; keeps alias; records versions).
- Messages inbox: `/admin/messages` (view contact submissions).

## Roadmap

- Google auth via `next-auth` (reuse patterns from vibeboard)
- Graph view of lineages (migrate to Neo4j or render from edges table)
- CRUD UI for adding/editing entries
- Rich filters (date ranges, tags)
