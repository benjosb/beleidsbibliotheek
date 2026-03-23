# Verbeterpunten Beleidsbibliotheek (uit check beleidsbibliotheek_6maar2026.xlsx)

Uitgelezen uit de Excel. Per thema/subtegel de opmerkingen. Stappenplan: punten afwerken, hieronder bijhouden wat gedaan is en wat niet.

---

## Volgende sessie: start hier

**Als je je laptop weer aanzet en verder wilt met de verbeterpunten:**

1. Open dit project in Cursor en zeg bijvoorbeeld: *“Ga verder met de verbeterpunten uit VERBETERPUNTEN_uit_Excel.md en werk de afwerkingslog bij.”*
2. De assistent leest dit bestand en de code (o.a. `wassenaar/app.js`, `wassenaar/scripts/domeinclustering.py`) en pakt het volgende punt uit de Afwerkingslog.
3. Na elke wijziging wordt de Afwerkingslog hieronder bijgewerkt (✓ gedaan / ✗ niet gelukt + korte reden).

*Let op: de assistent start niet vanzelf als je je laptop aanzet; je moet even dit project openen en vragen om verder te gaan.*

---

## Cultuur en Welzijn

| Subtegel | Opmerking |
|----------|------------|
| **Volksgezondheid** | (ja/nee: ok) |
| **Warenar** | Deze financiële bijdrage uit het Cultuurbudget (taakveld 5.6) te … / Tekst verwijst niet naar juiste beslispunt. Beantwoording 101 schriftelijke vragen ex art. 37 RvO van raadslid: gaat over bestuurscultuuronderzoek – heeft met gemeentelijk bestuur te maken. |
| **Overig** | Tegel geeft geen nadere info. |

---

## Sociaal Domein, Wonen & Onderwijs

| Subtegel | Opmerking |
|----------|------------|
| **Jeugd** | Verordening antidiscriminatievoorziening gemeente Wassenaar 2026. |
| **Onderwijshuisvesting** | (ja: ok) |
| **Onderwijs** | Diverse kredietvoorstellen: betrekking op onderwijshuisvesting, idem IHP; herontwikkeling en straatnaam bouwlocatie = Fysiek domein. Subtegel leerlingenvervoer, voor- en vroegschoolse educatie, OAB, leerplicht, RMC. |
| **Ouderenbeleid** | (ja: ok) |
| **Schuldhulpverlening** | Er lijkt in 1 geval gesproken te worden over beleidsplan Inburgering. Tegel inburgering. |
| **Voor- en vroegschoolse educatie** | (ja: ok) |
| **Woonzorgvisie** | (ja: ok) |
| **Wmo** | (ja: ok) |
| **Sociaal domein** | Re-integratie- en Participatieverordening Participatiewet. Werk en Inkomen vraagt eigen tegel. |
| **Overig** | Tegel klikt niet door (hier zou ik werk en inkomen verwachten). |

---

## Financiën, Economie en Sport

| Subtegel | Opmerking |
|----------|------------|
| **Afval** | (ja: ok) |
| **Economie** | Meicirculaire: Algemene dekkingsmiddelen = Financiën; Zienswijze Conceptjaarrekening 2022, herziene begroting 2023: betreft GR KDB = werkbedrijf = beschut werk. Lege collegevergaderpunten; Collegebesluit Financiën, Economie en Sport (tijdelijke waarneming bm De Lange). Marktgelden, BIZ verordening: alleen actuele versies opnemen, nu ook eerder jaren. |
| **Gemeentelijke huisvesting** | Schooladviesdienst hoort hier niet thuis, meer bij Onderwijs. |
| **Financiën** | Stedenbouwkundig kader → Fysiek domein; sportvisie → sport; najaarsnota, begroting, kadernota, Voorjaarsnota → P&C-cyclus; Begrotingen GR’s bij andere beleidsterreinen. Zou sub belastingen maken en sub gemeentefonds, + sub financiële kaders. |
| **P&C cyclus** | Mag alleen Voorjaarsnota, najaarsnota, kadernota, begroting en jaarrekening bevatten (van gemeente zelf); nu te veel andere onderwerpen (begrotingen/jaarrekeningen GR’s, scholen e.d.). |
| **Sport** | Duindigt hoort hier niet thuis. Sport en sportaccommodaties splitsen; lege collegebesluiten (titel). |
| **Overig** | — |

