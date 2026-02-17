# Agora Product Plan

## Goals
- Open submissions: anyone can add teachers, monasteries, and retreats.
- Useful discovery: rank and filter to surface relevant entries.
- Simple now, grow later: add moderation and lineage gradually.

## Editing Model
- Open add; guided edits via suggestions (do not overwrite immediately).
- Suggestions queue: pending → approved/rejected; keep version history.
- Lightweight approval: creator can edit own entries; trusted users/mods approve others.

## Data Model (initial)
- `nodes`: id, type (teacher|monastery|retreat), name, country, tradition, website, description
- `edges`: id, from_id, to_id, relation (teacher_of|ordained_by|affiliated_with|hosts)
- `comments`: id, node_id, author_name, content, created_at
- (Later) `users`, `likes`, `suggestions`, `aliases`

## Ranking & Quality
- Score by likes + recency + trust bonus.
- Dedupe on add (similar name+country/tradition) with merge flow.
- Report issues → small moderation queue.

## Profiles & Content
- Short description now; optional longer bio later (Markdown).
- Source links for claims; show a “sourced” badge.
- Claim profiles: verified owners get faster edits.

## Categories & Tags
- Keep structured fields (type, country, tradition).
- Add freeform tags later with alias mapping (e.g., “Zen” ~ “Ch’an”).

## Graph / Lineage
- Use `edges` for lineage (teacher_of, ordained_by, affiliated_with).
- Show mini-graph on profile; full graph view later.
- Enforce DAG (prevent cycles) on edge creation.

## Abuse & Safety
- Require Google sign-in for add/suggest/like.
- Rate limits for new accounts.
- Soft-delete and audit logs; optional reCAPTCHA if needed.

## Phased Roadmap (lean)

Milestone 1: Core Polish (now)
- Images: add `photo_url` to nodes; show on list/detail. URL now; uploads later.
- Deletion: soft delete via `deleted_at`/`deleted_by` (admin-only UI).
- Contact: simple contact form (stores messages), admin inbox page.
- Moderation (minimal): admin allowlist via env; banned emails via env; guard mutations.
- UI polish: sticky header, improved cards, empty state/skeletons.

Milestone 2: Lineage Basics
- Relationship editor: add/list edges (teacher_of/ordained_by/affiliated_with) on item pages.
- Prevent self-loops; show relationships on profiles; no heavy cycle checks yet.

Milestone 3: Discovery & Guidance
- Quiz: short questionnaire → suggestions by tradition/region/tags.
- Search: tags and synonyms (lightweight), ranking tweaks.

Later
- Merge preview UI, redirects from removed IDs, uploads, trust/reputation, claimed profiles, public history diffs.

## Open Questions
- What minimal fields define “same teacher” for dedupe?
- How to show lineage disagreements (parallel edges + source citations)?
- Which emails/domains count as trusted for bootstrap moderation?
