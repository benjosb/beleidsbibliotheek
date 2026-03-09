#!/bin/bash
# Eenvoudige deploy van Wassenaar-frontend naar VPS.
# Gebruik:
#   cd /Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidswijzer/wassenaar
#   bash scripts/deploy_wassenaar.sh

set -euo pipefail

REMOTE="root@187.77.93.148"
REMOTE_PATH="/var/www/wassenaar.besluit-wijzer.nl"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WASSENAAR_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$WASSENAAR_DIR"

echo "Deploy Wassenaar naar ${REMOTE}:${REMOTE_PATH}"
echo "Bestanden: index.html, data.js, app.js, roadmap.html, verbeterpunten-beheer.html, viewer.html, scripts/domeinclustering.py"

scp index.html data.js app.js app_v5.js app_v6.js roadmap.html verbeterpunten-beheer.html viewer.html styles.css "wassenaar_logo_fc kopie.svg" "${REMOTE}:${REMOTE_PATH}/"
ssh "${REMOTE}" "mkdir -p ${REMOTE_PATH}/scripts"
scp scripts/domeinclustering.py "${REMOTE}:${REMOTE_PATH}/scripts/"

echo "Klaar. Vergeet niet: Cmd+Shift+R in de browser."

