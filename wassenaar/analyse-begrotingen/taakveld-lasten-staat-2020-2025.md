# Lasten per taakveld 2020–2025 (staat)

**Eenheid:** euro, zoals in brondocument (lasten negatief).

**Bronnen per kolom**
- **2020:** Jaarrekening 2020 (lokaal)
- **2021:** — (geen automatische extract in dit script)
- **2022:** Jaarstukken 2022 (Cuatro, _fetched)
- **2023:** Jaarstukken 2023 (Cuatro, _fetched)
- **2024:** Jaarstukken 2024 (Cuatro, _fetched)
- **2025:** Programmabegroting 2025 (lokaal; raming)

> **Let op:** de bestanden `Jaarstukken_2021.pdf` … `Jaarstukken_2025.pdf` in `analyse-begrotingen/` zijn in deze omgeving **1 pagina** en vrij **zonder tekstlaag** — `pdftotext` kan daar geen tabel uithalen. Voor 2022–2024 zijn daarom de **volledige** PDF’s van Cuatro gebruikt (`analyse-begrotingen/_fetched/`).

**PDF’s opnieuw binnenhalen (Cuatro):**

```bash
mkdir -p analyse-begrotingen/_fetched && cd analyse-begrotingen/_fetched
curl -fsSL -O "https://cuatro.sim-cdn.nl/wassenaar/uploads/jaarstukken-2022__0.pdf"
curl -fsSL -O "https://cuatro.sim-cdn.nl/wassenaar/uploads/Jaarstukken%202023.pdf"
curl -fsSL -O "https://cuatro.sim-cdn.nl/wassenaar/uploads/Jaarstukken%202024.pdf"
```

## Tabel
| Taakveld | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|
| 0.1 | -9500823 | — | -3186294 | -2397568 | -2580157 | — |
| 0.2 | -2379079 | — | -1061018 | — | -1597849 | — |
| 0.3 | -857308 | — | -717945 | — | -537758 | — |
| 0.4 | -1007660 | — | — | — | -17929390 | — |
| 0.5 | -15706 | — | -16090 | — | — | — |
| 0.61 | -283842 | — | -316969 | — | — | — |
| 0.62 | -60483 | — | -63620 | — | — | — |
| 0.64 | 0 | — | -94022 | — | — | — |
| 0.7 | -101461 | — | 0 | — | — | — |
| 0.8 | -278990 | — | -91697 | 0 | 0 | — |
| 1.1 | 0 | — | -4085443 | -5074636 | -1537133 | -10164 |
| 1.2 | 0 | — | — | -1553291 | -2797393 | -7691 |
| 2.1 | -3848536 | — | -4437956 | -5155835 | -4968631 | -2689 |
| 2.2 | -402231 | — | -329118 | -539307 | -473855 | 0 |
| 2.3 | 0 | — | -9 | -8 | -10 | — |
| 2.5 | 0 | — | 0 | 0 | 0 | 0 |
| 3.1 | -382723 | — | -403770 | 0 | -556520 | 0 |
| 3.3 | -95326 | — | -179994 | -173513 | -4529546 | 0 |
| 3.4 | -164983 | — | -106119 | -138161 | -2204192 | -4145 |
| 4.1 | -55036 | — | — | — | -626877 | -48488 |
| 4.2 | -1353156 | — | -94299 | -421523 | -1381508 | — |
| 4.3 | -1507956 | — | 0 | — | -1866682 | — |
| 5.1 | -588050 | — | — | — | -652232 | — |
| 5.2 | -1251727 | — | — | — | -2170226 | — |
| 5.3 | -408455 | — | — | — | — | -4451 |
| 5.4 | -12051 | — | — | — | 0 | — |
| 5.6 | -303891 | — | — | — | -894458 | -27483 |
| 5.7 | -705048 | — | -470554 | -4987881 | -4757107 | — |
| 6.1 | -1639235 | — | — | — | -1122735 | -3739 |
| 6.21 | — | — | — | — | — | -3435 |
| 6.22 | — | — | — | — | — | -2108 |
| 6.23 | — | — | — | — | — | -46780 |
| 6.3 | -641366 | — | — | — | -4702602 | 0 |
| 6.4 | -11309336 | — | — | — | -2266041 | -17927 |
| 6.5 | -1044664 | — | — | — | -9538023 | 0 |
| 6.60 | — | — | — | — | 0 | 0 |
| 6.711 | — | — | — | — | 0 | -27 |
| 6.712 | — | — | — | — | 0 | -2689 |
| 6.713 | — | — | — | — | — | — |
| 6.714 | — | — | — | — | — | 0 |
| 6.751 | — | — | — | — | — | -1111 |
| 6.752 | — | — | — | — | — | — |
| 6.753 | — | — | — | — | — | 0 |
| 6.761 | — | — | — | — | — | 0 |
| 6.762 | — | — | — | — | — | — |
| 6.763 | — | — | — | — | — | — |
| 6.791 | — | — | — | — | — | -9 |
| 6.792 | — | — | — | — | — | — |
| 6.821 | — | — | — | — | — | — |
| 6.822 | — | — | — | — | — | — |
| 6.91 | — | — | — | — | — | — |
| 6.92 | — | — | — | — | — | — |
| 7.1 | -4737699 | — | — | — | -269361 | 0 |
| 7.2 | -1837989 | — | — | -1941344 | -143265 | 0 |
| 7.3 | — | — | — | -4363709 | -125347 | — |
| 7.4 | — | — | — | -1598391 | -1743806 | — |
| 7.5 | — | — | — | -1510442 | -484972 | — |
| 8.1 | -908618 | — | -1207258 | -125142 | -160839 | — |
| 8.2 | -165937 | — | -8962 | -1976908 | -1947900 | -7378 |
| 8.3 | -8660551 | — | -1970074 | -36226 | -36576 | — |

