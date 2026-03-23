// Schrijf-Wijzer — minimale data (standalone, geen dependency op data.js/app.js)
// Bron: SAMENVATTING_PER_THEMA uit app.js

const SCHRIJF_WIJZER_DOMEINEN = [
    'Bestuur & Veiligheid',
    'Financiën, Economie & Sport',
    'Ruimte, Duurzaamheid & Mobiliteit',
    'Sociaal Domein, Wonen & Onderwijs',
    'Cultuur & Welzijn',
    'Bedrijfsvoering'
];

const SCHRIJF_WIJZER_KLEUREN = {
    'Bestuur & Veiligheid':              { accent: '#002244', light: '#d6e4f0' },
    'Financiën, Economie & Sport':       { accent: '#57589D', light: '#ddddf0' },
    'Ruimte, Duurzaamheid & Mobiliteit': { accent: '#1565c0', light: '#bbdefb' },
    'Sociaal Domein, Wonen & Onderwijs': { accent: '#c0392b', light: '#f5d0cc' },
    'Cultuur & Welzijn':                 { accent: '#e67e22', light: '#fce4cc' },
    'Bedrijfsvoering':                   { accent: '#438527', light: '#d4edcc' },
};

const SCHRIJF_WIJZER_SAMENVATTINGEN = {
    'Bestuur & Veiligheid': [
        { thema: 'Openbare Orde & Veiligheid', samenvatting: 'Integraal veiligheidsbeleid. Burgemeester als eenhoofdig bestuursorgaan. Noodverordening NAVO-top 2025 bekrachtigd (juni 2025). APV-toelichting geactualiseerd (mei 2022).' },
        { thema: 'Gemeenschappelijke Regelingen', samenvatting: 'GR Veiligheidsregio Haaglanden gewijzigd (maart 2025). Zienswijzen op begrotingen VRH en GR Rekenkamer WVOLV. Mandaatbesluit ODH geactualiseerd.' },
        { thema: 'Publieke Omroep & Communicatie', samenvatting: 'Toetsingscriteria aanwijzingsprocedure lokale publieke omroep gewijzigd vastgesteld (april 2025). Wet open overheid geïmplementeerd.' },
        { thema: 'Handhaving & APV', samenvatting: 'Ontruiming Huize Ivicke (mei/juni 2022). APV-toelichting geactualiseerd.' },
    ],
    'Financiën, Economie & Sport': [
        { thema: 'Financieel Beleid & P&C-cyclus', samenvatting: 'Sluitende meerjarenbegroting. P&C-cyclus: Kadernota, Begroting, Voorjaarsnota, Najaarsnota, Jaarstukken. Financiële Verordening en Controleprotocol 2025 geactualiseerd.' },
        { thema: 'Belastingen & Heffingen', samenvatting: 'Belastingverordeningen 2026 vastgesteld: OZB, afvalstoffenheffing, toeristenbelasting, hondenbelasting, leges, retributie, marktgeld, liggeld, precariobelasting, ondernemersheffing, kwijtschelding, begraafplaatsrechten.' },
        { thema: 'Economie', samenvatting: 'Economische Visie Wassenaar 2025 vastgesteld (sept 2025) met zes ambities. BIZ Maaldrift 2026-2030. Zienswijze Visie Economisch Vestigingsklimaat MRDH.' },
        { thema: 'Sport', samenvatting: 'Sportvisie Wassenaar 2025 vastgesteld (sept 2025) met vier pijlers. Lokaal Sportakkoord II "Sport versterkt" (2023). Bouw gemeentelijke sporthal in uitvoering.' },
        { thema: 'Vastgoed & De Paauw', samenvatting: 'De Paauw: renovatie/restauratie zonder extra krediet, subsidie-opbrengsten voor verduurzaming. Avalex (afval): zienswijze begroting 2026.' },
    ],
    'Ruimte, Duurzaamheid & Mobiliteit': [
        { thema: 'Omgevingswet & Ruimtelijke ordening', samenvatting: 'Implementatie Omgevingswet. Startnotitie Participatie Omgevingsvisie (dec 2025). Beleidsregels milieuzonering. Bestemmingsplannen, beheersverordeningen. ODH: vijfde wijziging GR.' },
        { thema: 'Woningbouw & Woonbeleid', samenvatting: 'Nota Woonbeleid 2025 vastgesteld. Huisvestingsverordening 2023 (tweede wijziging dec 2025). Valkenhorst, Duindigt, Den Deylschool herontwikkeling.' },
        { thema: 'Kust, Duin & Groene Zone', samenvatting: 'Visie De Wassenaarse Slag vastgesteld (maart 2025). Concept-Programma Noordrand. Nationaal Park Hollandse Duinen.' },
        { thema: 'Duurzaamheid & Energietransitie', samenvatting: 'Lokale Energiestrategie 2023-2026. Voortgangsrapportages RES. Subsidieplafond Milieubeheer.' },
        { thema: 'Verkeer & Mobiliteit', samenvatting: 'Burgerberaad Verkeer (juni 2025). Wegencategoriseringsplan vastgesteld (dec 2025). Herziene Realisatieplan Verkeer.' },
    ],
    'Sociaal Domein, Wonen & Onderwijs': [
        { thema: 'Jeugdhulp & Jeugdbeleid', samenvatting: 'Lokaal Jeugdbeleid Wassenaar 2026 en Verordening Jeugdhulp 2025 vastgesteld (nov 2025). Nieuw inkoopkader jeugdhulp via GR SbJH.' },
        { thema: 'Wmo & Maatschappelijke Ondersteuning', samenvatting: '7e wijziging Verordening maatschappelijke ondersteuning (juni 2022). Wmo-tarieven H6 geïndexeerd. Verordening Adviesraad Sociaal Domein 2025.' },
        { thema: 'Participatie & Schuldhulp', samenvatting: 'Beleidsnota schuldhulpverlening 2025-2028 vastgesteld (apr 2025). Verordening inburgering 2022.' },
        { thema: 'Onderwijs & Huisvesting', samenvatting: 'Herijking IHP onderwijs 2024-2039 (apr 2025). Voorbereidingskredieten Sint Baptistschool, Kievietschool. Verordening leerlingenvervoer 2025.' },
        { thema: 'Wonen, Woonzorg & Ouderen', samenvatting: 'Startnotitie Lokale Woonzorgvisie (sept 2025). Beleidsnota Ouderenbeleid 2025 (jan 2025).' },
    ],
    'Cultuur & Welzijn': [
        { thema: 'De Warenar', samenvatting: 'Cultuurhuis blijft eigendom gemeente. Raad koos sept 2025 voor voorkeursvariant 2: herbestemming, renovatie en verduurzaming (€5 mln).' },
        { thema: 'Subsidiebeleid', samenvatting: 'Jaarlijkse vaststelling subsidieplafonds. 2025: Economie €35.960, SAD €478.969, Volksgezondheid €34.228. Subsidieregeling structurele activiteiten (2024).' },
        { thema: 'Erfgoed & Welstand', samenvatting: 'Eerste technische aanpassing Erfgoedverordening 2016 (2023). Commissie Welstand en Cultureel Erfgoed (WCE). Coalitie: erfgoed behouden, verduurzaming faciliteren.' },
        { thema: 'GGD & Volksgezondheid', samenvatting: 'GR GGD en Veilig Thuis Haaglanden. Zienswijzen op begrotingen. Regiovisie Aanpak Huiselijk Geweld 2026+ vastgesteld dec 2025.' },
        { thema: 'Welzijn & Buurtwerk', samenvatting: 'Overeenkomst Gro-Up Buurtwerk (apr 2024). Subsidies preventief veld. IPS-trajecten. Gezond en Actief Leven Akkoord (GALA).' },
    ],
    'Bedrijfsvoering': [
        { thema: 'Ambtelijke Organisatie & Personeel', samenvatting: 'College Uitvoeringsprogramma (CUP). Ledenraadpleging Cao Gemeenten en Cao SGO (2022-2023). Uitbreiding formatie juridische ondersteuning per 1-1-2023.' },
        { thema: 'Dienstverlening & Samenwerking', samenvatting: 'Werkorganisatie Duivenvoorde (samenwerking Voorschoten). DVO Maatschappij & Samenleving, DVO MO. Dienstverleningsovereenkomst Secretariaat Behandeling Bezwaarschriften.' },
        { thema: 'Informatievoorziening & ICT', samenvatting: 'Wet open overheid (Woo). Aanwijzing gemeentearchivaris (feb 2022). Communicatie en ICT als aandachtspunten.' },
        { thema: 'Buurtgericht Werken', samenvatting: 'Nota Inrichting Sociaal Kernteam Wassenaar (juni 2022). Routekaart Buurtgerichte Uitvoeringsplannen (jan 2023).' },
    ],
};
