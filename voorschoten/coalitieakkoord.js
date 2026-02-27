// Coalitieakkoord 2022–2026: "Voorschoten in verbinding vooruit"
// Bron: https://cuatro.sim-cdn.nl/voorschoten/uploads/coalitieakkoord_def_0.pdf
// Coalitie: VVD, Voorschoten Lokaal, CDA

const COALITIEAKKOORD_DATA = {
    bron_url: "https://cuatro.sim-cdn.nl/voorschoten/uploads/coalitieakkoord_def_0.pdf",
    titel: "Voorschoten in verbinding vooruit",
    datum: "4 juli 2022",
    partijen: ["VVD", "Voorschoten Lokaal", "CDA"],

    woord_vooraf: `Voor u ligt een coalitieakkoord gesloten door VVD, Voorschoten Lokaal en CDA. Het akkoord omvat afspraken op hoofdlijnen. Het document geeft een duidelijke richting voor de komende vier jaar.

Het belangrijkste vinden wij dat Voorschoten dicht bij de inwoner staat. Een open bestuurscultuur, een bestuur dat bereikbaar en transparant is, met een goede dienstverlening op alle gebieden. We betrekken inwoners zoveel mogelijk, en organiseren onze processen van buiten naar binnen.

Voor ons zijn 3 pijlers van wezenlijk belang:
1) Voorschoten blijft een heerlijk woondorp
2) Voorschoten heeft meer betaalbare woningen voor verschillende doelgroepen
3) Voorschoten is duurzaam en toekomstbestendig`,

    secties: [
        {
            id: "bestuurlijke-zelfstandigheid",
            titel: "Bestuurlijke zelfstandigheid",
            hoofdstuk: "Bestuur",
            thema: "Bestuur & Veiligheid",
            tekst: `Bestuurlijke zelfstandigheid is essentieel om grip te houden op eigen voorzieningen. Op meerdere gebieden — zorg en welzijn, klimaat, afval, verkeer, bedrijfsvoering — wordt intensief samengewerkt in de Leidse regio. Goede dienstverlening voor inwoners heeft prioriteit, zelfs als regionale samenwerking soms ten koste gaat van eigen beleidsruimte.

De coalitie is een warm voorstander van bestuurlijke zelfstandigheid en dit geeft aan dat wij vertrouwen hebben in de gemeente Voorschoten en haar mogelijkheden.`
        },
        {
            id: "veiligheid",
            titel: "Veiligheid handhaven in ons dorp",
            hoofdstuk: "Bestuur",
            thema: "Bestuur & Veiligheid",
            tekst: `Voorschoten heeft samen met het nieuwe gebiedsgebonden politieteam extra aandacht voor veiligheid in het dorp. Speerpunten zijn: aanpak van ondermijning, preventie van jeugdcriminaliteit, tegengaan van drugsoverlast en high impact crimes (woninginbraken, overvallen).

Buurtpreventie-initiatieven worden gestimuleerd. Er komt meer zichtbare handhaving in de openbare ruimte, ook in de avonduren. Bij complexe veiligheidsvraagstukken wordt samengewerkt in de Zorg- en Veiligheidstafel.`
        },
        {
            id: "participatie",
            titel: "Inwonerparticipatie stimuleren",
            hoofdstuk: "Bestuur",
            thema: "Bestuur & Veiligheid",
            tekst: `Inwonerparticipatie in termen van adviseren en meedenken is van groot belang en kan de kwaliteit van planvorming verbeteren. De participatieprojecten zijn duidelijk, transparant, maar ook eindig. Het uiteindelijke besluit van het gemeentebestuur is een besluit met oog voor het algemeen belang.

Participatie wordt zoveel mogelijk ingezet bij ruimtelijke en sociale opgaven. De gemeente zet in op nieuwe vormen van participatie, zoals het uitdaagrecht (right to challenge).`
        },
        {
            id: "florerende-economie",
            titel: "Een florerende economie",
            hoofdstuk: "Economie",
            thema: "Economie & Dienstverlening",
            tekst: `Voorschoten heeft een bruisend en aantrekkelijk centrum, met voldoende parkeergelegenheid. De economische functie van het centrum wordt versterkt door het aantrekken van meer diversiteit in het winkelaanbod.

De weekmarkt wordt gepromoot en waar mogelijk versterkt. Samenwerking met het Centrummanagement wordt gecontinueerd. De coalitie streeft naar het behouden van werkgelegenheid en het aantrekken van nieuwe bedrijvigheid passend bij het karakter van Voorschoten.`
        },
        {
            id: "dienstverlening",
            titel: "Betrouwbare dienstverlening aan inwoners",
            hoofdstuk: "Economie",
            thema: "Economie & Dienstverlening",
            tekst: `De dienstverlening aan inwoners wordt verder verbeterd. Digitaal als het kan, persoonlijk als het moet. De gemeentelijke website wordt doorontwikkeld als centraal informatiekanaal.

Vergunningaanvragen worden sneller afgehandeld. De coalitie stuurt op een cultuur van meedenken en oplossingen zoeken in plaats van regels toepassen.`
        },
        {
            id: "wonen",
            titel: "Wonen",
            hoofdstuk: "Wonen",
            thema: "Wonen & Ruimtelijke Ordening",
            tekst: `We zetten in op meer betaalbare woningen: 30% sociaal, 25% middenhuur of sociale koop. Specifiek gericht op jongeren/starters, jonge gezinnen en senioren.

Levensloopbestendig wonen en bouwen vraagt extra aandacht. Doorstroming op de woningmarkt wordt bevorderd door te bouwen voor senioren. Woningbouwprojecten (waaronder Segaar/Arsenaal, Leidseweg-Noord en de locaties rond het centrum) worden voortvarend opgepakt.

Bij de huisvesting van statushouders wordt gekeken naar spreiding over de verschillende wijken.`
        },
        {
            id: "omgevingswet",
            titel: "Omgevingswet",
            hoofdstuk: "Wonen",
            thema: "Wonen & Ruimtelijke Ordening",
            tekst: `De invoering van de Omgevingswet biedt kansen om vergunningverlening eenvoudiger en sneller te maken. De gemeente bereidt zich voor op de nieuwe werkwijze en investeert in digitale systemen en kennis.

Het omgevingsplan wordt opgesteld in samenspraak met inwoners en ondernemers. Hierbij wordt een goede balans gezocht tussen beschermen en benutten.`
        },
        {
            id: "energie-groen-klimaat",
            titel: "Energie, groen en klimaat",
            hoofdstuk: "Duurzaamheid",
            thema: "Duurzaamheid, Groen & Klimaat",
            tekst: `Om klimaatveranderingen het hoofd te bieden gaan we aan de slag met oplossingen op het gebied van klimaatadaptatie. Duurzaam bouwen is de standaard, we gaan onze rioleringen wijkgericht up-to-date brengen.

De coalitie stimuleert de energietransitie door het faciliteren van isolatiemaatregelen, zonnepanelen en wijkgerichte warmteoplossingen. Het groene karakter van Voorschoten wordt behouden en versterkt.

De biodiversiteit in de gemeente wordt beschermd. Bij het kappen van bomen geldt het principe: kap één, plant twee terug.`
        },
        {
            id: "grondstoffenplan",
            titel: "Grondstoffenplan",
            hoofdstuk: "Duurzaamheid",
            thema: "Duurzaamheid, Groen & Klimaat",
            tekst: `Voorschoten streeft naar een circulaire economie. Het grondstoffenplan wordt geactualiseerd met als doel de hoeveelheid restafval verder te verminderen.

De coalitie kiest voor bronscheiding en onderzoekt de mogelijkheden van nascheiding. Zwerfafval wordt aangepakt in samenwerking met bewonersinitiatieven.`
        },
        {
            id: "verkeer-bereikbaarheid",
            titel: "Verkeer en bereikbaarheid",
            hoofdstuk: "Mobiliteit",
            thema: "Verkeer & Bereikbaarheid",
            tekst: `Verkeersveiligheid heeft hoge prioriteit, met name rond scholen en in woonwijken. De coalitie streeft naar 30 km/u-zones in alle woonwijken.

De bereikbaarheid van Voorschoten per fiets en openbaar vervoer wordt verbeterd. De coalitie zet zich in voor behoud van goede busverbindingen. Parkeerbeleid wordt geëvalueerd en waar nodig aangepast aan de veranderende mobiliteitsbehoeften.

De verkeerssituatie rond het centrum en de Leidseweg vraagt specifieke aandacht.`
        },
        {
            id: "beheerplannen",
            titel: "Beheerplannen",
            hoofdstuk: "Mobiliteit",
            thema: "Verkeer & Bereikbaarheid",
            tekst: `Beheerplannen voor wegen, groen, riolering en openbare verlichting worden geactualiseerd. Hierbij wordt rekening gehouden met klimaatadaptatie en duurzaamheid.

Bij groot onderhoud worden direct verbeteringen meegenomen voor verkeersveiligheid en leefbaarheid.`
        },
        {
            id: "goede-zorg",
            titel: "Goede zorg voor de inwoners",
            hoofdstuk: "Sociaal domein",
            thema: "Zorg, Welzijn & Samenleving",
            tekst: `Goede en betaalbare zorg is essentieel. De coalitie stuurt op kostenbeheersing in de jeugdzorg en Wmo, zonder dat dit ten koste gaat van de kwaliteit.

Preventie staat voorop. We investeren in vroegsignalering en wijkgerichte aanpak. Het Sociaal Team Voorschoten speelt hierin een centrale rol. Eenzaamheid onder ouderen wordt aangepakt met gerichte programma's.

De coalitie stimuleert sport en bewegen voor alle leeftijdsgroepen. Het zwembad wordt behouden. Sportverenigingen worden ondersteund.`
        },
        {
            id: "voorschoten-verenigd",
            titel: "Voorschoten verenigd",
            hoofdstuk: "Sociaal domein",
            thema: "Zorg, Welzijn & Samenleving",
            tekst: `Voorschoten kent een rijk verenigingsleven. Culturele, sportieve en maatschappelijke organisaties zijn het cement van de samenleving. De coalitie investeert in het ondersteunen van vrijwilligers en het versterken van de sociale infrastructuur.

De bibliotheek is een belangrijke voorziening die behouden blijft. Cultuureducatie voor jongeren wordt gestimuleerd. Onderwijs en onderwijshuisvesting krijgen extra aandacht, met name het Integraal Huisvestingsplan.`
        },
        {
            id: "financieel-beheer",
            titel: "Gezond financieel beheer nu en in toekomst",
            hoofdstuk: "Financiën",
            thema: "Financiën & Organisatie",
            tekst: `Voorschoten is financieel beter op orde dan vier jaar geleden. Nieuw beleid wordt gerealiseerd door het schrappen van oud beleid of door efficiëntere inzet van beschikbare middelen.

Grote investeringen zijn geen vanzelfsprekendheid. Er wordt actief financiële ruimte gezocht, bijvoorbeeld door het afstoten van vastgoed. Uitgangspunt: een structureel sluitende begroting. De OZB wordt niet meer dan trendmatig verhoogd.`
        },
    ],

    portefeuilleverdeling: {
        "Burgemeester Nadine Stemerdink": ["Personeel, organisatie en ict", "Communicatie en lokale omroep", "Straatnaamgeving", "Bestuurlijke en juridische zaken", "Evenementen", "Vergunningverlening en handhaving", "Dienstverlening en deregulering", "Openbare orde en veiligheid"],
        "Wethouder Pieter Varekamp (1e loco) — Economie & Dienstverlening": ["Vastgoed (inclusief bibliotheek, exclusief sport)", "Werk en inkomen (inclusief inburgering)", "Toerisme en recreatie", "Omklap sociaal domein", "Regiozaken en regionale samenwerking", "Internationalisering", "Centrum en winkelcentra", "Economie en vestigingsklimaat"],
        "Wethouder Hans van der Elst (2e loco) — Financiën & Organisatie": ["Kunst, cultuur, bibliotheek en erfgoed", "Subsidiebeleid", "Onderwijs en onderwijshuisvesting", "Omgevingswet (inclusief vergunningverlening)", "Grondzaken", "Volkshuisvesting en (woning)bouw", "Financiën"],
        "Wethouder Hubert Schokker (3e loco) — Zorg, Welzijn & Samenleving": ["Wmo", "Welzijn en wijkbeleid", "Vrijwilligersbeleid", "Verkeer en vervoer", "Sport en zwembad (incl. vastgoed)", "Riolering", "Jeugdzorg", "Inwonersparticipatie", "Grondstoffen en circulariteit", "Gezondheidszorg incl. Hecht", "Duurzaamheid, milieu en energie", "Beheer openbare ruimte en groen", "Begraafplaatsen"]
    }
};
