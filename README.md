# Seconde Dressing - Clothing Resale Service

A Next.js application for booking clothing resale services with appointment management and client tracking.

## Features

- **Homepage**: Overview of services with call-to-action
- **Booking System**: Schedule appointments for drop-off or wardrobe sorting services
- **Client Dashboard**: View, manage, and track your bookings
- **Authentication**: Secure login with email/password or Google OAuth
- **Calendly Integration**: Easy appointment scheduling
- **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel
- **Calendar**: Calendly (Free tier)
- **Emails**: SendGrid (Optional for V1)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Calendly account (optional)
- SendGrid account (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mast0w2/seconde-dressing.git
cd seconde-dressing
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-username
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-email@seconde-dressing.com
```

4. Set up Supabase:
   - Create a new project at [https://app.supabase.com](https://app.supabase.com)
   - Go to SQL Editor and run the following SQL:
   ```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Create profiles table
   CREATE TABLE IF NOT EXISTS profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     full_name TEXT,
     phone TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create bookings table
   CREATE TABLE IF NOT EXISTS bookings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     service_type TEXT NOT NULL CHECK (service_type IN ('drop-off', 'wardrobe-sorting')),
     date TIMESTAMPTZ NOT NULL,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create index for user bookings
   CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
   ```

5. Enable Email/Password and Google Auth in Supabase:
   - Go to Authentication -> Providers
   - Enable Email/Password and Google
   - For Google, add your client ID and secret from Google Cloud Console

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
seconde-dressing/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── callback/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   └── bookings/
│   │   │       ├── route.ts
│   │   │       └── [id]/route.ts
│   │   ├── book/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Footer.tsx
│   │   └── Navbar.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── server.ts
│   └── types/
│       └── database.ts
├── .env.local.example
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to [https://vercel.com](https://vercel.com) and import your repository

3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CALENDLY_URL`
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`

4. Deploy!

### Set Up Database Webhooks (Optional)

For real-time updates, you can set up Supabase database webhooks to trigger emails on booking changes.

## API Endpoints

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create a new booking
- `PATCH /api/bookings/:id` - Update a booking
- `DELETE /api/bookings/:id` - Delete a booking

## Free Tier Limits

- **Vercel**: 100K serverless requests/month
- **Supabase**: 500 MB storage + 2 GB bandwidth
- **SendGrid**: 100 emails/day
- **Calendly**: 1 event type

## License

MIT
