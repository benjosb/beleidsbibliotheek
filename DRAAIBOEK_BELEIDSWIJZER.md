# Draaiboek BeleidsWijzer

**Doel:** Een zelfstandige, deelbare HTML-applicatie die bestuurders snel inzicht geeft in gemeentelijk beleid via beleidsdossiers, AI-gegenereerde briefings en doorzoekbare besluiten.

**Resultaat:** Eén HTML-bestand (~445 KB), geen server nodig, opent in elke browser.

---

## 1. Architectuur

```
index.html          ← Ontwikkelversie (verwijst naar losse bestanden)
├── styles.css      ← Alle styling, responsive, thema-kleuren
├── data.js         ← ALL_DECISIONS_DATA + THEMA_BOOM_DATA
├── briefings.js    ← BRIEFING_HTML_DATA (6 briefingteksten als JS)
└── app.js          ← Alle interactielogica

beleidsbibliotheek_wassenaar.html  ← Alles-in-één (build-output)
```

**Geen framework, geen bundler.** Puur HTML/CSS/JS. Build = Python-script dat CSS/JS/data inline embed.

---

## 2. Databronnen & pipeline

### 2.1 Raadsbesluiten (metadata)
- **Bron:** Excel-export uit raadsinformatiesysteem (iBabs / GemeenteOplossingen)
- **Script:** `scripts/excel_to_json.py` → extraheert naam, datum, type, domein, hyperlinks
- **Output:** Onderdeel van `data.js` (variabele `ALL_DECISIONS_DATA`)

### 2.2 Collegebesluiten (metadata + volledige tekst)
- **Bron:** PDF-besluitenlijsten op gemeentewebsite (URL-patroon per vergaderdatum)
- **Script:** `scripts/download_collegebesluiten.py`
  - Scant URL-reeks om PDF's te vinden (HEAD-requests)
  - Downloadt PDF's
  - Extraheert tekst met `pdfplumber`
  - Slaat metadata + volledige tekst op in SQLite
- **Output:** `db_collegebesluiten.db` (tabel `besluiten`: id, datum, naam, tekst, thema, ...)

### 2.3 Coalitieakkoord
- **Bron:** PDF op gemeentewebsite
- **Script:** Onderdeel van `download_collegebesluiten.py`
- **Output:** Tabel `referentiedocumenten` in dezelfde database

### 2.4 Raadsbesluiten (volledige tekst) — TODO
- Bron en extractiemethode nog te bepalen (iBabs API / PDF-download)

---

## 3. Domeinclustering

### 3.1 Thema-indeling definiëren
- 6 thema's op basis van wethouderportefeuilles (aanpasbaar per gemeente)
- Elke thema: naam, portefeuillehouder, kleurcode, SVG-icoon

### 3.2 Classificatie
- **Script:** `scripts/domeinclustering.py`
- Classificeert alle besluiten via mappings:
  - `PORTEFEUILLE_MAP` (portefeuille → thema)
  - `DOMEIN_MAP` (begrotingsdomein → thema)
  - `ONDERWERP_MAP` (begrotingsonderwerp → thema)
  - `KEYWORD_MAP` (trefwoorden in besluitnaam → thema)
- Werkt zowel `data.js` als de SQLite-database bij

---

## 4. AI-briefings genereren (BEBISYN)

### 4.1 Systeemprompt opstellen
- **Bestand:** `prompts/prompt_bebisyn.md`
- Strikte bronvermelding: `[Besluit: «naam», «datum»]`
- Vaste structuur: Samenvatting → Beleidsclusters → Beleidswijzigingen → Lacunes → Bronnenlijst
- Zelfverificatie-checklist voor de LLM

### 4.2 Prompt per thema genereren
- **Script:** `scripts/genereer_bebisyn_prompt.py`
- Combineert systeemprompt + coalitieakkoord + alle besluiten van dat thema
- Output: `prompts/prompt_<thema>.txt` — direct invoerbaar in LLM

