# Financieel dossier BBV — BeleidsBibliotheek Wassenaar

**Samenvatting:** Eén bestand met **officiële PDF-bronnen** (Cuatro), de volledige **analyse begrotingen 2023–2026** (programma P1–P5, macro, taakvelden H0–H8, kengetallen, conclusies, lokale bron-PDF’s), en de **technische koppeling** aan `financieel-bbv-begroting-2026.js`. Het eerdere aparte bron-PDF-overzicht en de analyse zijn hierin samengevoegd.

| | |
|---|---|
| **Samenvoeging dossier** | 19 april 2026 |
| **Oorspronkelijke analyse** | 13 april 2026 (inhoud hieronder; archiefkopie: `ANALYSE_BEGROTINGEN_2023_2026.md`) |
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

**Duiding:** **Begroten** = rijen 1, 3, 5 en de begrotingskolommen in rij 4; **verantwoorden** = realisatie (rij 4) en programma-realise 2022 (rij 2). De webdataset **2026** sluit aan op hetzelfde soort taakveldtabellen (andere jaargang).

**Nummering jeugd/WMO:** in oudere begrotingen o.a. **6.72a–6.74c**; in **2025** en in de BBV-ui **6.751–6.763**. Altijd **jaar + tabelkop** meenemen.

*PDF-tekstpagina’s gecontroleerd met `pdftotext` (april 2026).*

---

## 2. Programmastructuur vs BBV (Iv3)

### Cruciale bevinding: programmastructuur ≠ BBV H0–H8

Wassenaar gebruikt **geen** standaard BBV-hoofdstukkenindeling (H0–H8). In plaats daarvan hanteert de gemeente **5 eigen programma's (P1–P5)**. De BBV-taakvelden (IV3) zijn echter wél beschikbaar per programma.

### Mapping Wassenaar-programma's → BBV-taakvelden

| Programma | BBV-taakvelden | Overeenkomst BBV-hoofdstuk |
|---|---|---|
| P1 Veiligheid en Handhaving | 1.1, 1.2 | H1 Veiligheid |
| P2 Mens en Maatschappij | 4.1, 4.3, 5.1–5.3, 5.6, 6.x, 7.1 | H4 Onderwijs + H5 Sport/cultuur + H6 Sociaal domein + H7 Volksgezondheid (deels) |
| P3 Bestuur en Middelen | 0.1–0.9 | H0 Bestuur en ondersteuning |
| P4 Fysieke Leefomgeving | 4.2, 5.5, 7.5, 8.1–8.3 | H4 Onderwijs (huisvesting) + H5 Erfgoed + H7 (begraafplaatsen) + H8 VHROSV |
| P5 Natuur, Klimaat en Mobiliteit | 2.1–2.5, 3.1, 3.3–3.4, 5.7, 7.2–7.4 | H2 Verkeer + H3 Economie + H5 Groen + H7 Milieu/riool/afval |

**Let op:** P2, P4 en P5 bevatten elk taakvelden uit meerdere BBV-hoofdstukken. Een 1-op-1 mapping P→H is daardoor niet mogelijk, maar een mapping **taakveld→BBV-hoofdstuk** wél.

---

## 3. Totaaloverzicht per jaar (x € 1.000)

| | 2023 | 2024 | 2025 | 2026 |
|---|---:|---:|---:|---:|
| **Totale baten** | 79.847 | 88.353 | 93.255 | 95.560 |
| **Totale lasten** | -79.455 | -88.320 | -93.246 | -95.520 |
| **Begrotingssaldo** | **+392** | **+32** | **+9** | **+39** |
| Gemeentefonds | 38.708 | 42.701 | 44.773 | 47.715 |
| OZB totaal | 13.908 | 12.020 | 13.546 | 14.208 |
| Reserves (totaal) | 56.597 | 55.063 | 51.322 | 52.085 |
| Voorzieningen (totaal) | 18.441 | 16.972 | 16.147 | 16.174 |

---

