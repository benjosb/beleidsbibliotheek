# PWA-lite — BeleidsBibliotheek Wassenaar

## Wat zit erin

- **`manifest.webmanifest`** — naam, kleuren, start-URL (`index.html`), pictogrammen.
- **`sw.js`** — minimale service worker: **geen offline-cache**, elke pagina blijft live van het netwerk. Voldoet wél aan de Chromium-eisen om “Zet op beginscherm” / installatie aan te bieden.
- **`pwa-register.js`** — registreert de SW op **HTTPS** (en `localhost` voor testen).
- **`pwa-icons/`** — PNG’s (192, 512, maskable). Opnieuw genereren:  
  `python3 scripts/generate_pwa_icons.py`

## Gebruik op telefoon

1. Open de site in **Chrome** (Android) of **Safari** (iPhone).
2. **Android:** menu ⋮ → *App installeren* of *Toevoegen aan startscherm* (formulering verschilt per versie).
3. **iOS Safari:** Deel-knop → *Zet op beginscherm*.

## Server (nginx)

Zorg dat het manifest het juiste type krijgt (anders soms geen install-prompt):

```nginx
types {
    application/manifest+json webmanifest;
}
```

Of per locatie:

```nginx
location = /manifest.webmanifest {
    default_type application/manifest+json;
}
```

`sw.js` moet met **HTTPS** worden uitgeleverd (zoals de rest van de site).

## Service worker updaten

Na inhoudelijke wijzigingen aan `sw.js`: verhoog `SW_VERSION` in `sw.js` (comment + eventueel logica) zodat browsers de nieuwe versie oppikken.

## Scope

`start_url` wijst naar **`index.html`**. Geïnstalleerde app opent dus altijd het hoofdscherm, ook als je de installatie startte vanaf een andere pagina.
