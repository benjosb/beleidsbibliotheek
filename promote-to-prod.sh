#!/bin/bash
# ─────────────────────────────────────────────────────────────
# BeleidsBibliotheek — Promoveer ACC → PROD (Argeweb via FTP)
# ─────────────────────────────────────────────────────────────
#
# Dit script draait op Dick's Mac (of Ricardo's machine).
#
#   Gebruik:
#     ./promote-to-prod.sh
#     ./promote-to-prod.sh "Akkoord Joyce - link-correcties"
#
#   Wat het doet:
#     1. Haalt bestanden op van ACC (VPS Hostinger) via SSH
#     2. Uploadt naar PROD (Argeweb) via FTP
#     3. Logt de deploy
#
#   Vereist:
#     - .env.prod met FTP-credentials (zie template)
#     - SSH-key voor VPS (~/.ssh/id_vps)
#     - lftp (brew install lftp)
#
# ─────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.prod"
DEPLOY_LOG="$SCRIPT_DIR/docs/deploy-log.md"
VERSIE=$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null | tr -d '[:space:]' || echo "0.0.0")
DEPLOY_NOTITIE="${1:-}"
DATUM=$(date +"%Y-%m-%d %H:%M")

VPS_HOST="187.77.93.148"
VPS_USER="root"
SSH_KEY="$HOME/.ssh/id_vps"
SSH_OPTS="-o StrictHostKeyChecking=no -i $SSH_KEY"
ACC_PATH="/var/www/wassenaar.besluit-wijzer.nl"

EXCLUDE_FILES="beheer.html werklijst-reacties.html"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Checks ───
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Geen .env.prod gevonden. Maak dit bestand aan met FTP-credentials.${NC}"
    echo "  Kopieer .env.prod.template of vul in:"
    echo "    FTP_HOST=..."
    echo "    FTP_USER=..."
    echo "    FTP_PASS=..."
    echo "    FTP_PATH=/"
    exit 1
fi

source "$ENV_FILE"

if [ -z "${FTP_HOST:-}" ] || [ -z "${FTP_USER:-}" ] || [ -z "${FTP_PASS:-}" ]; then
    echo -e "${RED}FTP-credentials onvolledig in .env.prod${NC}"
    exit 1
fi

if ! command -v lftp &> /dev/null; then
    echo -e "${RED}lftp niet gevonden. Installeer met: brew install lftp${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BeleidsBibliotheek — ACC → PROD               ║${NC}"
echo -e "${BLUE}║   Versie: ${VERSIE}                                     ║${NC}"
echo -e "${BLUE}║   ACC:  wassenaar.besluit-wijzer.nl (Hostinger)  ║${NC}"
echo -e "${BLUE}║   PROD: beleidsbibliotheekwassenaar.nl (Argeweb) ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Stap 1: Bestanden ophalen van ACC ───
echo -e "${YELLOW}Stap 1: Bestanden ophalen van ACC (VPS)...${NC}"
TMPDIR=$(mktemp -d /tmp/bb-promote-XXXX)
trap "rm -rf $TMPDIR" EXIT

scp $SSH_OPTS -r "${VPS_USER}@${VPS_HOST}:${ACC_PATH}/"* "$TMPDIR/" 2>/dev/null

# Excludes verwijderen
for ex in $EXCLUDE_FILES; do
    rm -f "$TMPDIR/$ex"
done

FILE_COUNT=$(find "$TMPDIR" -type f | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$TMPDIR" | cut -f1)
echo -e "  ${GREEN}✓${NC} ${FILE_COUNT} bestanden opgehaald ($DIR_SIZE)"
echo ""

# ─── Stap 2: Upload naar PROD via FTP ───
echo -e "${YELLOW}Stap 2: Uploaden naar PROD (Argeweb via FTP)...${NC}"

lftp -c "
set ssl:verify-certificate no
set net:timeout 30
open -u ${FTP_USER},${FTP_PASS} ${FTP_HOST}
cd ${FTP_PATH:-/}
mirror --reverse --delete --verbose=1 $TMPDIR .
bye
"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Klaar! Productie bijgewerkt.${NC}"
    echo -e "${GREEN}  https://beleidsbibliotheekwassenaar.nl${NC}"
    echo -e "${GREEN}══════════════════════════════════════════${NC}"

    # Deploy-log bijwerken
    NOTITIE_KOLOM="${DEPLOY_NOTITIE:-—}"
    if [ -f "$DEPLOY_LOG" ]; then
        echo "| ${DATUM} | ${VERSIE} | PROD | $(whoami) | ${NOTITIE_KOLOM} |" >> "$DEPLOY_LOG"
        echo -e "  ${GREEN}✓${NC} Deploy-log bijgewerkt"
    fi
else
    echo ""
    echo -e "${RED}Upload mislukt. Controleer FTP-credentials in .env.prod${NC}"
fi

echo ""
echo -e "${YELLOW}  Vergeet niet: Cmd+Shift+R in de browser.${NC}"
echo ""
