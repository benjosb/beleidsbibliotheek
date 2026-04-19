#!/usr/bin/env python3
"""Merge ANALYSE into FINANCIEEL_BBV_BELEIDSBIBLIOTHEEK.md"""
from pathlib import Path

doc = Path(__file__).resolve().parent
analyse = (doc / "ANALYSE_BEGROTINGEN_2023_2026.md").read_text(encoding="utf-8")
lines = analyse.splitlines()
# Section 2 body: after "## Cruciale bevinding" through --- (lines 10-25 in file)
sect2 = "## 2. Programmastructuur vs BBV (Iv3)\n\n" + "\n".join(lines[10:25])
# From ## 1. Totaal to end (line 27 in file = index 26)
tail = "\n".join(lines[26:])
tail = tail.replace("## 1. Totaaloverzicht", "## 3. Totaaloverzicht per jaar", 1)
tail = tail.replace("## 2. Baten en lasten per programma", "## 4. Baten en lasten per programma", 1)
tail = tail.replace("## 3. Taakvelden per BBV", "## 5. Taakvelden per BBV-hoofdstuk", 1)
tail = tail.replace("## 4. Saldo per BBV", "## 6. Saldo per BBV-hoofdstuk", 1)
tail = tail.replace("## 5. Kengetallen", "## 7. Kengetallen financiële positie", 1)
tail = tail.replace("## 6. Meerjarenresultaat", "## 8. Meerjarenresultaat inclusief reserves", 1)
tail = tail.replace("## 7. Conclusies", "## 9. Conclusies voor koppeling aan BeleidsBibliotheek", 1)
tail = tail.replace("## Bronbestanden", "## 10. Bronbestanden (lokale PDF's in deze map)", 1)

header = """# Financieel dossier BBV — BeleidsBibliotheek Wassenaar

**Samenvatting:** Eén document: **officiële PDF-bronnen**, **analyse 2023–2026** (programma, macro, taakvelden H0–H8, kengetallen), en **koppeling website** (`financieel-bbv-begroting-2026.js`).

| | |
|---|---|
| **Samenvoeging dossier** | 19 april 2026 |
| **Oorspronkelijke analyse** | 13 april 2026 (inhoud hieronder samengevoegd) |
| **PDF-webbronnen** | april 2026 (tekstextractie gecontroleerd) |

---

## 1. Officiële PDF-bronnen op wassenaar.nl (Cuatro)

| # | Document | Pagina | Soort | Wat staat er (kern) |
|---|----------|--------|--------|----------------------|
| 1 | [Begroting Wassenaar 2021–2024](https://cuatro.sim-cdn.nl/wassenaar/uploads/begroting-wassenaar-2021-2024.pdf?cb=yr_00F3B) | **195** | **Begroting** | *Overzicht baten en lasten per taakveld*. Per programma (P0 …) Iv3-taakvelden met Baten / Lasten / Saldo voor **begroting 2021**. |
| 2 | [Jaarstukken 2022](https://cuatro.sim-cdn.nl/wassenaar/uploads/jaarstukken-2022__0.pdf) | **173** | **Verantwoorden / toezicht** | **Geen** taakveld-overzicht: *Analyse begrotingsafwijkingen en begrotingsrechtmatigheid* (o.a. goedkeuringstolerantie, BBV art. 28, Gw art. 189). **Tabel op programmaniveau** (P0–P8): begroting na wijziging vs **realisatie 2022**. |
| 3 | [Begroting 2023–2026 (definitief okt. 2022)](https://cuatro.sim-cdn.nl/wassenaar/uploads/begroting_2023-2026_-_definitieve_versie_drukker_6_oktober_2022.pdf?cb=GhrZ0ovA) | **105** | **Begroting** | *Tabel 12.5 – Baten en lasten per taakveld*, **begroting 2023** (oudere 6.x-splitsing o.a. 6.71a–d, 6.72a–d). |
| 4 | [Jaarstukken 2024](https://cuatro.sim-cdn.nl/wassenaar/uploads/Jaarstukken%202024.pdf?cb=lt3uEKU_) | **163** | **Begroting + verantwoorden** | *Overzicht baten en lasten per taakveld*: **begroting primair 2024**, **na wijziging**, **realisatie 2024** — taakveldniveau. |
| 5 | [Begroting gemeente Wassenaar 2025 (geamendeerd)](https://cuatro.sim-cdn.nl/wassenaar/uploads/begroting_gemeente_wassenaar_2025_geamendeerd.pdf?cb=J0EGWtdk) | **131** | **Begroting** | *Tabel 12.5*, **begroting 2025** — Iv3 in actuele vorm (6.21–6.23, 6.711, 6.751 …). |

**Duiding:** **Begroten** = rijen 1, 3, 5 en de begrotingskolommen in rij 4; **verantwoorden** = realisatie (rij 4) en programma-realise 2022 (rij 2).

**Nummering jeugd/WMO:** in oudere begrotingen o.a. **6.72a–6.74c**; in **2025** en in de BBV-ui **6.751–6.763**.

*PDF-tekstpagina's gecontroleerd met `pdftotext` (april 2026).*

---

"""

footer = """

---

## 11. Koppeling BeleidsBibliotheek (technisch)

| Onderdeel | Locatie / gedrag |
|-----------|------------------|
| **Machineleesbare data 2026** | `wassenaar/financieel-bbv-begroting-2026.js` — zelfde bedragen als **§5** (*Taakvelden per BBV-hoofdstuk — Begroting 2026*), eenheden **hele euro's**. |
| **UI-clustering → Iv3-som** | `FINANCIEEL_UI_CLUSTER_NAAR_CODES` in dat JS-bestand. |
| **Easter egg** | Dubbelklik **versienummer** (footer) → `body.toon-begroting`. |
| **Verantwoorden** | Niet in JS; zie jaarstukken — **§1** (Jaarstukken 2024 p. 163). |

---

*Einde gecombineerd dossier. Het bestand `ANALYSE_BEGROTINGEN_2023_2026.md` blijft als identieke archiefkopie beschikbaar; wijzig één van beide en sync handmatig of via dit script.*
"""

out = header + sect2 + "\n\n" + tail + footer
(doc / "FINANCIEEL_BBV_BELEIDSBIBLIOTHEEK.md").write_text(out, encoding="utf-8")
Path("/tmp/merged_financieel_bbv.md").write_text(out, encoding="utf-8")
print("Wrote", doc / "FINANCIEEL_BBV_BELEIDSBIBLIOTHEEK.md", "chars", len(out))
