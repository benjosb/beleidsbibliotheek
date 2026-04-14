# Schrijf-Wijzer

**Status:** Concept · Maart 2026

## Wat is dit?

De Schrijf-Wijzer ondersteunt beleidsmedewerkers bij het schrijven van een concept collegevoorstel. Beleidscontext uit de Besluit-Wijzer wordt **in het document** beschikbaar gemaakt via knoppen — geen copy-paste.

## Twee versies

| Bestand | Beschrijving |
|---------|--------------|
| **schrijf-wijzer-formulier.html** | **Aanbevolen.** Tweetraps: eerst portefeuille, dan subthema-knoppen per sectie. Beleid verschijnt inline in het document. |
| schrijf-wijzer.html | Eenvoudige versie: kies domeinen, zie samenvatting, kopieer. |

## Tweetraps-architectuur (formulier)

1. **Trap 1: Portefeuille** — Kies aan het begin voor welke portefeuille je schrijft (Sociaal Domein, Financiën, etc.). Een medewerker Sociaal Domein schrijft niet over Fysieke Leefomgeving.

2. **Trap 2: Subthema's per sectie** — Binnen elke sectie (Aanleiding, Gevraagde beslissing, etc.) staan knoppen voor de subthema's van die portefeuille. Klik om beleidscontext te tonen; die verschijnt **inline** in de sectie.

## Gebruik

1. Open `schrijf-wijzer-formulier.html`
2. Kies je portefeuille (Trap 1)
3. Vul de secties in; selecteer per sectie de relevante beleidsthema's (Trap 2)
4. De beleidssamenvatting verschijnt direct in de sectie — geen copy-paste
5. Opslaan (lokaal), exporteer als tekst of als JSON (voor agent)

## Agent-toekomst

De "Exporteer JSON (voor agent)"-knop levert een gestructureerd document met:
- Portefeuille
- Per sectie: tekst, geselecteerde subthemas, beleidssamenvatting

Dit formaat is geschikt voor een agent die collegevoorstellen controleert op volledigheid en consistentie, of suggesties doet. Zie `SCHRIJF_WIJZER_ONTWERP_v2.md` voor het volledige ontwerp en agent-advies.

## Bestanden

- `schrijf-wijzer-formulier.html` — Formulier (tweetraps, knoppen in document)
- `schrijf-wijzer.html` — Eenvoudige versie
- `schrijf-wijzer-formulier.js` / `schrijf-wijzer.js` — Logica
- `schrijf-wijzer-formulier.css` / `schrijf-wijzer.css` — Styling
- `schrijf-wijzer-data.js` — Domeinen + subthema's + samenvattingen
- `SCHRIJF_WIJZER_ONTWERP_v2.md` — Ontwerpdocument v2 (tweetraps, agent)
- `SCHRIJF_WIJZER_ONTWERP.md` — Ontwerpdocument v1
