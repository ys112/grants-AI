# GrantSync Setup Guide

Complete guide for setting up GrantSync locally and deploying to production.

---

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.10+ ([Download](https://python.org/))
- **PostgreSQL** with pgvector extension
  - Recommended: [Neon](https://neon.tech) (free tier available)
  - Alternative: Local PostgreSQL + pgvector
- **Google AI API Key** ([Get one](https://aistudio.google.com/apikey))

---

## Local Development Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-org/grantsync.git
cd grantsync
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/grantsync"

# Authentication
BETTER_AUTH_SECRET="generate-a-secure-random-string"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI (required for recommendations)
GEMINI_API_KEY="your-google-ai-api-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

**Enable pgvector** (run in database console):
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Seed Data

```bash
# Create demo user
npm run db:seed

# Import grants from OurSG API
npm run grants:import

# Generate embeddings for AI matching
npm run grants:embed
```

### 5. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo Login:**
- Email: `demo@tsaofoundation.org`
- Password: `demo123`

---

## Production Deployment

### Option 1: Vercel + Neon (Recommended)

#### Step 1: Create Neon Database
1. Sign up at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Enable pgvector:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

#### Step 2: Deploy to Vercel
1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   ```
   DATABASE_URL=postgresql://...@ep-xxx.neon.tech/grantsync?sslmode=require
   BETTER_AUTH_SECRET=your-production-secret
   BETTER_AUTH_URL=https://your-app.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   GEMINI_API_KEY=your-api-key
   ```
4. Deploy!

#### Step 3: Initialize Database
```bash
# Run migrations
npx prisma migrate deploy

# Seed data (run locally with production DATABASE_URL)
npm run db:seed
npm run grants:import
npm run grants:embed
```

## Updating Grants

### Manual Update
```bash
# Fetch latest from OurSG API
npm run grants:import

# Regenerate embeddings for new grants
npm run grants:embed
```

### Automated (Cron Job)
Set up a daily cron job or Vercel Cron:
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/update-grants",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## Troubleshooting

### pgvector not found
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Embeddings not working
1. Check `GEMINI_API_KEY` is set
2. Run `npm run grants:embed`
3. Verify embeddings: Check `objectivesEmbed` column in Grant table

### Build errors with Prisma
```bash
npx prisma generate
npm run build
```

### Authentication issues
1. Verify `BETTER_AUTH_SECRET` matches across environments
2. Check `BETTER_AUTH_URL` matches your domain
3. Clear cookies and retry

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Random string for auth tokens |
| `BETTER_AUTH_URL` | Yes | Full URL of your app |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL (same as BETTER_AUTH_URL) |
| `GEMINI_API_KEY` | Yes | Google AI API key |
| `VERCEL_URL` | Auto | Set by Vercel for preview deployments |
