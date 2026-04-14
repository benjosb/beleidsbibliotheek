# Ondernemen (WIL / BeleidsWijzer)

Hier hoort werk dat **niet** de live productcode is (`wassenaar/`, `besluit-wijzer-landing/`, enz.), maar wél bij **opdrachten, positionering, AI-sessies en uitbreiding naar andere gemeenten**.

## Principes (weinig hoofdpijn)

- **Maximaal twee lagen** onder `ondernemen/` — liever brede mappen dan diepe bomen.
- **Eén map per klant/gemeente** onder `gemeenten/` zodra die bestaat; tot die tijd blijft Wassenaar-concreet werk in `wassenaar/`.
- **Adviesruimte** = het product/verhaal/herbruikbare stukken dat over alle gemeenten heen loopt.

## Structuur

| Map | Inhoud |
|-----|--------|
| `wassenaar/` | Alles wat specifiek de **pilot Wassenaar** is: prompts, notities, offertes, exports voor gesprekken, enz. |
| `gemeenten/` | Per **andere** gemeente een eigen submap (bijv. `gemeenten/rotterdam/`). Pas aanmaken als er echt een tweede klant is. |
| `adviesruimte/` | **Adviesruimte**: positionering, aanpak, herbruikbare templates, conceptteksten — niet gebonden aan één gemeente. |

## Wat hier níét hoeft

- Broncode van de BeleidsWijzer-app → blijft in `wassenaar/` (repo-root).
- Algemene persoonlijke administratie (KVK, privé) → liever buiten deze repo of in je eigen `__2026_ondernemen`-structuur.

## TERSTOND / andere projecten

Kopieer een apart project hierheen als **`ondernemen/<logische-naam>/`** alleen als het bij bovenstaande hoort. Anders liever een **eigen repo** of map buiten `beleidsbibliotheek` om de repo niet te vervuilen.
