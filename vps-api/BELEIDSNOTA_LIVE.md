# Live bibliotheek — beleidsnota’s (Wassenaar)

De knop **Toevoegen aan bibliotheek** in `wassenaar/index.html`:

1. **POST `/mail-melding`** — geen sleutel; stuurt een plain-text e-mail via SMTP op de VPS (rate limit per IP). Dit is de “één klik”-melding voor iedereen.
2. **POST `/bijdragen`** — optioneel, met Bearer-sleutel: schrijft direct in het JSON-bestand (live zichtbaar na GET/verversen).

Iedereen haalt de lijst op via **GET** (geen sleutel nodig).

## 0. SMTP + meld-adres (aanbevolen)

Zonder deze variabelen valt de site terug op `mailto:` in de browser.

Voeg toe aan de **systemd unit** (naast het ingest-secret), bijvoorbeeld:

```ini
Environment="WASSENAAR_BELEIDSNOTA_NOTIFY_EMAIL=beleid@voorbeeld.nl"
Environment="WASSENAAR_SMTP_HOST=smtp.voorbeeld.nl"
Environment="WASSENAAR_SMTP_PORT=587"
Environment="WASSENAAR_SMTP_USER=api@…"
Environment="WASSENAAR_SMTP_PASSWORD=…"
Environment="WASSENAAR_SMTP_FROM=api@…"
```

Optioneel: `WASSENAAR_BELEIDSNOTA_MAIL_RATE_MAX` (default 20) en `WASSENAAR_BELEIDSNOTA_MAIL_RATE_WINDOW` (seconden, default 3600).

Test (geen Bearer):

```bash
curl -sS -X POST "https://boardroom.braamenco.nl/api/beleidsbibliotheek/wassenaar/mail-melding" \
  -H "Content-Type: application/json" \
  -d '{"titel":"SMTP-test","link":"https://example.com","extra":"","scope":{"bbvIndex":1,"taakveldCode":null}}'
```

Verwacht `{"ok":true,"via":"smtp"}` of `503` met `mail_not_configured` als env ontbreekt.

## 1. Geheim zetten op de server (live schrijven)

```bash
openssl rand -hex 24
```

Voeg in de **systemd unit** van de WIL API (gunicorn) toe, bijvoorbeeld:

```ini
Environment="WASSENAAR_BELEIDSNOTA_INGEST_SECRET=jouw_hier_gegenereerde_string"
```

Daarna:

```bash
sudo systemctl daemon-reload
sudo systemctl restart wil-api   # of de echte servicenaam
```

Optioneel: ander pad voor het JSON-bestand:

```ini
Environment="WASSENAAR_BELEIDSNOTA_FILE=/opt/wil-api/beleidsnota_wassenaar_bijdragen.json"
```

## 2. Test

```bash
curl -sS "https://boardroom.braamenco.nl/api/beleidsbibliotheek/wassenaar/bijdragen"
```

POST (vervang `TOKEN`):

```bash
curl -sS -X POST "https://boardroom.braamenco.nl/api/beleidsbibliotheek/wassenaar/bijdragen" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"titel":"Test","link":"https://example.com","extra":"","scope":{"bbvIndex":1,"taakveldCode":null}}'
```

## 3. Browser (eenmalig)

Op **wassenaar.besluit-wijzer.nl**: modal *Beleidsnota toevoegen* → **Bibliotheek koppelen** → plak dezelfde string als `WASSENAAR_BELEIDSNOTA_INGEST_SECRET` → **Sleutel bewaren**.

Zonder sleutel: na **Toevoegen** gaat de melding via **mail-melding** (SMTP) als dat op de VPS staat; anders opent het mailprogramma met een kant-en-klare e-mail (fallback).

## 4. Deploy API-wijzigingen

Na `git pull` op de VPS: opnieuw `api.py` uitrollen en gunicorn herstarten (zelfde proces als andere API-updates).

## Data

- Bestand: standaard `/opt/wil-api/beleidsnota_wassenaar_bijdragen.json`
- Backup / versiebeheer: periodiek kopiëren of entries handmatig naar `app.js` overzetten als je een “vaste” release wilt zonder runtime-bestand.
