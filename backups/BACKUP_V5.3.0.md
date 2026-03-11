# Backup versie 5.3.0 — Besluit-Wijzer Wassenaar

**Datum backup:** 25 februari 2026  
**Versie:** 5.3.0  
**Doel:** Deze versie goed terug kunnen vinden. Bevat beta Schrijf-Wijzer. Gaat tijdelijk in de koelkast; er komt een andere fork met ander uitgangsprincipe. Mogelijk later terugkeer naar deze versie.

---

## Terugvinden

### 1. Git-tag (aanbevolen)

```bash
git checkout v5.3.0
```

Of bekijk de tag op GitHub: `https://github.com/benjosb/beleidsbibliotheek/releases/tag/v5.3.0`

### 2. Lokale backup-map

```
backups/wassenaar_v5.3.0_2026-02-25/
```

Volledige kopie van de `wassenaar/` map op 25 februari 2026. *Niet in git (te groot); alleen lokaal beschikbaar.*

### 3. Commit-hash

Na tagging: zie `git log v5.3.0 -1` voor de exacte commit.

---

## Inhoud v5.3.0

- **Besluit-Wijzer:** Beleidsdossiers, coalitieakkoord, besluiten 2019–2025
- **Schrijf-Wijzer (beta):** Tweetraps-formulier met domein-selectie en beleidssamenvattingen
- **Roadmap & Verbeterpunten:** (menu zichtbaar in deze backup)
- **Data:** iBabs + Officiële Bekendmakingen 2022–2025
- **Domeinclustering:** 6 portefeuille-thema's, incl. override omgevingsvergunningen → Ruimte
- **WMO-tegel:** Uitsluiting rioolheffing/waterzorgheffing (geen valse match op "zorg")

---

## Gebruik van deze backup

- **Terugzetten:** Kopieer `backups/wassenaar_v5.3.0_2026-02-25/*` naar `wassenaar/`
- **Vergelijken:** `diff -r wassenaar/ backups/wassenaar_v5.3.0_2026-02-25/`
- **Fork:** Start een nieuwe branch vanaf `v5.3.0` voor de alternatieve aanpak
