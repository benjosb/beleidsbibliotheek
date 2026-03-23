# Schrijf-Wijzer v2 — Tweetraps + Knoppen in het document

**Status:** Ontwerp · Maart 2026  
**Versie:** 2.0 — Geen copy-paste; knoppen in het sjabloon; tweetraps-selectie.

---

## 1. Uitgangspunten

1. **Geen knippen/plakken** — Beleidscontext hoort in het document zelf, niet als apart paneel dat je moet kopiëren.
2. **Tweetraps-raket** — Eerst portefeuille (vooraf), dan subthema's per sectie (binnen het formulier).
3. **Portefeuille = vooraf** — Een medewerker Sociaal Domein schrijft niet over Fysieke Leefomgeving. De portefeuille is een keuze die je aan het begin maakt.
4. **Subthema's = binnen het formulier** — Binnen een portefeuille kunnen alle onderwerpen relevant zijn. Die wil je per sectie beschikbaar hebben.

---

## 2. Tweetraps-architectuur

### Trap 1: Portefeuille (documentniveau)

**Wanneer:** Bij het starten van een nieuw collegevoorstel.  
**Waar:** Bovenaan het formulier, prominent.  
**Keuze:** Eén portefeuille (Bestuur & Veiligheid, Financiën…, Ruimte…, Sociaal Domein…, Cultuur & Welzijn, Bedrijfsvoering).  
**Effect:** Alle subthema-knoppen in het document tonen alleen thema's uit die portefeuille.

### Trap 2: Subthema's (sectieniveau)

**Wanneer:** Tijdens het schrijven, per sectie.  
**Waar:** In elke sectie van het collegevoorstel (Aanleiding, Gevraagde beslissing, etc.).  
**Keuze:** Een of meer subthema's binnen de gekozen portefeuille.  
**Effect:** De beleidssamenvatting voor die subthema's verschijnt **inline in die sectie** — als uitklapbaar blok of direct zichtbaar paneel. Geen copy-paste.

---

## 3. Documentstructuur (collegevoorstel-sjabloon)

| Sectie | Beschrijving | Beleidsknoppen |
|--------|--------------|----------------|
| **Titel** | Onderwerp van het voorstel | — |
| **Portefeuille** | Trap 1: kies portefeuille | Grote knoppen |
| **Aanleiding** | Waarom nu? Achtergrond. | Subthema-knoppen + beleidspanel |
| **Gevraagde beslissing** | Wat wordt gevraagd? | Subthema-knoppen + beleidspanel |
| **Gevraagde beslispunten** | Genummerde punten | Subthema-knoppen + beleidspanel |
| **Financiële consequenties** | Budget, reserves, etc. | Subthema-knoppen + beleidspanel |
| **Juridisch kader** | Indien van toepassing | Subthema-knoppen + beleidspanel |
| **Bijlagen** | Overzicht bijlagen | — |

---

## 4. UX: Knoppen in het document

### Per sectie (bijv. Aanleiding)

