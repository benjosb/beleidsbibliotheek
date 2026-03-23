# Overdrachtsdossier raadsverkiezingen 2026 — Extractie

Computerleesbare extractie van `overdracht voor check.docx` voor gebruik als **kapstok** in de Beleidsbibliotheek.

## Toegang tot alle onderdelen

| Onderdeel | Toegang | Opmerking |
|-----------|---------|-----------|
| **Tekst** | ✅ Volledig | `overdracht_raadsverkiezingen_2026.md` |
| **Tabellen** | ✅ 13 stuks | In documentvolgorde in de Markdown |
| **Afbeeldingen** | ✅ 91 stuks | `media/` — jpeg, png, tiff, svg |
| **Structuur** | ✅ | `overdracht_kapstok.json` |

## Afbeeldingen

- **91 bestanden** in `media/` (image1.png t/m image91.jpeg)
- Formaten: JPEG, PNG, TIFF, SVG
- **Kan geanalyseerd worden:** ja — afbeeldingen zijn leesbaar (grafieken, diagrammen, iconen)
- **Positie in document:** de exacte plek van elke afbeelding in de tekst is niet geëxtraheerd; ze staan wel in dezelfde volgorde als in het Word-document (via document.xml.rels)

## Bestanden

```
overdracht_extract/
├── overdracht_raadsverkiezingen_2026.md   # Volledige tekst + tabellen (Markdown)
├── overdracht_kapstok.json                # Metadata, inhoudsopgave, afbeeldingenlijst
├── media/                                 # 91 afbeeldingen
└── README.md                              # Dit bestand
```

## Opnieuw extraheren

```bash
python3 scripts/extract_overdracht_docx.py
```

Vereist: `python-docx`, en dat `docx_extract/` bestaat (uitgepakt docx).

## Gebruik als kapstok

De Markdown en JSON kunnen dienen als:

- **Structuur** voor de Beleidsbibliotheek (hoofdstukken 1–11, bijlagen)
- **Zoekbare tekst** voor koppeling aan beleidsstukken
- **Referentie** voor de LTA (Langetermijnagenda) en projecten
