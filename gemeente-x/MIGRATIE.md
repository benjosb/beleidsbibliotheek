# Migratiestrategie: domein → taakveld (Iv3)

## Doel

Overgang van portefeuille-gebaseerde indeling (6 thema's) naar Iv3-taakvelden (48 taakvelden, 9 hoofdstukken) zonder dataverlies.

## Strategie

### 1. Beide velden behouden

- **domein** — blijft bestaan (originele waarde uit iBabs/OB of laatste portefeuille-classificatie)
- **taakveld** — nieuwe Iv3-taakveldnaam (bijv. "Ruimte en leefomgeving")
- **taakveld_code** — Iv3-code (bijv. "8.1")

### 2. Classificatie

`taakveld_clustering.py` classificeert elk besluit naar een Iv3-taakveld op basis van:

1. Override (bijv. omgevingsvergunning → 8.1)
2. Onderwerp begroting
3. Portefeuille (voor bestaande data)
4. Domein (oude iBabs-indeling)
5. Trefwoorden in naam/besluit
6. Fallback: 0.1 Bestuur

### 3. Frontend

- **getThemaKey(d)** — retourneert `taakveld_code + " " + taakveld` indien aanwezig, anders `domein`
- **THEMA_BOOM_DATA** — nu op basis van taakvelden (naam = "8.1 Ruimte en leefomgeving")
- **BEGROTING_TAAKVELD** — mapping taakveld → P1–P5 (Wassenaar)

### 4. Backward compatibility

- Data zonder `taakveld`/`taakveld_code` valt terug op `domein`
- Oude portefeuille-namen blijven in BEGROTING_DATA voor legacy
- Briefings (per portefeuille) laden nog steeds; taakveld-specifieke briefings komen later

## Uitvoeren

```bash
python3 gemeente-x/scripts/taakveld_clustering.py
```

Dit werkt op `wassenaar/data.js` en `wassenaar/db_collegebesluiten.db` (indien aanwezig).

## Terugdraaien

Om terug te gaan naar portefeuille-structuur:

```bash
cd wassenaar && python3 scripts/domeinclustering.py
```

De velden `taakveld` en `taakveld_code` blijven in data.js staan maar worden genegeerd door de oude app.