```
┌─────────────────────────────────────────────────────────────┐
│ Aanleiding                                                   │
├─────────────────────────────────────────────────────────────┤
│ [Beleidscontext voor deze sectie]                            │
│                                                              │
│ [Jeugdhulp] [Wmo] [Participatie] [Onderwijs] [Wonen]  ← knoppen
│                                                              │
│ ▼ Beleid (2 geselecteerd)                                    │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ **Jeugdhulp & Jeugdbeleid**                             │  │
│ │ Lokaal Jeugdbeleid Wassenaar 2026 en Verordening        │  │
│ │ Jeugdhulp 2025 vastgesteld (nov 2025)...                │  │
│ │                                                         │  │
│ │ **Wmo & Maatschappelijke Ondersteuning**                │  │
│ │ 7e wijziging Verordening maatschappelijke ondersteuning │  │
│ │ (juni 2022). Wmo-tarieven H6 geïndexeerd...             │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ [Tekstveld voor de aanleiding - schrijf hier]                │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │                                                         │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- De knoppen staan **boven** het tekstveld.
- De beleidssamenvatting staat **tussen** de knoppen en het tekstveld — of als uitklapbaar blok.
- De medewerker ziet het beleid terwijl hij schrijft. Geen copy-paste.

---

## 5. Technische opzet voor agent-toekomst

### Document als gestructureerde data

Het collegevoorstel wordt opgeslagen als JSON:

```json
{
  "versie": "1.0",
  "portefeuille": "Sociaal Domein, Wonen & Onderwijs",
  "titel": "Vaststelling subsidie...",
  "secties": [
    {
      "id": "aanleiding",
      "naam": "Aanleiding",
      "tekst": "De raad heeft in november 2025...",
      "geselecteerdeSubthemas": ["Jeugdhulp & Jeugdbeleid", "Wmo & Maatschappelijke Ondersteuning"],
      "beleidTekst": "Lokaal Jeugdbeleid Wassenaar 2026..."
    },
    {
      "id": "gevraagde_beslissing",
      "naam": "Gevraagde beslissing",
      "tekst": "",
      "geselecteerdeSubthemas": [],
      "beleidTekst": ""
    }
  ]
}
```

### Waarom dit belangrijk is voor een agent

1. **Context** — De agent krijgt: portefeuille + per sectie de geselecteerde subthemas + de beleidssamenvatting. Dat is de "grounding" voor wat er beleidsmatig van toepassing is.
2. **Volledigheid** — De agent kan checken: zijn alle relevante secties ingevuld? Ontbreekt er beleidsonderbouwing?
3. **Consistentie** — De agent kan controleren of de geschreven tekst consistent is met de geselecteerde beleidscontext.
4. **Suggesties** — De agent kan tekst voorstellen op basis van de beleidssamenvatting en de structuur van het voorstel.

### Aanbevelingen voor agent-integratie

| Aspect | Advies |
|--------|--------|
| **Data-model** | Houd het document als JSON; elke sectie heeft `tekst`, `geselecteerdeSubthemas`, `beleidTekst`. |
| **API** | Exposeer een endpoint dat het document + beleidscontext retourneert. De agent kan dit als prompt-context gebruiken. |
| **Prompt-structuur** | Geef de agent: (1) portefeuille, (2) per sectie: geselecteerd beleid + gebruikers-tekst, (3) instructie (bijv. "controleer volledigheid" of "stel een aanleiding voor"). |
| **Incrementeel** | Begin met een agent die alleen controleert (volledigheid, consistentie). Later: suggesties, herformuleringen. |
| **Export** | Exporteer naar Word/PDF met de beleidsreferenties als voetnoten of bijlage — machine-readable blijft de JSON. |

### Agent-prompt voorbeeld

```
Je bent een beleidsadviseur die collegevoorstellen beoordeelt.

CONTEXT:
- Portefeuille: Sociaal Domein, Wonen & Onderwijs
- Beleid (geselecteerd voor sectie Aanleiding): Jeugdhulp & Jeugdbeleid, Wmo & Maatschappelijke Ondersteuning
  [hier de samenvattingen]

VOORSTEL (concept):
- Aanleiding: [tekst van de gebruiker]
- Gevraagde beslissing: [tekst]
- etc.

OPDRACHT: Controleer of de aanleiding voldoende onderbouwd is met het geselecteerde beleid. 
Geef concrete verbetersuggesties.
```

---

## 6. Implementatie-overzicht

1. **Formulier-pagina** — `schrijf-wijzer-formulier.html` (of vergelijkbare naam)
2. **Trap 1** — Portefeuille-knoppen bovenaan; bij selectie wordt het formulier "geactiveerd".
3. **Trap 2** — Per sectie: subthema-knoppen (alleen van gekozen portefeuille) + inline beleidspanel.
4. **Geen copy-paste** — Beleid staat in het document; eventueel "Invoegen in tekst" als optie (niet als enige weg).
5. **Opslag** — localStorage of backend: JSON-structuur voor later agent-integratie.
