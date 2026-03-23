## Deploy Besluit-wijzer landing + gemeente-x + verkiezingen

### Structuur

**wassenaar.besluit-wijzer.nl** (Wassenaar-hub, geen andere gemeenten):
- **https://wassenaar.besluit-wijzer.nl/** — Besluiten, beleidsdossiers
- **https://wassenaar.besluit-wijzer.nl/verkiezingen/** — Partijprogramma-analyse 2026
- **https://wassenaar.besluit-wijzer.nl/schrijf-wijzer/** — Schrijf-Wijzer (beta)

**besluit-wijzer.nl** (landing, overzicht gemeenten — later mogelijk via boardroom):
- **https://besluit-wijzer.nl** — landing met vier gemeenten
- **https://besluit-wijzer.nl/gemeente-x/** — Iv3-generieke template
- **https://besluit-wijzer.nl/verkiezingen/** — Verkiezingsprogramma's (overzicht gemeenten)

### Volledige deploy (landing + gemeente-x)

```bash
cd "/Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidswijzer/besluit-wijzer-landing"

chmod +x scripts/deploy_landing.sh   # eenmalig
./scripts/deploy_landing.sh
```

Dit kopieert:
1. Landing (index.html, styles.css) → `/var/www/besluit-wijzer.nl/`
2. Gemeente-x → `/var/www/besluit-wijzer.nl/gemeente-x/`
3. Verkiezingen (index.html, wassenaar/index.html) → `/var/www/besluit-wijzer.nl/verkiezingen/`

**Vóór deploy verkiezingen:** genereer eerst de Wassenaar-analyse:
```bash
cd /Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_Wassenaar_partijprogramma_analyse
python3 /Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_Wassenaar_partijprogramma_analyse/maak_gecombineerde_html.py --besluit-wijzer
```

### Alleen gemeente-x deployen

```bash
cd gemeente-x
./scripts/deploy_gemeente_x.sh
```

### URL's Geldrop-Mierlo en Voorschoten

De landing page gebruikt nu placeholders:
- `geldrop-mierlo.besluit-wijzer.nl`
- `voorschoten.besluit-wijzer.nl`

Als deze gemeenten op andere URL's staan, pas `besluit-wijzer-landing/index.html` aan.
