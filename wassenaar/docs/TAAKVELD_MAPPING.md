# Taakveld-mapping: kwaliteitsdocument

*Versie 1.3 — 25 maart 2026*
*Auteur: Dev Team BeleidsBibliotheek (WIL)*
*Doel: referentiedocument voor de koppeling van besluiten aan BBV-taakvelden*

---

## 1. Doel en context

### Wat willen we bereiken?

De BeleidsBibliotheek maakt gemeentelijke besluiten **vindbaar**. Tot nu toe zijn besluiten
gekoppeld aan BBV-*hoofdstukken* (0–8). Dat is te grof: hoofdstuk 8 ("VHROSV") bevat
4.566 besluiten die gaan over alles van kapvergunningen tot omgevingsvisies.

Door besluiten te koppelen aan **BBV-taakvelden** (bijv. 8.3 "Wonen en bouwen", 7.3 "Afval")
wordt de informatie specifiek, filteerbaar en bruikbaar voor bestuurders, raadsleden en ambtenaren.

### Uitgangspunten

1. **Liever te veel dan te weinig** — een besluit mag aan meerdere taakvelden gekoppeld zijn.
   Een fout-positief is minder erg dan een gemist besluit.
2. **Hoofdstuk-niveau blijft** — besluiten zonder taakveld-match (algemene/strategische stukken)
   blijven zichtbaar op hoofdstuk-niveau. Deze zijn juist vaak het belangrijkst.
3. **Traceerbaarheid** — de koppeling is reproduceerbaar via keyword-matching. Elke match
   is controleerbaar en desnoods terug te draaien.
4. **Preprocessed** — matching wordt eenmalig gedaan bij data-update, niet bij elke page-load.

---

## 2. De database

### 2.1 Omvang en bronnen

| Bron | Systeem | Aantal (v1) | Na opschoning | Kenmerken |
|------|---------|-------------|---------------|-----------|
| Collegebesluiten | iBabs | 2.376 | **1.990** | Compact: alleen besluit, geen onderliggende stukken. Veld `naam` + korte `besluit`. Geen individuele `link`. |
| Raadsbesluiten | iBabs | 416 | **416** | Besluittekst + link naar onderliggende documenten. |
| College + overig | Officiële Bekendmakingen | 4.994 | **4.973** | Formele publicaties (GMB). Uniek `identifier`. |
| **Totaal** | | **7.786** | **7.379** | |

> **Opschoning 25 maart 2026**: 407 items verwijderd, 62 gerepareerd. Zie §6.

### 2.2 Hiërarchie van bronnen

```
Officiële Bekendmakingen (formeel, juridisch bindend)
  └── meeste metadata: subject-classificatie (29 categorieën KOOP),
      type, identifier, pdf_url, link
      Zwakte: besluittekst ontbreekt vaak in data.js

Raadsbesluiten iBabs (democratisch gelegitimeerd)
  └── besluittekst aanwezig, link naar onderliggende stukken
      Sterkste bron voor keyword-matching
      Zwakte: klein aantal (416)

Collegebesluiten iBabs (uitvoerend)
  └── meest voorkomend, compact
      Zwakte: korte teksten, geen onderliggende stukken
```

### 2.3 Veldstructuur per besluit

| Veld | Altijd aanwezig | Beschrijving |
|------|-----------------|--------------|
| `naam` | Ja | Titel / onderwerp |
| `besluit` | Ja (vaak leeg) | Besluittekst (68% niet-leeg) |
| `datum` | Ja | ISO-datum (YYYY-MM-DD) |
| `bron` | Ja | `"college"` of `"raad"` |
| `bron_systeem` | Ja | `"iBabs"` of `"Officiële Bekendmakingen"` |
| `type_besluit` | Ja | 21 categorieën (top: Omgevingsvergunning 4.009, Collegebesluit 2.376, Raadsbesluit 416) |
| `domein` | Ja | Portefeuille-thema (6 waarden) |
| `link` | Deels | URL naar bron (OB + raad: ja, college-iBabs: nee) |
| `identifier` | Alleen OB | GMB-identifier (bijv. `gmb-2025-551355`) |
| `pdf_url` | Deels | URL naar PDF |
| `jaar` | Alleen iBabs | Jaar als getal |
| `agendapunt` | Alleen college-iBabs | Agendapuntnummer |
| `portefeuille` | Deels | Portefeuille-toewijzing (vaak `null` of `""`) |
| `juridische_classificatie` | 73 raadsbesluiten | Bijv. "Besluit van Algemene Strekking (BaS)" |
| `onderwerp_begroting` | 73 raadsbesluiten | Bijv. "Verkeer" |