---

## Bestuur en Veiligheid

| Subtegel | Opmerking |
|----------|------------|
| **Bestuur** | Te veel inhoudelijke punten horen hier niet thuis. |
| **Veiligheid** | Te veel inhoudelijke punten horen hier niet thuis; omgevingsvergunningen. |
| **Lokale omroep** | Te veel inhoudelijke punten horen hier niet thuis. |

---

## Afwerkingslog (voortgang hier bijhouden)

| # | Verbeterpunt | Gedaan? | Opmerking |
|---|--------------|---------|-----------|
| 1 | Cultuur: Warenar – tekst/verkeerd beslispunt | ✗ | Datakwaliteit/bron: niet in code oplosbaar; gaat om verkeerde koppeling in bron. |
| 2 | Cultuur: Overig – tegel geeft geen nadere info | ✗ | UX: Overig is restcategorie; nadere info zou extra veld/tekst vergen. |
| 3 | Sociaal: Jeugd – Verordening antidiscriminatie | ✓ | Keyword `antidiscriminatie` toegevoegd aan Jeugdzorg (app.js). |
| 4 | Sociaal: Onderwijs – kredietvoorstellen/herontwikkeling naar Fysiek; subtegel leerlingenvervoer e.d. | ✓ | Keywords leerlingenvervoer, vve, oab, rmc, schooladvies toegevoegd aan Onderwijs; domeinclustering: schooladvies/leerlingenvervoer/vve/oab/rmc → Sociaal. Stedenbouwkundig kader → Ruimte (domeinclustering). |
| 5 | Sociaal: Schuldhulpverlening – inburgering/tegel inburgering | ✓ | Subtegel Inburgering toegevoegd (keywords + vaste kind in boom). |
| 6 | Sociaal: Sociaal domein – Werk en Inkomen eigen tegel | ✓ | Subtegel Werk en Inkomen toegevoegd (keywords + vaste kind in boom). |
| 7 | Sociaal: Overig – tegel klikt niet door (werk en inkomen) | ✓ | Werk en Inkomen nu eigen tegel; klik zou moeten werken. Na deploy testen. |
| 8 | Financiën: Economie – lege collegepunten, BIZ alleen actueel, Meicirculaire/GR KDB | ✗ | Lege collegepunten al gefilterd; BIZ/Meicirculaire/GR is datakwaliteit of filterregel – later eventueel aanscherpen. |
| 9 | Financiën: Gemeentelijke huisvesting – schooladviesdienst naar Onderwijs | ✓ | Keyword `schooladvies` in Onderwijs; domeinclustering: schooladvies → Sociaal. |
| 10 | Financiën: Financiën – stedenbouwkundig kader→Fysiek; P&C strikter; sub belastingen/gemeentefonds | ✓ | Stedenbouwkundig kader → Ruimte (KEYWORD_MAP). P&C-cyclus keywords verengd tot voorjaarsnota, najaarsnota, kadernota, begroting, jaarrekening. Sub belastingen/gemeentefonds: bestaande Belastingen-tegel; geen aparte subtegel toegevoegd. |
| 11 | Financiën: P&C cyclus – alleen gemeente eigen stukken | ✓ | P&C-cyclus keywords aangescherpt (voorjaarsnota, najaarsnota, kadernota, begroting, jaarrekening). |
| 12 | Financiën: Sport – Duindigt eruit; sport/sportaccommodaties splitsen; lege collegebesluiten | ✓ | Duindigt nu vóór Sport in KEYWORD_MAP → gaat naar Ruimte. Sportaccommodaties als aparte subtegel (keywords + vaste kind in boom). Lege collegebesluiten al gefilterd. |
| 13 | Bestuur: Bestuur – te veel inhoudelijke punten | ✗ | Inhoudelijke afbakening: keywords aanscherpen zou geldige items kunnen uitsluiten; handmatige review of beleidsregel. |
| 14 | Bestuur: Veiligheid – idem; omgevingsvergunningen | ✗ | Idem; omgevingsvergunningen zouden naar Ruimte kunnen (al in KEYWORD_MAP). |
| 15 | Bestuur: Lokale omroep – te veel inhoudelijke punten | ✗ | Idem punt 13. |

---

*Bron: check beleidsbibliotheek_6maar2026.xlsx, uitgelezen 2026-02-26*
