# Werkwijze — BeleidsBibliotheek Wassenaar

## Drie omgevingen

| Omgeving | URL | Waar | Doel |
|----------|-----|------|------|
| **Lokaal** | localhost | MacBook Pro Dick | Ontwikkeling |
| **Acceptatie** | wassenaar.besluit-wijzer.nl | VPS 187.77.93.148 `/var/www/wassenaar.besluit-wijzer.nl/` | Testen, content beheer |
| **Productie** | beleidsbibliotheekwassenaar.nl | Argeweb (Plesk/FTP) | Live voor raadsleden |

## Drie rollen

| Wie | Rol | Wat |
|-----|-----|-----|
| **Dick** | Ontwikkelaar | Wijzigingen doorvoeren, deployen naar ACC |
| **Joyce** | Contentbeheer | Controle op ACC, documenten toevoegen via browser, akkoord geven |
| **Ricardo** | Technisch beheer | ACC naar PROD promoveren |

---

## Dick: wijziging doorvoeren

### 1. Wijzig lokaal

Werk in de map `wassenaar/`. Test lokaal door `index.html` te openen in de browser.

### 2. Deploy naar acceptatie

```bash
cd "/Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidsbibliotheek"

# Zonder notitie:
./deploy.sh

# Met notitie (komt in deploy-log):
./deploy.sh "Link-correcties Erwin tegel 0"
```

Dit script doet automatisch:
- Git commit + push (backup naar GitHub)
- Bestanden uploaden naar ACC
- Regel toevoegen aan `docs/deploy-log.md`

### 3. Laat Joyce controleren

Stuur Joyce een bericht: "Wijziging staat op acceptatie, kun je checken?"
Zij opent wassenaar.besluit-wijzer.nl en controleert.

### 4. Na akkoord: Ricardo promoveert naar PROD

Zie hieronder bij "Ricardo".

---

## Joyce: controleren op acceptatie

### Controleren

1. Open **wassenaar.besluit-wijzer.nl** in de browser
2. Controleer de wijziging (Dick vertelt je waar je moet kijken)
3. Gebruik **Cmd+Shift+R** (of Ctrl+Shift+R) om de cache te verversen

### Documenten toevoegen

Via de browser op acceptatie:
- Gebruik het reactieformulier of de "Document voorstellen"-functie
- Wijzigingen verschijnen op de werklijst-reacties pagina

### Akkoord geven

Laat Dick of Ricardo weten: "Akkoord, mag naar productie."

---

## Ricardo: ACC naar PROD promoveren

### Stap voor stap

Draai dit vanaf Dick's Mac (of een machine met SSH-key en `.env.prod`):

```bash
cd "/Users/dickbraam/Library/CloudStorage/OneDrive-Persoonlijk/_2_DICK_WERK/_2026_beleidsbibliotheek"

# Zonder notitie:
./promote-to-prod.sh

# Met notitie:
./promote-to-prod.sh "Akkoord Joyce - link-correcties"
```

Het script doet automatisch:
- Bestanden ophalen van ACC (VPS Hostinger via SSH)
- Uploaden naar PROD (Argeweb via FTP)
- `beheer.html` en `werklijst-reacties.html` worden NIET gekopieerd (alleen voor ACC)
- Logboek bijwerken

### Vereisten

- SSH-key voor VPS (`~/.ssh/id_vps`)
- `.env.prod` met FTP-credentials voor Argeweb
- `lftp` geïnstalleerd (`brew install lftp`)

### Controleren

Open **beleidsbibliotheekwassenaar.nl** in de browser. Gebruik **Cmd+Shift+R** om de cache te verversen.

### Alternatief: handmatig via Plesk

Als het script niet werkt, kun je ook handmatig bestanden uploaden via de Plesk file manager van Argeweb.

---

## Versienummer

Het versienummer staat in het bestand `VERSION` in de projectroot. Dit bestand wordt meegedeployed. Bump het versienummer vóór een deploy als er inhoudelijke wijzigingen zijn:

- **Patch** (8.0.6 → 8.0.7): kleine correcties (link gefixt, typo)
- **Minor** (8.0.7 → 8.1.0): nieuwe content of functionaliteit
- **Major** (8.1.0 → 9.0.0): grote herstructurering

---

## Overzicht flow

```
Dick (MBP)           Joyce (browser)       Ricardo (SSH)
    |                      |                     |
    | 1. wijzig lokaal     |                     |
    | 2. ./deploy.sh       |                     |
    |--------------------->|                     |
    |                      | 3. controleer ACC   |
    |                      | 4. akkoord          |
    |                      |-------------------->|
    |                      |                     | 5. promote-to-prod.sh
    |                      |                     | 6. controleer PROD
```

---

## Bestanden

| Bestand | Wat | Waar |
|---------|-----|------|
| `deploy.sh` | Deploy lokaal → ACC | Projectroot (MBP) |
| `promote-to-prod.sh` | ACC → PROD | Projectroot (MBP) + `/var/www/` op VPS |
| `VERSION` | Versienummer | Projectroot |
| `docs/deploy-log.md` | Logboek van alle deploys | `docs/` |
| `BACKLOG.md` | Wat moet er nog gebeuren | Projectroot |