### 2.4 OB Metadata (nieuw opgehaald)

Via de SRU API van officielebekendmakingen.nl zijn **13.513 records** opgehaald voor Wassenaar.
Alle 4.994 OB-items in data.js zijn 100% gematcht.

Waardevolle extra velden per OB-publicatie:

| Veld | Beschrijving | Voorbeeld |
|------|--------------|-----------|
| `subject` | KOOP thema-classificatie | "Financiën \| Organisatie en beleid" |
| `type` | Publicatietype | "evenementenvergunning", "verordening" |
| `source` | Juridische grondslag | "artikel 1:3 Algemene subsidieverordening" |
| `alternative` | Alternatieve titel | Soms afwijkend van `naam` |

**Subject-verdeling** van de 4.994 OB-items in onze database:

| Subject | Aantal | % |
|---------|--------|---|
| Recht \| Organisatie en beleid | 4.108 | 82,3% |
| Recht \| Burgerlijk recht | 297 | 5,9% |
| Verkeer \| Organisatie en beleid | 132 | 2,6% |
| Natuur en milieu \| Organisatie en beleid | 116 | 2,3% |
| Bestuur \| Organisatie en beleid | 115 | 2,3% |
| Financiën \| Organisatie en beleid | 98 | 2,0% |
| Openbare orde en veiligheid \| Organisatie en beleid | 53 | 1,1% |
| Overig (8 categorieën) | 75 | 1,5% |

---

## 3. Huidige classificatie (VOOR)

### Wat er nu is

Besluiten zijn geclassificeerd in **6 portefeuille-domeinen**:

| Domein | Aantal | BBV-hoofdstuk |
|--------|--------|---------------|
| Ruimte, Duurzaamheid & Mobiliteit | 4.566 | 8 |
| Bestuur & Veiligheid | 2.332 | 0 |
| Financiën, Economie & Sport | 350 | 3 |
| Sociaal Domein, Wonen & Onderwijs | 249 | 6 |
| Bedrijfsvoering | 198 | 0 |
| Cultuur & Welzijn | 91 | 5 |

### Problemen

1. **Te grof** — 4.566 besluiten onder één hoofdstuk (8) is niet vindbaar.
2. **Onvolledige mapping** — hoofdstukken 1, 2, 4, 7 hebben **0 besluiten** via portefeuille-mapping,
   terwijl er via taakveld-keywords honderden matches zijn.
3. **BBV taakveld-filter werkt niet** — de code vergelijkt portefeuille-naam met Iv3-code (`d.domein === subFilter`).
4. **Portefeuille ≠ BBV** — de portefeuille-indeling volgt het college; de BBV-indeling volgt het Rijk.

---

## 4. Nieuwe classificatie (NA)

### Matchingmethode

Case-insensitive substring-matching op `naam` + `besluit` + OB-metadata (`subject`, `alternative`, `source`).
Identiek aan de bestaande `matchSubthema()` functie in `app.js`.

Keywords komen uit `taakvelden_iv3.js`: **654 keywords** verdeeld over **42 taakvelden**
(waarvan 2 clusters: Belastingen en Fin. beheer).

### Resultaat

Elke besluit krijgt:
- `taakvelden`: array van matchende taakveld-codes (bijv. `["2.1", "0.6 - 0.9"]`)
- `matched_kw`: object met per taakveld de matchende keywords (voor highlighting)

Besluiten zonder match (`taakvelden: []`) blijven zichtbaar op hoofdstuk-niveau als "Overig".

