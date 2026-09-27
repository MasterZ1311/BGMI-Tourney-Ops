#!/usr/bin/env bash
# ==============================================================================
# BGMI Tournament Control Center (TCC) — Production Deployment Script
# ==============================================================================
set -euo pipefail

echo "========================================================"
echo "  BGMI Tournament Control Center — Deployment Automator"
echo "========================================================"

MODE="${1:-local}"

# 1. Environment Verification
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "⚠️  No .env found. Copying .env.example -> .env..."
    cp .env.example .env
  else
    echo "❌ Error: Neither .env nor .env.example found!"
    exit 1
  fi
fi

# 2. Deployment Execution Modes
case "$MODE" in
  docker)
    echo "🚀 Deploying with Docker Compose..."
    docker compose down --remove-orphans || true
    docker compose build --no-cache
    docker compose up -d
    echo "✅ Containers launched. Checking health..."
    sleep 5
    docker compose ps
    ;;

  postgres-docker)
    echo "🚀 Deploying with Docker Compose (PostgreSQL Profile)..."
    docker compose --profile postgres down --remove-orphans || true
    docker compose --profile postgres build
    docker compose --profile postgres up -d
    echo "✅ Application + PostgreSQL launched."
    sleep 5
    docker compose ps
    ;;

  local|*)
    echo "📦 Installing clean dependencies..."
    npm ci

    echo "⚙️ Generating Prisma client..."
    npx prisma generate

    echo "🔄 Synchronizing database schema..."
    npx prisma db push

    echo "🧪 Running unit tests..."
    npm test

    echo "🏗️ Building Next.js production bundle..."
    npm run build

    echo "🎉 Deployment build successful!"
    echo "To launch the server in production mode, execute:"
    echo "  npm run start"
    ;;
esac

echo "========================================================"
echo "  BGMI TCC Deployment Completed Successfully"
echo "========================================================"