### 4.3 Briefing genereren
- Voer de prompt in een LLM (Claude/GPT-4) → krijg HTML-briefing terug
- Sla op als `briefings/briefing_<thema>.html`

### 4.4 Briefings embedden
- Kopieer alle briefing-HTML naar `briefings.js` als JS-variabele `BRIEFING_HTML_DATA`
- Hiermee werkt de app lokaal (geen CORS-probleem met file://)

---

## 5. Frontend bouwen

### 5.1 UI-concept: "Dossier-first"
- Startpagina: 6 kleurrijke dossierkaarten met preview-tekst
- Klik → briefing (synthese) als primaire content
- Onderliggende besluiten in uitklapbare `<details>` sectie
- Referenties in briefing zijn klikbaar → scrolt naar bijbehorend besluit
- Globale zoekfunctie met jaar/type/sorteerfilters

### 5.2 Responsive design
- CSS Grid: 3 kolommen → 2 → 1 afhankelijk van scherm
- Touch-targets geoptimaliseerd voor mobiel
- Viewport meta tag

### 5.3 Verborgen features
- Dubbelklik op versienummer → toont begrotingsdata per dossier (easter egg)

---

## 6. Build & publicatie

### 6.1 Build-commando (Python one-liner)
```python
# Leest index.html, vervangt <link>/<script> tags door inline content
# Output: beleidsbibliotheek_wassenaar.html (één bestand, ~445 KB)
```

### 6.2 Delen
- Direct als HTML-bestand via e-mail/Teams/chat
- Of als .zip als e-mailclient HTML sanitiseert
- Geen hosting nodig — opent vanuit elke map op elk apparaat

---

## 7. Herhalen voor andere gemeente

### Benodigde input
1. **Excel-export raadsbesluiten** (naam, datum, type, domein, link)
2. **URL-patroon college-besluitenlijsten** (PDF's op gemeentewebsite)
3. **Coalitieakkoord** (PDF)
4. **Wethouderportefeuilles** → bepaalt de 6-7 thema's
5. **Gemeentelijk logo** (SVG bij voorkeur)
6. **Begrotingsplaatje** (optioneel, voor financiële laag)

### Stappen
1. Pas URL-patronen aan in `download_collegebesluiten.py`
2. Pas thema-definitie en mappings aan in `domeinclustering.py`
3. Draai data-pipeline: download → extract → classificeer
4. Genereer briefing-prompts en laat LLM draaien
5. Embed briefings, pas logo/kleuren aan
6. Build → één HTML-bestand → klaar

---

## 8. Bestandsoverzicht

```
├── index.html                          # Ontwikkelversie
├── styles.css                          # CSS
├── app.js                              # JavaScript
├── data.js                             # Besluitendata + themaboom
├── briefings.js                        # Briefing-HTML als JS
├── beleidsbibliotheek_wassenaar.html   # Build-output (alles-in-één)
├── beleidsbibliotheek_wassenaar.zip    # Zipversie voor e-mail
├── db_collegebesluiten.db              # SQLite database
├── briefings/
│   └── briefing_<thema>.html           # 6 losse briefingteksten
├── prompts/
│   ├── prompt_bebisyn.md               # Systeemprompt voor LLM
│   └── prompt_<thema>.txt              # Gegenereerde prompts per thema
├── scripts/
│   ├── download_collegebesluiten.py    # PDF download + extractie
│   ├── domeinclustering.py             # Thema-classificatie
│   ├── excel_to_json.py                # Excel → data.js
│   └── genereer_bebisyn_prompt.py      # Promptgeneratie per thema
└── DRAAIBOEK_BELEIDSWIJZER.md          # Dit document
```

---

## 9. Afhankelijkheden

- **Python 3.8+** met: `pdfplumber`, `requests`, `openpyxl`, `sqlite3` (standaard)
- **LLM-toegang** (Claude / GPT-4) voor briefing-generatie
- **Browser** (elke moderne browser voor de app zelf)
- Geen server, geen database-server, geen framework
