# GrantSync 🎯

**AI-Powered Grant Discovery for Non-Profits**

GrantSync is an intelligent grant discovery and tracking platform that helps non-profit organizations find, evaluate, and manage funding opportunities using AI-powered recommendations.

---

## ✨ Key Features

### 🤖 AI-Powered Recommendations
- **2-Stage Hybrid Pipeline**: Embedding pre-filter + LLM-based relevance scoring
- **Smart Matching**: Analyzes purpose alignment, eligibility fit, and impact relevance
- **Reasoning**: Each recommendation includes AI-generated explanations

### 📊 Project Management
- Create and manage multiple funding projects
- Define focus areas, target population, deliverables, and funding needs
- Track project status: Planning → Active → Funded → Completed

### 🔍 Grant Discovery
- Auto-import grants from OurSG Grants Portal
- Filter by category, funding range, deadline
- Real-time grant status tracking

### 📋 Application Tracking
- Kanban-style workflow: Discovered → Applying → Submitted → Approved/Rejected
- AI gap analysis for each grant application
- Track deadlines and progress

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19 |
| UI | MUI (Material-UI) v7 |
| Authentication | Better Auth |
| Database | PostgreSQL + Prisma 7 + pgvector |
| AI | Google Gemini 3.0 (LLM + Embeddings) |
| Scraper | Python + psycopg2 |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL with pgvector extension (Neon recommended)
- Google AI API key

### Installation

```bash
# Clone and install
git clone https://github.com/your-org/grantsync.git
cd grantsync
npm install

# Setup Python scraper
pip install -r scripts/requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Database Setup

```bash
# Push schema to database
npx prisma db push

# Enable pgvector (run in Neon console)
CREATE EXTENSION IF NOT EXISTS vector;

# Seed demo user
npm run db:seed

# Import grants from OurSG
npm run grants:import

# Generate embeddings
npm run grants:embed
```

### Start Development

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔧 Environment Variables

```env
# Database (required)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Authentication (required)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Features (required for recommendations)
GEMINI_API_KEY="your-google-ai-api-key"
```

---

## 📁 Project Structure

```
grantsync/
├── docs/                     # Documentation
│   ├── recommendation-engine.md  # AI pipeline docs
│   ├── embeddings.md         # Embedding system
│   └── setup.md              # Setup guide
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Demo user seeder
├── scripts/
│   ├── scraper.py            # OurSG grant scraper
│   ├── import-grants.ts      # Grant importer
│   └── generate-embeddings.ts # Embedding generator
├── src/
│   ├── app/                  # Next.js app router
│   ├── components/           # React components
│   └── lib/                  # Core services
│       ├── recommendation-engine.ts  # AI recommendation
│       ├── llm-relevance.ts  # LLM scoring
│       └── embedding-service.ts # Embeddings
└── package.json
```

---

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo user |
| `npm run grants:import` | Import grants from OurSG API |
| `npm run grants:embed` | Generate grant embeddings |
| `npm run scrape` | Run Python scraper |

---

## 🌐 Deployment

### Vercel + Neon (Recommended)

1. Create database at [neon.tech](https://neon.tech)
2. Enable pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Deploy to Vercel with environment variables
4. Run `npx prisma migrate deploy`
5. Import grants: `npm run grants:import`

See [docs/setup.md](docs/setup.md) for detailed deployment guide.

---

## 📚 Documentation

- [Setup Guide](docs/setup.md) - Complete installation and configuration
- [Recommendation Engine](docs/recommendation-engine.md) - AI pipeline details
- [Embeddings](docs/embeddings.md) - Semantic search system
- [Architecture](docs/architecture.md) - System architecture
- [API Reference](docs/api.md) - API endpoints

---

## 📄 License

MIT License - Built with ❤️ for the Tsao Foundation
