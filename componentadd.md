# 🚀 FundSphere — How to Add Components Yourself

> A complete, project-specific guide for adding **UI components**, **new pages**, and **backend API routes** to the FundSphere crowdfunding platform.

---

## 📁 Project Structure at a Glance

```
d:\crowdfunding\
├── frontend/                   ← Vite + React + TypeScript (the UI)
│   └── src/
│       ├── App.tsx             ← Router: registers all pages & routes
│       ├── main.tsx            ← Entry point (don't touch normally)
│       ├── index.css           ← Global styles (Tailwind utilities)
│       ├── components/         ← 🔵 Reusable UI pieces (Navbar, etc.)
│       │   └── Navbar.tsx
│       ├── pages/              ← 🟢 Full page views (one per route)
│       │   ├── Landing.tsx
│       │   ├── Explore.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Login.tsx
│       │   └── Register.tsx
│       ├── lib/
│       │   └── api.ts          ← apiUrl() helper – always use this!
│       └── assets/             ← Images, SVGs
│
└── backend/                    ← Next.js App Router API (the server)
    └── src/
        ├── app/
        │   └── api/            ← 🔴 API routes (REST endpoints)
        │       ├── campaigns/
        │       ├── users/
        │       ├── auth/
        │       ├── generate/
        │       └── matchmake/
        ├── models/             ← MongoDB Mongoose schemas
        │   ├── Campaign.ts
        │   └── User.ts
        └── lib/                ← Backend utilities (DB connection, etc.)
```

---

## 🔵 PART 1 — Adding a Frontend UI Component

A **component** is a reusable piece of UI — like a card, badge, button, or modal — used inside pages or other components.

### Step 1 — Create the file

Create a new `.tsx` file inside `frontend/src/components/`:

```
d:\crowdfunding\frontend\src\components\StatsCard.tsx
```

### Step 2 — Write the component

Here is the **exact pattern** your project uses (copied from `Navbar.tsx`):

```tsx
// frontend/src/components/StatsCard.tsx

import React from 'react';
import { TrendingUp } from 'lucide-react';  // ← use lucide-react for icons

// 1. Define your props interface (TypeScript)
interface StatsCardProps {
  label: string;
  value: string;
  trend?: string;
}

// 2. Export as default function
export default function StatsCard({ label, value, trend }: StatsCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">
          {label}
        </span>
        <TrendingUp className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {trend && (
        <div className="text-xs text-emerald-400 font-semibold">{trend}</div>
      )}
    </div>
  );
}
```

### Step 3 — Import and use it in a page

Open any page (e.g., `Dashboard.tsx`) and add:

```tsx
// At the top of Dashboard.tsx
import StatsCard from '../components/StatsCard';

// Inside your JSX:
<StatsCard label="Total Raised" value="₹1,20,000" trend="+12% this week" />
```

### ✅ Component Checklist

- [ ] File is in `frontend/src/components/`
- [ ] Filename is `PascalCase.tsx` (e.g., `StatsCard.tsx`)
- [ ] Props are typed with a TypeScript `interface`
- [ ] Exported as `export default function ComponentName()`
- [ ] Icons come from `lucide-react` (already installed)
- [ ] Styling uses Tailwind utility classes (dark theme: `bg-[#0e1220]`, `text-white`, `border-white/10`)

---

## 🟢 PART 2 — Adding a New Page

A **page** is a full-screen view tied to a URL route (e.g., `/explore`, `/dashboard`).

### Step 1 — Create the page file

Create inside `frontend/src/pages/`:

```
d:\crowdfunding\frontend\src\pages\Leaderboard.tsx
```

### Step 2 — Write the page

```tsx
// frontend/src/pages/Leaderboard.tsx

import React, { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';      // ← Always use this for API calls
import { useAuth } from '@clerk/clerk-react'; // ← For auth token
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken(); // ← Get Clerk auth token
      const res = await fetch(apiUrl('/api/campaigns'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json.campaigns || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b12]">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080b12] text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl font-black">Leaderboard</h1>
        </div>

        <div className="space-y-3">
          {data.map((campaign: any, index: number) => (
            <div key={campaign._id}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <span className="text-2xl font-black text-gray-500">#{index + 1}</span>
              <div className="flex-grow">
                <p className="font-bold text-white">{campaign.hook}</p>
                <p className="text-xs text-gray-500">by @{campaign.creatorName}</p>
              </div>
              <span className="text-emerald-400 font-black text-lg">
                ₹{campaign.currentFunding.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Step 3 — Register the route in App.tsx

Open `frontend/src/App.tsx` and add your import + route:

```tsx
// 1. Add import at the top (with other imports)
import Leaderboard from './pages/Leaderboard';