## 4. Baten en lasten per programma — alle vier jaren (x € 1.000)

### P1 Veiligheid en Handhaving

| | Begr. 2023 | Begr. 2024 | Begr. 2025 | Begr. 2026 |
|---|---:|---:|---:|---:|
| Baten | 1.101 | 102 | 105 | 105 |
| Lasten | -4.427 | -4.204 | -4.602 | -4.641 |
| **Saldo** | **-3.326** | **-4.103** | **-4.496** | **-4.536** |

### P2 Mens en Maatschappij

| | Begr. 2023 | Begr. 2024 | Begr. 2025 | Begr. 2026 |
|---|---:|---:|---:|---:|
| Baten | 7.921 | 11.652 | 12.099 | 11.085 |
| Lasten | -33.826 | -38.934 | -40.391 | -41.536 |
| **Saldo** | **-25.905** | **-27.281** | **-28.292** | **-30.450** |

### P3 Bestuur en Middelen

| | Begr. 2023 | Begr. 2024 | Begr. 2025 | Begr. 2026 |
|---|---:|---:|---:|---:|
| Baten | 57.588 | 60.114 | 64.233 | 68.309 |
| Lasten | -20.259 | -19.786 | -23.203 | -24.433 |
| **Saldo** | **+37.328** | **+40.328** | **+41.030** | **+43.876** |

### P4 Fysieke Leefomgeving

| | Begr. 2023 | Begr. 2024 | Begr. 2025 | Begr. 2026 |
|---|---:|---:|---:|---:|
| Baten | 1.501 | 1.879 | 2.366 | 2.084 |
| Lasten | -3.710 | -6.176 | -5.055 | -4.498 |
| **Saldo** | **-2.209** | **-4.296** | **-2.689** | **-2.414** |

### P5 Natuur, Klimaat en Mobiliteit

| | Begr. 2023 | Begr. 2024 | Begr. 2025 | Begr. 2026 |
|---|---:|---:|---:|---:|
| Baten | 11.237 | 12.224 | 12.989 | 13.524 |
| Lasten | -17.233 | -19.221 | -19.995 | -20.412 |
| **Saldo** | **-5.996** | **-6.997** | **-7.005** | **-6.888** |

---

## 5. Taakvelden per BBV-hoofdstuk — Begroting 2026 (hele euro's)

Hieronder de taakvelden gehergroepeerd naar de BBV-hoofdstukken die de BeleidsBibliotheek hanteert.

### H0 — Bestuur en ondersteuning

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 0.1 Bestuur | 2.781 | -2.183.291 | -2.180.510 |
| 0.2 Burgerzaken | 727.998 | -1.585.966 | -857.968 |
| 0.3 Beheer overige gebouwen en gronden | 84.910 | -804.758 | -719.848 |
| 0.4 Overhead | 4.217.637 | -18.818.697 | -14.601.060 |
| 0.5 Treasury | 877.755 | -164.912 | 712.843 |
| 0.61 OZB Woningen | 10.369.790 | -383.885 | 9.985.905 |
| 0.62 OZB Niet-Woningen | 3.838.146 | -66.888 | 3.771.258 |
| 0.64 Belastingen overig | 475.168 | -113.597 | 361.571 |
| 0.7 Alg. uitkering gemeentefonds | 47.714.795 | 0 | 47.714.795 |
| 0.8 Overige baten en lasten | 0 | -310.544 | -310.544 |
| **Totaal H0** | **68.308.980** | **-24.432.538** | **43.876.442** |

### H1 — Veiligheid

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 1.1 Crisisbeheersing en brandweer | 0 | -2.776.480 | -2.776.480 |
| 1.2 Openbare orde en veiligheid | 105.457 | -1.864.852 | -1.759.395 |
| **Totaal H1** | **105.457** | **-4.641.332** | **-4.535.875** |