---

## 5. Database-audit en opschoning

### 5.0 Aanleiding

Bij inspectie van de iBabs-data bleek dat de scraper niet alleen besluiten maar ook
**procedurele agenda-items** en **tekstfragmenten** had opgeslagen. Dit vervuilde de database
en verlaagde de effectiviteit van de taakveld-matching.

### 5.1 Bevindingen

**Probleem 1 — Procedurele agenda-items (208 stuks)**
Items als "Schorsing" (76x), "Hamerstukken" (64x), "Sluiting" (35x), "Rondvraag" (16x),
"Opening" (3x), "Einde vergadering" (12x). Dit zijn geen besluiten maar standaard-
agendapunten van raads- en collegevergaderingen.

**Probleem 2 — Huishoudelijke college-items (115 stuks)**
"Uitnodigingenlijst/Afwezigheidsoverzicht" (75x), "Besluitenlijst Openbaar B&W-vergadering..."
(40x). Meta-items over de vergadering zelf, niet over beleid.

**Probleem 3 — Tekstfragmenten als titel (113 stuks)**
De scraper heeft soms zinnen opgeknipt. Voorbeelden:
- `"vast te stellen."` — staart van een besluit-zin, niet de titel
- `"(bijlage 2);"` — verwijzing midden in een tekst
- `"en 2024."` / `"000 voor 2026."` — afgebroken getallen
- `"Besluit:"` / `"Raad:"` — kopjes uit de besluitenlijst
- `"Bestuur en middelen"` — commissienaam, geen besluit

**Probleem 4 — Kennisname-items zonder inhoud (11 stuks)**
"Regionale samenwerking" met als enige tekst "College neemt kennis van de annotaties."
Vaste staande agenda-items zonder besluitkracht.

**Probleem 5 — Duplicaten (22 stuks)**
Items met identieke naam+datum combinatie, zowel binnen OB als binnen iBabs.

**Probleem 6 — College-items zonder link (alle 1.990)**
Geen enkel college-item uit iBabs heeft een werkende `link` naar het brondocument.
Dit is een beperking van de scraper, niet oplosbaar via opschoning.

**Probleem 7 — Raadsbesluiten 2022-2024 zonder tekst**
73% van de raadsbesluiten uit 2022-2024 mist de besluittekst. Alleen 2025 is 100% compleet.

**Probleem 8 — Portefeuille vrijwel nooit ingevuld**
91% van de college-items (2.164/2.376) heeft geen portefeuille-toewijzing.

### 5.2 Uitgevoerde opschoning

Script: `wassenaar/scripts/cleanup_data.js` (met automatische backup naar `data.js.bak`).

| Categorie | Actie | Aantal |
|-----------|-------|--------|
| Procedureel (Schorsing, Hamerstukken, etc.) | Verwijderd | 208 |
| Huishoudelijk (Besluitenlijst, Uitnodigingen) | Verwijderd | 115 |
| Fragmenten (onherstelbaar) | Verwijderd | 51 |
| Regionale samenwerking (kennisname-only) | Verwijderd | 11 |
| Duplicaten (naam+datum) | Verwijderd | 22 |
| Fragmenten met inhoudelijke besluittekst | **Gerepareerd** (naam hersteld) | 62 |
| **TOTAAL** | | **407 verwijderd, 62 gerepareerd** |

Resultaat: **7.786 → 7.379 items**

### 5.3 Niet-oplosbare beperkingen

De volgende problemen zijn vastgesteld maar vereisen een nieuwe scrape-run, niet opschoning:

1. **Geen links bij college-items** — de scraper heeft geen individuele document-URLs opgeslagen
2. **Ontbrekende besluittekst 2022-2024** — oudere raadsbesluiten moeten opnieuw worden opgehaald
3. **Portefeuille niet ingevuld** — veld is grotendeels leeg in de brondata

---

## 6. Kwaliteitsanalyse

### 6.1 Iteratiegeschiedenis

Er zijn vier versies van de keyword-matching gedraaid:

| Metriek | v1 (origineel) | v2 (na keyword-fix) | v3 (na keyword-fix v2) | **v4 (na opschoning)** |
|---------|---------------|--------------------|----|-----|
| Database | 7.786 | 7.786 | 7.786 | **7.379** |
| Keywords | 654 | 667 | 669 | 669 |
| Gematcht | 92,5% | 76,4% | 89,4% | **92,7%** |
| Ongematcht | 585 | 1.838 | 828 | **536** |
| Hoog-match (≥5) | 313 (4,0%) | 84 (1,1%) | 84 (1,1%) | **83 (1,1%)** |
| 0.4 Overhead | 5.476 (ruis!) | 888 | 888 | 888 |
| 2.5 Openbaar vervoer | 918 (ruis!) | 22 | 22 | 22 |
| 5.1 Sportbeleid | 5 (te laag) | 50 | 50 | 50 |

### 6.2 Samenvatting v4 (na opschoning)

| Metriek | Waarde |
|---------|--------|
| Totaal besluiten | **7.379** |
| Gematcht (≥1 taakveld) | **6.843** (92,7%) |
| Ongematcht | **536** (7,3%) |
| Multi-match (≥2 taakvelden) | **4.501** (61,0%) |
| Hoog-match (≥5 taakvelden) | **83** (1,1%) |

### 6.3 Dekking per bron (v4)

| Bron | Systeem | Totaal | Gematcht | % |
|------|---------|--------|----------|---|
| raad | iBabs | 416 | 342 | 82,2% |
| college | iBabs | 1.990 | 1.580 | **79,9%** |
| college | Officiële Bekendmakingen | 4.973 | 4.921 | **99,0%** |

### 6.4 Uitgevoerde keyword-correcties

De volgende keywords veroorzaakten disproportioneel veel vals-positieven en zijn gecorrigeerd:

| Keyword | Taakveld | v1 hits | Probleem | Actie |
|---------|----------|---------|----------|-------|
| `organisatie` | 0.4 Overhead | 4.746 | Matcht op elk OB-subject "Organisatie en beleid" | **Verwijderd** |
| `ov` | 2.5 Openbaar vervoer | 893 | 2-letter: matcht "overheid", "overzicht" | **Vervangen** → `openbaar vervoer`, `bushalte`, `ov-concessie` |
| `res` | 7.4 Milieubeheer | 197 | 3-letter: matcht "reserves", "resultaat" | **Vervangen** → `regionale energiestrategie`, `milieubelastende activiteit` |
| `pers` | 5.6 Media | 53 | 4-letter: matcht "persoon", "personeel" | **Vervangen** → `persbericht`, `persconferentie` |
| `werk` | 6.3-6.5 | 333 | Matcht "werkzaamheden", "samenwerking" | **Vervangen** → `werk en inkomen`, `werkgelegenheid`, `werkloosheid` |
| `bro` | 8.1 | 118 | Matcht "Broekweg", "Langbroekweg" | **Vervangen** → `basisregistratie ondergrond` |
| `bus` | 2.5 | — | Matcht "robuust" | **Vervangen** → `bushalte`, `buslijn` |
| `informatievoorziening` | 0.4 | — | Te breed, dubbelt met 5.6 | **Verwijderd** |
| `communicatie` | 0.4 | — | Te breed | **Verwijderd** |
| `huisvesting` | 0.4 | — | Dubbelt met 8.3 | **Verwijderd** |
| `aanwijzingsprocedure` | 5.6 | — | Te breed | **Verfijnd** → `aanwijzingsprocedure lokale omroep` |
| — | 5.1 Sportbeleid | — | Te weinig hits (5) | **Toegevoegd**: `sport`, `bewegen`, `beweegbeleid` |
| — | 1.2 Openbare orde | — | Exploitatie/alcohol ontbrak | **Toegevoegd**: `exploitatievergunning`, `alcoholvergunning`, `paracommercieel` |
| `kap` | 8.3 → ook 5.7 | — | Bomenkap hoort bij groen | **Dubbel**: `kap`, `kapvergunning`, `bomenkap` ook in 5.7 |
| `omgevingsvergunning bouw` | 8.3 | — | Te specifiek, miste veel OV's | **Vervangen** → `omgevingsvergunning`, `aangevraagde omgevingsvergunning` |