// 2. Add a route inside <Routes> (with Navbar + auth guard)
<Route path="/leaderboard" element={
  <>
    <SignedIn>
      <Navbar />
      <Leaderboard />
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
} />
```

> **If you want a PUBLIC page** (no login required), use this simpler pattern:
> ```tsx
> <Route path="/leaderboard" element={<Leaderboard />} />
> ```

### Step 4 — Add a link in Navbar (optional)

Open `frontend/src/components/Navbar.tsx` and add a `<Link>` inside the nav links section:

```tsx
import { Trophy } from 'lucide-react'; // Add this import

// Inside the nav links <div>:
<Link
  to="/leaderboard"
  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
    location.pathname === '/leaderboard'
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-600 hover:bg-gray-50'
  }`}
>
  <Trophy className="w-4 h-4" /> Leaderboard
</Link>
```

### ✅ Page Checklist

- [ ] File is in `frontend/src/pages/`
- [ ] Filename is `PascalCase.tsx`
- [ ] Always uses `apiUrl()` from `../lib/api` for fetch calls
- [ ] Uses `const { getToken } = useAuth()` for authenticated API calls
- [ ] Imported and registered in `App.tsx` with a `<Route>`
- [ ] Wrapped with `<SignedIn>/<SignedOut>` guard if login is required
- [ ] Uses the dark theme (`bg-[#080b12]`, `text-white`)

---

## 🔴 PART 3 — Adding a Backend API Route

Your backend runs on **Next.js App Router** (`backend/src/app/api/`). Each folder = one endpoint.

### Understanding the structure

```
backend/src/app/api/
├── campaigns/
│   ├── route.ts                     → GET /api/campaigns, POST /api/campaigns
│   └── [id]/
│       ├── route.ts                 → GET /api/campaigns/:id
│       └── invest-skill/
│           └── route.ts             → POST /api/campaigns/:id/invest-skill
├── users/
│   └── me/
│       └── route.ts                 → GET /api/users/me
└── generate/
    └── route.ts                     → POST /api/generate
```

The folder name becomes the URL. `[id]` is a dynamic segment.

### Step 1 — Create the folder and file

Example: add a new `GET /api/campaigns/stats` endpoint.

```
d:\crowdfunding\backend\src\app\api\campaigns\stats\route.ts
```

### Step 2 — Write the route handler