---

## Lege cellen (code × jaar)

Onderstaande combinaties hebben **geen** waarde in het gebruikte extract (lege string in CSV). Dat hoeft niet altijd een fout in de bron te zijn: jaarstukken gebruiken soms **andere Iv3-splitsingen** dan de begroting 2026 (bijv. `6.71`/`6.72` vs `6.711`/`6.712`).

- **0.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.1** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.2** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.2** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.2** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.3** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.3** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.3** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.4** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.4** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.4** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.4** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.5** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.5** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.5** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.5** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.61** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.61** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.61** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.61** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.62** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.62** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.62** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.62** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.64** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.64** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.64** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.64** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.7** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.7** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.7** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.7** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **0.8** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **0.8** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **1.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **1.2** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **1.2** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **2.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **2.2** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **2.3** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **2.3** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **2.5** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **3.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **3.3** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **3.4** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **4.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **4.1** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **4.1** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **4.2** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **4.2** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **4.3** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **4.3** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **4.3** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **5.1** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.1** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.1** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.2** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **5.2** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.2** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.2** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.3** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **5.3** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.3** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.3** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.4** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **5.4** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.4** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.4** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.6** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **5.6** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.6** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **5.7** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **5.7** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.1** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.1** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.21** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.21** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.21** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.21** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.21** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.22** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.22** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.22** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.22** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.22** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.23** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.23** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.23** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.23** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.23** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.3** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.3** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.3** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.4** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.4** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.4** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.5** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.5** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.5** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.60** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.60** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.60** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.60** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.711** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.711** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.711** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.711** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.712** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.712** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.712** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.712** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.713** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.713** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.713** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.713** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.713** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.713** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.714** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.714** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.714** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.714** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.714** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.751** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.751** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.751** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.751** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.751** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.752** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.752** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.752** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.752** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.752** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.752** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.753** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.753** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.753** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.753** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.753** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.761** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.761** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.761** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.761** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.761** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.762** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.762** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.762** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.762** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.762** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.762** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.763** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.763** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.763** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.763** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.763** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.763** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.791** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.791** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.791** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.791** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.791** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.792** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.792** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.792** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.792** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.792** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.792** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.821** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.821** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.821** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.821** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.821** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.821** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.822** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.822** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.822** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.822** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.822** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.822** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.91** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.91** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.91** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.91** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.91** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.91** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.92** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.92** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **6.92** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.92** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.92** × **2024** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **6.92** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **7.1** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.1** × **2023** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.2** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **7.2** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.3** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.3** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **7.3** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.3** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.4** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.4** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **7.4** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.4** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.5** × **2020** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.5** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **7.5** × **2022** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **7.5** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **8.1** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **8.1** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).
- **8.2** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **8.3** × **2021** — 2021: geen automatische extract in dit script — multi-kolom begroting-PDF of aparte volledige jaarstukken-PDF nodig.
- **8.3** × **2025** — geen waarde in extract (code ontbreekt in brontabel of andere Iv3-splitsing dan 2026-begroting).

## Verdachte extracties (bewust leeg gelaten in tabel)

- **1.2** × **2022** — ruwe waarde `-80509233` — abs(-80509233) > 50000000 (waarschijnlijk verkeerde koppeling kolom/rij in pdftotext).
