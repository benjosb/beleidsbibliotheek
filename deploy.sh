#!/bin/bash
# ─────────────────────────────────────────────────
# BeleidsWijzer — Deploy naar VPS
# ─────────────────────────────────────────────────
#
# Gebruik:
#   ./deploy.sh                  → deploy naar ACCEPTATIE
#   ./deploy.sh "korte notitie"  → idem, met notitie in deploy-log
#
# Workflow:
#   1. Git commit + push (automatische backup)
#   2. Upload bestanden naar ACC op VPS
#   3. Regel toevoegen aan docs/deploy-log.md
#
# Productie-deploy gaat NIET via dit script.
# Gebruik promote-to-prod.sh op de VPS (Ricardo).
# ─────────────────────────────────────────────────

set -euo pipefail

VPS_HOST="187.77.93.148"
VPS_USER="root"
SSH_KEY="$HOME/.ssh/id_vps"
SSH_OPTS="-o StrictHostKeyChecking=no -i $SSH_KEY"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_DIR="$SCRIPT_DIR/wassenaar"

ENV_NAAM="ACCEPTATIE"
VPS_PATH="/var/www/wassenaar.besluit-wijzer.nl"
SITE_URL="https://wassenaar.besluit-wijzer.nl"
EXCLUDE_FILES=("")

DEPLOY_NOTITIE="${1:-}"
VERSIE=$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null | tr -d '[:space:]' || echo "0.0.0")

# ─── Auto patch-versie bump ───
IFS='.' read -r V_MAJOR V_MINOR V_PATCH <<< "$VERSIE"
V_PATCH=$((V_PATCH + 1))
VERSIE="${V_MAJOR}.${V_MINOR}.${V_PATCH}"
echo "$VERSIE" > "$SCRIPT_DIR/VERSION"

ALL_FILES=(
    index.html
    scroll-sync-bridge.js
    app.js
    financieel-bbv-begroting-2026.js
    financieel-taakveld-dashboard-meta.js
    financieel-taakveld-dashboard-embed.js
    taakvelden_iv3.js
    bi-taakveld-dashboard.html
    analyse-begrotingen/bi-voorbeeld-4.2.html
    beleidsnota-per-taakveld-data.js
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
    werklijst-reacties.html
    wijzigingen.html
    sw.js
    manifest.webmanifest
    pwa-register.js
    reactie.html
    bb42-oefen.html
)

# Filter excludes
DEPLOY_FILES=()
for f in "${ALL_FILES[@]}"; do
    skip=false
    for ex in "${EXCLUDE_FILES[@]}"; do
        [ "$f" = "$ex" ] && skip=true
    done
    $skip || DEPLOY_FILES+=("$f")
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BeleidsWijzer — Deploy ${ENV_NAAM}${NC}"
printf "${BLUE}║   %-47s║${NC}\n" "$SITE_URL"
echo -e "${BLUE}║   Versie: ${VERSIE}${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Git backup ───
echo -e "${YELLOW}Git backup...${NC}"
cd "$SCRIPT_DIR"
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    git add -A
    if ! git diff --staged --quiet 2>/dev/null; then
        git commit -m "Deploy v${VERSIE} naar ACC — $(date +%Y-%m-%d)"
        echo -e "  ${GREEN}✓${NC} Commit aangemaakt"
        if git remote get-url origin > /dev/null 2>&1; then
            git push origin main 2>/dev/null && echo -e "  ${GREEN}✓${NC} Push naar GitHub" \
                || echo -e "  ${YELLOW}⚠${NC} Push mislukt (niet blokkerend)"
        fi
    else
        echo -e "  ${GREEN}✓${NC} Geen wijzigingen — al up-to-date"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Geen git repo gevonden (overgeslagen)"
fi
cd "$LOCAL_DIR"
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
echo ""

scp $SSH_OPTS "$TMPTAR" "${VPS_USER}@${VPS_HOST}:/tmp/_bw_deploy.tar.gz" \
    && ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" \
        "tar -xzf /tmp/_bw_deploy.tar.gz -C ${VPS_PATH} && rm /tmp/_bw_deploy.tar.gz && echo 'OK'"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Klaar! ${#DEPLOY_FILES[@]} bestanden live (${ENV_NAAM}).${NC}"
    echo -e "${GREEN}  ${SITE_URL}${NC}"
    echo -e "${GREEN}══════════════════════════════════════════${NC}"

    # ─── Deploy-log bijwerken ───
    DEPLOY_LOG="$SCRIPT_DIR/docs/deploy-log.md"
    DATUM_LOG=$(date +"%Y-%m-%d %H:%M")
    NOTITIE_KOLOM="${DEPLOY_NOTITIE:-—}"
    if [ -f "$DEPLOY_LOG" ]; then
        echo "| ${DATUM_LOG} | ${VERSIE} | ACC | Dick | ${NOTITIE_KOLOM} |" >> "$DEPLOY_LOG"
        echo -e "  ${GREEN}✓${NC} Deploy-log bijgewerkt"
    fi
else
    echo ""
    echo -e "${RED}Deploy mislukt. Controleer wachtwoord en verbinding.${NC}"
fi
echo ""
echo -e "${YELLOW}  Vergeet niet: Cmd+Shift+R in de browser.${NC}"
echo ""
