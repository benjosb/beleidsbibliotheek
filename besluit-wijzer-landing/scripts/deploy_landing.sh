#!/bin/bash
# Deploy Besluit-wijzer landing page + gemeente-x naar besluit-wijzer.nl
# Gebruik:
#   cd /Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidswijzer/besluit-wijzer-landing
#   bash scripts/deploy_landing.sh
#
# Dit doet:
# 1. Landing (index.html, styles.css) → /var/www/besluit-wijzer.nl/
# 2. Gemeente-x → /var/www/besluit-wijzer.nl/gemeente-x/
# 3. Sync deploy/verkiezingen-wassenaar → verkiezingen/wassenaar, dan deploy volledige Wassenaar-site

set -euo pipefail

REMOTE="root@187.77.93.148"
REMOTE_ROOT="/var/www/besluit-wijzer.nl"
REMOTE_GEMEENTE_X="${REMOTE_ROOT}/gemeente-x"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LANDING_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${LANDING_DIR}/.." && pwd)"

echo "=== Deploy Besluit-wijzer landing + gemeente-x ==="
echo ""

# Stap 1: Landing naar root
echo "1. Landing page naar ${REMOTE}:${REMOTE_ROOT}/"
cd "$LANDING_DIR"
scp index.html styles.css "${REMOTE}:${REMOTE_ROOT}/"

# Stap 2: Gemeente-x naar subpad
echo ""
echo "2. Gemeente-x naar ${REMOTE}:${REMOTE_GEMEENTE_X}/"
cd "$REPO_ROOT/gemeente-x"
ssh "${REMOTE}" "mkdir -p ${REMOTE_GEMEENTE_X}"
scp index.html data.js app.js styles.css toelichting-hoofdstukken-taakvelden.html "${REMOTE}:${REMOTE_GEMEENTE_X}/"

# Stap 3: Verkiezingen (landing + wassenaar)
REMOTE_VERKIEZINGEN="${REMOTE_ROOT}/verkiezingen"
REMOTE_VERKIEZINGEN_WASSENAAR="${REMOTE_VERKIEZINGEN}/wassenaar"
WASSENAAR_DEPLOY="${REPO_ROOT}/../_2026_Wassenaar_partijprogramma_analyse/deploy/verkiezingen-wassenaar"
WASSENAAR_DST="${LANDING_DIR}/verkiezingen/wassenaar"

echo ""
echo "3a. Sync Wassenaar (deploy/verkiezingen-wassenaar → verkiezingen/wassenaar)"
if [ -d "$WASSENAAR_DEPLOY" ]; then
  mkdir -p "$WASSENAAR_DST"
  rsync -a --delete "$WASSENAAR_DEPLOY/" "$WASSENAAR_DST/"
  echo "   Gesynchroniseerd."
else
  echo "   (Overgeslagen: $WASSENAAR_DEPLOY niet gevonden. Run eerst: python3 maak_gecombineerde_html.py --besluit-wijzer)"
fi

echo ""
echo "3b. Verkiezingen naar ${REMOTE}:${REMOTE_VERKIEZINGEN}/"
ssh "${REMOTE}" "mkdir -p ${REMOTE_VERKIEZINGEN_WASSENAAR}"
scp "$LANDING_DIR/verkiezingen/index.html" "${REMOTE}:${REMOTE_VERKIEZINGEN}/"
# Volledige wassenaar-map: alle HTML, styles.css, logos/
rsync -avz --delete "$WASSENAAR_DST/" "${REMOTE}:${REMOTE_VERKIEZINGEN_WASSENAAR}/"

echo ""
echo "Klaar."
echo "  Landing:  https://besluit-wijzer.nl"
echo "  Gemeente X: https://besluit-wijzer.nl/gemeente-x/"
echo "  Verkiezingen: https://besluit-wijzer.nl/verkiezingen/"
echo "  Wassenaar: https://besluit-wijzer.nl/verkiezingen/wassenaar/"
echo "Vergeet niet: Cmd+Shift+R in de browser voor verse cache."
