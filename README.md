# GrantSync 🎯

**AI-Powered Grant Discovery for Non-Profits**

> *Helping non-profit organizations find, evaluate, and manage funding opportunities using AI-powered recommendations.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-grants-ai-three.vercel.app-4ECDC4?style=for-the-badge)](https://grants-ai-three.vercel.app/)

[**Step-by-step guide**](docs/demo.md)

---

## 🎯 The Problem

Non-profit organizations struggle to find relevant grants:

- 🔍 **Discovery is manual** — Staff spend 20+ hours/month browsing multiple grant portals
- 📊 **Matching is subjective** — Hard to know which grants actually fit their mission
- ⏰ **Deadlines are missed** — No centralized tracking system
- 📝 **Applications are weak** — No guidance on fit or gaps

---

## 💡 Our Solution

GrantSync is an intelligent platform that:

1. **Automatically imports** grants from government portals (OurSG)
2. **Uses AI to match** grants to your specific projects with explainable scores
3. **Analyzes gaps** and provides recommendations to strengthen applications
4. **Tracks applications** from discovery to approval in a Kanban workflow

---

## ✨ Key Features

### 🤖 AI-Powered Recommendations
- **2-Stage Hybrid Pipeline**: Embedding pre-filter + LLM-based relevance scoring
- **Smart Matching**: Analyzes purpose alignment, eligibility fit, and impact relevance
- **Transparent Scoring**: Users see exactly why each score was given

### 📊 Project Management
- Create and manage multiple funding projects
- Define focus areas, target population, deliverables, and funding needs
- Track project status: Planning → Active → Funded → Completed

### 🔍 Grant Discovery
- Auto-import grants from OurSG Grants Portal with vercel cron job
- Filter by category, funding range, deadline
- Real-time grant status with color-coded deadline urgency

### 📋 Application Tracking
- Kanban-style workflow: New → Reviewing → Applied → Rejected
- AI gap analysis for each grant application
- Track deadlines and application progress

---

## 🤖 Technical Innovation

### 2-Stage AI Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Stage 1       │     │   Stage 2       │     │   Output        │
│   Embeddings    │ ──► │   LLM Analysis  │ ──► │   Ranked List   │
│   (Pre-filter)  │     │   (60% weight)  │     │   + Reasoning   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Fast                    Accurate               Actionable
   100→15 grants           15→10 grants          With explanations
```

### Scoring Formula

**Final Score = (LLM Score × 60%) + (Rule-Based Score × 40%)**

| Pre-Filter Stage | LLM Analysis |
|------------------|--------------|
| Semantic Embeddings (50%) | Purpose Alignment (50%) |
| Focus Area Match (30%) | Eligibility Fit (25%) |
| Funding Range Fit (10%) | Impact Relevance (25%) |
| Deadline Urgency (10%) | |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19 |
| UI | MUI (Material-UI) v7 |
| Authentication | Better Auth |
| Database | PostgreSQL + Prisma 7 + pgvector |
| AI | Google Gemini 3.0 (LLM + Embeddings) |
| Hosting | Vercel + Neon |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL with pgvector extension (Neon recommended)
- Google AI API key

### Installation

```bash
# Clone and install
git clone https://github.com/ys112/grantsync.git
cd grantsync
npm install

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

# Seed demo data
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

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run grants:import` | Import grants from OurSG API |
| `npm run grants:embed` | Generate grant embeddings |

---

## 🌐 Deployment

### Vercel + Neon (Recommended)

1. Create database at [neon.tech](https://neon.tech)
2. Enable pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Deploy to Vercel with environment variables
4. Run `npx prisma migrate deploy`
5. Import grants: `npm run grants:import`

---

## 📚 Documentation

- [Demo](docs/demo.md) — Step-by-step demo guide
- [Recommendation Engine](docs/recommendation-engine.md) — AI pipeline details
- [Grant Import](docs/grant-import.md) — Data pipeline documentation

---

## 📊 Impact

| Before GrantSync | After GrantSync |
|-----------------|-----------------|
| 20+ hrs/month searching | < 2 hrs/month reviewing |
| 40% missed deadlines | 0% missed (tracked) |
| 3 grants/month applied | 8+ grants/month applied |
| No fit analysis | AI-powered fit scoring |

---

## 👥 Team

Built by HMGeeks:
- Yong Yu Sian
- Nam Dohyun
- Edward Rafael
- Glenn Chew

---

