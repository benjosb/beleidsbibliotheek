# Besluit-Wijzer — TODO

## Portefeuille-kopjes filteren (lege "besluiten")

**Probleem:** De PDF-parser maakte van elk kopje (5.a, 5.b, 5.c) een apart "besluit". Die kopjes zijn alleen sectie-headers (bijv. "Sociaal Domein, Wonen en Onderwijs") — geen echte besluiten. Ze hebben lege besluittekst en vervuilen de lijst.

**Referentie:** [Besluitenlijst Wassenaar 17 dec 2024](https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_17_december_2024.pdf) — 5.b is een kopje, 5.b.1, 5.b.2, 5.b.3 zijn de echte besluiten.

**Oplossing (beide toegepast voor Wassenaar):**
1. **Parser:** `download_collegebesluiten.py` — skip secties waar agendapunt = 5.a, 5.b, 5.c (zonder subnummer) én geen Besluit-tekst
2. **Display:** `app.js` — filter in loadData() om collegebesluiten met lege besluit + portefeuillenaam als naam uit te sluiten

| Gemeente      | Status   | Opmerking |
|---------------|----------|-----------|
| Wassenaar     | ✅ Gereed | Parser + display filter |
| Geldrop-Mierlo| 🔲 TODO  | Zelfde aanpassing (parser + display filter) |
| Voorschoten   | 🔲 TODO  | Zelfde aanpassing (parser + display filter) |
