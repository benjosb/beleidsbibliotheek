# Deploy naar productie — beleidsbibliotheekwassenaar.nl (Argeweb / Plesk)

**Laatst bijgewerkt:** 8 april 2026  
**Hosting:** Argeweb, Plesk-paneel  
**Account:** Dick Braam  
**Webroot:** `httpdocs/`

---

## Snelle route (zip via publiceer-tool)

1. Ga naar **https://wassenaar.besluit-wijzer.nl/_publiceer/**
2. Wachtwoord: `wassenaar2026`
3. Klik **"Download zip voor productie"** — wacht tot de voortgangsbalk klaar is
4. Er downloadt een bestand: `beleidsbibliotheek_productie_YYYY-MM-DD-HHMM.zip`
5. Pak het zipbestand uit op je computer

---

## Uploaden via Plesk

1. Log in op **Plesk** (beleidsbibliotheekwassenaar.nl)
2. Ga naar **Bestanden** → klik op **httpdocs**
3. **Verwijder** eerst de oude bestanden (selecteer alles behalve `.well-known/`)
4. Klik op het **+** icoon (linksboven) → **Bestand uploaden**
5. Sleep alle bestanden en mappen uit de uitgepakte zip naar het uploadvenster:

### Bestanden (in httpdocs/)

| Bestand | Wat is het |
|---------|-----------|
| `index.html` | Hoofdpagina |
| `app.js` | Applicatielogica + beleidsnota's |
| `data.js` | Besluitendata |
| `styles.css` | Styling |
| `disclaimer.js` | Disclaimer-popup |
| `taakvelden_iv3.js` | Taakveld-mapping |
| `stempel.svg` | Watermark-afbeelding |
| `wassenaar_logo_fc kopie.svg` | Gemeentelogo |
| `reactie.html` | Reactiepagina |
| `werklijst-reacties.html` | Werklijst opmerkingen |
| `werklijst-sociaal-domein.html` | Werklijst sociaal domein |
| `beleidsnotas.html` | Beleidsnotas subpagina |
| `beleidsnotas.js` | Beleidsnotas logica |
| `overdrachtsdossier.html` | Overdrachtsdossier |
| `overdrachtsdossier.js` | Overdrachtsdossier logica |
| `roadmap.html` | Roadmap |
| `verbeterpunten-beheer.html` | Verbeterpunten |
| `wijzigingen.html` | Wijzigingslog |
| `beheer.html` | Beheerpagina |
| `viewer.html` | Document-viewer |
| `manifest.webmanifest` | PWA-manifest |
| `sw.js` | Service worker |
| `pwa-register.js` | PWA-registratie |
| `favicon.ico` | Favicon |
| `favicon.svg` | Favicon (SVG) |
| `favicon-32.png` | Favicon (32px) |

### Mappen (in httpdocs/)

| Map | Inhoud |
|-----|--------|
| `pwa-icons/` | 3 PNG-bestanden (icon-192, icon-512, icon-maskable-512) |
| `schrijf-wijzer/` | Schrijfwijzer HTML-bestanden |

### Niet uploaden / niet verwijderen

| Map/bestand | Reden |
|-------------|-------|
| `.well-known/` | SSL-certificaat validatie — **NOOIT verwijderen** |
| `css/`, `img/` | Argeweb standaard — mag weg zodra onze bestanden er staan |
| `test/` | Testmap — mag weg |

---

## Controle na upload

1. Open **https://beleidsbibliotheekwassenaar.nl** in een incognito-venster
2. Controleer of de homepage laadt met alle tegels
3. Klik op een tegel (bijv. H0 Bestuur) — komen de documenten?
4. Test het zoekveld
5. Test het reactieformulier ("Foutje? Meld het!")

---

## Alternatieve route (handmatig zonder zip-tool)

Als de publiceer-tool niet werkt:

1. Kopieer de bestanden lokaal met het shell-script:
   ```
   cd _2026_beleidsbibliotheek
   ./_publiceer_naar_productie.sh
   ```
2. De map `_softlaunch_wo_8_april/` bevat alle bestanden
3. Upload die via Plesk zoals hierboven beschreven

---

## Omgevingen

| Omgeving | URL | Hosting | Beheer |
|----------|-----|---------|--------|
| Ontwikkeling | localhost | Mac Dick | Cursor/VS Code |
| Acceptatie | wassenaar.besluit-wijzer.nl | Hostinger VPS | SSH |
| Productie | beleidsbibliotheekwassenaar.nl | Argeweb | Plesk |

---

## Troubleshooting

**Pagina toont oude versie:**  
→ Cmd+Shift+R (harde refresh) of incognito-venster

**Bestanden uploaden lukt niet via Plesk:**  
→ Probeer kleinere batches (10 bestanden per keer)  
→ Of gebruik de Plesk "Archief" functie: upload de hele zip en pak uit via Plesk

**SSL-fout:**  
→ Controleer of `.well-known/` niet is verwijderd  
→ Heractiveer SSL via Plesk → Websites & domeinen → SSL/TLS
