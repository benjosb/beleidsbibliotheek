#!/bin/bash
# Deploy Besluit-wijzer (gemeente-x) v0.1 naar besluit-wijzer.nl
# Gebruik:
#   cd /Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidswijzer/gemeente-x
#   bash scripts/deploy_gemeente_x.sh

set -euo pipefail

REMOTE="root@187.77.93.148"
REMOTE_PATH="/var/www/besluit-wijzer.nl/gemeente-x"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GEMEENTE_X_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$GEMEENTE_X_DIR"

echo "Deploy Besluit-wijzer (gemeente-x) v0.1 naar ${REMOTE}:${REMOTE_PATH}"
echo "Bestanden: index.html, data.js, app.js, styles.css, toelichting-hoofdstukken-taakvelden.html"

ssh "${REMOTE}" "mkdir -p ${REMOTE_PATH}"
scp index.html data.js app.js styles.css toelichting-hoofdstukken-taakvelden.html "${REMOTE}:${REMOTE_PATH}/"

echo "Klaar. Gemeente X: https://besluit-wijzer.nl/gemeente-x/"
echo "Vergeet niet: Cmd+Shift+R in de browser voor verse cache."
