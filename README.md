# ClaimGuard: AI-Powered Bill Dispute Agent 🛡️

ClaimGuard is a next-generation platform designed to analyze bills (Medical, Auto Insurance, Rent, and Utilities) and automatically draft legal dispute letters to uncover savings and eliminate hidden fees.

## Bank-Grade Security Architecture 🔒
ClaimGuard is built with an **Iron-Clad Security** and **Auth-Gate** architecture because your financial data is critical. We implement the following standards:

1. **Mandatory Auth-Gate**: No payment logic or sensitive data is accessible without authenticated sessions. All premium interactions requires a signed-in state.
2. **Row-Level Security (RLS)**: The database operates on a strict zero-trust model. Native PostgreSQL RLS policies enforce `auth.uid() = user_id` on all tables (Bills, Negotiations, Payments), guaranteeing that user data cannot be requested or leaked across accounts, even if API endpoints are compromised.
3. **Server-Side Validation**: Checkout sessions and payment verifications securely happen on the backend, using `@supabase/ssr` to ensure JWT verification before executing any `.select()`, `.insert()`, or `.update()` operation.
4. **Strict Typing**: The entire codebase strictly enforces TypeScript (`ignoreBuildErrors: false`), preventing undefined data flows that could compromise security states.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack
- Frontend: Next.js (App Router), React, Tailwind CSS, Framer Motion
- Backend & DB: Supabase (Auth, Storage, PostgreSQL with RLS)
- Icons: Lucide React