### 6.5 Taakvelden met weinig hits (v4)

| Code | Naam | Hits | Keywords | Diagnose |
|------|------|------|----------|----------|
| 5.4 | Musea | 5 | 8 | Wassenaar heeft weinig museum-besluiten. Keywords adequaat. |

### 6.6 Ongematchte besluiten (536 items, v4)

Na opschoning is het aantal ongematchte items gedaald van 828 naar **536** (-35%).
Het grootste deel van de verbetering komt doordat procedurele en huishoudelijke items
(die per definitie niet op taakvelden matchen) zijn verwijderd.

| Type besluit | Ongematcht | Analyse |
|-------------|------------|---------|
| Collegebesluit (B&W) | ~410 | Generieke college-items. Terecht "Overig". |
| Raadsbesluit | ~74 | "Retributieverordening Wassenaar 2026" e.d. — overweeg specifieke keywords. |
| Overig (Beschikking, Melding, etc.) | ~52 | Kennisgevingen, uitschrijvingen, herstelbesluit — generiek. |

Dit zijn grotendeels besluiten die te generiek zijn voor taakveld-matching en terecht
op hoofdstuk-niveau als "Overig" getoond worden.

### 6.7 Hoog-match besluiten (≥5 taakvelden, v4)

83 besluiten matchen op 5+ taakvelden (was 313 in v1). Dit zijn vrijwel uitsluitend:

1. **P&C-documenten**: Kadernota, Najaarsnota, Begroting — matchen **terecht** op veel taakvelden
2. **Brede beleidsvisies**: Samenhangende aanpak Dorpskern, Belastingverordeningen

Dit is acceptabele multi-matching: de user wil deze stukken zien bij elk relevant taakveld.

### 6.8 BBV-hoofdstuk dekking (cruciaal inzicht)

| # | Hoofdstuk | Via portefeuille | Via taakveld-keywords (v3) |
|---|-----------|-----------------|----------------------|
| 0 | Bestuur en ondersteuning | 2.530 | 3.025 |
| 1 | Veiligheid | **0** | 478 |
| 2 | Verkeer, vervoer en waterstaat | **0** | 1.951 |
| 3 | Economie | 350 | 182 |
| 4 | Onderwijs | **0** | 77 |
| 5 | Sport, cultuur en recreatie | 91 | 2.547 |
| 6 | Sociaal domein | 249 | 553 |
| 7 | Volksgezondheid en milieu | **0** | 424 |
| 8 | VHROSV | 4.566 | 6.775 |

**Conclusie**: taakveld-mapping vindt besluiten in hoofdstukken 1, 2, 4 en 7 die via
portefeuille-mapping volledig onzichtbaar waren. Dit is een fundamentele verbetering.

---

## 7. OB Subject als aanvullend signaal

De KOOP subject-classificatie is een onafhankelijke, handmatige classificatie door de Rijksoverheid.
Dit is een waardevol extra signaal:

| OB Subject | Primair taakveld | Bruikbaarheid |
|------------|-----------------|---------------|
| Verkeer \| Organisatie en beleid | 2.1 Verkeer en vervoer | Hoog — 100% correlatie |
| Natuur en milieu \| Org. en beleid | 7.4 Milieubeheer / 5.7 Groen | Hoog |
| Financiën \| Organisatie en beleid | 0.6-0.9 Belastingen | Hoog |
| Bestuur \| Organisatie en beleid | 0.1 Bestuur | Hoog |
| Openbare orde en veiligheid \| Org. en beleid | 1.2 Openbare orde | Hoog |
| Ruimte en infrastructuur \| Org. en beleid | 8.1 Ruimte en leefomgeving | Hoog |
| Recht \| Organisatie en beleid | Divers | Laag — te breed (82% van alle OB) |
| Recht \| Burgerlijk recht | 1.2 / divers | Matig |

