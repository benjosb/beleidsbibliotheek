## Deploy Besluit-wijzer (gemeente-x) naar besluit-wijzer.nl

### Eerst: backup naar GitHub

```bash
cd "/Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidswijzer"

# Eenmalig: script uitvoerbaar maken
chmod +x gemeente-x/scripts/backup_en_deploy.sh
chmod +x gemeente-x/scripts/deploy_gemeente_x.sh

# Backup + deploy in één keer
cd gemeente-x
./scripts/backup_en_deploy.sh "Besluit-wijzer v0.1 — Iv3-structuur, toelichting hoofdstukken en taakvelden"
```

Dit doet:
1. **Git:** `git add gemeente-x/`, commit, push naar github.com/benjosb/beleidsbibliotheek
2. **Deploy:** scp naar root@187.77.93.148:/var/www/besluit-wijzer.nl/

### Alleen deployen (zonder git)

```bash
cd gemeente-x
./scripts/deploy_gemeente_x.sh
```

### VPS-pad aanpassen

Als besluit-wijzer.nl op een ander pad staat, pas `REMOTE_PATH` aan in `scripts/deploy_gemeente_x.sh`:

```bash
REMOTE_PATH="/var/www/besluit-wijzer.nl"   # of bijv. /var/www/html/besluit-wijzer
```

### Na deploy

- **URL:** https://besluit-wijzer.nl
- **Cache:** Cmd+Shift+R (Mac) of Ctrl+Shift+R (Windows) in de browser
