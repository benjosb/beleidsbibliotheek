# Agent BB42 — Onderwijshuisvesting (BBV 4.2)

Periodiek **publieke** bronnen doorzoeken met vaste trefwoorden. Output is een **JSON-rapport** voor review — **geen** automatische wijziging van de BeleidsBibliotheek.

**Keten:** scan → **GO Yvonne** → handmatig opnemen in `wassenaar/beleidsnota-per-taakveld-data.js` → `./deploy.sh` (ACC) → **Ricardo** `promote-to-prod.sh` (PROD).

## Snelstart (lokaal)

```bash
cd agents/bb42
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp keywords-4.2.example.json keywords-4.2.json
python run.py --dry-run
```

## Echte run (na koppelen API’s)

1. Vul `.env` (zie `.env.example`) na registratie bij **KOOP** voor SRU/officiële bekendmakingen waar nodig.
2. Noteer **dataset-URL** voor *Lokale regelingen* op [data.overheid.nl](https://data.overheid.nl/) en implementeer `fetch_hits_lokale_regelgeving` in `run.py`.
3. Zonder `--dry-run` verwacht de huidige skeletcode nog **gekoppelde** fetch-functies; tot die tijd krijg je per term een `nog-niet-gekoppeld`-regel.

## VPS (Hostinger) — voorbeeld cron

Pas paden aan naar jouw gebruiker en map (hier: home + venv op de VPS).

```cron
# Agent BB42 — elke 2 dagen om 06:15 UTC (07:15 CET winter)
15 6 */2 * * cd /root/agents/bb42 && /root/agents/bb42/.venv/bin/python run.py --output /var/log/bb42-last.json >> /var/log/bb42.log 2>&1
```

Alternatief: clone de repo naar `/root/beleidsbibliotheek` en gebruik:

```cron
15 6 */2 * * cd /root/beleidsbibliotheek/agents/bb42 && /root/beleidsbibliotheek/agents/bb42/.venv/bin/python run.py --output /var/log/bb42-last.json >> /var/log/bb42.log 2>&1
```

`crontab -e` op de VPS; zorg dat `keywords-4.2.json` en `.env` op de server staan (niet in git als secrets).

## Gezicht (HTML)

Open in de browser (dubbelklik of via file-server):

- **`index.html`** — lichte statuspagina met logo/gezicht voor BB42, uitleg en een **viewer** voor JSON-rapport (bestand kiezen of plakken).

Pad: `agents/bb42/index.html`

## Oefenpagina op de site (taakveld 4.2)

- **`wassenaar/bb42-oefen.html`** — pilot: **twee panelen** (Agent ↔ chatbot BB42). Het algemene reactieformulier blijft op `reactie.html`.
- Optioneel: na een run `bb42-last.json` naast die pagina op de server leggen; het Agent-paneel probeert dat bestand te laden.

## Naam

**Agent BB42** — eerste agent van de BeleidsBibliotheek-pilot (4.2 Onderwijshuisvesting).