```typescript
// backend/src/app/api/campaigns/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';      // ← Clerk auth for backend
import dbConnect from '../../../lib/dbConnect';       // ← Always connect DB first
import Campaign from '../../../models/Campaign';       // ← Import your model

export async function GET(req: NextRequest) {
  // 1. Verify the user is authenticated
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Connect to MongoDB
  await dbConnect();

  try {
    // 3. Query the database using your Mongoose model
    const totalCampaigns = await Campaign.countDocuments({});
    const fundedCampaigns = await Campaign.countDocuments({ status: 'Funded' });
    
    const allCampaigns = await Campaign.find({});
    const totalRaised = allCampaigns.reduce(
      (sum, c) => sum + c.currentFunding, 0
    );

    // 4. Return JSON response
    return NextResponse.json({
      totalCampaigns,
      fundedCampaigns,
      totalRaised,
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### Step 3 — Call it from the frontend

```tsx
// In any frontend component/page:
const fetchStats = async () => {
  const token = await getToken();
  const res = await fetch(apiUrl('/api/campaigns/stats'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log(data); // { totalCampaigns: 5, fundedCampaigns: 2, totalRaised: 350000 }
};
```

### HTTP Methods Reference

| Method | When to use | Example |
|--------|-------------|---------|
| `GET` | Reading / fetching data | Get all campaigns |
| `POST` | Creating new data | Create a campaign, invest |
| `PUT` | Updating/replacing data | Update campaign details |
| `PATCH` | Partial update | Change campaign status |
| `DELETE` | Removing data | Delete a campaign |

Each is a named export in `route.ts`:

```typescript
export async function GET(req: NextRequest) { ... }
export async function POST(req: NextRequest) { ... }
export async function PATCH(req: NextRequest) { ... }
```

### ✅ API Route Checklist

- [ ] Folder created inside `backend/src/app/api/`
- [ ] File named exactly `route.ts`
- [ ] Uses `getAuth(req)` to verify the user
- [ ] Calls `await dbConnect()` before any DB operation
- [ ] Imports the correct Mongoose model from `../../models/`
- [ ] Returns `NextResponse.json()` for all responses
- [ ] Has try/catch with error handling

---

## 🗄️ PART 4 — Adding a Field to the Database Model

When you need to store new data, you must update the **Mongoose schema**.

### Example: Add a `websiteUrl` field to Campaign

Open `backend/src/models/Campaign.ts`:

```typescript
// 1. Add to the ICampaign interface:
export interface ICampaign extends Document {
  // ... existing fields ...
  websiteUrl?: string;   // ← Add here (? means optional)
}

// 2. Add to the CampaignSchema:
const CampaignSchema: Schema = new Schema({
  // ... existing fields ...
  websiteUrl: { type: String, default: '' },  // ← Add here
});
```

> **No migrations needed!** MongoDB is schema-flexible. New fields appear automatically on new documents. Old documents will return `undefined` for the new field (handle this in your frontend with `campaign.websiteUrl || 'N/A'`).

---

## 🎨 PART 5 — Design Patterns Used in This Project

### Color & Theme

| Purpose | Class |
|---------|-------|
| Page background | `bg-[#080b12]` |
| Card background | `bg-[#0e1220]` or `bg-white/5` |
| Card border | `border border-white/8` or `border-white/10` |
| Primary text | `text-white` |
| Muted text | `text-gray-400` or `text-gray-500` |
| Accent (indigo) | `text-indigo-400`, `bg-indigo-600` |
| Success (green) | `text-emerald-400` |
| Warning (amber) | `text-amber-400` |

### Icons

Always use **lucide-react** (already installed):

```tsx
import { Trophy, Star, TrendingUp, AlertCircle } from 'lucide-react';

<Trophy className="w-5 h-5 text-amber-400" />
```

Browse all icons at: [lucide.dev](https://lucide.dev/icons/)

### Reusable `Section` Pattern (from Explore.tsx)

Your project already has a `Section` component defined inside `Explore.tsx`. Use this pattern for consistent section headers:

```tsx
function Section({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="bg-white/2 border border-white/6 rounded-2xl p-4">
        {children}
      </div>
    </div>
  );
}
```

### Loading State Pattern

```tsx
if (loading) return (
  <div className="min-h-screen flex items-center justify-center bg-[#080b12]">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 animate-spin" />
    </div>
  </div>
);
```

### API Call Pattern (frontend)

```tsx
// Standard pattern used everywhere in this project:
const fetchSomething = async () => {
  try {
    const token = await getToken();                   // 1. Get auth token
    const res = await fetch(apiUrl('/api/your-endpoint'), {
      headers: { Authorization: `Bearer ${token}` }, // 2. Attach token
    });
    if (!res.ok) throw new Error('Failed');           // 3. Check response
    const data = await res.json();                    // 4. Parse JSON
    setYourState(data);                               // 5. Update state
  } catch (e: any) {
    setError(e.message);                              // 6. Handle errors
  } finally {
    setLoading(false);                                // 7. Always stop loading
  }
};
```

---

## 🏁 Quick Reference: Full Workflow Summary

```
Want to add a UI piece?
  → Create frontend/src/components/YourComponent.tsx
  → Import it in the page that needs it

Want to add a new screen/page?
  → Create frontend/src/pages/YourPage.tsx
  → Register route in frontend/src/App.tsx
  → Optionally add link to frontend/src/components/Navbar.tsx

Want to add a new API endpoint?
  → Create backend/src/app/api/your-route/route.ts
  → Write GET/POST handler with dbConnect() + Mongoose model

Want to store new data?
  → Update the interface + schema in backend/src/models/Campaign.ts (or User.ts)
  → Handle undefined in frontend with optional chaining (?.)
```

---

## ❓ FAQ

**Q: What is `apiUrl()`?**  
A: It's a helper in `frontend/src/lib/api.ts` that automatically uses the correct backend URL — `/api/...` in development (via Vite proxy) and the full production URL in production. **Always use it** instead of hardcoding URLs.

**Q: What is `getToken()`?**  
A: It's a Clerk function (`const { getToken } = useAuth()`) that gives you a JWT token. Pass it in the `Authorization` header so the backend can verify who you are.

**Q: Why do I see `window.ethereum` in the code?**  
A: That's for MetaMask/Web3 wallet integration. Ignore it unless you're working on blockchain features.

**Q: How do I add a new category (like "Finance") to campaigns?**  
A: Update the `enum` in `Campaign.ts` model AND the `CAT` object in `Explore.tsx`. Both need to stay in sync.

**Q: Can I create a component inside a page file?**  
A: Yes! Your project already does this — the `Section` function is defined inside `Explore.tsx`. Do this for components used only in one page. Move to `components/` folder only when you need to reuse it across multiple pages.

**Q: How do I start the dev servers?**  
```powershell
# Frontend (Vite):
cd d:\crowdfunding\frontend
npm run dev   # runs on http://localhost:5173

# Backend (Next.js):
cd d:\crowdfunding\backend
npm run dev   # runs on http://localhost:3000
```
