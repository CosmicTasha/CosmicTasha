#!/usr/bin/env bash
# Install git hooks for CosmicTasha
# Run from repo root: bash scripts/setup-hooks.sh

HOOK_DIR=".git/hooks"

if [ ! -d "$HOOK_DIR" ]; then
    echo "Error: .git/hooks not found. Are you in the repo root?"
    exit 1
fi

cp scripts/pre-commit-check.sh "$HOOK_DIR/pre-commit"
chmod +x "$HOOK_DIR/pre-commit"

echo "Pre-commit hook installed successfully."
echo "It will prevent weight files and calibration data from being committed."
