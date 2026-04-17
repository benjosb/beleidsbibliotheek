# Status — BeleidsBibliotheek Wassenaar

**Laatste sessie:** 2026-04-18 (zaterdag)

## Waar we mee bezig waren

P0-backlog afwerken; mobiel menu (B-002) was nog open.

## Wat er gedaan is (deze sessie)

### Reactie H5 OD-samenvatting (e-mail 18 apr 2026)
- Bron: `_reacties/BeleidsBibliotheek — Document ontbreekt (H5 Sport, cultuur en recreatie) — 2026-04-18 01_07.eml`
- `wassenaar/app.js`: OD-samenvatting BBV-hoofdstuk 5 uitgebreid (Sportvisie 2025, Fit in Wassenaar, Sportakkoord II, GALA, sport- en beweegcoaches, verenigingen, jeugdledensubsidie).
- `wassenaar/werklijst-mutaties.html`: mutatie **M2026-008** toegevoegd, status verwerkt + gepubliceerde reactie.
- `wassenaar/index.html`: `app.js` cache-query `?v=20260418a`.

### Vergelijker dashboard — drie omgevingen in één venster
- `docs/vergelijk.html`: standaard **drie kolommen** (lokaal · ACC · PROD); dropdown voor alleen 2 kolommen (pairwise). Scroll-sync stuurt naar alle **zichtbare** iframes. Knop “Herlaad” alleen zichtbare panelen.
- **Lokaal zonder gedoe:** `dashboard.py` serveert `wassenaar/` onder **`http://127.0.0.1:8800/local-site/`**; de vergelijker vult dat automatisch in (oude opgeslagen `http://127.0.0.1:8765` zonder pad wordt gemigreerd). Open de vergelijker via **http://127.0.0.1:8800/vergelijk.html**, niet als `file://`.

### B-002 — Mobiel menu Overdrachtsdossier
- **Oorzaak:** De hamburger-knop gebruikte `position: absolute; top: 50%; transform: translateY(-50%)`. Bij een geopend menu wordt de groene nav-balk veel hoger; het icoon bleef dan visueel in het **midden** van de balk en bedekte het **tweede** navigatie-item (Overdrachtsdossier).
- **Fix:** In `wassenaar/styles.css` (media `max-width: 768px`): bij `.site-nav-bar.nav-open .nav-hamburger` de knop naar `top: 0.5rem` en `transform: none` zodat die bovenin blijft en beide links zichtbaar en klikbaar zijn.
- `BACKLOG.md`: B-002 op `done`, Mermaid P0 bijgewerkt, changelogregel toegevoegd.

### Eerdere sessies (samenvatting)
- Dashboard, backups, LaunchAgent, `WERKWIJZE.md`, deploy-workflow; zie eerdere STATUS-regels.

## Volgende stap

1. **Deploy** — wijziging naar ACC testen (smalle viewport / echte telefoon): hamburger open → beide links + zoek zichtbaar.
2. **B-003** — Reacties softlaunch verwerken (`_reacties/`, `app.js` / `data.js`).
3. **Subdomein / sync** — `accept.beleidsbibliotheekwassenaar.nl` bij Argeweb; lokaal vs ACC/PROD sync (zie vorige STATUS).

## Blokkades

- Geen nieuwe; subdomein Argeweb en omgeving-sync blijven planning/operatie.

## Openstaande backlog (top 3)

1. **B-003** — Reacties softlaunch verwerken, 8 meldingen (P0, medium)
2. **B-001** — Excel controller + feedback Ronald Zoutendijk (P0, groot)
3. **B-010** — Bezoekteller productie (P1)

Zie `BACKLOG.md` voor de volledige lijst.
