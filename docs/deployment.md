# BGMI Tournament Control Center — Deployment Guide

## 1. Prerequisites
- Node.js 18+ (tested on Node.js v20 and v22)
- npm or pnpm or yarn
- SQLite (built-in, default for local execution & zero-config demo) or PostgreSQL (production cloud deployment)

## 2. Environment Variables (.env)
```env
# Application Port and Host
PORT=3000
NODE_ENV=development

# Database Connection (Default SQLite for instant local zero-config launch)
DATABASE_URL="file:./dev.db"
# For PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/bgmi_tcc?schema=public"

# Authentication & Security Secret
NEXTAUTH_SECRET="bgmi-tournament-super-secret-key-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"

# Public App URL for Display Mode and Export Links
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 3. Local Installation & Development
1. Clone repository and install dependencies:
   ```bash
   npm install
   ```
2. Initialize database schema:
   ```bash
   npx prisma db push
   ```
3. Seed demo tournament with realistic BGMI teams and matches:
   ```bash
   npx prisma db seed
   # or via in-app "Load Demo Tournament" button
   ```
4. Run development server:
   ```bash
   npm run dev
   ```
5. Access application at `http://localhost:3000`.

## 4. Production Build & Execution
```bash
npm run build
npm run start
```

## 5. Docker Deployment
A multi-stage `Dockerfile` is provided for containerized deployments on Kubernetes, AWS ECS, or DigitalOcean App Platform.
