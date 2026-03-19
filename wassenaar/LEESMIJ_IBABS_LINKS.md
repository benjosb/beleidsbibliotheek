# Standaardcontrole: iBabs-documentlinks

Bij het toevoegen of wijzigen van verwijzingen naar documenten in iBabs (wassenaar.bestuurlijkeinformatie.nl) moet altijd worden gecontroleerd dat de link naar het **juiste document** wijst.

## Probleem

Een agenda-item bevat vaak meerdere documenten:
- **Raadsvoorstel** – het voorstel van het college
- **Bijlage 1, 2, …** – de eigenlijke beleidsstukken (Nota, Visie, etc.)
- **Raadsbesluit** – het vastgestelde besluit van de raad

Dezelfde `documentId` kan niet voor alle documenten gelden. Elk document heeft een eigen `documentId`.

## Controleprocedure

1. **Ga naar de agenda-pagina** van de raadsvergadering (bijv. `/Agenda/Index/{meetingId}`).

2. **Identificeer het gewenste document** – bijv. "Bijlage 1. Nota Woonbeleid" en niet "Geamendeerd-Raadsbesluit Nota Woonbeleid".

3. **Haal het juiste documentId op** via de HTML van de agenda-pagina:
   ```bash
   curl -s "https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/{meetingId}" | grep -o 'documentId=[a-f0-9-]*' | ...
   ```
   Of: open de agenda in de browser, inspecteer de link bij het gewenste document en kopieer de `documentId` uit de `href`.

4. **Verifieer de link** – open de URL en controleer of de paginatitel overeenkomt met het beoogde document.

## URL-formaat

```
https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/{meetingId}?documentId={documentId}&agendaItemId={agendaItemId}
```

- `meetingId` – GUID van de raadsvergadering
- `documentId` – GUID van het specifieke document (PDF)
- `agendaItemId` – GUID van het agendapunt (optioneel maar aanbevolen)

## Voorbeeld: Nota Woonbeleid 2025

| Document | documentId | Gebruik |
|----------|------------|---------|
| Raadsvoorstel Nota Woonbeleid | 4ba7165c-... | ❌ Niet de Nota zelf |
| **Bijlage 1. Nota Woonbeleid (geamendeerd)** | **bdfb8868-7df2-422f-bfbe-dcd9528fbaa6** | ✅ Het beleidsdocument |
| Geamendeerd-Raadsbesluit | a4f56d56-... | ❌ Alleen het besluit |

## Bij toevoegen in app.js

Voeg een comment toe bij BELEIDSNOTA_PER_THEMA of BELEIDSNOTA_PER_TAAKVELD als reminder. Controleer altijd de paginatitel na het openen van de link.
