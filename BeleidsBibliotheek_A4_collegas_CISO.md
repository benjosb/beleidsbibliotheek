# BeleidsBibliotheek / Besluit-Wijzer Wassenaar
## Technische eisen, testinstructie en compliance-overzicht

**Doel:** Transparantietool voor raads- en collegebesluiten. Nieuwe wethouders snel overzicht van vigerend beleid per portefeuille. *Aanvulling op het Overdrachtsdossier Gemeenteraad 2026.*

**Techniek:** Statische HTML/CSS/JavaScript — geen server-side code, geen externe API-calls. De inhoud is **statisch**; alleen de weergave (zoeken, filters) is dynamisch.

---

## 1. Benodigde functies van het CMS / hosting

| Functie | Waarom nodig |
|---------|--------------|
| **Statische bestanden hosten** | De BeleidsBibliotheek bestaat uit HTML, CSS en JavaScript-bestanden. Het CMS moet deze kunnen uitdelen aan bezoekers. |
| **JavaScript uitvoeren** | Zoekfunctie, filters, uitklapbare secties, disclaimer-modal en navigatie werken via JavaScript. Zonder JS is de tool niet bruikbaar. |
| **Inline of ingesloten scripts toestaan** | De disclaimer en app-logica draaien via `<script>`-tags. Een strikte Content Security Policy die `unsafe-inline` blokkeert kan problemen geven. |
| **Correcte MIME-types** | `.js` en `.css` moeten als `application/javascript` en `text/css` worden geserveerd. Anders laden ze niet. |
| **Bestandsgrootte ~2 MB** | De monolith-versie (alles-in-één) of de losse bestanden samen kunnen groot zijn. Upload- en weergavelimieten mogen dit niet blokkeren. |

---

## 2. Wat de BeleidsBibliotheek níet nodig heeft

- Geen database of backend
- Geen cookies (alleen `sessionStorage` voor de disclaimer “Ik ga akkoord”)
- Geen externe API-calls of third-party scripts
- Geen analytics of tracking
- Geen gebruikersregistratie of login

---

## 3. Testinstructie — zo controleer je of het werkt

1. **Open de URL** van de BeleidsBibliotheek in een moderne browser (Chrome, Edge, Firefox, Safari).
2. **Disclaimer:** Er verschijnt een modal “Over deze Besluit-Wijzer”. Klik op *“Ik begrijp het en ga verder”*.
3. **Overzicht:** Je ziet kaarten per portefeuille (bijv. Bestuur & Veiligheid, Sociaal Domein). Klik op een kaart.
4. **Detail:** Er verschijnen besluiten, filters (jaar, type) en een zoekbalk. Typ een zoekterm en controleer of resultaten verschijnen.
5. **Weergave wisselen:** Klik op *“BBV-taakveld”* — de indeling moet veranderen.
6. **Geen foutmeldingen:** Open de ontwikkeltools (F12) → tab *Console*. Er mogen geen rode fouten staan.

**Als het werkt:** Disclaimer sluit, kaarten laden, zoeken en filters werken, geen console errors.  
**Als het niet werkt:** Lege pagina, geen kaarten, of rode fouten in de console → vaak wordt JavaScript geblokkeerd of zijn MIME-types niet correct.

---

## 4. Compliance — voor CISO en andere belanghebbenden

### 4.1 Huisstijl

| Aspect | Status |
|--------|--------|
| Logo | Gemeente Wassenaar-logo (SVG) — officieel huisstijl |
| Kleuren | Blauw (#0060ac), geel (#ffda00), rood (#e40521) — huisstijlkleuren |
| Typografie | Standaard webfonts; geen externe font-host |
| Domein | Onder `wassenaar.nl` (subdomein) — conform huisstijl |
| Vormgeving | **Verzoek aan Communicatie:** keuze — naadloos in wassenaar.nl OF bewuste afwijking zoals wassenaar.bestuurlijkeinformatie.nl (iBabs). |

---

### 4.2 WCAG (toegankelijkheid)

| Aspect | Status |
|--------|--------|
| Taal | `lang="nl"` op `<html>` |
| Semantiek | `<header>`, `<main>`, `<nav>`, `<section>`, koppen hiërarchie |
| ARIA | `aria-label`, `aria-expanded`, `aria-modal`, `role="dialog"` voor modals en knoppen |
| Contrast | Tekst op achtergrond voldoet aan contrast-eisen |
| Toetsenbord | Navigatie en acties via toetsenbord mogelijk |
| Focus | Focus zichtbaar bij tab-navigatie |
| Links | Externe links met `rel="noopener"` |

**Aanbeveling:** Periodieke WCAG 2.1 AA- audit (bijv. screenreader-test, axe DevTools).

---

### 4.3 Privacy

| Aspect | Status |
|--------|--------|
| Persoonsgegevens | Geen verzameling of verwerking van persoonsgegevens |
| Cookies | Geen cookies |
| sessionStorage | Alleen voor disclaimer “Ik ga akkoord” — per sessie, geen tracking |
| Third-party scripts | Geen — geen Google Analytics, geen externe trackers |
| AVG | Geen verwerking van persoonsgegevens → geen AVG-meldplicht voor deze tool |
| Privacyverklaring | Algemene privacyverklaring van de gemeente is van toepassing; geen aparte nodig voor deze tool |

---

### 4.4 Informatiebeveiliging

| Aspect | Status |
|--------|--------|
| Gegevensbron | Alleen openbare bronnen: raads- en collegebesluiten (iBabs), Officiële Bekendmakingen, coalitieakkoord |
| Geen vertrouwelijke data | Geen BSN, geen inloggegevens, geen interne stukken |
| Hosting | Voorkeur: hardened omgeving van gemeente Wassenaar. Gesloten CMS (Shift2) — geen externe API-calls. |
| HTTPS | Verplicht — alle verkeer via HTTPS |
| XSS | Geen gebruikersgegenereerde content zonder sanitization; data uit vertrouwde bronnen |
| Content Security Policy | Indien mogelijk: `script-src 'self'` en `style-src 'self'`; inline scripts kunnen nodig zijn voor disclaimer |
| Dependencies | Geen externe npm/CDN-afhankelijkheden — alles lokaal |

**Risico-inschatting:** Laag — statische tool, publieke bronnen, geen gebruikersdata. *Integriteit:* het faken van historische data is niet denkbeeldig; mitigerende maatregelen (bijv. checksums, versiebeheer) zijn aan te raden.

---

## 5. Samenvatting voor CISO

**BeleidsBibliotheek / Besluit-Wijzer Wassenaar** is een statische webapplicatie die:

- alleen openbare bronnen gebruikt
- geen persoonsgegevens verwerkt
- geen cookies of third-party tracking gebruikt
- geen externe verbindingen maakt buiten het domein
- voorkeur: hardened omgeving gemeente Wassenaar

De tool is bedoeld voor interne transparantie (wethouders, raadsleden) en publieke toegang tot beleidsinformatie. Risicoprofiel laag; standaard security review voldoende.

---

*Document versie: februari 2026*  
*Contact: [verantwoordelijke afdeling]*
