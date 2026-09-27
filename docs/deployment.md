# BGMI Tournament Control Center (TCC) — Deployment & Operations Playbook

## 1. Executive Overview & Architecture

The **BGMI Tournament Control Center (TCC)** is a production-grade Next.js 14 esports operations application built with TypeScript, Prisma ORM, and Tailwind CSS. It is engineered for high-pressure LAN and online esports environments, managing 16–25 squads per match with deterministic scoring, roster validation, and automated schedule allocation.

### Supported Runtime Environments
- **Node.js**: `>= 20.x` (LTS recommended)
- **Container Runtime**: Docker `>= 24.x` with Docker Compose V2
- **Operating Systems**: Linux (Ubuntu 20.04/22.04 LTS, Debian 12, Alpine 3.19+), macOS, Windows 11 / WSL2
- **Databases**:
  - **SQLite 3** (Default for instant zero-dependency local development, staging, and single-host LAN tournaments)
  - **PostgreSQL 14+ / 16** (Recommended for multi-region cloud deployments and high-concurrency broadcasts)

---

## 2. Environment Configuration Matrix

The application is configured via environment variables. Create a `.env` file at the repository root by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Type / Allowed Values | Default Value | Description |
|---|---|---|---|
| `DATABASE_URL` | String (Connection URI) | `"file:./dev.db"` | Relational database connection string. Supports SQLite (`file:...`) or PostgreSQL (`postgresql://...`). |
| `PORT` | Integer | `3000` | Port on which the HTTP server listens. |
| `HOSTNAME` | String | `0.0.0.0` | Network interface to bind to (`0.0.0.0` inside containers, `localhost` for local dev). |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` | Node.js execution environment mode. |
| `NEXT_PUBLIC_APP_URL` | URL String | `http://localhost:3000` | Canonical public URL used for broadcast overlays, QR codes, and export links. |
| `NEXTAUTH_URL` | URL String | `http://localhost:3000` | Canonical URL for authentication redirects and session resolution. |
| `NEXTAUTH_SECRET` | String (>= 32 chars) | Required in Prod | Cryptographic secret for signing session cookies and audit signatures. |
| `ENABLE_DEMO_AUTH` | `true` \| `false` | `true` | Allows instant admin authentication for fast evaluation and tournament demo mode. Set `false` in production. |

> [!WARNING]
> **Zero Real Secrets Policy**: Never commit `.env` or production passwords to Git. Generate production secrets using:
> ```bash
> openssl rand -base64 32
> ```

---

## 3. Local Developer Setup (Bare Metal)

### Step 1: Install Dependencies
```bash
npm ci
```

### Step 2: Initialize Database
Generate the Prisma Client and synchronize the schema:
```bash
npx prisma generate
npx prisma db push
```

### Step 3: Seed Demo Tournament Data
Populate the database with realistic BGMI squads, players, scoring configs, and mock matches:
```bash
# Execute standalone TypeScript seed runner
npx tsx scripts/seed-db.ts
# Or via bundled script
node scripts/seed-db.bundle.js
```

### Step 4: Run Tests & Verification
Run the 13-point unit and regression test suite:
```bash
npm test
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 4. Multi-Stage Production Containerization (Docker)

The repository includes an optimized, security-hardened `Dockerfile` utilizing a 3-stage build process:
1. **Stage 1 (`deps`)**: Installs dependencies via `npm ci` on Node 20 Alpine with `libc6-compat` and `openssl`.
2. **Stage 2 (`builder`)**: Generates the Prisma client for Linux musl, compiles assets, and builds Next.js in `standalone` output mode.
3. **Stage 3 (`runner`)**: Strips development tools, creates an unprivileged `nextjs:nodejs` (UID 1001) user, sets up persistent volume permissions, and executes `node server.js`.

### Build & Run Container Manually

```bash
# 1. Build Docker image
docker build -t bgmi-tcc:latest .

# 2. Run container with persistent SQLite volume
docker run -d \
  --name bgmi-tcc \
  -p 3000:3000 \
  -v bgmi-data:/app/prisma \
  -e NODE_ENV=production \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  bgmi-tcc:latest
```

---

## 5. Docker Compose Orchestration

### Option A: Standard Deployment (Persistent SQLite — Default)
Zero external dependencies. Ideal for venue LAN servers, local admin laptops, and quick staging:

```bash
# Start application in background
docker compose up -d

# View live container logs
docker compose logs -f app

# Stop containers
docker compose down
```
Data is automatically preserved in the named volume `bgmi_tcc_sqlite_data`.

### Option B: Cloud High-Availability (PostgreSQL Cluster)
For large-scale tournaments running on dedicated cloud infrastructure:

1. Update `prisma/schema.prisma` datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Start application alongside dedicated PostgreSQL 16 container:
   ```bash
   docker compose --profile postgres up -d
   ```
3. Run migrations against the PostgreSQL container:
   ```bash
   docker compose exec app npx prisma db push
   ```

---

## 6. Production Host Deployment (Linux VPS / Nginx)

### System Architecture on a Cloud VPS (e.g. AWS EC2, DigitalOcean Droplet, Hetzner):
```
Internet ➔ Cloudflare / SSL ➔ Nginx (Reverse Proxy :443) ➔ Docker Container (:3000) ➔ SQLite/PostgreSQL
```

### Nginx Virtual Host Configuration (`/etc/nginx/sites-available/bgmi-tcc.conf`):
```nginx
server {
    listen 80;
    server_name tcc.esports.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tcc.esports.example.com;

    ssl_certificate /etc/letsencrypt/live/tcc.esports.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tcc.esports.example.com/privkey.pem;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. Database Operations, Backups & Rollback Protocols

### 7.1. SQLite Hot Backups
Because SQLite supports WAL mode (Write-Ahead Logging), you can create consistent point-in-time backups without stopping tournament operations:

```bash
# Automated hot backup using SQLite online backup API or .backup command:
docker compose exec app sqlite3 /app/prisma/dev.db ".backup '/app/prisma/backup-$(date +%Y%m%d_%H%M%S).db'"
```

### 7.2. Safe Rollback Procedure
Before any version upgrade or schema change:
1. **Take Snapshot**:
   ```bash
   cp prisma/dev.db prisma/dev.db.bak.$(date +%s)
   ```
2. **Execute Deployment**:
   ```bash
   ./scripts/deploy.sh docker
   ```
3. **Emergency Rollback**:
   If an issue occurs during a live tournament matchday:
   ```bash
   docker compose down
   cp prisma/dev.db.bak.<timestamp> prisma/dev.db
   docker compose up -d
   ```

---

## 8. Health Probes & Operational Readiness Checklist

### Container Health Check
The Docker container includes a built-in health probe:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1
```

Verify health status:
```bash
docker inspect --format='{{json .State.Health.Status}}' bgmi-tcc-app
# Expected output: "healthy"
```

### Pre-Matchday Operations Checklist
- [ ] Confirm `NEXTAUTH_SECRET` is set to a secure string.
- [ ] Verify NTP time synchronization across server and admin laptops (critical for schedule slot precision).
- [ ] Verify test suite passes: `npm test`.
- [ ] Verify database volume is mounted and writable.
- [ ] Run dry-run demo tournament to verify standings calculation: `npx tsx scripts/seed-db.ts`.
