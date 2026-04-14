# Mutatierapport — BeleidsBibliotheek Wassenaar (7–8 april 2026)

**Datum:** 7 april 2026 (avond) – 8 april 2026 (nacht)  
**Versie:** 8.0.5 → 8.0.6  
**Gedeployed naar:** acceptatie (wassenaar.besluit-wijzer.nl) + productie (beleidswijzer-wassenaar.nl)  
**Backup:** `wassenaar/backups/v8.0.6_pre_voorstellen_verwerking_20260407/` (vóór voorstellen-merge)  
**Backup:** `wassenaar/backups/v8.0.6_20260408/` (snapshot ná alle wijzigingen)

---

## 1. UI / navigatie

| # | Wijziging | Bestand(en) |
|---|-----------|-------------|
| 1.1 | **Stempel (watermark)** verplaatst van linksboven naar **midden-boven**; voorkomt overlap met navigatiemenu bij lagere schermresoluties | `index.html`, `styles.css` |
| 1.2 | **"BeleidsBibliotheek" menu-item** werkt nu als **homebutton** op alle pagina's (link naar `index.html#dossierOverzicht`) | `index.html` |
| 1.3 | **Introductietekst** verplaatst van **onder** de hoofdstuktegels naar **boven** de tegels — logischere leesrichting | `index.html` |
| 1.4 | **Zoekveld** verplaatst naar **in de groene navigatiebalk** — wint een schermregel; alle tegels zichtbaar op de homepage | `index.html`, `styles.css` |
| 1.5 | **Klikbare link** van "een aparte webpagina waar u alle bestuurlijke stukken kunt vinden" naar `wassenaar.nl/bestuur` (was voorheen platte tekst + losse URL) | `index.html` |
| 1.6 | **Extra verticale ruimte** tussen introductietekst en hoofdstuktegels | `styles.css` |

---

## 2. Reactiepaneel ("Foutje gezien? Meld het!")

| # | Wijziging | Bestand(en) |
|---|-----------|-------------|
| 2.1 | **Twee dropdowns** in plaats van één: automatisch gedetecteerd **Hoofdstuk** + automatisch gedetecteerd **Taakveld** | `index.html` |
| 2.2 | **Automatische detectie** van huidig Hoofdstuk en Taakveld op basis van actieve pagina/sectie | `index.html` (inline JS) |
| 2.3 | **Introductietekst** uit reactiepaneel verwijderd (meer ruimte) | `index.html` |
| 2.4 | **E-mailontvangers** bijgewerkt: `ehiep@wassenaar.nl`, `mheijting@wassenaar.nl`, `dickbraam@me.com`, `dbraam@wassenaar.nl` | `index.html` |
| 2.5 | **Bevestigingsmelding** na verzenden + automatisch sluiten van het reactiepaneel (of handmatig via klik) | `index.html` |
| 2.6 | **Link naar werklijst-reacties** opgenomen in de body van uitgaande e-mails | `index.html` |

---

## 3. Nieuwe pagina's / verwijderingen

| # | Wijziging | Bestand(en) |
|---|-----------|-------------|
| 3.1 | **`werklijst-reacties.html`** aangemaakt — verborgen pagina waar gemelde opmerkingen worden verzameld | nieuw bestand |
| 3.2 | **"Document voorstellen"-knop** volledig verwijderd (inclusief API-aanroep en submitfunctie) — wordt later in acceptatieomgeving herintroduceerd | `index.html`, `app.js` |

---

## 4. Zoekfunctionaliteit

| # | Wijziging | Bestand(en) |
|---|-----------|-------------|
| 4.1 | **Zoekbereik uitgebreid**: naast beleidsnota's worden nu ook **Besluiten** uit `data.js` doorzocht (bijv. "financiële verordening" geeft nu wél resultaten) | `app.js` |

---

## 5. Persoonsgegevens

| # | Wijziging | Bestand(en) |
|---|-----------|-------------|
| 5.1 | **Persoonsnamen verwijderd** uit de Verantwoording-sectie en contactfooters; vervangen door rolomschrijvingen | `index.html` |

---

## 6. Data-merge: Kamahls API-voorstellen (grootste wijziging)