**Aanbeveling**: OB-subject gebruiken als extra match-dimensie, met name voor de specifieke
subjects (niet "Recht | Organisatie en beleid" dat te breed is).

---

## 8. Aanbevelingen voor Fase 1

### 8.1 Keyword-correcties — UITGEVOERD

Alle problematische keywords zijn gecorrigeerd in `taakvelden_iv3.js` (zie §6.4).
De keyword-index bevat nu **669 keywords** over **42 taakvelden**.

### 8.2 Exclusion-mechanisme (nog te implementeren)

Net als `SUBTHEMA_EXCLUSIONS` in app.js, een exclusion-list per taakveld in `taakvelden_iv3.js`:

```javascript
{ code: '5.7', naam: 'Openbaar groen',
  keywords: ['park', 'bomen', ...],
  exclusions: ['parkeerplaats', 'parkeervergunning', 'parkeerbeleid'],
  ...
}
```

### 8.3 OB Subject-mapping (optioneel, nog te implementeren)

Een directe mapping van OB-subject naar taakveld als "garantie-match":

```javascript
const OB_SUBJECT_NAAR_TAAKVELD = {
    'Verkeer | Organisatie en beleid': '2.1',
    'Natuur en milieu | Organisatie en beleid': '7.4',
    'Financiën | Organisatie en beleid': '0.6 - 0.9',
    // ...
};
```

### 8.4 Preprocessing-script (Fase 1)

Nieuw script `scripts/map_taakvelden.py` dat:
1. Keywords leest uit `taakvelden_iv3.js`
2. OB-metadata leest uit `data/ob_metadata.json`
3. Per besluit: matcht tegen alle taakvelden
4. Twee velden toevoegt: `taakvelden` (array codes) en `matched_kw` (object)
5. Resultaat wegschrijft naar `data.js`

### 8.5 Frontend-aanpassingen (Fase 2)

1. `applyDossierFilters()`: BBV-branch fixen — filter op `d.taakvelden.includes(subFilter)`
2. "Overig"-tegel per hoofdstuk: besluiten met lege `taakvelden` maar juiste hoofdstuk
3. Taakveld-badges bij elke besluitregel
4. Keyword-highlighting met achtergrondkleur
5. Tellingen op taakveld-tegels

---

## 9. Referenties

- **Iv3-Informatievoorschrift 2025 v1.1** — Ministerie van BZK / CBS (11 juli 2024)
- **KOOP SRU API** — `zoek.officielebekendmakingen.nl/sru/Search`
- **`taakvelden_iv3.js`** — 42 taakvelden, 669 keywords, inclusief clustering
- **`data/ob_metadata.json`** — 13.513 OB-records met subject-classificatie
- **`docs/TAAKVELD_MATCHING_ANALYSE.md`** — gedetailleerde dry-run resultaten

---

## 10. Assessment: lokaleregelgeving.overheid.nl als bron

### 9.1 Wat is lokaleregelgeving.overheid.nl?

Deze website is de publieke interface van de **CVDR** (Centrale Voorziening Decentrale Regelgeving),
beheerd door KOOP. Het bevat **geconsolideerde teksten** van lokale regelingen: verordeningen,
beleidsregels, en andere besluiten van gemeenten, provincies en waterschappen.

De collectie bevat landelijk circa **100.870 regelingen**. Voor Wassenaar zijn dit naar schatting
**150-300 regelingen** (verordeningen, beleidsregels, uitvoeringsbesluiten).

### 9.2 Verschil met officielebekendmakingen.nl

| Aspect | officielebekendmakingen.nl | lokaleregelgeving.overheid.nl |
|--------|---------------------------|-------------------------------|
| **Inhoud** | *Bekendmaking* van besluiten | *Geconsolideerde tekst* (huidige versie) |
| **Perspectief** | Historisch: wat is er besloten? | Actueel: wat geldt er nu? |
| **Tekstlengte** | Kort (besluit + motivering) | Lang (volledige regeling, artikelsgewijs) |
| **Omvang Wassenaar** | ~4.994 items | ~150-300 regelingen |
| **Versiehistorie** | Elke wijziging = apart item | Alleen de actuele + vervallen versies |
| **API** | SRU API (goed werkend) | SRU API via repository.overheid.nl (technisch complex) |

