# BeleidsWijzer — Kickoff Geldrop-Mierlo

## Context

Ik ben Wes ter Baan, CEO van WIL (Wes' Innovation Lab). Wij bouwen BeleidsWijzer: een transparantie-tool die gemeentelijke besluiten en beleid inzichtelijk maakt voor raadsleden, ambtenaren en inwoners.

We hebben een werkend product voor de Gemeente Wassenaar. Nu willen we hetzelfde bouwen voor **Gemeente Geldrop-Mierlo**. Een bevriende consultant spreekt morgen de gemeentesecretaris — we willen een werkende **light-versie** klaar hebben als demo.

## Referentie: wat we voor Wassenaar gebouwd hebben

De volledige Wassenaar-versie staat in deze workspace:
- `index.html` — hoofdpagina (v5.1.0, dossier-first)
- `index_v6_verificatie.html` — verificatieversie (v6.0.0, publish-after-approval)
- `app.js` / `app_v6.js` — applicatielogica
- `data.js` — alle raads- en collegebesluiten (3137 stuks) als JSON
- `briefings.js` — beleidsbriefings per portefeuille als HTML
- `coalitieakkoord.js` — coalitieakkoord geanalyseerd en gekoppeld
- `styles.css` / `styles_v6.css` — styling

Live op: https://beleidswijzer-wassenaar.nl

## Wat er nu moet gebeuren: LIGHT-versie Geldrop-Mierlo

### Scope (wat WEL)
1. **Gemeentestructuur**: portefeuilleverdeling college B&W, wethouders, beleidsthema's
2. **Coalitieakkoord**: ophalen, analyseren, koppelen aan portefeuilles
3. **Dossier-tegels**: per portefeuille een kaart met samenvatting
4. **Professionele uitstraling**: zelfde kwaliteit als Wassenaar

### Scope (wat NIET voor de light-versie)
- Geen scraping van individuele collegebesluiten (dat is fase 2)
- Geen beleidsbriefings (dat is fase 3)
- Geen verificatiesysteem (dat is fase 4)

### Stappen

#### Stap 0: Bepaal het raadsinformatiesysteem
Ga naar de website van Geldrop-Mierlo en bepaal welke leverancier ze gebruiken: Notubiz, iBabs, of GemeenteOplossingen. Dit bepaalt de scraping-strategie voor fase 2.

#### Stap 1: Portefeuilleverdeling
- Ga naar de gemeentewebsite → College van B&W
- Bepaal alle wethouders + burgemeester
- Bepaal per bestuurder de portefeuille(s)
- Maak een THEMA_BOOM_DATA structuur (zie data.js van Wassenaar als voorbeeld)

#### Stap 2: Coalitieakkoord / Collegeakkoord
- Zoek het coalitieakkoord of collegeakkoord op de gemeentewebsite
- Download/extraheer de tekst
- Analyseer per hoofdstuk/paragraaf de beleidsonderwerpen
- Koppel elk onderwerp aan de juiste portefeuille
- Maak een COALITIE_AKKOORD_DATA structuur (zie coalitieakkoord.js)

#### Stap 3: Samenvattingen per portefeuille
- Schrijf per portefeuille een beknopte samenvatting (3-5 zinnen)
- Baseer op het coalitieakkoord + openbare informatie
- Dit wordt de preview-tekst op de dossier-kaarten

#### Stap 4: Bouw de HTML/JS/CSS
- Kopieer de Wassenaar-structuur
- Vervang alle Wassenaar-specifieke data door Geldrop-Mierlo data
- Pas kleuren/logo aan naar Geldrop-Mierlo huisstijl
- Zorg dat het versienummer "1.0.0-light" is

#### Stap 5: Deploy
- Zet de bestanden op de VPS: `/var/www/braamenco.nl/geldrop-mierlo/`
- Configureer nginx om dit te serveren onder `braamenco.nl/geldrop-mierlo`
- Test

## Technische details

### VPS
- **Host**: 187.77.93.148 (Hostinger, Ubuntu 24.04)
- **SSH**: `ssh root@187.77.93.148` met wachtwoord `I9-dsF0;zAQ#-WySNHE.`
- **Nginx**: al geïnstalleerd en draaiend
- **Huidige sites**: beleidswijzer-wassenaar.nl, braamenco.nl

### Hosting-locatie
- Deploy naar: `braamenco.nl/geldrop-mierlo/`
- Dit is tijdelijk; later verhuizen we naar een subdomein

### Data-structuur (volg exact het Wassenaar-formaat)

**THEMA_BOOM_DATA** in data.js:
```javascript
const THEMA_BOOM_DATA = {
    'Portefeuillenaam': {
        beschrijving: 'Korte beschrijving...',
        portefeuille: 'Wethouder Naam (Partij)',
        kleur: '#hexcode'
    },
    // ...meer portefeuilles
};
```

**ALL_DECISIONS_DATA** in data.js (voor light-versie: leeg array):
```javascript
const ALL_DECISIONS_DATA = [];
```

**COALITIE_AKKOORD_DATA** in coalitieakkoord.js:
```javascript
const COALITIE_AKKOORD_DATA = {
    titel: 'Titel van het akkoord',
    periode: '2022-2026',
    partijen: ['Partij1', 'Partij2'],
    hoofdstukken: [
        {
            titel: 'Hoofdstuktitel',
            thema: 'Portefeuillenaam',
            kernpunten: ['Punt 1', 'Punt 2'],
            tekst: 'Volledige tekst...'
        }
    ]
};
```

**BRIEFING_HTML_DATA** in briefings.js (voor light-versie: placeholder per portefeuille):
```javascript
const BRIEFING_HTML_DATA = {
    'Portefeuillenaam': '<h1>Beleidsbriefing Portefeuillenaam</h1><p>Deze briefing wordt momenteel opgesteld...</p>'
};
```

## Regels
- Alleen openbare data gebruiken
- Respecteer robots.txt, max 1 req/sec
- Geen persoonsgegevens opslaan
- Log alles
- Bij twijfel: vraag Wes

## Kleurcodes
Gebruik de huisstijl van Geldrop-Mierlo (zoek op de gemeentewebsite). Als die niet duidelijk is, gebruik neutrale professionele kleuren en pas later aan.
