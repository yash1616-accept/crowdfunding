# FundSphere — AI Context File
> Paste this entire file at the start of any AI conversation to instantly brief it on the project.
> Last updated: May 2026

---

## 🧠 Project Overview

**FundSphere** is a full-stack **Skill-Based Micro-Investment / Crowdfunding platform** (final year engineering project).

It allows:
- **Creators** (Founders) to publish funding campaigns with a goal, category, and list of required skills.
- **Backers** (Investors) to invest money (via Razorpay) or pledge their skills (hours + estimated value) in exchange for equity.
- Campaign creators can **approve or reject** incoming skill pledges from their Creator Dashboard.
- The platform uses **AI matchmaking** to suggest campaigns based on a user's skill profile.
- An **AI Pitch Generator** helps creators write blueprints using a prompt.

---

## 🗂️ Repository Structure

```
d:\crowdfunding\
├── frontend/           Vite + React 18 + TypeScript (UI)
│   └── src/
│       ├── App.tsx                  Router + auth guards
│       ├── main.tsx                 Entry point
│       ├── index.css                Global Tailwind styles
│       ├── components/
│       │   └── Navbar.tsx           Top navigation bar
│       ├── pages/
│       │   ├── Landing.tsx          Public home/marketing page
│       │   ├── Explore.tsx          Browse + invest in campaigns (965 lines)
│       │   ├── Dashboard.tsx        Creator Studio (796 lines)
│       │   ├── Login.tsx            Clerk sign-in embed
│       │   └── Register.tsx         Clerk sign-up embed
│       └── lib/
│           └── api.ts               apiUrl() helper
│
└── backend/            Next.js 14 App Router (API server only)
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   └── api/
        │       ├── campaigns/
        │       │   ├── route.ts             GET/POST /api/campaigns
        │       │   ├── me/route.ts          GET /api/campaigns/me
        │       │   └── [id]/
        │       │       ├── route.ts         GET /api/campaigns/:id
        │       │       ├── fund/            POST (legacy)
        │       │       ├── checkout/        POST
        │       │       ├── razorpay-order/  POST
        │       │       ├── razorpay-verify/ POST
        │       │       ├── invest-skill/    POST
        │       │       └── validate-skill/  POST
        │       ├── users/
        │       │   └── me/
        │       │       ├── route.ts         GET/POST /api/users/me
        │       │       └── pledges/route.ts GET /api/users/me/pledges
        │       ├── generate/route.ts        POST /api/generate  (AI pitch)
        │       ├── matchmake/route.ts       POST /api/matchmake (AI matching)
        │       └── auth/                   Clerk webhook handling
        ├── models/
        │   ├── Campaign.ts          Mongoose Campaign schema
        │   └── User.ts              Mongoose User schema
        └── lib/
            └── mongodb.ts           DB connection with caching
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Vite + React 18 + TypeScript |
| Frontend Routing | React Router DOM v6 |
| Authentication | **Clerk** (frontend: `@clerk/clerk-react`, backend: `@clerk/nextjs`) |
| Styling | **Tailwind CSS** (utility classes) |
| Icons | `lucide-react` |
| Payments | **Razorpay** (INR, order + verify flow) |
| Backend Framework | **Next.js 14 App Router** (API routes only, no frontend pages) |
| Database | **MongoDB Atlas** via Mongoose |
| DB Connection Utility | `backend/src/lib/mongodb.ts` → `connectToDatabase()` |
| Investment certificates | `html2canvas` (canvas screenshot download) |
| Currency | **Indian Rupees (₹)** throughout |

---

## 🌐 API Endpoints — Complete Reference

All endpoints are prefixed with `/api/`. The frontend calls them via `apiUrl('/api/...')`.

### Campaigns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/campaigns` | Bearer token | Returns all non-Draft campaigns |
| `POST` | `/api/campaigns` | Bearer token | Create a new campaign |
| `GET` | `/api/campaigns/me` | `x-user-id` header | Get campaigns belonging to logged-in creator |
| `GET` | `/api/campaigns/:id` | Bearer token | Get single campaign by MongoDB `_id` |
| `POST` | `/api/campaigns/:id/razorpay-order` | Bearer token | Create Razorpay order for investment |
| `POST` | `/api/campaigns/:id/razorpay-verify` | Bearer token | Verify Razorpay payment + update funding |
| `POST` | `/api/campaigns/:id/invest-skill` | Bearer token | Pledge skills to a campaign |
| `POST` | `/api/campaigns/:id/validate-skill` | None (creator only) | Approve/Reject a skill pledge |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/users/me` | `x-user-email` header | Get user profile (skills, availability) |
| `POST` | `/api/users/me` | None | Create or update user skill profile |
| `GET` | `/api/users/me/pledges` | `x-user-id` header | Get all skill pledges made by this user |

### AI / Utility

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/generate` | Optional Bearer | AI pitch text generator |
| `POST` | `/api/matchmake` | None | AI skill-to-campaign matcher |

