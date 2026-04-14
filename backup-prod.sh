#!/bin/bash
# ─────────────────────────────────────────────────
# BeleidsBibliotheek — Backup productie (Argeweb)
# ─────────────────────────────────────────────────
#
#   Gebruik:
#     ./backup-prod.sh
#
#   Wat het doet:
#     1. Download de hele productie-site via FTP
#     2. Slaat op in backups/prod_YYYY-MM-DD_HHMM/
#     3. Houdt de laatste 10 backups, verwijdert oudere
#
#   Vereist:
#     - .env.prod met FTP-credentials
#     - lftp (brew install lftp)
#
# ─────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.prod"
BACKUP_DIR="$SCRIPT_DIR/backups"
DATUM=$(date +"%Y-%m-%d_%H%M")
DOEL="$BACKUP_DIR/prod_${DATUM}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Checks ───
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Geen .env.prod gevonden. Vul FTP-credentials in.${NC}"
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
echo -e "${BLUE}║   BeleidsBibliotheek — Backup productie          ║${NC}"
echo -e "${BLUE}║   Bron: ${FTP_HOST}                              ║${NC}"
echo -e "${BLUE}║   Doel: backups/prod_${DATUM}/                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Download ───
mkdir -p "$DOEL"

echo -e "${YELLOW}Downloaden van productie...${NC}"
echo ""

lftp -c "
set ssl:verify-certificate no
set net:timeout 30
open -u ${FTP_USER},${FTP_PASS} ${FTP_HOST}
cd ${FTP_PATH:-/httpdocs}
mirror --verbose=1 . $DOEL
bye
"

if [ $? -eq 0 ]; then
    BESTANDEN=$(find "$DOEL" -type f | wc -l | tr -d ' ')
    GROOTTE=$(du -sh "$DOEL" | cut -f1)
    echo ""
    echo -e "${GREEN}══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Backup compleet!${NC}"
    echo -e "${GREEN}  ${BESTANDEN} bestanden, ${GROOTTE}${NC}"
    echo -e "${GREEN}  Opgeslagen in: backups/prod_${DATUM}/${NC}"
    echo -e "${GREEN}══════════════════════════════════════════${NC}"
else
    echo ""
    echo -e "${RED}Backup mislukt. Controleer FTP-credentials in .env.prod${NC}"
    rm -rf "$DOEL"
    exit 1
fi

# ─── Oude backups opruimen (bewaar laatste 10) ───
AANTAL=$(ls -d "$BACKUP_DIR"/prod_* 2>/dev/null | wc -l | tr -d ' ')
if [ "$AANTAL" -gt 10 ]; then
    VERWIJDER=$((AANTAL - 10))
    echo ""
    echo -e "${YELLOW}Opruimen: ${VERWIJDER} oude backup(s) verwijderen...${NC}"
    ls -d "$BACKUP_DIR"/prod_* | head -n "$VERWIJDER" | while read dir; do
        rm -rf "$dir"
        echo -e "  ${GREEN}✓${NC} $(basename $dir) verwijderd"
    done
fi

echo ""