### H2 — Verkeer, vervoer en waterstaat

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 2.1 Verkeer en vervoer | 492.198 | -4.881.944 | -4.389.746 |
| 2.2 Parkeren | 146.187 | -407.155 | -260.968 |
| 2.3 Recreatieve havens | 27.269 | -4.481 | 22.788 |
| 2.5 Openbaar vervoer | 0 | -12.185 | -12.185 |
| **Totaal H2** | **665.654** | **-5.305.765** | **-4.640.111** |

### H3 — Economie

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 3.1 Economische ontwikkeling | 0 | -570.464 | -570.464 |
| 3.3 Bedrijfsloket en bedrijfsregelingen | 108.446 | -142.302 | -33.856 |
| 3.4 Economische promotie | 2.387.498 | -139.833 | 2.247.665 |
| **Totaal H3** | **2.495.944** | **-852.599** | **1.643.345** |

### H4 — Onderwijs

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 4.1 Openbaar basisonderwijs | 12.236 | -169.794 | -157.558 |
| 4.2 Onderwijshuisvesting | 0 | -1.428.313 | -1.428.313 |
| 4.3 Onderwijsbeleid en leerlingzaken | 525.291 | -1.849.303 | -1.324.012 |
| **Totaal H4** | **537.527** | **-3.447.410** | **-2.909.883** |

### H5 — Sport, cultuur en recreatie

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 5.1 Sportbeleid en activering | 149.913 | -784.082 | -634.169 |
| 5.2 Sportaccommodaties | 583.677 | -1.989.166 | -1.405.489 |
| 5.3 Cultuurpresentatie, -productie en -participatie | 60.347 | -542.322 | -481.975 |
| 5.5 Cultureel erfgoed | 4.571 | -531.729 | -527.158 |
| 5.6 Media | 137.817 | -859.042 | -721.225 |
| 5.7 Openbaar groen, (openlucht)recreatie | 202.857 | -4.808.717 | -4.605.860 |
| **Totaal H5** | **1.139.182** | **-9.515.058** | **-8.375.876** |

### H6 — Sociaal domein

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 6.1 Samenkracht en burgerparticipatie | 1.940.608 | -5.671.866 | -3.731.258 |
| 6.21 Toegang en eerstelijnsvoorz. WMO | 94.940 | -921.160 | -826.220 |
| 6.22 Toegang en eerstelijnsvoorz. Jeugd | 0 | -1.083.875 | -1.083.875 |
| 6.23 Toegang en eerstelijnsvoorz. Integraal | 0 | -909.709 | -909.709 |
| 6.3 Inkomensregelingen | 7.138.140 | -10.194.995 | -3.056.855 |
| 6.4 WSW en beschut werk | 0 | -1.076.222 | -1.076.222 |
| 6.5 Arbeidsparticipatie | 0 | -853.919 | -853.919 |
| 6.60 Hulpmiddelen en diensten (WMO) | 17.425 | -973.006 | -955.581 |
| 6.711 Hulp bij het huishouden (WMO) | 150.000 | -2.429.246 | -2.279.246 |
| 6.712 Begeleiding (WMO) | 0 | -754.845 | -754.845 |
| 6.713 Dagbesteding (WMO) | 0 | -280.371 | -280.371 |
| 6.714 Ov. maatwerkarrangementen (WMO) | 0 | 0 | 0 |
| 6.751 Jeugdhulp ambulant lokaal | 0 | -711.096 | -711.096 |
| 6.752 Jeugdhulp ambulant regionaal | 0 | -4.104.095 | -4.104.095 |
| 6.753 Jeugdhulp ambulant landelijk | 0 | 100.000 | 100.000 |
| 6.761 Jeugdhulp met verblijf lokaal | 0 | -105.096 | -105.096 |
| 6.762 Jeugdhulp met verblijf regionaal | 0 | -1.409.935 | -1.409.935 |
| 6.763 Jeugdhulp met verblijf landelijk | 0 | -126.087 | -126.087 |
| 6.791 PGB Wmo | 0 | -178.955 | -178.955 |
| 6.792 PGB Jeugd | 0 | -188.658 | -188.658 |
| 6.821 Jeugdbescherming | 0 | -236.413 | -236.413 |
| 6.822 Jeugdreclassering | 0 | -105.072 | -105.072 |
| 6.91 Coordinatie en beleid WMO | 0 | -642.182 | -642.182 |
| 6.92 Coordinatie en beleid Jeugd | 0 | -692.876 | -692.876 |
| **Totaal H6** | **9.341.113** | **-33.479.679** | **-24.138.566** |