### 9.3 Overlap met bestaande data

Er is **hoge overlap**: elke regeling op CVDR heeft een corresponderende bekendmaking op OB.
De APV Wassenaar 2024 (CVDR725819) staat ook als `gmb-2024-473698` op OB. De Legesverordening 2025
(CVDR730705) staat ook als `gmb-2024-582729` op OB.

Onze OB-data bevat de **bekendmaking** (kort: "De raad heeft besloten de APV vast te stellen").
De CVDR bevat de **volledige tekst** (163 KB voor de APV: alle artikelen, hoofdstukken, bijlagen).

### 9.4 Meerwaarde-analyse

**Potentiële meerwaarde:**
1. **Volledige tekst** — de CVDR-tekst bevat véél meer keywords dan de korte OB-bekendmaking.
   De APV alleen al bevat woorden als "veiligheid", "overlast", "horeca", "parkeren", "milieu",
   "evenement" — ideaal voor taakveld-matching.
2. **Gestructureerde metadata** — `rechtsgebied`, `trefwoord` velden
3. **Historische regelingen** — sommige CVDR-records gaan terug tot vóór de OB-digitalisering

**Beperkingen:**
1. **Klein volume** — ~150-300 regelingen vs. 7.786 besluiten. Marginale toevoeging aan de database.
2. **Dubbeling** — elke CVDR-regeling is al als OB-bekendmaking aanwezig. Toevoegen zou
   duplicaten creëren tenzij we de-dupliceren.
3. **Technische complexiteit** — de SRU API voor CVDR (via repository.overheid.nl) reageert
   niet op verwachte zoekvelden voor Wassenaar-specifieke queries. De zoekdienst
   (zoekdienst.overheid.nl) geeft verbindingsfouten. De web-UI filtert niet correct op gemeente.
4. **Ander perspectief** — BeleidsWijzer toont *besluiten* (wat is er besloten?), niet
   *regelingteksten* (wat staat er in de APV?). CVDR-data past niet goed in het
   besluit-georiënteerde datamodel.

### 9.5 Aanbeveling

**Conclusie: NIET toevoegen als bron in Fase 1.**

De meerwaarde is beperkt:
- Het volume is klein (~200 vs. 7.786)
- Elke regeling is al als OB-bekendmaking aanwezig
- De API is technisch problematisch
- Het past niet in het besluit-georiënteerde datamodel

**Alternatief (Fase 2+):** Als de volledige regeltekst gewenst is voor betere keyword-matching,
kunnen we per OB-item dat een regeling betreft, de CVDR-identifier opzoeken en de volledige
tekst als verrijking ophalen. Dat is een enrichment-strategie, geen aparte bron.

**Eventuele uitzondering:** Als er historische regelingen op CVDR staan die niet op OB verschenen
zijn (pre-digitalisering), zou dat wel unieke content zijn. Dit vereist nader onderzoek maar
heeft lage prioriteit.

---

## 11. Versiegeschiedenis

| Datum | Versie | Wijziging |
|-------|--------|-----------|
| 2026-03-25 | 1.0 | Initieel document: databeschrijving, kwaliteitsanalyse v1, aanbevelingen |
| 2026-03-25 | 1.1 | Keyword-correcties doorgevoerd (9 probleemwoorden gecorrigeerd). Analyse v3: 89,4% dekking, hoog-match gedaald van 313 naar 84. Iteratiegeschiedenis toegevoegd. |
| 2026-03-25 | 1.2 | Assessment lokaleregelgeving.overheid.nl toegevoegd (§10). Conclusie: niet toevoegen als bron in Fase 1. |
| 2026-03-25 | 1.3 | Database-audit en opschoning (§5): 407 items verwijderd (procedureel, huishoudelijk, fragmenten, duplicaten), 62 gerepareerd. Analyse v4: 92,7% dekking op 7.379 items. Niet-oplosbare iBabs-beperkingen vastgelegd. |
