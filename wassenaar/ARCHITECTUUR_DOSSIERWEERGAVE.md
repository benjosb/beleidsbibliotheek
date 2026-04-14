# Architectuur Dossierweergave — BeleidsBibliotheek Wassenaar

> Versie: 6.1.0 · Datum: 26 maart 2026

## Overzicht

De BeleidsBibliotheek presenteert gemeentelijk beleid volgens de BBV-hoofdstukindeling (0–8). Elk hoofdstuk kent twee weergaveniveaus: de **moedertegel** (hoofdstuk) en de **kindtegels** (taakvelden).

---

## 1. Moedertegel (hoofdstukniveau)

Wordt getoond bij het openen van een BBV-hoofdstuk (bijv. "8. Volkshuisvesting, leefomgeving en stedelijke vernieuwing").

### Componenten

| Component | Bron | Omschrijving |
|-----------|------|--------------|
| OD-samenvatting | `OD_SAMENVATTING_PER_BBV[n]` | Samenvattende tekst uit het overdrachtsdossier raadsverkiezingen 2026 |
| Beleidsnota's en beleidsdocumenten | `BELEIDSNOTA_PER_HOOFDSTUK_BBV[n]` | Strategische, overkoepelende documenten: visies, beleidsplannen, kadernota's |

### Selectiecriteria moedertegel

Op de moedertegel staan uitsluitend:
- Visies en strategische beleidsplannen
- Kadernota's en begrotingen (BBV 0)
- Overkoepelende beleidsnota's die meerdere taakvelden raken

Voorbeelden: Omgevingsvisie, Nota Woonbeleid, Woonvisie, Beheervisie Openbare Ruimte, Beleidsplan Sociaal Domein.

---

## 2. Kindtegel (taakveldniveau)

Wordt getoond bij het selecteren van een specifiek taakveld (bijv. "8.1 Ruimte en leefomgeving").

### Gedrag bij activering

1. OD-samenvatting **verdwijnt** (`bbvHoofdstukSamenvatting` → `display: none`)
2. Taakveld-context **verschijnt** (Iv3-omschrijving)
3. Beleidsnota's tonen **alleen** items van het geselecteerde taakveld (`BELEIDSNOTA_PER_TAAKVELD['n.x']`)

### Selectiecriteria kindtegel

Op de kindtegel staan:
- Verordeningen
- Beleidsregels
- Raadsbesluiten (niet-operationeel)
- Zienswijzen en GR-wijzigingen
- Rekenkamerrapporten
- Startnotities en visies die specifiek bij één taakveld horen

**Niet** op de kindtegel:
- Individuele bestemmingsplanbesluiten
- Individuele vergunningen en beschikkingen
- Operationele procesbesluiten

---

## 3. Navigatie

| Actie | Resultaat |
|-------|----------|
| Klik op moedertegel | Opent hoofdstuk: OD-samenvatting + strategische nota's |
| Klik op kindtegel | Selecteert taakveld: specifieke nota's, OD verdwijnt |
| Klik op dezelfde kindtegel | Deselecteert: terug naar moedertegel-weergave |
| Klik op hoofdstuktitel | Reset subFilter: terug naar moedertegel-weergave |
| Klik op "← Terug" | Terug naar het overzicht met alle 9 hoofdstukken |

---

## 4. Datastructuren (app.js)

```
OD_SAMENVATTING_PER_BBV[n]              → HTML-tekst overdrachtsdossier
BELEIDSNOTA_PER_HOOFDSTUK_BBV[n]        → Strategische documenten (moedertegel)
BELEIDSNOTA_PER_TAAKVELD['n.x']         → Specifieke documenten (kindtegel)
BBV_TAAKVELDEN_PER_HOOFDSTUK[n]         → Definitie taakvelden per hoofdstuk
BBV_HOOFDSTUK_META[n]                   → Icoon en ondertitel per hoofdstuk
```

### Object-structuur beleidsnota

```javascript
{
    naam: 'Titel van het document',
    datum: '2025-10-14',                    // optioneel
    link: 'https://...',                    // iBabs of andere bron; null als onbekend
    type: 'Beleidsnota',                    // vrij veld: Verordening, Visie, Raadsbesluit, etc.
    toelichting: 'Korte context'            // optioneel
}
```

---

## 5. Brondata

| Bron | Gebruik |
|------|---------|
| Overdrachtsdossier raadsverkiezingen 2026 | OD-samenvattingen, strategische context |
| `Beleidsbibliotheek_eh_tot2025.xlsx` (controller) | 285 beleidsnota's met BBV-taakveldtoewijzing |
| `data.js` (iBabs-scrape) | Raads- en collegebesluiten met werkende hyperlinks |
| Officiële Bekendmakingen (SRU-API) | Aanvullende publicaties en verordeningen |

### Matching-procedure Excel → iBabs

1. Fuzzy matching op naam (keyword-overlap + stopwoordfilter)
2. Datumproximiteit als bonus
3. Fallback voor pre-2022 items: agenda-link → kalenderniveau-link
4. Resultaten opgeslagen in `scripts/h8_matching.json` (per hoofdstuk)

---

## 6. Principes

1. **Strategisch = moedertegel, specifiek = kindtegel**
2. **Dubbelingen toegestaan** — bij twijfel in beide categorieën
3. **Geen operationele vervuiling** — geen bestemmingsplanbesluiten op kindtegels
4. **Excel controller is leidend** voor taakveldtoewijzing
5. **Links moeten werken** — fallback naar agenda/kalender als document-link ontbreekt
6. **Titel**: "Beleidsnota's en beleidsdocumenten" (niet "losse stukken")