### Achtergrond
Collega Kamahl Kivits heeft via de "Document voorstellen"-functionaliteit (POST naar `api.besluit-wijzer.nl`) in totaal **157 beleidsnota's** ingediend. Deze verschenen dynamisch als "Bijdrage — Toegevoegd apr 2026" op de acceptatieomgeving.

### Verwerking
- **145 nieuwe items** zijn permanent verwerkt (hardcoded) in `BELEIDSNOTA_PER_TAAKVELD` in `app.js`
- **12 items** waren duplicaten (al aanwezig op basis van `naam|link`-sleutel) en zijn overgeslagen
- **10 extra kopieën** zijn bijgeplaatst op cross-taakveld locaties om deduplicatie per scope correct te laten werken
- **2 items** zonder taakveld zijn toegevoegd aan `BELEIDSNOTA_PER_HOOFDSTUK_BBV`

### Handmatige toevoeging
- **Nota Hogere Waarden Wegverkeerslawaai Wassenaar 2024** — kon Kamahl niet indienen (rate limit). Handmatig toegevoegd aan TV 7.4 met link `https://lokaleregelgeving.overheid.nl/CVDR725232/1`

### API-afhankelijkheid verwijderd
- De gehele `fetchGoedgekeurdeVoorstellen()`-functie, `submitVoorstel()`-functie en gerelateerde API-code zijn verwijderd uit `app.js`
- Op productie worden geen API-calls meer gedaan; alle data is statisch

### Kamahls e-mail — correctielijst (22 items)

| # | Item | Taakveld | Status |
|---|------|----------|--------|
| 1–9 | Belastingverordeningen 2026 (OZB, precario, honden, leges, retributie, marktgeld, toeristenbelasting, rioolheffing, afvalstoffenheffing) | 0.6 | Verwerkt via API-merge |
| 10 | Regiovisie Haaglanden | 1.2 | Verwerkt via API-merge |
| 11 | Integraal veiligheidsbeleid | 1.2 | Verwerkt via API-merge |
| 12 | APV 2024 | 1.2 | Verwerkt via API-merge |
| 13 | Verordening cliëntenraad Wet werk en bijstand | 6.1 | Verwerkt via API-merge |
| 14 | Verordening kwijtschelding | 6.3 | Verwerkt via API-merge |
| 15 | Parkeerverordening | 2.1 | Verwerkt via API-merge |
| 16 | Beleidsplan re-integratie en participatie | 6.3–6.5 | Verwerkt via API-merge |
| 17–20 | Oranje items (door Mechteld/Kamahl aangemaakt) | 6.60–6.91 | Verwerkt via API-merge |
| 21 | Afvalstoffenverordening | 7.3 | Verwerkt via API-merge |
| 22 | Nota bodembeheer | 7.4 | Verwerkt via API-merge |
| — | Nota Hogere Waarden Wegverkeerslawaai 2024 (rate-limit) | 7.4 | Handmatig toegevoegd |

### Open punt
- **Thema 8.0** — Kamahl noemde dat dit nog moest. Dit is een inhoudelijke/structurele toevoeging, geen correctie. Uitgesteld naar volgende iteratie.

---

## 7. Gewijzigde bestanden (samenvatting)

| Bestand | Aard wijziging |
|---------|---------------|
| `index.html` | Stempel, navigatie, zoek, intro, reactiepaneel, compliance, persoonsgegevens, cache-bust |
| `app.js` | 157+ beleidsnota's hardcoded, API-code verwijderd, zoekbereik uitgebreid (3161 → 3324 regels) |
| `styles.css` | Stempel positie, zoekbalk in header, spacing |
| `reactie.html` | Standalone reactiepagina |
| `werklijst-reacties.html` | Nieuw: verzamellijst gemelde opmerkingen |

---

## 8. Omgevingen

| Omgeving | URL | Status |
|----------|-----|--------|
| Ontwikkeling | localhost (Mac) | Bronbestanden bijgewerkt |
| Acceptatie | wassenaar.besluit-wijzer.nl | Gedeployed 7 apr 21:48 |
| Productie | beleidswijzer-wassenaar.nl (Argeweb) | Gedeployed door gebruiker op 8 apr |

---

## 9. Verificatie

- `node -c app.js` → syntax OK
- Spotcheck op acceptatie: geen "groene" (API-)duplicaten meer zichtbaar
- Cache-bust: `app.js?v=20260407merge2`, `styles.css?v=20260407f`
