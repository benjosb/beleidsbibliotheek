# BeleidsWijzer / BeleidsBibliotheek — acceptatietest, backoffice en CISO

**Doel van dit document**  
1) Eén doorloopbare **acceptatietest** vóór je een formele omschrijving naar backoffice en CISO deelt.  
2) Eén **technische achtergrond** voor **functioneel beheer / backoffice** en **CISO** (hosting, keten, privacy & security).

**Let op:** Het oudere overzicht `BeleidsBibliotheek_A4_collegas_CISO.md` beschrijft vooral de *statische* site zonder API-koppelingen. Dit document is bedoeld als **actueel** voor de keten *website + optionele API + e-mailmelding*.

---

## Deel A — Acceptatietest (eenmalig of per release)

**Invullen:** datum ___ | tester ___ | omgeving: ☐ acceptatie (bijv. Hostinger) ☐ productie (organisatie)  
**Versie site:** (footer of `appVersion` op de pagina) ___

### A1. Basis — statische BeleidsBibliotheek

| # | Actie | Verwacht resultaat | OK |
|---|--------|-------------------|-----|
| 1 | Open de **HTTPS-URL** van de Wassenaar-BeleidsBibliotheek | Pagina laadt zonder SSL-waarschuwing | ☐ |
| 2 | Sluit de **disclaimer** (“Ik begrijp het…”) | Modal sluit; inhoud zichtbaar | ☐ |
| 3 | Klik een **dossier/BBV-kaart** | Detailweergave met besluiten/filters | ☐ |
| 4 | **Zoeken** en filter (jaar/type) | Resultaten kloppen globaal | ☐ |
| 5 | Browser **F12 → Console** | Geen kritieke rode errors bij normaal gebruik | ☐ |
| 6 | **Harde refresh** na deploy (`Ctrl+Shift+R` / `Cmd+Shift+R`) | Nieuwe assets zichtbaar (geen oude cache) | ☐ |

### A2. Optioneel — PWA / mobiel

| # | Actie | OK |
|---|--------|-----|
| 7 | Op mobiel: pagina bruikbaar, geen geblokkeerde scripts | ☐ |

*(Zie `wassenaar/PWA.md` voor nginx/MIME-types indien van toepassing.)*

### A3. Keten — live bibliotheek & melding (alleen als API actief is)

**API-basis-URL** (nu vaak): `https://boardroom.braamenco.nl/api` — in `wassenaar/app.js` als `BELEIDSNOTA_API_BASE`.

| # | Test | Commando of handeling | Verwacht | OK |
|---|------|------------------------|-----------|-----|
| 8 | API bereikbaar | `curl -sS "https://boardroom.braamenco.nl/api/health"` | JSON met `"status":"ok"` | ☐ |
| 9 | Publieke lijst | `curl -sS "https://boardroom.braamenco.nl/api/beleidsbibliotheek/wassenaar/bijdragen"` | JSON met `items` (mag leeg) | ☐ |
| 10 | E-mailmelding (geen Bearer) | Zie `vps-api/BELEIDSNOTA_LIVE.md` — `curl -X POST .../mail-melding` met test-JSON | `200` + `"ok":true` als SMTP geconfigureerd; anders `503` `mail_not_configured` | ☐ |
| 11 | Browser: **+ Beleidsnota toevoegen** | Modal openen, geldige titel + **https-URL**, opslaan | Statusregel: melding verstuurd (SMTP) óf mailprogramma opent (fallback) | ☐ |
| 12 | Met **ingest-sleutel** in browser (alleen intern testen) | Zelfde actie | Indien sleutel + ingest actief: ook “live bibliotheek” / verversen toont item | ☐ |

**Aantekeningen testrun** (fouten, screenshots, tijdstip):  
…

---

## Deel B — Technische ondersteuning (backoffice / functioneel beheer)

### B1. Wat hoort waar?

| Onderdeel | Rol | Typische locatie |
|-----------|-----|------------------|
| **Statische site** Wassenaar (HTML, CSS, JS, `data.js`) | Bezoeker ziet besluiten/BBV | o.a. `wassenaar.besluit-wijzer.nl` (Hostinger/VPS-pad kan afwijken) |
| **Boardroom-API** (Flask/Gunicorn) | o.a. `GET/POST …/bijdragen`, `POST …/mail-melding`, health | Aparte VPS (`boardroom.braamenco.nl`), **niet** hetzelfde als alleen statische files |
| **SMTP / secrets** | E-mailmelding + optioneel live schrijven | Alleen op de server: systemd/environment van Gunicorn — **niet** in git |

### B2. Deploy (kort)

- **Wassenaar-front:** vanuit repo-map `wassenaar/`: script `scripts/deploy_wassenaar.sh` (zie `wassenaar/DEPLOY_WASSENAAR.md`). Daarna **harde refresh** in de browser.
- **API-wijzigingen:** nieuwe `api.py` op de API-server, Gunicorn herstarten; variabelen volgens `vps-api/BELEIDSNOTA_LIVE.md`.

