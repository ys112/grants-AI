# Deployment Guide

## Vercel (Recommended)

### Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Vercel account linked: `vercel login`

### Deploy
```bash
# Deploy to production
vercel --prod
```

### Environment Variables on Vercel
Set these in Vercel Dashboard → Settings → Environment Variables:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - A secure random string

---

## Google Cloud Run

### Prerequisites
1. Google Cloud SDK installed
2. Docker installed
3. A Google Cloud project with billing enabled

### Step 1: Create Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Update next.config.mjs

Add `output: 'standalone'`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

### Step 3: Build and Push to Artifact Registry

```bash
# Set your project ID
export PROJECT_ID=your-gcp-project-id
export REGION=asia-southeast1

# Authenticate Docker with GCP
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Create Artifact Registry repository (first time only)
gcloud artifacts repositories create grantsync \
  --repository-format=docker \
  --location=${REGION}

# Build and push
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/grantsync/app:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/grantsync/app:latest
```

### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy grantsync \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/grantsync/app:latest \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=your-neon-url,BETTER_AUTH_SECRET=your-secret" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10
```

### Environment Variables for Cloud Run

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `BETTER_AUTH_SECRET` | Secret key for auth tokens |
| `NODE_ENV` | Set to `production` |

### One-Command Deploy Script

Create `scripts/deploy-cloudrun.sh`:

```bash
#!/bin/bash
set -e

PROJECT_ID=${PROJECT_ID:-"your-gcp-project-id"}
REGION=${REGION:-"asia-southeast1"}
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/grantsync/app:latest"

echo "🔨 Building Docker image..."
docker build -t $IMAGE .

echo "📤 Pushing to Artifact Registry..."
docker push $IMAGE

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy grantsync \
  --image=$IMAGE \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi

echo "✅ Deployment complete!"
gcloud run services describe grantsync --region=$REGION --format='value(status.url)'
```

Make it executable: `chmod +x scripts/deploy-cloudrun.sh`

---

## Comparison

| Feature | Vercel | Cloud Run |
|---------|--------|-----------|
| **Setup** | Simple | Requires Docker |
| **Cost** | Free tier generous | Pay per use |
| **Cold Start** | Fast | Variable |
| **Scaling** | Automatic | Configurable |
| **Best For** | Next.js apps | Full control |