### H7 — Volksgezondheid en milieu

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 7.1 Volksgezondheid | 274.689 | -1.792.175 | -1.517.486 |
| 7.2 Riolering | 3.105.702 | -2.301.272 | 804.430 |
| 7.3 Afval | 6.539.076 | -5.223.686 | 1.315.390 |
| 7.4 Milieubeheer | 515.000 | -1.920.410 | -1.405.410 |
| 7.5 Begraafplaatsen en crematoria | 56.781 | -271.797 | -215.016 |
| **Totaal H7** | **10.491.248** | **-11.509.340** | **-1.018.092** |

### H8 — Volkshuisvesting, ruimtelijke ordening en stedelijke vernieuwing

| Taakveld | Baten | Lasten | Saldo |
|---|---:|---:|---:|
| 8.1 Ruimte en leefomgeving | 13.000 | -1.116.357 | -1.103.357 |
| 8.2 Grondexploitatie (niet bedr.terrein) | 0 | 0 | 0 |
| 8.3 Wonen en bouwen | 2.009.547 | -1.149.990 | 859.557 |
| **Totaal H8** | **2.022.547** | **-2.266.347** | **-243.800** |

### Voorbeeld — per taakveld: keten, 4 jaar, aandeel *(Iv3 4.2 Onderwijshuisvesting)*

Dit werkt het gebruikersidee uit: **taakveld → BBV-hoofdstuk → begroting**, plus **ontwikkeling over vier begrotingsjaren** en **positie t.o.v. totaal en t.o.v. hoofdstuk**.

**Keten (drie lagen, niet door elkaar halen):**

| Laag | Waarde voor dit voorbeeld |
|------|---------------------------|
| **Iv3-taakveld** | **4.2** — Onderwijshuisvesting |
| **BBV-hoofdstuk** (BeleidsBibliotheek / OD) | **H4** — Onderwijs |
| **Programma** gemeente Wassenaar (programmarekening) | **P4** — Fysieke Leefomgeving *(4.2 staat in P4 samen met o.a. 5.5, 7.5, 8.x — zie §2)* |

**Metrieken (begroten, geen realisatie):**

1. **Meerjarenontwikkeling** — hier uit **begroting** per jaar: baten, lasten, saldo (voor 4.2 zijn baten in deze jaren **0**; lasten zijn de “volume”-indicator).
2. **Aandeel van de totale gemeentebegroting** — |lasten taakveld| t.o.v. **som der lasten** gemeente (uit §3).
3. **Aandeel binnen het BBV-hoofdstuk** — |lasten 4.2| t.o.v. **som lasten H4** (§5, totaalregel H4).
4. *(Optioneel)* **Aandeel binnen P4** — |lasten 4.2| t.o.v. programma P4-lasten (§4, kolom begroting 2026).

**Bronnen per jaar** (Cuatro-PDF’s; controle april 2026, `pdftotext -layout` op P4-tabel “Saldo van baten en lasten per taakveld”):

| Jaar | Document | 4.2 Baten | 4.2 Lasten | 4.2 Saldo |
|------|----------|----------:|-----------:|----------:|
| 2023 | *Begroting 2023–2026* (def. 6 okt 2022), tabel begroting **2023** | 0 | -1.111.641 | -1.111.641 |
| 2024 | *Jaarstukken 2024*, **begroting na wijziging 2024** (zelfde taakveldregel) | 0 | -1.328.393 | -1.328.393 |
| 2025 | *Begroting 2025* (geamendeerd) | 0 | -1.411.640 | -1.411.640 |
| 2026 | *Begroting 2026* (= §5 dit dossier) | 0 | -1.428.313 | -1.428.313 |

