## Deploy Wassenaar naar VPS

Vanuit deze map:

```bash
cd "/Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidswijzer/wassenaar"

# eenmalig (maak script uitvoerbaar)
chmod +x scripts/deploy_wassenaar.sh

# elke keer na wijzigingen aan data.js / app*.js
./scripts/deploy_wassenaar.sh
```

Dit kopieert `data.js`, `app.js`, `app_v5.js` en `app_v6.js` naar:

`root@187.77.93.148:/var/www/wassenaar.besluit-wijzer.nl/`

Daarna: in de browser `Cmd+Shift+R` (of `Ctrl+Shift+R`) om de cache te verversen.

### PWA-lite

Het deploy-script kopieert ook `manifest.webmanifest`, `sw.js`, `pwa-register.js` en `pwa-icons/*.png`. Zie **`PWA.md`** (nginx MIME-type, gebruik op mobiel).

