# Global Connect — Speak with the World

Global Connect is a production-ready platform where people from around the world connect through **text, voice and video conversations** — learn English or Swahili, exchange cultures, make international friends and book sessions with verified members.

Built with **Next.js (App Router)**, **PostgreSQL + Drizzle ORM**, **JWT + bcrypt auth**, **WebRTC** calling and a blue/white/green design system with full **dark mode**.

---

## Demo accounts (after seeding)

| Role   | Email                        | Password      |
| ------ | ---------------------------- | ------------- |
| Admin  | `admin@globalconnect.app`    | `Admin@12345` |
| Member | `amina.juma@example.com`     | `Member@12345` |
| Member | `sarah.thompson@example.com` | `Member@12345` |

> Try calling from one seeded member to another in two browser windows to see the full WebRTC flow.

---

## Feature map

**Visitors** — Awwwards-grade landing page (hero, features, how-it-works, testimonials, pricing, live FAQ from the DB, contact, footer), member browsing is gated behind auth.

**Members**
- Register / login, email verification (6-digit codes), forgot/reset password
- Rich profiles: avatar upload (compressed client-side), languages, interests, country, availability
- Account activation for **KSh 90** via M-Pesa **Paybill 542542**, account **01609490286150** with proof upload + admin verification flow
- Member search with filters: country, language, interests, online now, verified only
- Real-time chat: typing indicators, read receipts ("Seen"), emoji picker, image sharing, unread badges
- Browser **voice & video calls** (WebRTC; signaling via API polling, swappable for Socket.IO)
- Booking system: request / accept / decline / cancel / complete + month calendar view
- Five-star ratings + written reviews (one per member pair, editable)
- Notifications (messages, bookings, payments, reports, calls), reports, blocking
- Settings: password change, dark/light/system theme, blocked list management

**Admin**
- Analytics: member/revenue/report/booking/message/call stats + 14-day signup chart
- User management: search, filter, activate / suspend / ban / restore, verify badges, CSV export
- Payment verification: pending queue, proof screenshots, approve → instant activation, CSV export
- Report moderation: resolve (optionally suspending the reported user) or dismiss with notes
- Content management: FAQs + announcements CRUD (powers the landing page)

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                     # Landing (server component, FAQs from DB)
│   ├── (auth pages)                 # login · register · verify-email · forgot/reset
│   ├── dashboard/                   # Member app (Shell layout + pages)
│   │   ├── page.tsx                 # Overview
│   │   ├── members/…                # Search + member profile (reviews/book/call)
│   │   ├── messages/…               # Chat UI
│   │   ├── calls/…                  # Call history + WebRTC interface
│   │   ├── bookings/ · notifications/ · activate/ · profile/ · settings/
│   ├── admin/                       # Admin console (tabbed)
│   └── api/                         # REST API (route handlers)
│       ├── auth/…                   # register login logout me verify-email forgot/reset change-password
│       ├── users/ · profile/ · payments/ · content/ · blocks/ · reports/ · notifications/
│       ├── conversations/[id]/(messages|read|typing)
│       ├── calls/[id]               # create + signaling (offer/answer/ICE) + lifecycle
│       ├── bookings/[id] · reviews/
│       └── admin/(stats|users|payments|reports|content)
├── components/                      # ui kit, shell, call interface, landing, auth
├── lib/                             # auth (JWT/bcrypt), api helpers (validation, rate limit),
│                                    # db helpers, constants, client fetch
└── db/                              # Drizzle schema, connection, seed.sql
middleware.ts                        # Route protection + admin role guard
```

---

## Database schema (PostgreSQL)

`users` · `auth_tokens` (email verify / password reset codes) · `payments` (activation, method + payload fields ready for M-Pesa Daraja / card gateways) · `conversations` + `conversation_participants` (drives read receipts) · `messages` · `typing_states` (TTL) · `calls` (SDP offer/answer + ICE trickle persisted for polling signaling) · `bookings` · `reviews` · `notifications` · `reports` · `blocks` · `faqs` · `announcements`

---

## Security

- **JWT** sessions in `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookies — CSRF-resistant by design
- **bcrypt** (10 rounds) password hashing
- **Role-based access control** via middleware + fresh DB checks in every admin route
- **Input validation** on every endpoint (typed validators), **parameterized queries** via Drizzle (SQL-injection safe)
- **Rate limiting** on auth, messaging, reports and payment endpoints
- React-escaped output everywhere (XSS-safe), no `dangerouslySetInnerHTML` for user content
- Account status enforcement (suspended/banned lose access immediately), activation gating for premium features

