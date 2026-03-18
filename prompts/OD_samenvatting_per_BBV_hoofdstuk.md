# Prompt: OD-samenvattingen toevoegen aan overige BBV-hoofdstukken

**Gebruik:** Kopieer deze prompt en plak in Cursor. Of: "Voer de instructies uit uit prompts/OD_samenvatting_per_BBV_hoofdstuk.md — werk alle BBV-hoofdstukken af zonder om bevestiging te vragen."

## Doel

Voeg aan elk BBV-hoofdstuk (behalve 6, die al klaar is) een **"DIT STAAT ER IN HET OVERDRACHTSDOSSIER"**-blok toe, net zoals bij BBV 6 (Sociaal domein). De inhoud komt uit het Overdrachtsdossier raadsverkiezingen 2026 (`wassenaar/overdracht_raadsverkiezingen_2026.md`).

## Context

- **BBV 6 (Sociaal domein)** heeft al zo'n blok. Zie `wassenaar/app.js` functie `loadOverdrachtsdossierContent()` (regel ~1150) en de logica in `openDossier()` waar `bbvIndex === 6` het OD-blok toont.
- Het OD-blok staat in `wassenaar/index.html` als `#overdrachtsdossierBlok` met `#overdrachtsdossierInhoud`.
- De brontekst staat in `wassenaar/overdracht_raadsverkiezingen_2026.md`.

## Mapping OD-hoofdstukken → BBV-hoofdstukken

| BBV | BBV-naam | OD-hoofdstuk(ken) | OD-titel |
|-----|----------|------------------|----------|
| 0 | Bestuur en ondersteuning | 2, 3, 4 | De staat van de gemeentelijke organisatie; De financiële positie; Regionale samenwerkingen |
| 1 | Veiligheid | 5 | Veiligheid en leefbaarheid |
| 2 | Verkeer, vervoer en waterstaat | 5, 6 | (deel van Veiligheid; Wonen en fysieke leefomgeving – mobiliteit) |
| 3 | Economie | 8 | Economie, recreatie en toerisme |
| 4 | Onderwijs | 9 | Sport, cultuur en onderwijs |
| 5 | Sport, cultuur en recreatie | 8, 9 | Economie, recreatie en toerisme; Sport, cultuur en onderwijs |
| 6 | Sociaal domein | 7 | Sociaal Domein en asielopvang ✓ (al gedaan) |
| 7 | Volksgezondheid en milieu | 5, 6 | (deel Veiligheid – afval; Wonen – energietransitie, milieu) |
| 8 | Volkshuisvesting, leefomgeving en stedelijke vernieuwing | 6, 10 | Wonen en fysieke leefomgeving; Projecten |

## Taak

1. **Lees** `wassenaar/overdracht_raadsverkiezingen_2026.md` en haal per BBV-hoofdstuk de relevante passages.
2. **Maak** een samenvatting van 2–4 alinea’s per BBV-hoofdstuk (zoals bij Sociaal domein).
3. **Pas** `wassenaar/app.js` aan:
   - Breid `loadOverdrachtsdossierContent()` uit of maak een mapping `bbvIndex → HTML-inhoud`.
   - Pas de conditie in `openDossier()` aan: toon het OD-blok voor **alle** BBV-hoofdstukken (niet alleen bbvIndex === 6).
   - Zorg dat de juiste inhoud per bbvIndex wordt getoond.
4. **Update** de brontekst in `index.html` (`overdrachtsdossier-bron`) zodat die dynamisch of per BBV-hoofdstuk klopt.

## Formaat van de samenvatting

- Korte, leesbare alinea’s.
- Kernpunten uit het OD: stand van zaken, opgaven, aandachtspunten.
- Optioneel: lijst met relevante beleidsdocumenten (zoals bij Sociaal domein).
- HTML: `<p>`, `<strong>`, `<h4>`, `<ul class="overdracht-doclist">` etc.

## Autonoom uitvoeren

Voer deze taak **volledig zelfstandig** uit. Je hoeft niet om bevestiging te vragen. Werk alle BBV-hoofdstukken 0, 1, 2, 3, 4, 5, 7 en 8 af. Controleer daarna of het OD-blok correct verschijnt en de juiste tekst toont per hoofdstuk.

## Bestanden om te wijzigen

- `wassenaar/app.js` — logica voor OD-blok per BBV
- `wassenaar/index.html` — eventueel brontekst of structuur
- Optioneel: aparte data-structuur (bijv. `OD_SAMENVATTING_PER_BBV`) in app.js
