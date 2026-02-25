#!/bin/bash
# Commit en push naar GitHub — run dit script, eventueel met een bericht:
#   ./scripts/commit-en-push.sh
#   ./scripts/commit-en-push.sh "Korte beschrijving van de wijziging"

cd "$(dirname "$0")/.."
BERICHT="${1:-Wijzigingen doorgevoerd}"

git add .
git status --short
echo ""
echo "Commit met bericht: $BERICHT"
echo "Druk Enter om door te gaan, of Ctrl+C om te annuleren."
read -r

git commit -m "$BERICHT"
git push

echo ""
echo "Klaar. Code staat op GitHub."