### B3. Veelvoorkomende issues

| Symptoom | Mogelijke oorzaak |
|----------|-------------------|
| Oude UI na “deploy” | Browser- of CDN-cache → harde refresh |
| CORS-fout in console bij toevoegen | API `CORS`-origins bevatten het **exacte** frontend-domein niet |
| Melding altijd via mailprogramma | SMTP/notify-env op API-server niet gezet (`mail_not_configured`) |
| 401 bij live toevoegen | Verkeerde of ontbrekende Bearer-sleutel in browser / server |
| 429 bij mail-melding | Rate limit per IP (tijdelijk); zie env `WASSENAAR_BELEIDSNOTA_MAIL_RATE_*` |

### B4. Contact & escalatie

| Rol | Wie / kanaal |
|-----|----------------|
| Eigenaar product (WIL) | Wes ter Baan — bij twijfel over data/scraping |
| Technisch | *vul in: interne beheerder / leverancier* |
| Repo | `github.com/benjosb/beleidsbibliotheek` |

---

## Deel C — CISO en privacy (samenvatting)

### C1. Architectuur in één zin

De **BeleidsBibliotheek** is primair een **statische webapp** met **publieke besluitdata** in de pagina; voor **voorstellen om documenten toe te voegen** maakt de browser **HTTPS-calls** naar een **eigen API** (andere host). Die API kan een **e-mail** versturen en/of (met geheim) een **JSON-bestand** op de server bijwerken.

### C2. Gegevens en grondslag

| Gegevenscategorie | Toelichting |
|-------------------|-------------|
| Openbare besluiten / metadata | Al in de dataset; bronnen iBabs, OB, etc. — **spoor 1** alleen openbare data |
| **Beleidsnota-formulier** (titel, URL, vrije toelichting) | Vrijwillig ingevoerd door gebruiker; kan **inhoudelijk gevoelig** zijn; **theoretisch ook persoonsgegevens** als iemand die in vrije tekst zet — **behandel als normale bedrijfs-/gemeentelijke aanvraag** |
| **IP-adres** | Wordt in de **e-mailmelding** naar beheer genoemd (serverzijde); rate limiting per IP |
| **localStorage** | o.a. optionele ingest-token (alleen in die browser), pending-voorstellen bij mailto-fallback |

**Cookies:** geen tracking-cookies voor analytics in de basisopzet; controleer bij een specifieke organisatie-host of er een **cookiebanner** nodig is naast technisch strikt noodzakelijke opslag.

### C3. Verwerkers en hosting

- **Statische hosting** (nu o.a. Hostinger-omgeving voor acceptatie): bestanden uitdelen.  
- **API-hosting** (VPS): verwerking requests, SMTP naar mailbox beheer.  
- **Straks productie bij organisatie:** zelfde scheiding aanbevolen (statisch vs API), secrets in **vault / systemd**, geen secrets in repo.

### C4. Beveiliging (hoofdlijnen)

| Onderwerp | Maatregel |
|-----------|-----------|
| Transport | **TLS (HTTPS)** overal |
| Authenticatie live-schrijven | **Bearer-secret** (alleen voor beheer/test); niet publiek |
| Publieke meld-endpoint | **Geen** Bearer; wel **rate limit** per IP |
| Integriteit dataset | Versiebeheer git + gecontroleerde deploy; optioneel checksums (aanbevolen in A4) |
| Logging | API/serverlogs naar beleid organisatie; geen “verborgen” fouten — transparant loggen |

### C5. Wat je aan CISO kunt beloven vóór productie-overdracht

- [ ] Acceptatietest **Deel A** uitgevoerd en afwijkingen gedocumenteerd.  
- [ ] Lijst **subverwerkers** (hosting statisch, hosting API, SMTP-provider) ingevuld voor DPIA/verwerkersregister.  
- [ ] **Privacytekst**: of algemene gemeentelijke privacyverklaring dekt dit gebruik, of korte aanvulling op formulier (“u vult vrijwillig in…”).  
- [ ] **Acc vs prod**: vaste URL’s en vaste API-base in config; geen testdata op prod.

---

## Referenties in de repo

| Document | Onderwerp |
|----------|-----------|
| `wassenaar/DEPLOY_WASSENAAR.md` | Deploy statische Wassenaar-site |
| `vps-api/BELEIDSNOTA_LIVE.md` | API-endpoints, env-variabelen, curl-tests |
| `BeleidsBibliotheek_A4_collegas_CISO.md` | Oudere, statische compliance-samenvatting (deels verouderd t.o.v. API) |
| `.cursor/rules/wil-governance.mdc` | Projectgrenzen, pilot, geen PII-scrape |

---

*Document: maart 2026 — aan te vullen met interne namen, URL’s productie en DPIA-referentie wanneer bekend.*
