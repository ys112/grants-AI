# Grant Import & Cron Job Setup

## Overview

The grant import script fetches grants from the OurSG Grants Portal API, parses HTML content, and stores structured data in the database.

---

## Quick Start

### Run Manual Import
```bash
npm run grants:import
```

This will:
1. Fetch all grants from the API
2. Parse `guideline_html` into sections (objectives, eligibility, timeline, funding)
3. Parse `template_html` for required documents
4. Upsert grants into the database

---

## Data Parsed

### From `guideline_html`:
| Field | Description |
|-------|-------------|
| `objectives` | What the grant supports (main description) |
| `whoCanApply` | Eligibility criteria |
| `whenToApply` | Application timeline |
| `fundingInfo` | Funding amount details |

### From `template_html`:
| Field | Description |
|-------|-------------|
| `requiredDocs` | JSON array of required documents |

### From API:
| Field | Source |
|-------|--------|
| `title` | `name` |
| `agency` | `agency_name` |
| `description` | `desc` |
| `status` | `status` (green/red) |
| `applicableTo` | `applicable_to` |
| `tags` | `explorable_categories` |
| `deliverables` | `deliverables` |
| `email/phone/address` | From details API |

---

## Cron Job Setup

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/import-grants",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Create API route at `src/app/api/cron/import-grants/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Run import (or call the import function)
  // ...
  
  return NextResponse.json({ success: true });
}
```

### Option 2: GitHub Actions

Create `.github/workflows/import-grants.yml`:
```yaml
name: Import Grants

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:       # Manual trigger

jobs:
  import:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - run: npm ci
      
      - run: npm run grants:import
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Option 3: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at desired time
4. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c cd /d C:\path\to\grants-AI && npm run grants:import`

### Option 4: Linux Cron

```bash
crontab -e

# Add line (runs daily at 6 AM):
0 6 * * * cd /path/to/grants-AI && npm run grants:import >> /var/log/grants-import.log 2>&1
```

---

## Environment Variables

Ensure `DATABASE_URL` is set in your environment or `.env` file.

---

## Monitoring

The import script logs:
- ✅ New grants imported
- ✏️ Existing grants updated  
- ⏭️ Skipped (non-green status)
- ⏱️ Total duration

Check logs to verify successful execution.
