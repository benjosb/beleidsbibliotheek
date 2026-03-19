# Chat-backup (Wassenaar) — 2026-03-19

## Context / doel
- Sectie per hoofdstuk: blok **“Kwaliteit en verantwoording”** verwijderen.
- Alleen **“Methodologie”** behouden en **verplaatsen naar Compliance**.
- Daarna: beleidsnota’s-lijst onder tegel **BBV 0 (Bestuur en ondersteuning)** zoals bij Sociaal Domein.
- Daarna: kleine vormgevingswensjes:
  - “Lijst met Raads- en Collebesluiten” standaard ingeklapt (driehoekje dicht).
  - Aantallen weghalen uit tegels.
- Daarna: volgende stap “economie”:
  - Welke nota in het OD zit?
  - Twijfel over **“De Wassenaarse Slag”**: waar hoort “toerisme” in BBV?

## Gemaakte keuzes / besluiten uit de chat
1. **Kwaliteit & Verantwoording** verwijderen en **Methodologie** naar **Compliance** verplaatsen.
2. **Beleidsnota’s** voor **BBV 0 – Bestuur en ondersteuning** opnemen in de tegel/lijst.
3. **Dienstverleningsmodel** plaatsen bij **BBV 0.2 Burgerzaken**.
4. UI: **Raads- en collegebesluiten** standaard **ingeklapt**.
5. UI: **aantallen op tegels** verwijderen.
6. BBV-mapping “toerisme”:
   - Er is geen apart BBV-taakveld “toerisme”.
   - “De Wassenaarse Slag”/strandvisie past het best bij **BBV 5.7 (Openbaar groen en (openlucht) recreatie)**.
   - Economische aspecten (marketing) kunnen eventueel naar **BBV 3.4**, maar de kern (strand/recreatie) is 5.7.

## Opgesomde voorstellen voor BBV 0 (uit de chat)
- Coalitieakkoord 2022–2026
- Begroting 2026
- Financiële Verordening en Controleprotocol 2025
- Subsidiebeleid / Subsidieregelingen
- Gemeenschappelijke regelingen
- Dienstverleningsmodel (toegevoegd, met label/plaatsing bij 0.2 Burgerzaken)

## Referentie: wat er in de code is aangepast (high level)
- `wassenaar/index.html`
  - sectie `kwaliteit-sectie` (kwaliteit & verantwoording) verwijderd
  - methodologie-kaart toegevoegd in `#compliance` (met placeholder `#methodologieInhoud`)
- `wassenaar/app.js`
  - `renderKwaliteit()` vervangen door `renderMethodologie()` (vult `#methodologieInhoud`)
  - dossiergedrag: `dossierBesluiten` standaard gesloten i.p.v. open bij dossier-openen
  - tegelaantallen verwijderd uit hoofd/ sub-/ subsub-tegels
  - beleidsnota’slijst voor BBV 0 uitgebreid met documenten (incl. dienstverleningsmodel)
- `wassenaar/styles.css`
  - extra styling voor de methodologie-kaart (paragraaf spacing + linkstijl)

## Laatst besproken mapping (economie / BBV)
- Nota’s in OD:
  - OD hoofdstuk 8: **Economische Visie Wassenaar 2025**
  - OD hoofdstuk 8: tekst over strandvisie / “De Wassenaarse Slag”
- Vraag: “waar zit toerisme in BBV?”
  - Antwoord/keuze: **5.7** (openbaar groen & openlucht recreatie) als hoofdpositie voor “De Wassenaarse Slag”.

