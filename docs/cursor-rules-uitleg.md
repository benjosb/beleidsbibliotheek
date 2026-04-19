# Cursor Rules — Uitleg voor Dick

## Wat zijn Cursor Rules?

Rules zijn tekstbestanden die de AI-agent **automatisch leest** aan het begin van elke chat. Ze werken als een geheugen: alles wat erin staat, "weet" de agent zodra je een gesprek begint.

Zonder rules moet je elke keer opnieuw vertellen:
- Waar het project staat
- Welke omgevingen er zijn
- Hoe je deployt
- Waar je gebleven was

Met rules **verminder** je herhaling; het is geen 100% garantie dat elk model ze elke keer toepast. Daarom is **`STATUS.md` + expliciet `@STATUS.md` in een nieuwe chat** de betrouwbaarste combinatie.

## Waar staan ze?

```
jouw-project/
  .cursor/
    rules/
      beleidsbibliotheek.mdc    ← project-regel (geldt IN dit project)
      chat-continuiteit.mdc     ← project-regel
      ...

~/.cursor/
  rules/
    dick-projecten.mdc          ← home-regel (geldt ALTIJD, in elke workspace)
```

**Twee niveaus:**

| Niveau | Map | Wanneer geladen? |
|--------|-----|------------------|
| **Home** | `~/.cursor/rules/` | Altijd, in elke chat, ongeacht welk project open is |
| **Project** | `jouw-project/.cursor/rules/` | Alleen als je dat project open hebt in Cursor |

## Hoe ziet een rule-bestand eruit?

Een `.mdc`-bestand heeft twee delen:

```
---
description: Korte beschrijving (zie je in de instellingen)
alwaysApply: true
---

# De inhoud

Hier schrijf je wat de agent moet weten of doen.
- Feiten (waar staan omgevingen?)
- Instructies (lees eerst STATUS.md)
- Verboden (vraag NOOIT waar de VPS staat)
```

**De drie instellingen in de header:**

| Instelling | Wat het doet |
|------------|-------------|
| `alwaysApply: true` | Wordt ALTIJD geladen bij elke chat |
| `alwaysApply: false` + `globs: *.js` | Wordt alleen geladen als je een `.js`-bestand open hebt |
| `alwaysApply: false` + geen globs | Staat uit, maar je kunt hem handmatig aanzetten |

Voor jouw situatie is `alwaysApply: true` bijna altijd de juiste keuze.

## Jouw huidige rules

### Home workspace (`~/.cursor/rules/`)

| Bestand | Doel |
|---------|------|
| `dick-projecten.mdc` | Overzicht van al je projecten, zodat de agent meteen weet waar dingen staan |

### Project (`_2026_beleidsbibliotheek/.cursor/rules/`)

| Bestand | Doel |
|---------|------|
| `beleidsbibliotheek.mdc` | Hoofdregel: wat is dit project, omgevingen, deploy-workflow, kernbestanden |
| `chat-continuiteit.mdc` | Hoe de agent eerdere chats kan terugvinden |
| `dev-autonomy.mdc` | Instructie: los problemen zelf op, niet stoppen bij fouten |
| `wil-governance.mdc` | WIL / Wes Innovation Lab context |
| `content-verification.mdc` | Inhoudelijke verificatieregels |
| `bbv-dossier-structuur.mdc` | BBV taakvelden structuur |

## Hoe bewerk je ze?

### Via Cursor (makkelijkst)
1. Open het bestand in Cursor (het is gewoon tekst)
2. Bewerk het
3. Sla op — klaar, de volgende chat gebruikt de nieuwe versie

### Via Cursor Settings
1. Klik op het tandwiel (instellingen) → zoek "Rules"
2. Je ziet een overzicht van alle actieve rules
3. Je kunt ze aan/uit zetten

## Tips

- **Kort en bondig**: de agent leest alles, maar lange rules kosten aandacht. Houd het onder de 50-80 regels per bestand.
- **Eén onderwerp per bestand**: niet alles in één mega-bestand proppen.
- **Feiten, geen verhalen**: "ACC staat op 187.77.93.148" is beter dan "De acceptatie-omgeving, die we in maart hebben opgezet..."
- **Gebruik HOOFDLETTERS voor cruciale dingen**: "NOOIT vragen waar de VPS staat" werkt beter dan "vraag niet waar de VPS staat"
- **Test het**: open een nieuwe chat, koppel **`@STATUS.md`**, en vraag om een korte samenvatting + volgende stap. Alleen “verder” zeggen is vaag; liever expliciet `STATUS.md` koppelen.

## STATUS.md — het dagboek

Naast rules heb je ook `STATUS.md` in de projectroot. Dit is anders:

| | Rules | STATUS.md |
|---|---|---|
| **Doel** | Permanente kennis (verandert zelden) | Actuele stand van zaken (verandert elke sessie) |
| **Wie schrijft** | Jij of de agent (eenmalig) | De agent (aan het einde van elke sessie) |
| **Voorbeeld** | "ACC staat op Hostinger" | "Gisteren B-003 verwerkt, volgende stap: deploy naar ACC" |

In de **projectregels** staat dat de agent `STATUS.md` moet lezen en aan het einde bijwerkt — dat **helpt**, maar is niet waterdicht. **Jij** vergroot de kans door in een nieuwe chat **`@STATUS.md`** te koppelen (zie ook de kop *Start instructie* bovenaan `STATUS.md`).
