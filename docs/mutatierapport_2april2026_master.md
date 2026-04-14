# Mutatierapport master — Beleidsbibliotheek (2 april 2026)

**Bron:** `docs/Beleidsbibliotheek sociaal domein_2april2026.docx`  
**Platte tekst (audit):** `docs/_extract_2april2026.txt` (geëxporteerd uit dezelfde docx)  
**Doel:** één traceerbare keten — geen dubbel werk met eerdere rapporten, wel volledige dekking van de docx.

---

## 1. Al verwerkt / vergelijkbaar met eerdere mutatierapporten

Deze blokken uit de docx komen inhoudelijk overeen met werk dat al is **vastgelegd** (en naar verwachting in `data.js` is doorgevoerd vóór deze master). Bij twijfel: diff tegen backup `wassenaar/backups/v8.0.0_pre_mutaties_h0/` en `v8.0.0_pre_mutaties_h234/`.

| Docx-sectie (regels in `_extract_2april2026.txt`) | Eerdere rapport |
|---------------------------------------------------|-----------------|
| Regels 8–73 · **H0** Bestuur en ondersteuning | `mutatierapport_tegel_0.md` |
| Regels 87–119 · **H2–H4** (verkeer, economie, onderwijs) start | `mutatierapport_tegels_2_3_4.html` (volledige tegel 2–4-lijst) |

**Let op:** de docx is breder dan alleen “sociaal domein”; vanaf **H1 Veiligheid** (regel 74+) en **H5** (146+) staat veel dat **niet** in de twee eerdere rapporten zat.

---

## 2. Nog te verwerken (per BBV-hoofdstuk) — uit docx 2 april

Status in deze tabel: `open` = nog niet in `data.js` / UI aangepast in deze sessie; `gedaan` = onderstaand batchlog.

| Hoofdstuk | Onderwerp docx | Globale inhoud | Status |
|-----------|----------------|----------------|--------|
| **Homepage** | Regels 1–7 | Volgorde categorieën (Verordeningen → Visies → Financieel); introtekst + link `wassenaar.nl/bestuur` | open |
| **H1** Veiligheid | 74–86 | Toelichtingstekst algemeen; **APV 2024** → CVDR725819; verwijderen zienswijzen / GR-VH / benoeming Beerepoot e.d. | gedeeltelijk — zie §3 |
| **H5** Sport, cultuur… | 146–179 | Veel **verwijderen**; diverse **linkwijzigingen** (sportvisie PDF, Commandopost, skatebaan, strandvisie, …) | gedaan — zie §3 **B6** |
| **H6** Sociaal domein | 180–221 | Herstructurering (o.a. schuldhulp naar 6.3); verordeningen/links; verwijderingen; **typfout URL** “ar.bestuurlijkeinformatie.nl” in bron → corrigeren naar `wassenaar.` | gedaan — zie §3 **B7** (o.a. CVDR-links; veel verwijderingen stonden al na werklijst maart 2026) |
| **H7** VG&M | 222–248 | Linkwijzigingen + verwijderingen | gedaan — zie §3 **B8** |
| **H8** VHROSV | 249–300 | Grote set verwijderingen + linkwijzigingen; **Handboek Welstand** opsplitsen in 5 items metzelfde URL; **dubbele delegatie-besluiten** met # variant | gedaan — zie §3 **B9** |

**Ambiguïtet in bron (regel 86):**  
`Raadsbesluit Zienswijze Regionaal Beleidsplan Rampenbestrijding en Crisisbeheersing 2023 & Regionaal Veiligheidsrisico Haaglanden` — geen expliciete actie (*verwijderen* / *link*). **Handmatig laten bevestigen** door opdrachtgever.

---

## 3. Uitvoerlog (batchgewijs, controleerbaar)

