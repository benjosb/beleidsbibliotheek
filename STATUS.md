# Status — BeleidsBibliotheek Wassenaar

## Start instructie — nieuwe Cursor-chat (Dick)

**Dit bestand (`STATUS.md`, repo-root) is het enige vaste “waar waren we gebleven”-punt** — hier staan ook financiën en **Volgende stap**. Geen apart handoff-bestand in `docs/` nodig.

1. **Open in Cursor** dit bestand: **`STATUS.md`** in de root van `_2026_beleidsbibliotheek` (bijv. Cmd+P → `STATUS.md` → Enter).
2. **Start een nieuwe Composer/Agent-chat** en doe één van deze twee:
   - Koppel **`@STATUS.md`** (Cursor laat je het bestand kiezen) en schrijf daaronder bijvoorbeeld: *Vat samen waar we stonden en pak de eerste regel onder "Volgende stap" op.*
   - Of plak in één keer: *Lees STATUS.md in de repo-root en werk daarna het eerste concrete punt onder "Volgende stap" af.*
3. **Einde van een sessie:** laat de agent `STATUS.md` bijwerken — of doe het zelf kort (datum, gedaan, volgende stap).

*Waarom:* het model heeft geen geheugen tussen chats. Projectregels helpen, maar zijn niet 100% afdwingbaar; **`@STATUS.md` expliciet koppelen** geeft de beste treffer. Het woord **“verder”** alleen is bewust geen betrouwbare trigger — bovenstaande zinnen wel.

**Optioneel (vaker automatisch):** Cursor → Settings → Rules → **User Rules** — één regel, bijvoorbeeld: *In dit project: bij elke nieuwe chat eerst STATUS.md lezen als de gebruiker @STATUS.md koppelt.* De repo-regels (`.cursor/rules/chat-continuiteit.mdc`) staan al goed.

---

