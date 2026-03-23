## Deploy Besluit-wijzer (gemeente-x) naar besluit-wijzer.nl

Gemeente-x staat op **https://besluit-wijzer.nl/gemeente-x/** (subpad). De hoofdpagina besluit-wijzer.nl toont de landing met vier gemeenten.

### Volledige deploy (landing + gemeente-x)

Zie `besluit-wijzer-landing/DEPLOY.md` — gebruik `./scripts/deploy_landing.sh` vanuit de landing-map.

### Alleen gemeente-x deployen

```bash
cd gemeente-x
./scripts/deploy_gemeente_x.sh
```

### Backup + deploy (git + gemeente-x)

```bash
cd gemeente-x
./scripts/backup_en_deploy.sh "Besluit-wijzer v0.1 — Iv3-structuur"
```

Dit doet git commit/push + deploy van gemeente-x naar `/var/www/besluit-wijzer.nl/gemeente-x/`.

### Na deploy

- **Gemeente X:** https://besluit-wijzer.nl/gemeente-x/
- **Landing:** https://besluit-wijzer.nl
- **Cache:** Cmd+Shift+R (Mac) of Ctrl+Shift+R (Windows) in de browser
