#!/bin/bash
# Backup naar GitHub + deploy Besluit-wijzer (gemeente-x) naar besluit-wijzer.nl
# Gebruik:
#   cd gemeente-x
#   bash scripts/backup_en_deploy.sh [commit-bericht]
#
# Stap 1: git add, commit, push (vanuit repo-root)
# Stap 2: deploy naar VPS

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GEMEENTE_X_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${GEMEENTE_X_DIR}/.." && pwd)"

MSG="${1:-Besluit-wijzer gemeente-x v0.1 — Iv3-structuur, toelichting hoofdstukken en taakvelden}"

echo "=== Stap 1: Backup naar GitHub ==="
cd "$REPO_ROOT"

git add gemeente-x/
git status

if git diff --staged --quiet; then
    echo "Geen wijzigingen om te committen."
else
    git commit -m "$MSG"
    git push origin main
    echo "Push voltooid."
fi

echo ""
echo "=== Stap 2: Deploy naar besluit-wijzer.nl ==="
cd "$GEMEENTE_X_DIR"
bash scripts/deploy_gemeente_x.sh

echo ""
echo "Klaar. Cmd+Shift+R in de browser voor verse cache."
