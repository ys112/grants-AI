# GrantSync 🎯

**Orchestrate Your Funding Sustainability**

GrantSync is a grant discovery and tracking platform built for the Tsao Foundation ecosystem. It enables nonprofit partners to discover, evaluate, and manage funding opportunities tailored to their organization's mission.

![Landing Page](./landing_preview.png)

## 🚀 Features

### Smart Discovery
- **Personalized Grant Feed** - AI-powered relevance scoring based on your organization's interests and target population
- **Advanced Filtering** - Filter grants by category (Seniors, Healthcare, Arts, Technology, Community)
- **Real-time Search** - Search grants by title, agency, or keywords

### Track Progress
- **Kanban Board** - Visual workflow management from discovery to application
- **Status Tracking** - Move grants through stages: New → Reviewing → Applied → Rejected
- **Deadline Alerts** - Visual indicators for approaching deadlines

### Ecosystem Collaboration
- **Organization Hierarchy** - Parent-child structure for Tsao Foundation and satellite centers
- **Grant Sharing** - Dispatch relevant grants to partner organizations
- **Unified Dashboard** - Single view across the ecosystem

## 📸 Screenshots

### Landing Page
Premium dark theme with glassmorphism effects, featuring the GrantSync brand and feature highlights.

### Dashboard - Grant Feed
Grid of grant cards with:
- Match score badges (e.g., "92% Match")
- Funding amounts and deadlines
- Category tags and descriptions
- "Track this Grant" action buttons

### Kanban Board
Drag-and-drop interface for managing tracked grants through the application pipeline.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16.1.1, React 19 |
| UI Components | MUI (Material-UI) v7 |
| Authentication | Better Auth |
| Database | SQLite with Prisma 7 |
| Styling | Emotion CSS-in-JS |

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/grantsync.git
cd grantsync

# Install dependencies
npm install

# Set up the database
npx prisma migrate dev --name init

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📁 Project Structure

```
grantsync/
├── prisma/
│   ├── schema.prisma     # Database models
│   ├── seed.ts           # Sample data
│   └── migrations/       # Database migrations
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── auth/         # Auth pages
│   │   └── dashboard/    # Dashboard pages
│   ├── components/       # Reusable components
│   └── lib/              # Utilities (auth, prisma, theme)
└── package.json
```

## 🗄️ Database Schema

### Core Models

- **User** - Authentication and profile (interests, target population, min funding)
- **Grant** - Funding opportunities with metadata and tags
- **TrackedGrant** - User's tracked grants with status
- **Organization** - Parent-child hierarchy for ecosystem

## 🎨 Design System

GrantSync uses a premium dark theme with:
- **Primary Color**: Teal (`#4ECDC4`)
- **Secondary Color**: Coral (`#FF6B6B`)
- **Background**: Deep Navy (`#0A1929`)
- **Glassmorphism** effects on cards
- **Micro-animations** for hover states

## 🧪 Development Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run db:seed    # Seed sample grants
npm run lint       # Run ESLint
```

## 🏆 Hackathon Submission

**Built for the Tsao Foundation Hackathon 2026**

### Judging Criteria Met

| Criteria | Implementation |
|----------|---------------|
| **Usefulness** | Solves real NPO grant discovery pain points with personalized matching |
| **Creativity** | Innovative ecosystem approach with parent-child organization hierarchy |
| **Technical Complexity** | Full-stack Next.js 16 + Prisma 7 + Better Auth + MUI v7 |
| **Documentation** | Comprehensive README with screenshots and setup instructions |

## 📄 License

MIT License - Built with ❤️ for the Tsao Foundation ecosystem.
