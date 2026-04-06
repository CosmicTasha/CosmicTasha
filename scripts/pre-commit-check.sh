#!/usr/bin/env bash
# Pre-commit hook: prevent weight files and calibration data from being committed.
# Install: cp scripts/pre-commit-check.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

BLOCKED_PATTERNS=(
    "ray_weights.json"
    "*.weights"
    "*.weights.json"
    "*.weights.bak"
    "calibration_data/"
    "weight_snapshots/"
)

echo "Checking for blocked files..."

FOUND=0
for pattern in "${BLOCKED_PATTERNS[@]}"; do
    # Check staged files
    MATCHES=$(git diff --cached --name-only -- "$pattern" 2>/dev/null)
    if [ -n "$MATCHES" ]; then
        echo "BLOCKED: Found staged file matching '$pattern':"
        echo "$MATCHES" | while read -r f; do echo "  - $f"; done
        FOUND=1
    fi
done

# Also check for common credential patterns in staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [ -n "$STAGED_FILES" ]; then
    # Check for API keys, connection strings, etc. in staged content
    SECRETS=$(git diff --cached -U0 -- $STAGED_FILES 2>/dev/null | grep -iE '^\+.*(AKIA[A-Z0-9]{16}|sk_live_|pk_live_|password\s*=\s*["\x27][^\s]+|mongodb://[^\s]+|postgres://[^\s]+)' 2>/dev/null || true)
    if [ -n "$SECRETS" ]; then
        echo ""
        echo "WARNING: Possible credentials detected in staged changes:"
        echo "$SECRETS" | head -5
        echo ""
        echo "Review these changes before committing."
        # Warning only, not blocking — credentials in code could be examples/docs
    fi
fi

if [ "$FOUND" -eq 1 ]; then
    echo ""
    echo "COMMIT BLOCKED: Weight files and calibration data must never be committed."
    echo "These are proprietary trade secrets (see ADR-008)."
    echo ""
    echo "If this is intentional (e.g., updating .gitignore), use: git commit --no-verify"
    exit 1
fi

echo "Pre-commit check passed."
exit 0
