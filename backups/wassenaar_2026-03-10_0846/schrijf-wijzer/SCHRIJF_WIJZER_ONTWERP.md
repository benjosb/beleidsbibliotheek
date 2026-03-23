# Schrijf-Wijzer — Ontwerpdocument

**Status:** Concept · Maart 2026  
**Doel:** Beleidsmedewerkers ondersteunen bij het schrijven van een concept collegevoorstel door relevante beleidscontext uit de Besluit-Wijzer direct beschikbaar te maken.

---

## 1. Probleemstelling

Een beleidsmedewerker die een collegevoorstel schrijft moet:

- Het bestaande beleid kennen (coalitieakkoord, raadsbesluiten, collegebesluiten)
- De aanleiding en gevraagde beslissing onderbouwen met dat beleid
- Consistent zijn met eerder genomen besluiten

**Huidige situatie:** De medewerker moet handmatig in de Besluit-Wijzer zoeken, of vertrouwt op eigen geheugen. De beleidsbriefings zijn beschikbaar maar staan los van het schrijfproces.

---

## 2. UX-opties overwogen

| Optie | Beschrijving | Voor | Tegen |
|-------|--------------|------|-------|
| **A. Inleidende alinea** | Eén statische tekst bovenaan het formulier | Eenvoudig | Te generiek, past niet bij elk onderwerp |
| **B. Split screen** | Beleid links, schrijven rechts | Altijd zichtbaar | Afleidend; beleid kan overweldigend zijn; mobiel lastig |
| **C. Knoppen + samenvatting** | Medewerker selecteert thema's via knoppen; krijgt gerichte samenvatting | Speels, gericht, hergebruikt bestaande tegels | Meerdere klikken nodig |

**Gekozen richting: C — Knoppen + samenvatting.**  
De knoppen bestaan al (dossier-kaarten/tegels). De medewerker drukt op wat relevant is voor het voorstel; de tool toont een gecombineerde beleidssamenvatting. Dat is speels, gericht en sluit aan bij de bestaande interface.

---

## 3. Concept: "Beleid indrukken"

### Workflow

1. **Start** — Medewerker opent de Schrijf-Wijzer (los van of geïntegreerd in een formulier).
2. **Selectie** — Klik op één of meer domein-knoppen (Bestuur & Veiligheid, Financiën…, Ruimte…, etc.). Dezelfde visuele stijl als de Besluit-Wijzer-dossiers.
3. **Resultaat** — Een samenvatting verschijnt: per geselecteerd domein de relevante beleidsclusters (uit briefings + coalitieakkoord).
4. **Gebruik** — Medewerker leest, kopieert of "voegt toe" aan het collegevoorstel.

### Knoppen = bestaande tegels

- Bestuur & Veiligheid  
- Financiën, Economie & Sport  
- Ruimte, Duurzaamheid & Mobiliteit  
- Sociaal Domein, Wonen & Onderwijs  
- Cultuur & Welzijn  
- Bedrijfsvoering  

**Multi-select:** Klik om toe te voegen, nogmaals klikken om te verwijderen. Geselecteerde knoppen visueel gemarkeerd (border, achtergrond).

### Samenvatting

Per geselecteerd domein:

- **Subthema's** uit `SAMENVATTING_PER_THEMA` (app.js)
- Optioneel: **Coalitieakkoord-secties** die bij dat thema horen
- Optioneel: **Recente besluiten** (top 3–5)

De samenvatting wordt dynamisch opgebouwd. "Kopieer"-knop plakt de tekst op het klembord.

---

## 4. Vormgeving

### Optie A: Standalone pagina

- Aparte pagina `schrijf-wijzer.html`
- Boven: knoppen
- Onder: samenvatting-paneel
- Link naar collegevoorstel-sjabloon (Word)

### Optie B: Geïntegreerd in formulier

- Formulier met velden: Aanleiding, Gevraagde beslissing, Financiële consequenties, etc.
- Per veld of boven het formulier: "Selecteer beleidscontext" met knoppen
- Samenvatting in een collapsible paneel of sidebar
- "Voeg toe aan dit veld" — kopieert naar het actieve veld

**Prototype:** Optie A (standalone) als eerste stap. Optie B is een logische vervolgstap.

---

## 5. Technische opzet

- **Gescheiden van huidige versie:** Eigen map `schrijf-wijzer/`, geen wijzigingen aan `index.html`, `app.js`, etc.
- **Data:** Hergebruik `SAMENVATTING_PER_THEMA` (of een export daarvan), `COALITIE_AKKOORD_DATA.secties`, `THEMA_KLEUREN`
- **Bestanden:**
  - `schrijf-wijzer.html` — standalone pagina
  - `schrijf-wijzer.js` — logica (selectie, samenvatting, kopiëren)
  - `schrijf-wijzer.css` — styling (of inline)
  - `schrijf-wijzer-data.js` — minimale data (domeinen + samenvattingen) om geen zware dependencies te hebben

---

## 6. Vervolgstappen

1. **Prototype valideren** — Test met beleidsmedewerkers: zijn de knoppen logisch? Is de samenvatting bruikbaar?
2. **Collegevoorstel-sjabloon koppelen** — Word-sjabloon of webformulier; link of embed.
3. **Uitbreiden** — Subthema-knoppen (naast hoofddomeinen)? Zoekfunctie binnen samenvatting?
4. **Integratie** — Als de Schrijf-Wijzer aanslaat: embedden in een groter formulier of als sidebar bij een editor.

---

## 7. Relatie met Roadmap

- **Spoor 2: Schrijf-Wijzer** — "Besluit-Wijzer + collegevoorstel-sjabloon"
- Dit ontwerp realiseert de eerste stap: beleidsterrein-inhoud direct beschikbaar bij het schrijven.
- Lange termijn: volledige collegevoorstellen als content, standaard voor beleidsschrijvers.
