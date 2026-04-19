# Raadsopnames — apart projectblok binnen BeleidsBibliotheek

Dit is **geen** onderdeel van de statische site in `wassenaar/`. Hier hoort alles rond **inventarisatie, matching en eventuele scripts** voor de opsplitsing WODV / iBabs-opnames.

## Structuur

| Pad | Doel |
|-----|------|
| `index.html` | Concept / opdracht (ook via dashboard: `/raad-opnames/`) |
| `scripts/` | Python of shell: ffprobe-inventaris, koppeling aan vergaderlijsten, enz. |
| `data/` | Lokale CSV/exports/samples — **niet** groot materiaal in git (zie `.gitignore`) |
| `.venv/` | Optioneel: **eigen** Python-omgeving alleen voor dit werk (zie hieronder) |

## Eigen “compute” (Python apart van de rest van de repo)

In deze map (niet in de projectroot):

```bash
cd raad-opnames
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Zo raken `dashboard.py` en andere tooling in de root **niet** verward met extra packages voor dit traject.

`ffprobe` / `ffmpeg` blijven **systeemtools** (Homebrew); die staan niet in `requirements.txt`.

## Naamgeving

De map heet bewust **`raad-opnames/`** (niet onder `wassenaar/`) zodat duidelijk is: **policy library = site**, **raad-opnames = apart werkveld** met eigen data en scripts.
