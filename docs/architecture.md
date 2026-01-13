# Architecture & Design

## System Overview

GrantSync is a modern web application designed to facilitate grant discovery and tracking for the Tsao Foundation ecosystem. It follows a multi-tenant inspired architecture where organizations have a parent-child relationship.

## Tech Stack

- **Frontend Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Component Library**: Material UI (MUI) v7
- **Styling**: Emotion (CSS-in-JS) with a custom glassmorphism theme
- **Authentication**: Better Auth
- **Database**: PostgreSQL (Prisma ORM)
- **Infrastructure**: Vercel (Frontend/API) + Neon (Database)

## Data Architecture

### Core Models

#### User
- Represents platform users (partners, admins).
- Authenticated via Email/Password (extensible to SSO).
- Profile attributes: `interests` (JSON), `targetPopulation`, `minFunding`.

#### Grant
- Stores grant opportunities.
- Fields: `title`, `amount`, `deadline`, `description`, `agency`.
- Metadata: `issueArea`, `eligibilityCriteria` (JSON), `kpis` (JSON).
- Scraped data includes `sourceId` for deduplication.

#### TrackedGrant
- Join table between `User` and `Grant`.
- Tracks status: `new` -> `reviewing` -> `applied` -> `rejected`.
- Supports user-specific notes.

#### Organization
- Hierarchical structure (`parentId`).
- Allows modeling the Tsao Foundation -> Hua Mei Centre relationship.

## Key Components

### Grant Scraper
- Python script using `requests` and `BeautifulSoup`.
- Writes directly to the PostgreSQL database.
- Upsert logic prevents duplicates based on `sourceId` (hash of title + agency).

### Recommendation Engine (Planned)
- Matching logic runs on grant ingestion.
- Scores grants based on:
  1. Interest overlap
  2. Funding range eligibility
  3. Keyword relevance

## Security

- **Authentication**: Secure sessions via Better Auth.
- **Authorization**: Role-based access control (Admin vs Partner).
- **Data Protection**: Environment variables for secrets, secure database connections (`sslmode=require`).
