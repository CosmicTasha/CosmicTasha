#!/usr/bin/env bash
# CosmicTasha — Production Build
# Usage: bash scripts/build.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/web"
DIST_DIR="$PROJECT_ROOT/dist"

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
echo -e "  ${MAGENTA}CosmicTasha — Production Build${NC}"
echo -e "  ${GRAY}===============================${NC}"
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

# Run production build
echo -e "  ${CYAN}Running production build...${NC}"
cd "$WEB_DIR"
npm run build

# Clean dist folder
if [ -d "$DIST_DIR" ]; then
    rm -rf "$DIST_DIR"
fi

# Copy standalone output
STANDALONE_DIR="$WEB_DIR/.next/standalone"
if [ ! -d "$STANDALONE_DIR" ]; then
    echo ""
    echo -e "  ${RED}ERROR: .next/standalone not found.${NC}"
    echo -e "  ${RED}Ensure next.config has output: 'standalone'${NC}"
    exit 1
fi

echo -e "  ${CYAN}Copying standalone build to dist/...${NC}"
cp -r "$STANDALONE_DIR" "$DIST_DIR"

# Copy public assets
if [ -d "$WEB_DIR/public" ]; then
    cp -r "$WEB_DIR/public" "$DIST_DIR/public"
    echo -e "  ${GREEN}Copied public/ assets${NC}"
fi

# Copy static files (required for standalone mode)
if [ -d "$WEB_DIR/.next/static" ]; then
    mkdir -p "$DIST_DIR/.next"
    cp -r "$WEB_DIR/.next/static" "$DIST_DIR/.next/static"
    echo -e "  ${GREEN}Copied .next/static/ assets${NC}"
fi

# Done
echo ""
echo -e "  ${GREEN}Build complete!${NC}"
echo ""
echo -e "  ${WHITE}Deploy the dist/ folder to your production server.${NC}"
echo ""
echo -e "  ${GRAY}To run:${NC}"
echo -e "  ${CYAN}  node dist/server.js${NC}"
echo ""
