# GrantSync 🎯

**Orchestrate Your Funding Sustainability**

GrantSync is a grant discovery and tracking platform for the Tsao Foundation ecosystem. It enables nonprofit partners to discover, evaluate, and manage funding opportunities.

## 🚀 Features

- **Smart Discovery** - AI-powered relevance scoring based on organization profile
- **Grant Filtering** - Filter by category, funding range, deadline
- **Kanban Tracking** - Visual workflow from discovery to application

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19 |
| UI | MUI (Material-UI) v7 |
| Authentication | Better Auth |
| Database | PostgreSQL + Prisma 7 |
| Scraper | Python + psycopg2 |

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL database (local or cloud)

### Local Development

```bash
# Clone and install
git clone https://github.com/your-org/grantsync.git
cd grantsync
npm install

# Setup Python scraper
pip install -r scripts/requirements.txt

# Configure database
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Push schema to database
npx prisma db push

# Seed organizations
npm run db:seed

# Scrape and populate grants
npm run scrape

# Start dev server
npm run dev
```

## 🌐 Cloud Deployment (Vercel + Neon)

### 1. Create Neon Database
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### 2. Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx.us-east-2.aws.neon.tech/grantsync?sslmode=require
   BETTER_AUTH_SECRET=your-production-secret
   BETTER_AUTH_URL=https://your-app.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
4. Deploy!

### 3. Run Migrations
```bash
npx prisma migrate deploy
```

### 4. Populate Grants
Run the scraper locally or set up a cron job:
```bash
npm run scrape
```

## 🔧 Environment Variables

```env
# PostgreSQL Database (required)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Authentication (required)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📁 Project Structure

```
grantsync/
├── prisma/
│   ├── schema.prisma     # PostgreSQL schema
│   └── seed.ts           # Organization seeder
├── scripts/
│   ├── scraper.py        # Grant scraper (Python)
│   └── requirements.txt  # Python dependencies
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   └── lib/              # Utilities
└── package.json
```

## 🧪 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run scrape` | Scrape and store grants to PostgreSQL |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed organizations |

## 📄 License

MIT License - Built with ❤️ for the Tsao Foundation