---

## 🗄️ MongoDB Schemas

### Campaign (`backend/src/models/Campaign.ts`)

```typescript
{
  creatorId: string,           // Clerk user ID
  creatorName: string,         // Display name shown on cards
  contactEmail: string,        // Visible to lead-tier backers
  category: 'Tech' | 'Creative' | 'Community' | 'Other',
  hook: string,                // Project name / headline
  blueprint: string,           // Full project description
  fundingGoal: number,         // Target in ₹
  currentFunding: number,      // Running total raised in ₹
  status: 'Draft' | 'Active' | 'Funded' | 'Failed',
  milestones: [{ description: string, unlockPercentage: number }],
  stretchGoals: [{ description: string, requiredFunding: number }],
  backers: [{
    username: string,
    amount: number,
    date: Date
  }],
  requiredSkills: string[],    // e.g. ["React", "Marketing"]
  skillBackers: [{
    userId: string,
    username: string,
    skill: string,
    hoursPledged: number,
    estimatedValue: number,    // In ₹
    status: 'Pending' | 'Approved' | 'Rejected',
    date: Date
  }],
  createdAt: Date
}
```

### User (`backend/src/models/User.ts`)

```typescript
{
  email: string,               // Unique
  passwordHash: string,
  role: 'Creator' | 'Backer',
  trustScore: number,          // Default 100
  skills: string[],            // User's skill portfolio
  availability: number,        // Hours/week available
  createdAt: Date
}
```

---

## 🔐 Authentication Pattern

### Frontend
```tsx
import { useAuth, useUser } from '@clerk/clerk-react';

const { getToken } = useAuth();
const { user } = useUser();

// Get token for API calls:
const token = await getToken();

// User identity:
user.id           // Clerk user ID
user.username
user.firstName
user.primaryEmailAddress?.emailAddress
user.publicMetadata?.role   // 'Creator' or 'Investor'
```

### Backend (Next.js)
```typescript
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```

Some routes use custom headers instead of Clerk:
- `x-user-id` → passed by frontend as `user.id`
- `x-user-email` → passed as `user.primaryEmailAddress?.emailAddress`

---

## 🌐 Frontend Routing (App.tsx)

| Route | Page | Protected? |
|-------|------|------------|
| `/` | `Landing.tsx` | Public |
| `/login/*` | `Login.tsx` | Public |
| `/register/*` | `Register.tsx` | Public |
| `/explore` | `Explore.tsx` | ✅ SignedIn required |
| `/dashboard` | `Dashboard.tsx` | ✅ SignedIn + Creator role |

Protected routes use `<SignedIn>` / `<SignedOut>` / `<RedirectToSignIn>` from Clerk.

---

## 🎨 Design System

### Theme Colors (dark UI)

| Token | Value |
|-------|-------|
| Page background | `#080b12` |
| Card background | `#0e1220` or `bg-white/5` |
| Card border | `border-white/8` or `border-white/10` |
| Indigo accent | `text-indigo-400`, `bg-indigo-600` |
| Emerald (success) | `text-emerald-400` |
| Amber (warning) | `text-amber-400` |
| Muted text | `text-gray-400` / `text-gray-500` |

### Category Color Map (Explore.tsx `CAT` object)

