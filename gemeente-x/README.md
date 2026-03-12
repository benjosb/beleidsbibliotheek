# Gemeente X — Generieke Iv3-structuur

Generieke laag voor Besluit-wijzer op basis van Iv3 (Informatie voor Derden) taakvelden. Versie 0.1 — publicatie op besluit-wijzer.nl.

## Structuur

| Bestand | Doel |
|---------|------|
| **taakvelden_iv3.json** | 48 taakvelden in 9 hoofdstukken (Iv3-informatievoorschrift) |
| **portefeuille_naar_taakveld.json** | Mapping oude portefeuille-thema's → Iv3-taakvelden (migratie) |
| **wassenaar_begroting_mapping.json** | Iv3-taakvelden → P1–P5 programmabegroting Wassenaar |
| **scripts/taakveld_clustering.py** | Classificeert besluiten naar Iv3-taakvelden |
| **MIGRATIE.md** | Migratiestrategie en terugdraaien |

## Gebruik

```bash
# Vanuit projectroot:

# Output naar wassenaar (overschrijft wassenaar/data.js):
python3 gemeente-x/scripts/taakveld_clustering.py

# Output naar gemeente-x (voor de Iv3-standalone app):
python3 gemeente-x/scripts/taakveld_clustering.py --target gemeente-x
```

- **Input:** altijd `wassenaar/data.js` (bronbesluiten met portefeuille/domein)
- **Output wassenaar:** overschrijft `wassenaar/data.js`, werkt ook op `wassenaar/db_collegebesluiten.db`
- **Output gemeente-x:** schrijft naar `gemeente-x/data.js` (standalone Iv3-app)

## Standalone app (gemeente-x/)

- **index.html** — generieke UI, 9 BBV-hoofdstukken als tegels
- **app.js** — Iv3-logica: `getThemaKleur()`, filter op `hoofdstuk` en `taakveld_code`
- **styles.css** — kleuren per BBV-hoofdstuk (0–8)
- **data.js** — gegenereerd door `taakveld_clustering.py --target gemeente-x`

Open `gemeente-x/index.html` in een browser om de Iv3-app te bekijken.

## Wassenaar-integratie (toekomst)

- Wassenaar blijft op portefeuille-structuur (domein)
- Voor Iv3 in Wassenaar: eerst generieke gemeente-x structuur, daarna Wassenaar-specifieke mapping (P1–P5)

## Bronnen

- [Findo.nl Vraagbaak Iv3](https://www.findo.nl/content/vraagbaak-iv3-gemeenten)
- [Iv3-informatievoorschrift 2025](https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/richtlijnen/2015/10/02/iv3-informatievoorschrift-gemeenten-en-gemeenschappelijke-regelingen/iv3-informatievoorschrift-gemeenten-en-gren-2025-1-1.pdf)
- [CBS iv3_definities](https://github.com/statistiekcbs/iv3_definities)
