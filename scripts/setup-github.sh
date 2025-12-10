#!/bin/bash

# Master script to set up GitHub issues for the project
# Runs label creation first, then issue creation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "GitHub Project Setup"
echo "=========================================="
echo ""

# Check authentication
echo "Checking GitHub authentication..."
if ! gh auth status &>/dev/null; then
    echo ""
    echo "ERROR: Not authenticated with GitHub."
    echo ""
    echo "Please run: gh auth login"
    echo ""
    echo "Choose:"
    echo "  1. GitHub.com"
    echo "  2. HTTPS"
    echo "  3. Login with a web browser"
    echo ""
    exit 1
fi

echo "✓ Authenticated with GitHub"
echo ""

# Check if we're in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo "ERROR: Not in a git repository"
    exit 1
fi

# Check if remote exists
if ! git remote get-url origin &>/dev/null; then
    echo ""
    echo "ERROR: No 'origin' remote configured."
    echo ""
    echo "Please add a GitHub remote first:"
    echo "  gh repo create google-classroom --public --source=. --push"
    echo ""
    echo "Or if repo exists:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/google-classroom.git"
    echo ""
    exit 1
fi

echo "Repository: $(git remote get-url origin)"
echo ""

# Confirm before proceeding
read -p "This will create ~70+ issues. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Creating labels..."
echo "=========================================="
bash "$SCRIPT_DIR/create-labels.sh"

echo ""
echo "Step 2: Creating issues..."
echo "=========================================="
bash "$SCRIPT_DIR/create-issues.sh"

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "View your issues at: $(git remote get-url origin | sed 's/\.git$//')/issues"