| Category | Color |
|----------|-------|
| Tech | Violet/Indigo |
| Creative | Rose/Pink |
| Community | Emerald/Teal |
| Other | Amber/Orange |

### Investment Tiers (hardcoded in Explore.tsx)

| Tier | Amount | Equity |
|------|--------|--------|
| Seed 🌱 | ₹5,000 | 0.01% |
| Growth 📈 | ₹25,000 | 0.05% |
| Lead 🏆 | ₹1,00,000 | 0.15% |
| Custom 💫 | User input | — |

---

## 🔧 Environment Variables

### Frontend (`frontend/.env`)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_API_BASE_URL=https://your-backend.vercel.app   # empty in local dev
VITE_RAZORPAY_KEY_ID=rzp_...
```

### Backend (`backend/.env.local`)
```
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
GOOGLE_GEMINI_API_KEY=...   # for AI generate/matchmake routes
```

---

## 📌 Key Code Patterns

### Frontend API call (standard pattern)
```tsx
const fetchData = async () => {
  try {
    const token = await getToken();
    const res = await fetch(apiUrl('/api/endpoint'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    setState(data);
  } catch (e: any) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};
```

### Backend route handler (standard pattern)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  try {
    const campaigns = await Campaign.find({});
    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### Dynamic route with params
```typescript
// File: app/api/campaigns/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // use id here
}
```

---

## ⚠️ Important Rules & Gotchas

1. **Always use `apiUrl('/api/...')`** — never hardcode backend URLs. Defined in `frontend/src/lib/api.ts`.
2. **Always call `await connectToDatabase()`** before any Mongoose query in the backend.
3. **The backend is Next.js, frontend is Vite** — they are two separate apps running on different ports:
   - Frontend: `localhost:5173`
   - Backend: `localhost:3000`
   - In dev, Vite proxies `/api` calls to `:3000`
4. **Campaign model is re-imported on every change** because of this code in `Campaign.ts`:
   ```typescript
   if (mongoose.models.Campaign) { delete mongoose.models.Campaign; }
   ```
5. **Razorpay runs in mock mode** if `RAZORPAY_KEY_ID` is not set — look for `order.isMock` check in `Explore.tsx`.
6. **Clerk role** is stored in `user.publicMetadata.role` — values: `'Creator'` or `'Investor'`. Only `Creator` role users can publish campaigns.
7. **Currency is always INR (₹)** — never use USD in any new code.
8. **No migrations needed for MongoDB** — just add fields to the schema. Old documents return `undefined` for new fields; handle with `field || defaultValue`.
9. **`lucide-react`** is the only icon library used. Do not add Font Awesome or Material Icons.
10. **`html2canvas`** is used for downloading investment certificates as PNG from `Explore.tsx`.

---

## 📄 Pages Summary

### `Landing.tsx`
Public marketing page. No authentication. Static content explaining the platform.

### `Explore.tsx` (~965 lines)
Main investor view. Features:
- Campaign card grid with category filters, search, sort
- Slide-in detail panel (Deal Room) for each campaign
- Investment flow: tier picker → payment form → Razorpay → confirmation → certificate download
- Skill pledge flow: skill picker → hours/value → submit
- Category-based color system (`CAT` object)

### `Dashboard.tsx` (~796 lines)
Creator Studio. Features:
- Live Projects table (creator's own campaigns with skill backer approval UI)
- Campaign creation form → POST `/api/campaigns`
- Skill Investment Hub (skill profile + AI matchmaking + My Pledges tracker)
- AI Pitch Generator → POST `/api/generate`
- Financial Dashboard (mock balance, withdraw placeholder)
- System Console log panel

### `Navbar.tsx`
- Shows: FundSphere logo, Explore link, Creator Studio link (Creator role only), user email, sign-out button
- "Analytics" and "Community" buttons are placeholder stubs

---

## 🚀 Running Locally

```powershell
# Terminal 1 — Backend
cd d:\crowdfunding\backend
npm run dev   # http://localhost:3000

# Terminal 2 — Frontend
cd d:\crowdfunding\frontend
npm run dev   # http://localhost:5173
```

---
*This context file covers the complete FundSphere platform as of May 2026. For implementation guides and component patterns, see `componentadd.md`.*
