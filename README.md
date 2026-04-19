# Beleidsbibliotheek Wassenaar

**Versie:** 1.0.0

Een zoekbare interface voor vastgesteld gemeentelijk beleid (raadsbesluiten en collegebesluiten).

## Voortgang & samenwerking (Cursor)

- **Vaste resume:** [`STATUS.md`](./STATUS.md) in de **repo-root** — daar staat wat er speelt en wat de volgende stap is.
- **Nieuwe chat:** begin met `@STATUS.md` of de korte instructie **bovenaan** `STATUS.md` (kop *Start instructie*). Het model heeft geen geheugen tussen chats; dat bestand is het enige afgesproken checkpoint.

## Opzet

Deze applicatie combineert:
- **Raadsbesluiten** (uit Excel-bestand, verrijkt met metadata)
- **Collegebesluiten (B&W)** (geëxtraheerd uit PDF's van wassenaar.nl)

## Structuur

```
_2026_beleidsbibliotheek/
├── index.html          # Hoofdpagina
├── styles.css          # Styling
├── app.js              # JavaScript functionaliteit
├── data/               # JSON data bestanden
│   ├── raadsbesluiten_2025.json
│   ├── collegebesluiten_2025.json
│   └── thema_boom.json
├── pdfs/               # Gedownloade PDF's (optioneel)
└── scripts/            # Python scripts voor dataverwerking
    ├── excel_to_json.py
    ├── pdf_to_json.py
    └── update_thema_boom.py
```

## Gebruik

### Data voorbereiden (eenmalig)

1. **Excel naar JSON** (raadsbesluiten):
   ```bash
   python3 scripts/excel_to_json.py
   ```

2. **PDF's downloaden en parsen** (collegebesluiten):
   ```bash
   python3 scripts/pdf_to_json.py
   ```

3. **Themaboom updaten**:
   ```bash
   python3 scripts/update_thema_boom.py
   ```

4. **JSON naar JavaScript converteren** (voor statische HTML):
   ```bash
   python3 scripts/json_to_js.py
   ```

### Applicatie gebruiken

**Optie 1: Direct openen (aanbevolen!)**
- Dubbelklik op `index.html` of sleep het bestand naar je browser
- Werkt volledig offline, geen server nodig!
- Perfect om te delen met collega's (gewoon de hele map delen)

**Optie 2: Met lokale webserver** (optioneel)
```bash
# Python 3
python3 -m http.server 8000

# Of met Node.js
npx http-server
```

Open dan http://localhost:8000 in je browser.

**Optie 3: Docker** (als je Docker wilt gebruiken)
```bash
docker run -d -p 8080:80 -v "$(pwd)":/usr/share/nginx/html nginx
```
Open dan http://localhost:8080

## Functionaliteiten

- **Zoeken**: Vrije tekstzoeken door alle besluiten
- **Filteren**: Op jaar, type besluit (raad/college), datum
- **Themanavigatie**: Boomstructuur per domein en onderwerp
- **Sorteren**: Op datum of naam
- **Directe links**: Naar originele documenten

## Toekomstige uitbreidingen

- Meerdere jaren (2024, 2023, etc.)
- Raadsinformatiebrieven (RIB's)
- Betere PDF-parsing met AI-classificatie
- Export functionaliteit

## Versie

Het versienummer staat in het bestand `VERSION` en in de footer van de applicatie. Bij een release: pas `VERSION` en de footer in `index.html` aan.

## GitHub

Dit project heeft een eigen Git-repository (in deze map). Om met GitHub te werken:

### Eerste keer: koppelen aan GitHub

1. **Maak een nieuwe repository op GitHub**
   - Ga naar [github.com/new](https://github.com/new)
   - Naam bijv. `beleidsbibliotheek-wassenaar`
   - Kies Public, geen README/license toevoegen (die bestaan al lokaal)

2. **Koppel je lokale map en push**
   ```bash
   cd "_2026_beleidsbibliotheek"   # of het volledige pad naar deze map
   git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/beleidsbibliotheek-wassenaar.git
   git branch -M main
   git push -u origin main
   ```

### Daarna: wijzigingen doorvoeren

```bash
git add .
git commit -m "Korte beschrijving van de wijziging"
git push
```

### Clone (op een andere pc of door een collega)

```bash
git clone https://github.com/JOUW-GEBRUIKERSNAAM/beleidsbibliotheek-wassenaar.git
cd beleidsbibliotheek-wassenaar
# Open index.html in de browser
```

## Documentatie (operatie & compliance)

- **`docs/ACCEPTATIE_TEST_EN_BACKOFFICE_CISO.md`** — acceptatietestchecklist, uitleg voor backoffice en samenvatting voor CISO (website + API + e-mailketen).

## Disclaimer

De data is door AI in samenhang gebracht. Gebruikers zijn zelf verantwoordelijk voor het toetsen van informatie in de originele documenten.
