#!/usr/bin/env bash
# CosmicTasha — Development Launcher
# Usage: bash scripts/dev.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/web"

# Colors
MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
GRAY='\033[1;30m'
WHITE='\033[1;37m'
NC='\033[0m'

echo ""
echo -e "  ${MAGENTA}CosmicTasha — Development Server${NC}"
echo -e "  ${GRAY}=================================${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "  ${RED}ERROR: Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "  ${GREEN}Node.js:     ${NODE_VERSION}${NC}"

# Check if node_modules exists
if [ ! -d "$WEB_DIR/node_modules" ]; then
    echo -e "  ${YELLOW}Installing dependencies...${NC}"
    cd "$WEB_DIR"
    npm install
    echo -e "  ${GREEN}Dependencies installed.${NC}"
fi

# Check for .env file
ENV_FILE="$WEB_DIR/.env.local"
ENV_EXAMPLE="$WEB_DIR/.env.example"
if [ ! -f "$ENV_FILE" ] && [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo -e "  ${YELLOW}Created .env.local from .env.example${NC}"
    echo -e "  ${YELLOW}Edit web/.env.local to configure database and services${NC}"
fi

# Show status
echo ""
echo -e "  ${GRAY}Database:    localStorage fallback (no PostgreSQL needed)${NC}"
echo -e "  ${GRAY}biged-rs:    mock fallback (no running instance needed)${NC}"
echo -e "  ${GRAY}AI preview:  template-based mock${NC}"
echo ""
echo -e "  ${CYAN}Starting dev server...${NC}"
echo -e "  ${WHITE}http://localhost:3000${NC}"
echo -e "  ${GRAY}Press Ctrl+C to stop${NC}"
echo ""

# Start the dev server
cd "$WEB_DIR"
npm run dev
