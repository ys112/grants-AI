# Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended for serverless)

## Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env    # Then edit .env with your DATABASE_URL
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BETTER_AUTH_SECRET=your-secret-key
```

## Database Setup

```bash
# Push schema to database
npm run db:push

# Seed demo users
npm run db:seed

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@tsao.org | admin123 | Admin |
| partner@huamei.org | partner123 | Partner |
| demo@grantsync.com | demo123 | Partner |

## Running

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Sync schema to database |
| `npm run db:seed` | Seed demo users |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:generate` | Generate migrations |
| `npm run db:migrate` | Run migrations |

## Importing Grants

```bash
# Run scraper first
npm run scrape

# Import scraped grants to database
npx tsx scripts/import_grants.ts
```
