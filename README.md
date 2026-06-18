# Nritya Admin

Internal admin dashboard for Nritya operations (workshops, bookings, CRM, KYC, and more).

Deployed via GitHub Pages: [nritya-admin](https://nritya-official.github.io/nritya-admin/) (HashRouter — routes use `#/…`).

## Setup

```bash
npm install
npm start          # http://localhost:3000
npm run build      # production build
npm run deploy     # build + gh-pages deploy
```

## Target Users CRM

**Route:** `#/targetUsers`

Finds dancers to invite to a workshop using booking history from the Django API.

```
GET {server}n_admin/target_users_recommendations/{workshop_id}/
```

Users are returned **sorted by index (highest first)**.

### Index formula

Each target user gets a composite **index** used for CRM prioritization:

```
index = 0.5 × style + 0.3 × recency + 0.2 × activity
```

| Signal | Weight | What it measures |
|--------|--------|------------------|
| **Style** | 50% | How well the user's booked dance styles match the target workshop (exact style → related style → same cluster) |
| **Recency** | 30% | How recently they booked a matching workshop in the same city (exponential decay, 45-day half-life) |
| **Activity** | 20% | How many matching bookings in the last 180 days (normalized: 5+ bookings → 1.0) |

### API fields (per user)

| Field | Description |
|-------|-------------|
| `index` | Composite score (0–1), higher = better CRM target |
| `similarity_index` | Same as `index` (kept for backward compatibility) |
| `score_breakdown` | `{ style, recency, activity }` — raw signal values before weighting |
| `matched_styles` | Dance styles that matched the target workshop |
| `matching_bookings_count` | Relevant bookings in the last 180 days |
| `last_matching_booking` | ISO timestamp of most recent matching booking |
| `booked` | `true` if already registered for this workshop (skip outreach) |

### UI legend

In the Target Users table:

- **Index chip** — composite score (green ≥ 0.8, amber ≥ 0.5)
- **S · R · A** — style, recency, activity breakdown
- Hover the index chip for full details (matched styles, booking count, last booking)

### Workflow

1. Select environment (Production / Staging / Local)
2. Pick city → load upcoming workshops
3. Select a workshop → target users load sorted by index
4. Contact high-index users who are not yet booked (`booked: false`) via email promo or WhatsApp

## Environment URLs

Each screen defines server URLs inline (Production Heroku, Staging Heroku, Local `127.0.0.1:8000`).
