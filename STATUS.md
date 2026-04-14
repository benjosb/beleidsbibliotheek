# Status — BeleidsBibliotheek Wassenaar

**Laatste sessie:** 2026-04-15 (dinsdag, nacht)

## Waar we mee bezig waren

Operationele infrastructuur opzetten: dashboard, backups, scheduling, integriteitscheck.

## Wat er gedaan is (deze sessie + vorige)

### Beheer-dashboard (lokaal, `python3 dashboard.py`)
- `dashboard.py` — lokale server op poort 8800, serveert dashboard + API
- `docs/werkwijze-dashboard.html` — werkend dashboard met:
  - Drie actieknoppen: Backup, Deploy ACC, Promoveer PROD
  - Ingebouwde terminal met live streaming (SSE)
  - Productie-beveiliging: "PRODUCTIE" typen vereist
  - Status: versie, lokale wijzigingen, deploy-log, backups, backlog
  - Dagelijkse-backup status + log-weergave

### Backup-systeem
- `backup-prod.sh` — download productie-site van Argeweb via FTP naar `backups/prod_DATUM/`
- `backup-daily.py` — backup + integriteitscheck (8 kernbestanden, groottes, checksums, vergelijking) + e-mail
- `.env.prod` — FTP-credentials Argeweb (INGEVULD, werkt)
- `.env.mail` — SMTP-credentials iCloud (INGEVULD, werkt)
- LaunchAgent `~/Library/LaunchAgents/nl.beleidsbibliotheek.backup.plist` — draait dagelijks 07:00
- Backup getest en werkt: 39 bestanden, 6.0 MB, integriteitscheck OK
- Bewaart laatste 10 backups, ruimt oudere op

### Werkwijze-documentatie
- `docs/werkwijze-visueel.html` — visueel overzicht voor Joyce en Ricardo (printbaar)
- `WERKWIJZE.md` — instructies voor alle drie de rollen
- `docs/cursor-rules-uitleg.md` — uitleg Cursor rules voor Dick

### Cursor rules
- Home rule (`~/.cursor/rules/dick-projecten.mdc`) — project-router
- Project rule `chat-continuiteit.mdc` — sessie-continuïteit via STATUS.md
- Alle project rules up-to-date

### Eerdere sessies
- Release-workflow: `deploy.sh` (lokaal→ACC), `promote-to-prod.sh` (ACC→PROD via FTP)
- BACKLOG.md bijgewerkt met B-002, B-003, B-030

## Volgende stap

1. **Subdomein `accept.beleidsbibliotheekwassenaar.nl` aanmaken** bij Argeweb — beide omgevingen op één server, simpeler
2. **Omgevingen in sync brengen** — lokaal heeft wijzigingen t.o.v. 8.0.6 die nog niet op ACC/PROD staan
3. **Eerste inhoudelijke wijziging** gecontroleerd deployen (één kleine, niet alles tegelijk)

## Blokkades

- Lokaal, ACC en PROD zijn uit sync (wijzigingen sinds softlaunch 8 april)
- Subdomein bij Argeweb nog niet aangemaakt

## Openstaande backlog (top 3)

1. **B-002** — Mobiel menu: link overdrachtsdossier ontbreekt (P0, klein)
2. **B-003** — Reacties softlaunch verwerken, 8 meldingen (P0, medium)
3. **B-001** — Excel controller + feedback Ronald Zoutendijk (P0, groot)

Zie `BACKLOG.md` voor de volledige lijst.
