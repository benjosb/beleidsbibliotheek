#!/bin/bash
# ─────────────────────────────────────────────────
# BeleidsWijzer — Deploy naar VPS
# Eén druk op de knop: wassenaar → productie
# ─────────────────────────────────────────────────

VPS_HOST="187.77.93.148"
VPS_USER="root"
VPS_PATH="/var/www/wassenaar.besluit-wijzer.nl"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_DIR="$SCRIPT_DIR/wassenaar"

DEPLOY_FILES=(
    index.html
    app.js
    styles.css
    data.js
    beleidsnotas.js
    beleidsnotas.html
    briefings.js
    disclaimer.js
    overdrachtsdossier.js
    overdrachtsdossier.html
    coalitieakkoord.js
    voorstel.html
    beheer.html
    sw.js
    manifest.webmanifest
    pwa-register.js
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BeleidsWijzer — Deploy naar productie  ║${NC}"
echo -e "${BLUE}║   wassenaar.besluit-wijzer.nl             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

missing=()
for f in "${DEPLOY_FILES[@]}"; do
    if [ ! -f "$LOCAL_DIR/$f" ]; then
        missing+=("$f")
    fi
done
if [ ${#missing[@]} -gt 0 ]; then
    echo -e "${RED}Ontbrekende bestanden:${NC}"
    for f in "${missing[@]}"; do echo "  - $f"; done
    exit 1
fi

echo -e "${YELLOW}Bestanden die worden gedeployd:${NC}"
total_size=0
for f in "${DEPLOY_FILES[@]}"; do
    size=$(wc -c < "$LOCAL_DIR/$f" | tr -d ' ')
    total_size=$((total_size + size))
    echo -e "  ${GREEN}✓${NC} $f  (${size} bytes)"
done
echo ""
echo -e "  Totaal: ${#DEPLOY_FILES[@]} bestanden, $((total_size / 1024)) KB"
echo -e "  Doel:   ${BLUE}${VPS_USER}@${VPS_HOST}:${VPS_PATH}${NC}"
echo ""

TMPTAR=$(mktemp /tmp/beleidswijzer-deploy-XXXX.tar.gz)
trap "rm -f $TMPTAR" EXIT

echo -e "${YELLOW}Pakket maken...${NC}"
tar -czf "$TMPTAR" -C "$LOCAL_DIR" "${DEPLOY_FILES[@]}" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}Fout bij het maken van het pakket.${NC}"
    exit 1
fi

pkg_size=$(wc -c < "$TMPTAR" | tr -d ' ')
echo -e "  Pakket: $((pkg_size / 1024)) KB (gecomprimeerd)"
echo ""
echo -e "${YELLOW}Uploaden en uitpakken op VPS...${NC}"
echo -e "${BLUE}→ Je wordt één keer om het VPS-wachtwoord gevraagd.${NC}"
echo ""

scp -o StrictHostKeyChecking=no "$TMPTAR" "${VPS_USER}@${VPS_HOST}:/tmp/_bw_deploy.tar.gz" \
    && ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" \
        "tar -xzf /tmp/_bw_deploy.tar.gz -C ${VPS_PATH} && rm /tmp/_bw_deploy.tar.gz && echo 'OK'"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Klaar! ${#DEPLOY_FILES[@]} bestanden live.${NC}"
    echo -e "${GREEN}  https://wassenaar.besluit-wijzer.nl${NC}"
    echo -e "${GREEN}══════════════════════════════════════════${NC}"
else
    echo ""
    echo -e "${RED}Deploy mislukt. Controleer wachtwoord en verbinding.${NC}"
fi
echo ""