---

## Installation

```bash
npm install

# .env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app_db"
AUTH_SECRET="replace-with-a-long-random-string"

npm run build && npm start        # or: npm run dev

# database
npx drizzle-kit push              # create tables

# seed demo data (computes bcrypt hashes, then loads seed.sql)
ADMIN_HASH=$(node -e "console.log(require('bcryptjs').hashSync('Admin@12345',10))")
MEMBER_HASH=$(node -e "console.log(require('bcryptjs').hashSync('Member@12345',10))")
psql "$DATABASE_URL" -v admin_hash="$ADMIN_HASH" -v member_hash="$MEMBER_HASH" -f src/db/seed.sql
```

---

## Deployment

### 1 — Push to GitHub

```bash
# create an empty repo at https://github.com/new (name: global-connect), then:
git remote add origin https://github.com/<your-username>/global-connect.git
git push -u origin main
```

(Or with the GitHub CLI: `gh repo create global-connect --public --source=. --push`)

### 2 — Provision Postgres (Neon free tier)

1. Create a project at [neon.tech](https://neon.tech) and copy the pooled connection string.
2. Create the tables and seed data:

```bash
export DATABASE_URL="postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
npx drizzle-kit push

ADMIN_HASH=$(node -e "console.log(require('bcryptjs').hashSync('Admin@12345',10))")
MEMBER_HASH=$(node -e "console.log(require('bcryptjs').hashSync('Member@12345',10))")
psql "$DATABASE_URL" -v admin_hash="$ADMIN_HASH" -v member_hash="$MEMBER_HASH" -f src/db/seed.sql
```

(Supabase/Railway/Render Postgres work identically — any managed Postgres.)

### 3 — Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** the `global-connect` repo (framework auto-detected: Next.js).
2. Add **Environment Variables**:
   - `DATABASE_URL` = your Neon pooled connection string
   - `AUTH_SECRET` = a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
3. Click **Deploy** — done. Your app is live at `https://<project>.vercel.app`.

Alternatively via CLI: `npm i -g vercel && vercel --prod --yes --env DATABASE_URL=... --env AUTH_SECRET=...`

> Notes for production: chat & calls use short polling, so they work perfectly on serverless — no websockets required. The in-memory rate limiter is per-instance; move to Upstash Redis for a multi-instance hard limit. WebRTC needs HTTPS (Vercel provides it) for microphone/camera permissions.

**Split deployment (as in the original brief)** — the `/api` route handlers are a standard REST API and can be hosted on Render/Railway behind a Node server, with the frontend on Vercel pointed at it. Sessions are bearer-compatible JWTs, so swapping the cookie for an `Authorization` header is a small change.

**Upgrades already designed-in**
- Automatic M-Pesa Daraja STK push → fill `payments.method='mpesa_auto'` + `payload`; card payments via Stripe use the same table
- Socket.IO realtime → replace the polling intervals in chat/calls with socket events; the DB schema needs no changes
- SMTP (Resend/SES) → send the 6-digit codes already generated by the API instead of returning `devCode`
- Cloudinary → swap the base64 image pipeline (`fileToDataUrl`) with signed uploads

---

## Notes

- Email delivery is stubbed for the demo: verification/reset codes are displayed in the UI (“demo delivery”) when no SMTP provider is configured.
- All monetary amounts are stored in minor units with currency codes.
