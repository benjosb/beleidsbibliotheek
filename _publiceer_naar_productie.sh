#!/bin/bash
# ============================================================
#  BeleidsBibliotheek — kopieer naar productie-map
#  Gebruik: dubbelklik of ./publiceer_naar_productie.sh
# ============================================================

BRON="$(cd "$(dirname "$0")/wassenaar" && pwd)"
DATUM=$(date +"%Y%m%d_%H%M")
DOEL="$(dirname "$0")/_softlaunch_wo_8_april"

if [ ! -d "$BRON" ]; then
    echo "❌ Bronmap niet gevonden: $BRON"
    exit 1
fi

echo "============================================"
echo "  BeleidsBibliotheek → Productie-kopie"
echo "============================================"
echo ""
echo "  Bron:  $BRON"
echo "  Doel:  $DOEL"
echo ""

mkdir -p "$DOEL/pwa-icons" "$DOEL/schrijf-wijzer"

BESTANDEN=(
    index.html
    app.js
    beleidsnota-per-taakveld-data.js
    data.js
    styles.css
    disclaimer.js
    taakvelden_iv3.js
    stempel.svg
    "wassenaar_logo_fc kopie.svg"
    od-cover.png
    reactie.html
    werklijst-reacties.html
    werklijst-sociaal-domein.html
    beleidsnotas.html
    beleidsnotas.js
    overdrachtsdossier.html
    overdrachtsdossier.js
    roadmap.html
    verbeterpunten-beheer.html
    wijzigingen.html
    beheer.html
    viewer.html
    manifest.webmanifest
    sw.js
    pwa-register.js
)

TELLER=0
FOUTEN=0

for f in "${BESTANDEN[@]}"; do
    if [ -f "$BRON/$f" ]; then
        cp "$BRON/$f" "$DOEL/$f"
        TELLER=$((TELLER + 1))
    else
        echo "⚠️  Niet gevonden: $f"
        FOUTEN=$((FOUTEN + 1))
    fi
done

cp "$BRON"/pwa-icons/*.png "$DOEL/pwa-icons/" 2>/dev/null
cp -R "$BRON"/schrijf-wijzer/* "$DOEL/schrijf-wijzer/" 2>/dev/null

# Favicon bestanden (indien aanwezig)
for fav in favicon.ico favicon.svg favicon-32.png; do
    [ -f "$BRON/$fav" ] && cp "$BRON/$fav" "$DOEL/$fav"
done

echo "✅ $TELLER bestanden gekopieerd naar:"
echo "   $DOEL"
[ $FOUTEN -gt 0 ] && echo "⚠️  $FOUTEN bestanden niet gevonden (zie boven)"
echo ""
echo "  PWA-icons:     $(ls "$DOEL/pwa-icons/" 2>/dev/null | wc -l | tr -d ' ') bestanden"
echo "  Schrijf-wijzer: $(ls "$DOEL/schrijf-wijzer/" 2>/dev/null | wc -l | tr -d ' ') bestanden"
echo ""
echo "============================================"
echo "  Klaar! Upload deze map naar Argeweb."
echo "============================================"