*Toelichting 2024:* in Jaarstukken staat ook *begroting primair 2024* met lasten **-1.371.931**; voor vergelijking met latere vastgestelde begrotingen is **na wijziging** gekozen.

**Lezing:** de **lasten** voor onderwijshuisvesting stijgen van ca. **1,11 mln** (2023) naar ca. **1,43 mln** (2026) — ruim **+28%** in vier jaar; past bij langlopende investeringen (IHP onderwijs e.d.).

**Aandelen begroting 2026** (consistent met §3–§5):

- **Totaal lasten gemeente 2026:** 95.520.000 → \|4.2\| / totaal ≈ **1,49%** van alle gemeentelijke lasten.
- **Binnen H4:** lasten H4 totaal **3.447.410** → \|4.2\| / H4-lasten ≈ **41,4%** van het hoofdstuk Onderwijs (de overige lasten H4 zitten op 4.1 en 4.3).
- **Binnen P4** (optioneel): lasten P4 begroting 2026 **4.498.000** (§4, × € 1.000) → \|4.2\| / P4-lasten ≈ **31,8%** van het programma Fysieke Leefomgeving.

*UI-notitie:* dezelfde logica is voor andere Iv3-regels te herhalen zodra per taakveld een **vierkoloms serie** in machineleesbare vorm staat (nu heeft `financieel-bbv-begroting-2026.js` alleen **2026** volledig; meerjaren per taakveld kan een kleine dataset of CSV zijn die §5 aanvult). **BI-dashboard (alle Iv3-regels uit de dataset):** `wassenaar/bi-taakveld-dashboard.html` — query `?tv=4.2` (of andere code). Lokaal: `python3 dashboard.py` → `http://127.0.0.1:8800/local-site/bi-taakveld-dashboard.html?tv=4.2`. Oude pad `analyse-begrotingen/bi-voorbeeld-4.2.html` verwijst door. **Meerjarenlijn:** alleen waar `financieel-taakveld-dashboard-meta.js` → `FINANCIEEL_MEERJAREN_LASTEN_ABS` een reeks heeft (nu o.a. **4.2**); overige taakvelden: KPI 2026 + donut, placeholder bij lijngrafiek tot meerjaren zijn ingevuld.

---

## 6. Saldo per BBV-hoofdstuk — meerjarig (x € 1.000, afgeleid)

Onderstaande tabel is afgeleid uit de taakveldoverzichten per begrotingsjaar.

| BBV-hoofdstuk | 2023 | 2024 | 2025 | 2026 |
|---|---:|---:|---:|---:|
| H0 Bestuur en ondersteuning | +37.328 | +40.328 | +41.030 | +43.876 |
| H1 Veiligheid | -3.326 | -4.103 | -4.496 | -4.536 |
| H2 Verkeer, vervoer, waterstaat | ~-4.693 | ~-4.756 | ~-4.858 | -4.640 |
| H3 Economie | ~+1.908 | ~+1.826 | ~+1.682 | +1.643 |
| H4 Onderwijs | ~-1.935 | ~-1.911 | ~-3.054 | -2.910 |
| H5 Sport, cultuur, recreatie | ~-7.808 | ~-8.069 | ~-8.076 | -8.376 |
| H6 Sociaal domein | ~-22.319 | ~-23.337 | ~-23.948 | -24.139 |
| H7 Volksgezondheid en milieu | ~-594 | ~-381 | ~-838 | -1.018 |
| H8 VHROSV | ~-2.745 | ~-4.296 | ~-2.193 | -244 |

*NB: De waarden voor 2023 en 2024 zijn geschat o.b.v. de taakveldtabellen per programma. Voor 2025 en 2026 zijn de exacte taakveldtabellen beschikbaar.*

---

## 7. Kengetallen financiële positie

