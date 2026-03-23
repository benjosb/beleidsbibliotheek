#!/bin/bash
# Backup naar GitHub + deploy naar live site.
# Gebruik:
#   cd wassenaar
#   bash scripts/backup_en_deploy.sh [commit-bericht]
#
# Stap 1: git add, commit, push (vanuit repo-root)
# Stap 2: deploy naar VPS

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WASSENAAR_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${WASSENAAR_DIR}/.." && pwd)"

MSG="${1:-Update Wassenaar}"

echo "=== Stap 1: Backup naar GitHub ==="
cd "$REPO_ROOT"

# Alleen wassenaar-bestanden
git add wassenaar/
git status

if git diff --staged --quiet; then
    echo "Geen wijzigingen om te committen."
else
    git commit -m "$MSG"
    git push origin main
    echo "Push voltooid."
fi

echo ""
echo "=== Stap 2: Deploy naar site ==="
cd "$WASSENAAR_DIR"
bash scripts/deploy_wassenaar.sh

echo ""
echo "Klaar. Cmd+Shift+R in de browser voor verse cache."
