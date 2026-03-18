#!/bin/bash
# Deploy Wassenaar-frontend + verkiezingen naar wassenaar.besluit-wijzer.nl
# Gebruik:
#   cd /Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidswijzer/wassenaar
#   bash scripts/deploy_wassenaar.sh
#
# Vóór deploy: python3 maak_gecombineerde_html.py --besluit-wijzer (in partijprogramma_analyse)

set -euo pipefail

REMOTE="root@187.77.93.148"
REMOTE_PATH="/var/www/wassenaar.besluit-wijzer.nl"

# Hergebruik SSH-verbinding — wachtwoord maar 1x invoeren
SSH_OPTS="-o ControlMaster=auto -o ControlPath=/tmp/ssh-wassenaar-%r@%h-%p -o ControlPersist=120"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WASSENAAR_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${WASSENAAR_DIR}/.." && pwd)"
VERKIEZINGEN_SRC="${REPO_ROOT}/../_2026_Wassenaar_partijprogramma_analyse/deploy/verkiezingen-wassenaar"

cd "$WASSENAAR_DIR"

echo "=== Deploy wassenaar.besluit-wijzer.nl ==="
echo ""

echo "1. Besluiten, Schrijf-Wijzer, Overdrachtsdossier, Roadmap..."
scp $SSH_OPTS index.html data.js app.js app_v5.js app_v6.js disclaimer.js overdrachtsdossier.html overdrachtsdossier.js roadmap.html verbeterpunten-beheer.html viewer.html styles.css "wassenaar_logo_fc kopie.svg" "${REMOTE}:${REMOTE_PATH}/"
ssh $SSH_OPTS "${REMOTE}" "mkdir -p ${REMOTE_PATH}/scripts ${REMOTE_PATH}/schrijf-wijzer"
scp $SSH_OPTS scripts/domeinclustering.py "${REMOTE}:${REMOTE_PATH}/scripts/"
scp $SSH_OPTS -r schrijf-wijzer/* "${REMOTE}:${REMOTE_PATH}/schrijf-wijzer/"

echo ""
echo "2. Verkiezingsprogramma's naar ${REMOTE_PATH}/verkiezingen/"
if [ -d "$VERKIEZINGEN_SRC" ]; then
  ssh $SSH_OPTS "${REMOTE}" "mkdir -p ${REMOTE_PATH}/verkiezingen"
  rsync -avz --delete -e "ssh $SSH_OPTS" "${VERKIEZINGEN_SRC}/" "${REMOTE}:${REMOTE_PATH}/verkiezingen/"
  echo "   Verkiezingen gesynchroniseerd."
else
  echo "   (Overgeslagen: $VERKIEZINGEN_SRC niet gevonden. Run eerst: python3 maak_gecombineerde_html.py --besluit-wijzer)"
fi

echo ""
echo "Klaar."
echo "  Besluiten: https://wassenaar.besluit-wijzer.nl/"
echo "  Verkiezingen: https://wassenaar.besluit-wijzer.nl/verkiezingen/"
echo "  Schrijf-Wijzer: https://wassenaar.besluit-wijzer.nl/schrijf-wijzer/schrijf-wijzer-formulier.html"
echo "Vergeet niet: Cmd+Shift+R in de browser."