| Datum | Batch | Actie | Referentie docx |
|-------|--------|--------|-----------------|
| 2026-04-03 | **B0** | **APV 2024** (raadsbesluit met `link`): iBabs → `https://lokaleregelgeving.overheid.nl/CVDR725819` | Regel 80 |
| | | *Collegebesluitregel zonder eigen `link` (alleen pdf_url) ongewijzigd* | Regel 29940–29951 data.js |
| 2026-04-03 | **B5** | **BBV H4** nabewerking in `wassenaar/app.js`: `OD_SAMENVATTING_PER_BBV[4]` — IHP als kader; LEA als samenwerking (expliciet: geen apart document in bibliotheek) | Afstemming extract + tegel-4-curatie |
| | | Verwijderd uit `BELEIDSNOTA_PER_TAAKVELD['4.2']`: *Aanvullend voorbereidingskrediet … Kievietschool* (jul 2025) | Los kredietbesluit buiten beleidsnota-lijn |
| | | `SAMENVATTING_PER_THEMA` — *Onderwijs & Huisvesting*: bedragen Kievietschool/Sint Baptist verwijderd; generieke IHP/huisvesting-formulering | Portefeuille consistent met 4.2 |
| | | Release-label `index.html` → **8.0.1**; backup `wassenaar/backups/v8.0.1_pre_h4_od_kievietschool_20260403/app.js` | |
| 2026-04-03 | **B6** | **BBV H5** (`wassenaar/app.js` + `beleidsnotas.js`): `BELEIDSNOTA_PER_HOOFDSTUK_BBV[5]` — alleen Sportvisie 2025 als PDF (SIM-cdn); *Visie voor De Wassenaarse Slag* uit hoofdstuk-5-lijst (blijft onder BBV 3 en tegel 5.7) | Extract 146–147 |
| | | **5.1** Sportvisie →zelfde PDF-URL; **5.2** alleen *Aanvullende krediet … sporthal*; **5.3** geleegd; **5.5** alleen Commandopost + nieuwe `documentId` | 148–163 |
| | | **5.7** grote opschoning (o.a. beheersvisie, beheerplannen, groene zone, Valkenburg/Valkenhorst-zienswijzen, skatekrediet, startnotitie strandvisie verwijderd); skate + Visie Slag nieuwe iBabs-`documentId` | 165–179 |
| | | Release **8.0.2**; backup `wassenaar/backups/v8.0.2_pre_mutaties_h5_20260403/` (`app.js`, `beleidsnotas.js`) | |
| | | *Controlemoment:* snapshot na live H5 — `wassenaar/backups/v8.0.2_controle_h5_20260403/` (`app.js`, `beleidsnotas.js`, `index.html`, `README.txt`) | |
| 2026-04-03 | **B7** | **BBV H6** (`app.js` + `beleidsnotas.js`): `BELEIDSNOTA_PER_HOOFDSTUK_BBV[6]` — Beleidsplan Sociaal Domein: bijlagenlijst zonder Raadsvoorstel/Raadsbesluit (mutatie regel 181) | Extract 180–181 |
| | | **6.1** Verordening ASD → `https://lokaleregelgeving.overheid.nl/CVDR742966/1` (iBabs-raadsbesluit eruit); Regiovisie AHG 2026: toelichting “bijlage 1” | 183–185 |
| | | **6.3–6.5** Dynamisch minimabeleid: URL + `#` (fragment) conform extract | 206 |
| | | **6.7–6.9** GR SbJH: i.p.v. “6e wijziging” iBabs → **CVDR721620/1** (gemeenschappelijke regeling) | 216, 221 |
| | | `beleidsnotas.js`: defaults ASD + GR SbJH (CVDR) | |
| | | *Reeds eerder (werklijst / eerdere curatie):* 6.1 opgeschoond, schuldhulp op 6.3-cluster, leerlingenvervoer op 6.7+CVDR, overige verwijderingen o.a. vermogensnorm/Wmo-rapport/kostenbesparend — niet opnieuw gewijzigd in B7 | 186–220 |
| | | Release **8.0.3**; backup `wassenaar/backups/v8.0.3_pre_mutaties_h6_20260403/` | |
| 2026-04-03 | **B8** | **BBV H7** (`wassenaar/app.js` + `beleidsnotas.js`): **7.1** alleen Regiovisie AHG 2026 met gewijzigde `documentId`; drie GR/zienswijze-regels verwijderd | Extract 224–227 |
| | | **7.2** Hemel-/grondwater → `CVDR657050/1`; rioolheffing-raadsbesluit uit tegel verwijderd; Rekenkamer riolering → nieuwe iBabs-URL + `#` | 228–230 |
| | | **7.3** Motie + Avalex/raadpleegbrief-regels verwijderd; Intensiveren bronscheiding, afvalstoffenheffing (`CVDR748859`), definitieve keuze restafval → URLs uit extract | 232–239 |
| | | **7.4** Transitievisie warmte, LES, Duurzaamheidsvoucher, twee Rekenkamer-RES/energie-URL’s; RES 1.0 Rijnmond–DH verwijderd; type energiebesparingsplicht → rekenkameronderzoek | 240–246 |
| | | **7.5** iBabs-raadsbesluit verwijderd; vervangen door **Officiële bekendmaking** `gmb-2025-558621` (zelfde titel als `data.js`); idem cluster **0.6–0.9** + defaults `beleidsnotas.js` | 247–248 |
| | | Rioolheffing in cluster **0.6–0.9**: OB `gmb-2025-557418` i.p.v. iBabs | 230 |
| | | Release **8.0.4**; backup `wassenaar/backups/v8.0.4_pre_mutaties_h7_20260403/` | |
| | | *Akkoord eerdere batches:* inhoudelijk geen heropeningsmutaties — B5–B7 blijven zoals gelogd | Gebruiker 3 apr 2026 |
| 2026-04-03 | **B9** | **BBV H8** (`wassenaar/app.js` + `beleidsnotas.js`): **H8** Startnotitie Participatie `documentId` 416f5b70…; Beheervisie OR `6dfee0f6…`; Woonvisie → iBabs (zelfde als 8.3) | Extract 250–251, 285–286 |
| | | **8.1** Verwijderingen (VGB-regels, Noordrand, Duindigt-voorbereiding, zienswijze/GR ODH, uitvoeringsverordening omgevingsrecht, nadeelcompensatie, verzwaard buitenplanse adviesrecht, zonnepanelen-inspraak, initiatieven-impact, Nota hogere waarden 2023); linkupdates Duindigt/MOC/Startnotitie/ROA/BOPA-participatie-Index/dubbele delegatie + `#`/Nota 2024 | 252–282 |
| | | **8.3** Verwijderd: startnotitie woonvisie, 2e wijziging HVV, verkoop Den Deyl, capaciteit wonen, startnotitie lokale woonzorg; overige linkupdates; **Handboek Welstand** → 5 onderdelen (zelfde basis-URL + `#`) | 283–300 |
| | | `beleidsnotas.js`: Noordrand “wensen”-regel eruit; GR ODH + 2e HVV eruit; Beheervisie/Woonvisie/Vestiging Duindigt/milieuzonering/nota lawaai-links; duplicaat Lokale Woonzorg onder 8.3 eruit | |
| | | Release **8.0.5**; backup `wassenaar/backups/v8.0.5_pre_mutaties_h8_20260403/` | |

Volgende logische batches (voorstel):

- **B1 — H1:** verwijderen 6 genoemde stukken + toelichtingstekst in UI (indien gewenst apart BBV-blok).

---

## 4. Werkwijze (geen dubbel werk)

1. Wijziging **altijd** kunnen terugvinden in `_extract_2april2026.txt` + dit masterbestand.  
2. Vóór grotere deletes: **backup-map** of git commit.  
3. Na elke batch: spotcheck in de site op het juiste **BBV-hoofdstuk / tegel**.  
4. Inhoudelijke juistheid van verwijderen (“hoort niet meer in bibliotheek”) blijft bij **opdrachtgever**; wij voeren technisch uit.

---

## 5. Kruisverwijzing oude rapporten

- `docs/mutatierapport_tegel_0.md` — H0 mutaties (55 stuks gerapporteerd).  
- `docs/mutatierapport_tegels_2_3_4.html` — Tegels 2, 3, 4 (45 mutaties gerapporteerd).  
- `docs/mutatierapport_tegel_0.html` — HTML-variant tegel 0.

---

*Laatste update master: 3 april 2026 — batch **B9** (BBV H8); `index.html` **8.0.5**.*