**Laatste technische sessie:** 2026-04-17 — Financieel-BBV-dossier samengevoegd + JS-bronverwijzing  
**Laatste STATUS-workflow / chat-samenvatting:** 2026-04-19 — start-instructie (open `STATUS.md` → `@` of plakzin → einde sessie bijwerken) + `chat-continuiteit.mdc` afgestemd; zie ook [Chat met Cursor — 2026-04-20](#chat-met-cursor--2026-04-20-samenvatting)

## Herinnering: Beheerpagina (na MacBook-update of als je het vergeet)

**Beheerpagina** = wat Dick dit noemt: het lokale **Deploy Dashboard** (`dashboard.py`) op **http://localhost:8800/** (niet de site-pagina `wassenaar/beheer.html`).

1. Terminal → projectmap: `_2026_beleidsbibliotheek` (deze repo).
2. Start: **`python3 dashboard.py`**
3. Browser: **http://127.0.0.1:8800** (wordt vaak automatisch geopend).
4. Stoppen: **Ctrl+C** in het terminalvenster.

*Zie **[Start instructie — nieuwe Cursor-chat](#start-instructie--nieuwe-cursor-chat-dick)** bovenaan dit bestand.*

## Waar we mee bezig waren

P0-backlog afwerken; mobiel menu (B-002) was nog open.

## Chat met Cursor — 2026-04-20 (samenvatting)

*Geen volledig transcript; wel de kern van deze conversatie zodat de context niet alleen in het model zat.*

- **Probleem:** frustratie dat eerder werd gezegd dat je “alleen verder” hoefde te typen; tussen chats heeft het model geen geheugen, en regels zijn niet 100% afdwingbaar.
- **Analyse:** er bestond al **`STATUS.md`** + **`.cursor/rules/chat-continuiteit.mdc`** + **`beleidsbibliotheek.mdc`**; geen ontbrekende map in `docs/` als enige oplossing — wel dubbele beloftes en herhaling.
- **Afgesproken oplossing:** **`STATUS.md` (repo-root) = enige checkpoint**; start met **`@STATUS.md`** of de zinnen onder [Start instructie](#start-instructie--nieuwe-cursor-chat-dick); woord “verder” alleen niet als enige trigger.
- **Uitgevoerd in repo:** start-instructie bovenaan dit bestand; `chat-continuiteit.mdc` aangescherpt (o.a. `read_file` op `STATUS.md`); `beleidsbibliotheek.mdc` ontdubbeld; `README.md` + `docs/cursor-rules-uitleg.md` eerlijker over rules vs. checkpoint; `dev-status.js` logregel.
- **Praktisch voor Dick:** **`STATUS.md` openen** = **Cmd+P** → typ `STATUS.md` → Enter; in chat **`@`** → `STATUS.md` koppelen.
- **Tip samenwerking:** korte opdrachten; einde sessie = `STATUS.md` bijwerken (of agent laten doen).

## Wat er gedaan is (deze sessie)

### Workflow — vaste start/einde (2026-04-19)
- **Start instructie** bovenaan dit bestand: open `STATUS.md` in Cursor → nieuwe chat met **`@STATUS.md`** + samenvatting + eerste regel onder *Volgende stap*, óf plakzin “lees repo-root `STATUS.md` en werk eerste punt onder *Volgende stap* af”; **einde sessie** = `STATUS.md` bijwerken (of zelf kort). Optionele **User Rule** in Cursor genoemd; geen apart `docs/`-handoff.
- **`.cursor/rules/chat-continuiteit.mdc`:** expliciet eerste concrete punt onder *Volgende stap*; geen parallel handoff-bestand.

### Financieel dossier BBV — één canoniek Markdown-bestand
- `wassenaar/analyse-begrotingen/FINANCIEEL_BBV_BELEIDSBIBLIOTHEEK.md` bevat nu **doorlopend**: §1 Cuatro-PDF’s, §2–10 analyse (programma’s, macro, taakvelden 2026, meerjarig saldo, kengetallen, conclusies, lokale bron-PDF’s), §11 technische koppeling site/JS.
- `wassenaar/financieel-bbv-begroting-2026.js`: broncomment wijst naar dat dossier **§5** (was: losse analyse §3).

### Bron-PDF’s begroten / verantwoorden (overzicht)
- `wassenaar/analyse-begrotingen/BRON_PDF_BEGROTEN_EN_VERANTWOORDEN.md` — tabel met jouw 5 URL’s + pagina’s: inhoud (taakveld vs programma), en expliciet dat **Jaarstukken 2022 p.173** = rechtmatigheids-/programma-analyse, **niet** hetzelfde als taakveld-overzicht.

### BBV × begroting 2026 (begroten vs verantwoorden)
- Nieuw: `wassenaar/financieel-bbv-begroting-2026.js` — baten/lasten/saldo per taakveld en totalen per H0–H8 uit `analyse-begrotingen/ANALYSE_BEGROTINGEN_2023_2026.md` §3; clustering in UI (o.a. 6.2, 6.60–6.91) gemapt naar som van onderliggende Iv3-codes.
- `app.js`: bij BBV-startpagina — onder dubbelklik-versie (`body.toon-begroting`) begrote **lasten** per hoofdstuk + aandeel van gemeentelijk totaal; bij gekozen taakveld — compact **dashboard** (baten/lasten/saldo, % van hoofdstuk, broncodes); voetnoot + hint **verantwoorden** → jaarstukken.
- `index.html` (cache-bumps), `styles.css`, `deploy.sh` (+ nieuw JS-bestand in deploylijst).

### Raadsopnames / WODV-split — opdracht vastgelegd
- Map **`raad-opnames/`** (zelfde niveau als **`wassenaar/`**): **`index.html`** met context (WODV, split 2023, iBabs, ~400 MP4’s), probleemomschrijving, pipeline fase A/B/C, spreadsheet-idee, spike, geen implementatie deze sessie.
- **`dashboard.py`** serveert **`/raad-opnames/`**; knop **Raadsopnames — aanpak** op **`docs/werkwijze-dashboard.html`** (paars, naast Omgevingen vergelijken).
- **`raad-opnames/verslag.html`:** verslag onderzoek iBabs/Royalcast; **`dashboard.py`** serveert nu elk bestand onder **`/raad-opnames/…`** (niet alleen index). Onderwerp raad-opnames/automatisering **laten rusten**; vervolg op ander spoor.
- **Aantekening voor na systeemupdate:** zie sectie **Herinnering: Beheerpagina** hierboven (`python3 dashboard.py` → poort **8800**).

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

1. **BBV-begroting weergave (vervolg)** — styling `.bbv-fin-*` + optioneel horizontaal vergelijk H0–H8 bij `toon-begroting` (zie laatste sessie-chat).
2. **Deploy** — `./deploy.sh` naar ACC (o.a. `financieel-bbv-begroting-2026.js`); spotcheck: dubbelklik versienummer → BBV-kaarten + taakveld financieel; mobiel hamburger (B-002) op echte telefoon.
3. **B-003** — Reacties softlaunch verwerken (`_reacties/`, `app.js` / `data.js`).
4. **Subdomein / sync** — `accept.beleidsbibliotheekwassenaar.nl` bij Argeweb; lokaal vs ACC/PROD sync (zie vorige STATUS).

## Blokkades

- Geen nieuwe; subdomein Argeweb en omgeving-sync blijven planning/operatie.

## Openstaande backlog (top 3)

1. **B-003** — Reacties softlaunch verwerken, 8 meldingen (P0, medium)
2. **B-001** — Excel controller + feedback Ronald Zoutendijk (P0, groot)
3. **B-010** — Bezoekteller productie (P1)

Zie `BACKLOG.md` voor de volledige lijst.
