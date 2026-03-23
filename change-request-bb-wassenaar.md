# Change Request: BeleidsBibliotheek

**Datum:** 23 maart 2026
**Aanvrager:** Dick Braam, beleidsadviseur gemeente Wassenaar
**Categorie:** Webhosting & DNS
**Prioriteit:** Normaal
**Omgeving:** Productie

---

## Samenvatting

Aanvraag voor het inrichten van een nieuw subdomein `bb.wassenaar.nl` bij hostingpartij Argeweb, ten behoeve van de BeleidsBibliotheek — een informatietool voor de gemeenteraad met overzicht van vigerend beleid, raads- en collegebesluiten en het overdrachtsdossier raadsverkiezingen 2026.

---

## Wat is de BeleidsBibliotheek?

De BeleidsBibliotheek is een webapplicatie die gemeenteraadsleden en ambtenaren inzicht geeft in het volledige beleidslandschap van de gemeente Wassenaar. De applicatie bevat:

- Overzicht van alle vigerende beleidsnota's, verordeningen en visiedocumenten, geordend op BBV-taakveld
- Raads- en collegebesluiten (2022–heden) doorzoekbaar op trefwoord, domein en periode
- Overdrachtsdossier raadsverkiezingen 2026
- Domeinbriefings met context per beleidsterrein

De applicatie draait als **volledig statische website** (HTML, CSS, JavaScript). Er is geen server-side verwerking, geen database en geen API nodig op de productieomgeving.

---

## Wat wordt gevraagd

### 1. DNS: subdomein aanmaken

**Actie voor Shift2 (DNS-beheer wassenaar.nl):**

- Nieuw A-record (of CNAME) aanmaken: `bb.wassenaar.nl`
- Verwijzen naar het IP-adres of hostname dat Argeweb opgeeft voor de hostingomgeving

### 2. Hosting: webruimte inrichten

**Actie voor Argeweb (hosting):**

- Webruimte inrichten voor `bb.wassenaar.nl`
- SSL-certificaat (HTTPS) activeren
- FTP-toegang beschikbaar stellen voor het uploaden van bestanden

### 3. Initiële plaatsing bestanden

**Actie voor Dick Braam (aanvrager):**

- Eenmalig uploaden van de statische bestanden via FTP
- Wekelijks bijwerken van 2–3 gewijzigde bestanden (databestanden)

---

## Technische specificaties

| Kenmerk | Waarde |
|---------|--------|
| Type site | Statisch (HTML/CSS/JS) |
| Server-side code | Geen |
| Database | Geen |
| Geschatte omvang | ~12 bestanden, totaal ca. 15 MB |
| Bandbreedte | Laag (intern gebruik, <100 bezoekers/dag) |
| SSL/HTTPS | Vereist |
| Toegang via FTP | Vereist (voor wekelijkse updates) |
| PHP / Python / Node | Niet nodig |
| E-mail | Niet nodig |

---

## Bestandsoverzicht

| Bestand | Omschrijving | Muteert |
|---------|-------------|---------|
| index.html | Hoofdpagina BeleidsBibliotheek | Zelden |
| styles.css | Opmaak | Zelden |
| app.js | Applicatielogica + beleidsnota-data | Wekelijks |
| data.js | Raads- en collegebesluiten | Wekelijks |
| beleidsnotas.js | Beleidsnota-overzicht | Wekelijks |
| beleidsnotas.html | Pagina beleidsnota's | Zelden |
| briefings.js | Domeinbriefings | Af en toe |
| coalitieakkoord.js | Coalitieakkoord-data | Zelden |
| disclaimer.js | Disclaimer-tekst | Zelden |
| overdrachtsdossier.html | Overdrachtsdossier | Zelden |
| overdrachtsdossier.js | Data overdrachtsdossier | Zelden |
| manifest.webmanifest | PWA-configuratie | Nooit |

---

## Risicobeoordeling

| Risico | Toelichting |
|--------|------------|
| Privacy | Geen persoonsgegevens. Uitsluitend openbare raads- en collegebesluiten (bron: iBabs, Officiële Bekendmakingen). |
| Beveiliging | Geen server-side code, geen database, geen formulieren, geen login. Statische bestanden only. |
| Beschikbaarheid | Geen bedrijfskritische applicatie. Uitval heeft geen gevolgen voor de bedrijfsvoering. |
| Beheer | Functioneel beheer door aanvrager. Technisch beheer (hosting) door Argeweb. |

---

## Planning

| Stap | Wie | Doorlooptijd |
|------|-----|-------------|
| Goedkeuring CIO | CIO | 1 week |
| DNS-record aanmaken | Shift2 | 1 werkdag |
| Hosting inrichten + SSL | Argeweb | 1–3 werkdagen |
| FTP-credentials ontvangen | Argeweb → aanvrager | — |
| Initiële upload bestanden | Aanvrager | 1 uur |
| Verificatie en livegang | Aanvrager | 1 uur |

**Gewenste livegang:** april 2026

---

## Kosten

Geen aanvullende kosten verwacht bij bestaand hostingcontract Argeweb. Geen licenties, geen externe dienstverlening.

---

## Contactpersonen

| Rol | Naam | Organisatie |
|-----|------|------------|
| Aanvrager / functioneel beheer | Dick Braam | Gemeente Wassenaar |
| DNS-beheer | Shift2 | Shift2 |
| Hosting | Argeweb | Argeweb |
