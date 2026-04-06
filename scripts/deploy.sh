#!/usr/bin/env bash
# Deploy CosmicTasha to production
# Run from project root on the R7-1700

set -e

echo "CosmicTasha — Production Deploy"
echo "================================"

# Check for .env
if [ ! -f deploy/.env ]; then
    echo "ERROR: deploy/.env not found"
    echo "Copy deploy/.env.production.example to deploy/.env and fill in values"
    exit 1
fi

# Load env
export $(grep -v '^#' deploy/.env | xargs)

# Build and deploy
echo "Building containers..."
docker compose build --no-cache web

echo "Running database migrations..."
docker compose run --rm web npx drizzle-kit push

echo "Starting services..."
docker compose up -d

echo ""
echo "Deployment complete!"
echo "  Web:      https://${DOMAIN}"
echo "  Postgres: internal (5432)"
echo "  Redis:    internal (6379)"
echo ""
echo "Check status: docker compose ps"
echo "View logs:    docker compose logs -f web"