| Kengetal | 2023 | 2024 | 2025 | 2026 |
|---|---:|---:|---:|---:|
| Netto schuldquote | -25% | -9,3% | -1,3% | -0,5% |
| Solvabiliteitsratio | 67% | 65% | 62,1% | 60% |
| Structurele exploitatieruimte | 2,63% | 0,04% | 0,0% | 0,1% |
| Belastingcapaciteit | 173% | 172% | 181,6% | 183,5% |
| Weerstandsratio | 15,5 | 17,4 | 10,8 | 9,6 |

Alle jaren: categorie A (uitstekend). Negatieve schuldquote = meer bezittingen dan schulden.

---

## 8. Meerjarenresultaat inclusief reserves (x € 1.000)

| | 2023 | 2024 | 2025 | 2026 | 2027 | 2028 | 2029 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Saldo baten/lasten | -108 | -2.349 | -1.453 | -412 | +193 | -864 | -907 |
| Mutaties reserves | +500 | +2.382 | +1.462 | +452 | 0 | 0 | 0 |
| **Begrotingssaldo** | **+392** | **+32** | **+9** | **+39** | **+193** | **-864** | **-907** |

---

## 9. Conclusies voor koppeling aan BeleidsBibliotheek

### Wat direct koppelbaar is
- **Taakveldnummers** zijn consistent over alle vier begrotingen en mappen 1-op-1 op de BBV-taakvelden in `data.js`
- Per taakveld zijn baten, lasten en saldo beschikbaar in hele euro's (uit de taakveldoverzichten)
- Meerjarenramingen zijn beschikbaar (elk begrotingsdocument bevat 4 jaar vooruit)

### Aandachtspunten
1. **Taakveldindeling is gewijzigd tussen 2023 en 2025**: de jeugdhulp-taakvelden zijn in 2025 hernummerd (van 6.72a/6.72b/... naar 6.751/6.752/...). Dit moet bij koppeling worden geharmoniseerd.
2. **Programma ≠ BBV-hoofdstuk**: we moeten via taakveldnummers mappen, niet via programmanamen.
3. **Bedragen:** Programmaoverzichten zijn in x € 1.000, taakveldoverzichten in hele euro's. Uniformeren bij koppeling.
4. **Reserves en voorzieningen** zijn niet per taakveld, maar per programma of per specifieke bestemming beschikbaar.

### Gedetailleerde taakveldtabellen
De volledige taakveldtabellen per jaar staan in de vier subagent-analyses die als bronmateriaal zijn gebruikt. De PDFs staan in deze map.

---

## 10. Bronbestanden (lokale PDF’s in deze map)

| Bestand | Omvang | Pagina's |
|---|---|---|
| `begroting_2023.pdf` | 4,8 MB | 109 |
| `begroting_2024.pdf` | 3,2 MB | 121 |
| `begroting_2025.pdf` | 2,9 MB | 136 |
| `begroting_2026.pdf` | 2,0 MB | 120 |

---

## 11. Koppeling BeleidsBibliotheek (technisch)

| Onderdeel | Locatie / gedrag |
|-----------|------------------|
| **Machineleesbare data 2026** | `wassenaar/financieel-bbv-begroting-2026.js` — zelfde bedragen als **§5** (*Taakvelden per BBV-hoofdstuk — Begroting 2026*), eenheden **hele euro's**. |
| **UI-clustering → Iv3-som** | `FINANCIEEL_UI_CLUSTER_NAAR_CODES` in dat JS-bestand (bijv. tegel `6.2` → som 6.21–6.23). |
| **Easter egg** | Dubbelklik **versienummer** (footer) → `body.toon-begroting`: BBV-kaarten = begrote **lasten** per hoofdstuk; dossier rechts = **baten/lasten/saldo** per taakveld. |
| **Verantwoorden (realisatie)** | Niet in JS; zie jaarstukken — **§1** (o.a. Jaarstukken 2024 p. 163). |

---

*Einde gecombineerd dossier.*
