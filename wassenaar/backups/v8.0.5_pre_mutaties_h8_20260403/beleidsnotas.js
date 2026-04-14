/**
 * Beleidsnota's — interactieve lijst beleidsdocumenten met BBV-koppeling
 * Data uit Overdrachtsdossier Bijlage 1. Opslag in localStorage.
 */
(function () {
    const STORAGE_KEY = 'beleidsnotas_wassenaar';

    // BBV-hoofdstuk + taakveld (zelfde structuur als app.js). H0–H8 = hoofdstukniveau (beleidsnota over meerdere taakvelden).
    const BBV_OPTIES = [
        { value: '', label: '— Kies BBV-taakveld —' },
        { value: 'H0', label: '— Hoofdstuk 0: Bestuur en middelen —' },
        { value: 'H1', label: '— Hoofdstuk 1: Veiligheid —' },
        { value: 'H2', label: '— Hoofdstuk 2: Verkeer en vervoer —' },
        { value: 'H3', label: '— Hoofdstuk 3: Economie —' },
        { value: 'H4', label: '— Hoofdstuk 4: Onderwijs —' },
        { value: 'H5', label: '— Hoofdstuk 5: Sport, cultuur, recreatie —' },
        { value: 'H6', label: '— Hoofdstuk 6: Sociaal domein —' },
        { value: 'H7', label: '— Hoofdstuk 7: Volksgezondheid en milieu —' },
        { value: 'H8', label: '— Hoofdstuk 8: Volkshuisvesting, leefomgeving en stedelijke vernieuwing —' },
        { value: '0.1', label: '0.1 Bestuur' },
        { value: '0.2', label: '0.2 Burgerzaken' },
        { value: '0.3', label: '0.3 Beheer overige gebouwen en gronden' },
        { value: '0.4', label: '0.4 Overhead' },
        { value: '0.5', label: '0.5 Treasury' },
        { value: '0.61', label: '0.61 OZB woningen' },
        { value: '0.62', label: '0.62 OZB niet-woningen' },
        { value: '0.63', label: '0.63 Parkeerbelasting' },
        { value: '0.64', label: '0.64 Belastingen overig' },
        { value: '0.7', label: '0.7 Algemene uitkering gemeentefonds' },
        { value: '0.8', label: '0.8 Overige baten en lasten' },
        { value: '0.9', label: '0.9 Vennootschapsbelasting (VpB)' },
        { value: '0.10', label: '0.10 Mutaties reserves' },
        { value: '0.11', label: '0.11 Resultaat baten en lasten' },
        { value: '1.1', label: '1.1 Crisisbeheersing en brandweer' },
        { value: '1.2', label: '1.2 Openbare orde en veiligheid' },
        { value: '2.1', label: '2.1 Verkeer en vervoer' },
        { value: '2.2', label: '2.2 Parkeren' },
        { value: '2.3', label: '2.3 Recreatieve havens' },
        { value: '2.4', label: '2.4 Economische havens en waterwegen' },
        { value: '2.5', label: '2.5 Openbaar vervoer' },
        { value: '3.1', label: '3.1 Economische ontwikkeling' },
        { value: '3.2', label: '3.2 Fysieke bedrijfsinfrastructuur' },
        { value: '3.3', label: '3.3 Bedrijvenloket en bedrijfsregelingen' },
        { value: '3.4', label: '3.4 Economische promotie' },
        { value: '4.1', label: '4.1 Openbaar basisonderwijs' },
        { value: '4.2', label: '4.2 Onderwijshuisvesting' },
        { value: '4.3', label: '4.3 Onderwijsbeleid en leerlingzaken' },
        { value: '5.1', label: '5.1 Sportbeleid en activering' },
        { value: '5.2', label: '5.2 Sportaccommodaties' },
        { value: '5.3', label: '5.3 Cultuurpresentatie, cultuurproductie en cultuurparticipatie' },
        { value: '5.4', label: '5.4 Musea' },
        { value: '5.5', label: '5.5 Cultureel erfgoed' },
        { value: '5.6', label: '5.6 Media' },
        { value: '5.7', label: '5.7 Openbaar groen en (openlucht) recreatie' },
        { value: '6.1', label: '6.1 Samenkracht en burgerparticipatie' },
        { value: '6.2', label: '6.2 Toegang eerste lijns' },
        { value: '6.3-6.5', label: '6.3 - 6.5 Werk en inkomen' },
        { value: '6.60-6.91', label: '6.60 - 6.91 WMO' },
        { value: '6.7-6.9', label: '6.7 - 6.9 Jeugd' },
        { value: '7.1', label: '7.1 Volksgezondheid' },
        { value: '7.2', label: '7.2 Riolering' },
        { value: '7.3', label: '7.3 Afval' },
        { value: '7.4', label: '7.4 Milieubeheer' },
        { value: '7.5', label: '7.5 Begraafplaatsen en crematoria' },
        { value: '8.1', label: '8.1 Ruimte en leefomgeving' },
        { value: '8.2', label: '8.2 Grondexploitatie (niet-bedrijventerreinen)' },
        { value: '8.3', label: '8.3 Wonen en bouwen' },
    ];

    // BBV → OD-hoofdstuk (deeplink overdrachtsdossier.html#od-ch-X)
    const BBV_TO_OD = {
        'H0': 8, '0.1': 8, '0.2': 8, '0.3': 8, '0.4': 9, '0.5': 9, '0.61': 9, '0.62': 9, '0.63': 9, '0.64': 9,
        '0.7': 9, '0.8': 9, '0.9': 9, '0.10': 9, '0.11': 9,
        'H1': 12, '1.1': 12, '1.2': 12,
        'H2': 13, '2.1': 13, '2.2': 13, '2.3': 13, '2.4': 13, '2.5': 13,
        'H3': 15, '3.1': 15, '3.2': 15, '3.3': 15, '3.4': 15,
        'H4': 16, '4.1': 16, '4.2': 16, '4.3': 16,
        'H5': 16, '5.1': 16, '5.2': 16, '5.3': 16, '5.4': 16, '5.5': 16, '5.6': 16, '5.7': 15,
        'H6': 14, '6.1': 14, '6.2': 14, '6.3-6.5': 14, '6.60-6.91': 14, '6.7-6.9': 14,
        'H7': 13, '7.1': 14, '7.2': 13, '7.3': 13, '7.4': 13, '7.5': 13,
        'H8': 13, '8.1': 13, '8.2': 13, '8.3': 13,
    };

    // Initiële data uit OD Bijlage 1. Links uit overdrachtsdossier.doc. wassenaar.incijfers.nl achteraan.
    // bbv = voorstel voor pulldown (kan worden aangepast)
    const INITIELE_DATA = [
        { document: 'Verordening Wmo', toelichting: 'Vernieuwde verordening maatschappelijke ondersteuning', link: '', bbv: '6.60-6.91', geverifieerd: false, initialen: '' },
        { document: 'Integraal Veiligheidsbeleid 2024–2027', toelichting: 'iBabs-document; controleer in iBabs welke vergadering en stemming', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/df32a5b8-1b14-4a96-b325-bd3af644cc9f?documentId=d55bb8d1-54e5-473f-8302-33434af5914c&agendaItemId=77e257f7-68bb-42a3-92ae-8a2628d2a666', bbv: 'H1', geverifieerd: false, initialen: '' },
        { document: 'Wegencategoriseringsplan Wassenaar', toelichting: 'Raad 17 dec 2025; iBabs LoadAgendaItemDocument (zelfde als briefing Verkeer & Mobiliteit)', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/3a10e3a7-42a0-4d1d-b2d5-4665bcb18442?agendaItemId=fecb037d-9434-46c1-8d7c-d88b5082b02a', bbv: 'H2', geverifieerd: false, initialen: '' },
        { document: 'Beleidsplan Sociaal Domein Wassenaar 2024', toelichting: 'Uitwerking sociaal domein', link: 'https://www.wassenaar.nl/beleidsplan-sociaal-domein', bbv: '6.60-6.91', geverifieerd: false, initialen: '' },
        // ─── BBV 8 (H8): volledige OD-/Omgevingswet-lijst — spiegel van BELEIDSNOTA_PER_HOOFDSTUK_BBV[8] in app.js ───
        { document: 'Raadsvoorstel Startnotitie Participatie Omgevingsvisie', toelichting: 'Raad 17 dec 2025 (geamendeerd); streef vaststelling visie 1 apr 2027', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=c42f813b-833e-4d65-af0a-c76e2824095d&agendaItemId=5abb6d11-0c07-463f-a4c0-10b66f8e58a8', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Eerste proeve Omgevingsvisie 2040', toelichting: 'Niet vastgesteld dec 2025; iBabs', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Participatie Omgevingsvisie (fase 2026)', toelichting: 'OD: 1e helft 2026; kaderloze periode vanaf 1 jan 2027 t/m vaststelling', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Ontwerp Omgevingsvisie — concept raad', toelichting: 'OD: streef okt 2026', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Definitieve Omgevingsvisie Wassenaar', toelichting: 'Nog niet vastgesteld; streef apr 2027', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Omgevingsplan Wassenaar (integraal)', toelichting: 'Vervangt bestemmingsplannen; uiterlijk 1 jan 2032', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Generieke delegatie tijdelijk deel omgevingsplan vaststellen', toelichting: 'Gemeentelijk besluit 15 jun 2023 — OB', link: 'https://zoek.officielebekendmakingen.nl/gmb-2023-261015.html', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Volkshuisvestelijk programma', toelichting: 'Verplicht onderdeel Omgevingsvisie (OD)', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Gebiedsgerichte uitvoeringsprogramma’s Omgevingsvisie', toelichting: 'Water, bodem, natuur, gezondheid, energie, wonen', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Klimaatadaptatie — programma na stresstest 2024', toelichting: 'Onderdeel Omgevingsvisie (OD)', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Thema’s Omgevingsplan (milieuzonering, geur, trilling, e.d.)', toelichting: 'OD + ODH; omgevingskwaliteit', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Beleidsregels milieuzonering (Omgevingswet)', toelichting: 'Raadsbesluit 16 sep 2024', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/bfa224c5-fa50-4bb5-a8d6-5fa7824fe588?agendaItemId=eb7a24cf-8c2b-411b-a7d9-ba80d8293dc6', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Nota hogere waarden verkeerslawaai (Omgevingswet)', toelichting: 'Raadsbesluit 16 sep 2024', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/9702fdf6-75c5-4207-be22-6246d4aba4ce?agendaItemId=4f6181b7-d8f7-4e1c-8cbf-82f4f9b84a6d', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Informatiebrief financiën invoering Omgevingswet', toelichting: 'College mei 2022 — briefing Ruimte', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Plan van aanpak Omgevingsvisie 2023', toelichting: 'Proces — iBabs/college', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Programma Noordrand (uitvoeringsprogramma Groene Zone)', toelichting: 'Bekendmaking ontwerpprogramma nov 2024; definitief programma college 2025', link: 'https://zoek.officielebekendmakingen.nl/gmb-2024-498607.html', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Wensen en bedenkingen Concept-Programma Noordrand', toelichting: 'Raad 3 jun 2025', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/2455d6c8-1c90-4564-be5b-62ee8bc8eb71?agendaItemId=fcf97e62-007f-4e8f-8d93-c6e6582496c1', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Onderzoek zweefvliegen / Visie Groene Zone → Omgevingsvisie', toelichting: 'CUP gerealiseerd (OD Bijlage 2)', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Bestemmingsplan Residentie Parkzicht + beeldkwaliteitsplan (ANWB-locatie)', toelichting: 'Raad jan 2024', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/b40189c1-dcea-44f9-a416-e4120fa1eb15?agendaItemId=27762907-377f-4f73-a2ec-bcb9d7282f9f', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Herstelbesluit bestemmingsplan Woongebied Valkenhorst', toelichting: 'Raad jun 2025', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/43135686-4970-4f3f-b7a4-b7600ccbe012?agendaItemId=4fb461f3-7cb3-4d3c-a4f2-071f91839464', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Samenhangende aanpak versterking dorpskern Wassenaar', toelichting: 'Raadsbesluit 19 dec 2023; vier pilaren dorpskern', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/9b3eec18-9f83-45d0-9cbf-610e3f0049ea?agendaItemId=da0b1ced-bff4-4f28-9acb-5a40134b9fbf', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Nota Woonbeleid gemeente Wassenaar 2025', toelichting: 'Kader wonen en huisvesting', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=bdfb8868-7df2-422f-bfbe-dcd9528fbaa6&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Nota Woonbeleid gemeente Wassenaar 2025', toelichting: 'Zelfde stuk — BBV 8.3 Wonen en bouwen', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=bdfb8868-7df2-422f-bfbe-dcd9528fbaa6&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d', bbv: '8.3', geverifieerd: false, initialen: '' },
        { document: 'Woonvisie Wassenaar 2021–2025', toelichting: 'PDF gemeente — voorloper Nota Woonbeleid', link: 'https://www.wassenaar.nl/_flysystem/media/woonvisie-wassenaar-2021-2025-grip-op-wonen.pdf', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Startnotitie Lokale Woonzorgvisie (+ uitvoeringsprogramma wonen-zorg)', toelichting: 'Sep 2025; ook BBV 6', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=cc8bf828-300a-4098-9198-dc67d2e0a15c&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Tweede wijziging Huisvestingsverordening Wassenaar 2023', toelichting: 'Raad 16 dec 2025', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/f4dfcc53-672e-4d58-aa9e-edaa034c860b?agendaItemId=a46c480a-6a05-4612-87a9-9bef1fc58382', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Vestiging vervroegd voorkeursrecht Draf- en Renbaan Duindigt', toelichting: 'Raad 22 sep 2025', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/ba1e5c4f-b0f7-402c-a81d-78a4a69793df?agendaItemId=2e4a9fcb-8262-450a-8001-e63cb2cefeae', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Beheervisie Openbare Ruimte 2024–2028', toelichting: 'Raadsbesluit 19 sep 2023', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/eacc1bd6-189f-47ee-bbb6-412c644c903e?agendaItemId=67f7fcd0-4f59-4473-98a9-b4c38f703d0a', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Beheervisie Openbare Ruimte 2024–2028', toelichting: 'BBV 8.1 Ruimte en leefomgeving', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/eacc1bd6-189f-47ee-bbb6-412c644c903e?agendaItemId=67f7fcd0-4f59-4473-98a9-b4c38f703d0a', bbv: '8.1', geverifieerd: false, initialen: '' },
        { document: 'Visienota religieus erfgoed 2025 → Omgevingsvisie', toelichting: 'OD: streef jun 2026', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Startnotitie erfgoed gemeente Wassenaar 2026', toelichting: 'Opvolging Erfgoedvisie 2018–2024; invoeding Omgevingsvisie', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Evenementenbeleid — uitwerking Omgevingsvisie', toelichting: 'Startnotitie vastgesteld raad nov 2022; uitwerking in Omgevingsvisie', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/41bea0f9-90bc-4b22-bf83-872bb713f1f8?agendaItemId=ba853240-d91a-4345-84b9-ebc526f38471', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'BOPA horeca Raadhuis De Paauw', toelichting: 'Buitenplanse omgevingsplanactiviteit; raadsbesluit vereist (OD)', link: '', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Vijfde wijziging GR Omgevingsdienst Haaglanden', toelichting: 'Raadsbesluit 16 dec 2025', link: 'https://zoek.officielebekendmakingen.nl/gmb-2025-558725.html', bbv: 'H8', geverifieerd: false, initialen: '' },
        { document: 'Economische Visie Wassenaar 2025', toelichting: 'Visie lokale economie — gemeentepagina met PDF', link: 'https://www.wassenaar.nl/economische-visie-wassenaar', bbv: 'H3', geverifieerd: false, initialen: '' },
        { document: 'Beheervisie Openbare Ruimte 2024–2028', toelichting: 'Kader beheer en onderhoud', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/eacc1bd6-189f-47ee-bbb6-412c644c903e?agendaItemId=67f7fcd0-4f59-4473-98a9-b4c38f703d0a', bbv: '8.1', geverifieerd: false, initialen: '' },
        { document: 'Sportvisie Wassenaar 2025', toelichting: 'PDF gemeente (SIM-cdn); vastgesteld sept 2025', link: 'https://cuatro.sim-cdn.nl/wassenaar/uploads/sportvisie_wassenaar_2025.pdf?cb=LEruT1mN', bbv: 'H5', geverifieerd: false, initialen: '' },
        { document: 'Herijking IHP 2024–2039', toelichting: 'Integraal Huisvestingsplan onderwijs; raad 1 april 2025', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/271db830-fe76-477f-ac64-1d68e329da63?documentId=5aa88524-fe67-4a2e-8234-a90daad8e049&agendaItemId=126c9ef7-1bf2-4c4b-b4fc-237d2a77a14a', bbv: '4.2', geverifieerd: false, initialen: '' },
        { document: 'Lokale Educatieve Agenda (LEA) 2026–2037', toelichting: 'Samenwerking gemeente, scholen en welzijn; ondertekend jan 2026. Link = nieuws Centraal+ (geen formeel stuk); PDF/iBabs zelf zoeken.', link: 'https://centraalplus.nl/2026/01/17/lokale-educatieve-agenda-van-wassenaar-ondertekend-een-horizon-waarmee-we-aan-de-slag-kunnen/', bbv: 'H4', geverifieerd: false, initialen: '' },
        { document: 'Verordening leerlingenvervoer 2025 gemeente Wassenaar', toelichting: 'Raadsbesluit 22 sept 2025 (hamerstuk 6.b); iBabs Agenda/Document', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=eec09f18-31bb-4477-9559-7a73cad358ee&agendaItemId=8d2e9fc6-907b-4a74-abd4-76997db3eb28', bbv: 'H4', geverifieerd: false, initialen: '' },
        { document: 'Verordening leerlingenvervoer 2025 gemeente Wassenaar', toelichting: 'Zelfde stuk — BBV 4.3 Onderwijsbeleid en leerlingzaken', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=eec09f18-31bb-4477-9559-7a73cad358ee&agendaItemId=8d2e9fc6-907b-4a74-abd4-76997db3eb28', bbv: '4.3', geverifieerd: false, initialen: '' },
        { document: 'Verordening Jeugdhulp gemeente Wassenaar 2025', toelichting: 'Kader jeugdhulp', link: 'https://lokaleregelgeving.overheid.nl/CVDR749873/1', bbv: '6.7-6.9', geverifieerd: false, initialen: '' },
        { document: 'Verordening Adviesraad Sociaal Domein gemeente Wassenaar 2025', toelichting: 'Lokale regelgeving CVDR742966 (mutatielijst H6: geen iBabs-raadsbesluit als hoofdlink)', link: 'https://lokaleregelgeving.overheid.nl/CVDR742966/1', bbv: '6.1', geverifieerd: false, initialen: '' },
        { document: 'Gemeenschappelijke regeling Servicebureau Jeugdhulp Haaglanden', toelichting: 'CVDR721620 — huidige GR-tekst (mutatielijst H6)', link: 'https://lokaleregelgeving.overheid.nl/CVDR721620/1', bbv: '6.7-6.9', geverifieerd: false, initialen: '' },
        { document: 'Beleidsnota Schuldhulpverlening 2025–2028', toelichting: 'Raad 1 april 2025 (geamendeerd vastgesteld)', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/271db830-fe76-477f-ac64-1d68e329da63?documentId=8992182e-7fc7-4bdf-9874-f3ca5df4a8b1&agendaItemId=f537e129-28d2-4cea-8f4c-128ca0037086', bbv: '6.3-6.5', geverifieerd: false, initialen: '' },
        { document: 'Beleidsnota Ouderenbeleid 2025', toelichting: 'Raad 28 jan 2025 (hamerstuk, unaniem)', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/85393b37-a676-4ffb-a9f2-33b6f0d9b58b?documentId=79a101d9-552b-49cc-9d34-31f6923cc1a9&agendaItemId=6ac84012-a995-46de-b19f-d58cb5aa952a', bbv: '6.60-6.91', geverifieerd: false, initialen: '' },
        { document: 'Lokale Woonzorgvisie Wassenaar 2026', toelichting: 'Startnotitie sep 2025 — zie ook H8', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=cc8bf828-300a-4098-9198-dc67d2e0a15c&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b', bbv: '8.3', geverifieerd: false, initialen: '' },
        { document: 'Algemene plaatselijke verordening (APV) Wassenaar 2024', toelichting: 'Lokale regelgeving', link: '', bbv: '1.2', geverifieerd: false, initialen: '' },
        { document: 'Huisvestingsverordening Wassenaar 2023', toelichting: 'Woonwagenstandplaatsen e.d.', link: 'https://lokaleregelgeving.overheid.nl/CVDR697251', bbv: '8.3', geverifieerd: false, initialen: '' },
        { document: 'Visie voor De Wassenaarse Slag', toelichting: 'Raad 4 maart 2025 (geamendeerd)', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=ae1f505f-1c39-4f65-af01-7ef35f1d053a&agendaItemId=6038eaee-e37d-4d6d-a760-a222db95d7a6', bbv: '5.7', geverifieerd: false, initialen: '' },
        { document: 'Visie voor De Wassenaarse Slag', toelichting: 'Strand en recreatie (economische promotie) — raad 4 maart 2025 (geamendeerd)', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=ae1f505f-1c39-4f65-af01-7ef35f1d053a&agendaItemId=6038eaee-e37d-4d6d-a760-a222db95d7a6', bbv: 'H3', geverifieerd: false, initialen: '' },
        { document: 'Coalitieakkoord 2022–2026', toelichting: 'Coalitieakkoord VVD, CDA, D66, DLW, PvdA', link: 'https://www.wassenaar.nl/coalitieakkoord', bbv: '0.1', geverifieerd: false, initialen: '' },
        { document: 'Begroting 2026', toelichting: 'Begroting gemeente Wassenaar 2026', link: 'https://www.wassenaar.nl/begroting-2026', bbv: '0.4', geverifieerd: false, initialen: '' },
        { document: 'Gemeentelijke aanpak bestrijding ondernemende criminaliteit Wassenaar 2025-2028', toelichting: 'Kader bestrijding ondermijning', link: 'http://lokaleregelgeving.overheid.nl/CVDR735878', bbv: '1.2', geverifieerd: false, initialen: '' },
        { document: 'Woonvisie Wassenaar 2021-2025', toelichting: 'Grip op wonen (voorloper Nota Woonbeleid)', link: 'https://www.wassenaar.nl/_flysystem/media/woonvisie-wassenaar-2021-2025-grip-op-wonen.pdf', bbv: '8.3', geverifieerd: false, initialen: '' },
        { document: 'Verordening onroerendezaakbelastingen Wassenaar 2026', toelichting: 'Raad 16 dec 2025; grondslag OZB woningen en niet-woningen. Uitvoering BSGR.', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/cac9a825-311d-4997-9f21-7278d8f14b5f?agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', bbv: '0.61', geverifieerd: false, initialen: '' },
        { document: 'Verordening hondenbelasting Wassenaar 2026', toelichting: 'Raad 4 nov 2025; uitvoering BSGR', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/6a7b41f7-da3b-4000-8247-437a8af61761?agendaItemId=63f90655-66e9-4f60-833b-b2b7194c4b3c', bbv: '0.64', geverifieerd: false, initialen: '' },
        { document: 'Verordening precariobelasting Wassenaar 2026', toelichting: 'Raad 4 nov 2025; uitvoering BSGR', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/944e92a0-f637-4e1b-9da8-f70fae59827d?agendaItemId=b1705ab6-aaaf-43ca-99c1-26cf09496419', bbv: '0.64', geverifieerd: false, initialen: '' },
        { document: 'Legesverordening 2026', toelichting: 'Raad 16 dec 2025; tarieventabel leges dienstverlening', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/53fe2e44-b077-4163-8bb5-9a95284a33d0?agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', bbv: '0.64', geverifieerd: false, initialen: '' },
        { document: 'Verordening toeristenbelasting Wassenaar 2026', toelichting: 'Raad 4 nov 2025; heffing op overnachtingen. BBV 3.4 Economische promotie.', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/ef4c4862-3fd3-498b-b412-a43185e58faa?agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', bbv: '3.4', geverifieerd: false, initialen: '' },
        { document: 'Verordening op de heffing en de invordering van riool- en waterzorgheffing gemeente Wassenaar 2026', toelichting: 'Officiële bekendmaking; BBV 7.2 (mutatielijst: iBabs-raadsbesluit verwijderd)', link: 'https://zoek.officielebekendmakingen.nl/gmb-2025-557418.html', bbv: '7.2', geverifieerd: false, initialen: '' },
        { document: 'Verordening afvalstoffenheffing Wassenaar 2026', toelichting: 'CVDR748859; BBV 7.3 Afval', link: 'https://lokaleregelgeving.overheid.nl/CVDR748859/1', bbv: '7.3', geverifieerd: false, initialen: '' },
        { document: 'Verordening kwijtschelding gemeentelijke belastingen Wassenaar 2026', toelichting: 'Raad 4 nov 2025; BBV 6.3 Inkomensregelingen', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/57b7fa4c-ddc4-45ad-b7f0-60c828f01f9b?agendaItemId=0ed97f25-b533-4c6a-a26f-7b3a4ad97914', bbv: '6.3-6.5', geverifieerd: false, initialen: '' },
        { document: 'Verordening marktgeld Wassenaar 2026', toelichting: 'Raad 4 nov 2025; BBV 3.3 Bedrijvenloket', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/2897d6c8-0346-4e89-9391-67edc22cd48a?agendaItemId=ed895ca6-84eb-4502-a75c-686bba2d0ae0', bbv: '3.3', geverifieerd: false, initialen: '' },
        { document: 'Verordening liggeld Wassenaar 2026', toelichting: 'Raad 4 nov 2025; BBV 2.4 Economische havens en waterwegen', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/b7d8ee51-1039-46de-85e0-9931986efab7?agendaItemId=8cae7ed0-45d4-4714-8181-c565279f31cd', bbv: '2.4', geverifieerd: false, initialen: '' },
        { document: 'Verordening op de heffing en de invordering van rechten voor de algemene begraafplaats Persijnhof gemeente Wassenaar 2026', toelichting: 'Officiële bekendmaking; BBV 7.5 (mutatielijst: iBabs-raadsbesluit verwijderd)', link: 'https://zoek.officielebekendmakingen.nl/gmb-2025-558621.html', bbv: '7.5', geverifieerd: false, initialen: '' },
        { document: 'Verordening ondernemersheffing Wassenaar 2026', toelichting: 'Raad 16 dec 2025; BIZ-heffing. BBV 3.3', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/53fe2e44-b077-4163-8bb5-9a95284a33d0?agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', bbv: '3.3', geverifieerd: false, initialen: '' },
        { document: 'Retributieverordening Wassenaar 2026', toelichting: 'Raad 4 nov 2025; BBV 3.4 Economische promotie', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/57b7fa4c-ddc4-45ad-b7f0-60c828f01f9b?agendaItemId=0ed97f25-b533-4c6a-a26f-7b3a4ad97914', bbv: '3.4', geverifieerd: false, initialen: '' },
        { document: 'GR Belastingsamenwerking Gouwe-Rijnland (BSGR)', toelichting: 'Gewijzigde GR vastgesteld raad 15 okt 2024; uitvoeringsorganisatie gemeentelijke belastingen', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/10d1d083-a26d-4237-aaaf-1a67fff6390d?agendaItemId=442e7743-69d3-41c4-a838-1dfd18787134', bbv: '0.64', geverifieerd: false, initialen: '' },
        { document: 'CBS Statline', toelichting: 'Open data CBS', link: 'https://opendata.cbs.nl/#/CBS/nl/dataset/85146NED/table?ts=1768903835931', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Gemeente Wassenaar gemeenschappelijke regelingen', toelichting: 'Overzicht GR\'s op Overheid.nl', link: 'https://organisaties.overheid.nl/40204/Gemeente_Wassenaar#gemeenschappelijke-regelingen', bbv: '0.1', geverifieerd: false, initialen: '' },
        { document: 'Raad voor Openbaar Bestuur – Beleidsvrijheid geduid', toelichting: 'Adviesrapport 2019', link: 'https://www.raadopenbaarbestuur.nl/documenten/2019/03/14/advies-beleidsvrijheid-geduid', bbv: '0.1', geverifieerd: false, initialen: '' },
        { document: 'Eindrapportage Tijd voor stevige keuzes', toelichting: 'Rijksoverheid rapport 2025', link: 'https://www.rijksoverheid.nl/documenten/rapporten/2025/10/31/eindrapportage-tijd-voor-stevige-keuzes', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Waar staat je gemeente – monitor sociaal domein', toelichting: 'Dashboard gemeentelijke monitor', link: 'https://www.waarstaatjegemeente.nl/mosaic/dashboard/gemeentelijke-monitor-sociaal-domein', bbv: '6.60-6.91', geverifieerd: false, initialen: '' },
        { document: 'Internetconsultatie Reikwijdte Jeugdwet', toelichting: 'Consultatie wetswijziging', link: 'https://www.internetconsultatie.nl/reikwijdtejeugdwet/b1', bbv: '6.7-6.9', geverifieerd: false, initialen: '' },
        { document: 'Raadsvergadering 25 november 2025', toelichting: 'iBabs document', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/3e13ce7b-2972-4a14-9e63-5f8a03b8dde6?documentId=a7aca3e0-ab0b-4061-80d7-63301fa5a2d3&agendaItemId=b6056161-8751-4a89-852c-5b92234b07ad', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Bijlage 1. Verkenning reductie restafval', toelichting: 'Informatiebrief 095 — iBabs Reports/Document', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Reports/Document/13e0eeae-ce9a-454d-8530-b43864972f79?documentId=3d92ea1b-1a04-4bf3-9bb2-07c976603c43', bbv: 'H7', geverifieerd: false, initialen: '' },
        { document: 'Document bestuurlijke informatie 2024', toelichting: 'iBabs document', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/View/0f2230a2-4f06-4add-a5e0-0e25ffa97af8', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Wassenaar in cijfers – bevolking', toelichting: 'Dashboard bevolking (achteraan)', link: 'https://wassenaar.incijfers.nl/dashboard/bevolking', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Wassenaar in cijfers – bevolking prognoses', toelichting: 'Dashboard prognoses', link: 'https://wassenaar.incijfers.nl/dashboard/bevolking/prognoses', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Wassenaar in cijfers – bevolking huishoudens', toelichting: 'Dashboard huishoudens', link: 'https://wassenaar.incijfers.nl/dashboard/bevolking/huishoudens', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Wassenaar in cijfers – openbare orde en veiligheid', toelichting: 'Dashboard veiligheid', link: 'https://wassenaar.incijfers.nl/dashboard/openbare-orde-en-veiligheid', bbv: '1.2', geverifieerd: false, initialen: '' },
        { document: 'Wassenaar in cijfers – beleidsindicatoren BBV veiligheid', toelichting: 'Dashboard BBV veiligheid', link: 'https://wassenaar.incijfers.nl/dashboard/beleidsindicatoren-bbv/veiligheid', bbv: '1.2', geverifieerd: false, initialen: '' },
        { document: 'Wassenaar in cijfers – economie, inkomen en vermogen', toelichting: 'Dashboard inkomen', link: 'https://wassenaar.incijfers.nl/dashboard/economie--werk-en-inkomen/inkomen-en-vermogen', bbv: '6.3-6.5', geverifieerd: false, initialen: '' },
        { document: 'Wassenaar in cijfers – ruimte en leefomgeving', toelichting: 'Dashboard monitor brede welvaart', link: 'https://wassenaar.incijfers.nl/dashboard/ruimte-en-leefomgeving/monitor-brede-welvaart', bbv: '8.1', geverifieerd: false, initialen: '' },
        { document: 'Wassenaar in cijfers – wonen', toelichting: 'Dashboards leegstand, voorraad, woningmarkt', link: 'https://wassenaar.incijfers.nl/dashboard/wonen/leegstand', bbv: '8.3', geverifieerd: false, initialen: '' },
    ];

    function mergeDefaultsWithSaved(saved) {
        // Keyed merge op (document + bbv), zodat nieuwe defaults altijd zichtbaar worden.
        const keyOf = (d) => `${(d.document || '').trim()}__${(d.bbv || '').trim()}`;
        const defaults = INITIELE_DATA.map(d => ({ ...d }));
        const savedByKey = new Map(saved.map(d => [keyOf(d), d]));
        const defaultKeys = new Set(defaults.map(d => keyOf(d)));

        const merged = defaults.map(d => {
            const k = keyOf(d);
            const s = savedByKey.get(k);
            return s ? { ...d, ...s } : d;
        });

        // Behoud extra (door gebruiker toegevoegde) entries die niet in defaults zitten.
        saved.forEach(s => {
            const k = keyOf(s);
            if (!defaultKeys.has(k)) merged.push(s);
        });

        return merged;
    }

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return mergeDefaultsWithSaved(parsed);
            }
        } catch (_) {}
        return INITIELE_DATA.map(d => ({ ...d }));
    }

    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (_) {}
    }

    function escapeHtml(s) {
        if (!s) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function renderFilter() {
        const sel = document.getElementById('filterBbv');
        if (!sel) return;
        const opts = BBV_OPTIES.filter(o => o.value);
        opts.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.value;
            opt.textContent = o.label;
            sel.appendChild(opt);
        });
        sel.addEventListener('change', () => renderTable(loadData()));
    }

    function renderTable(data) {
        const tbody = document.getElementById('beleidsnotasBody');
        const filterVal = (document.getElementById('filterBbv') || {}).value || '';
        if (!tbody) return;

        let filtered = data;
        if (filterVal) {
            filtered = data.filter(d => (d.bbv || '') === filterVal);
        }

        tbody.innerHTML = filtered.map((row, idx) => {
            const globalIdx = data.indexOf(row);
            const bbvOpts = BBV_OPTIES.map(o =>
                `<option value="${escapeHtml(o.value)}"${(row.bbv || '') === o.value ? ' selected' : ''}>${escapeHtml(o.label)}</option>`
            ).join('');
            const verifClass = row.geverifieerd ? 'beleidsnotas-vink checked' : 'beleidsnotas-vink';
            const linkVal = (row.link || '').trim();
            const linkEscaped = escapeHtml(linkVal);
            const linkOpen = linkVal && linkVal.startsWith('http')
                ? `<a href="${linkEscaped}" target="_blank" rel="noopener noreferrer" class="beleidsnotas-open-link" title="Open in nieuw tabblad">Open</a>`
                : '';
            const initVal = escapeHtml((row.initialen || '').slice(0, 4));
            const odCh = BBV_TO_OD[row.bbv || ''];
            const odCell = odCh != null
                ? `DIT STAAT ER IN HET OD <a href="overdrachtsdossier.html#od-ch-${odCh}" class="beleidsnotas-od-link">Overdrachtsdossier</a>`
                : '';
            return `
<tr data-idx="${globalIdx}">
    <td class="col-doc"><input type="text" value="${escapeHtml(row.document || '')}" data-field="document" placeholder="Documentnaam"></td>
    <td class="col-toel"><input type="text" value="${escapeHtml(row.toelichting || '')}" data-field="toelichting" placeholder="Toelichting"></td>
    <td class="col-link"><div class="beleidsnotas-link-cell"><input type="url" value="${linkEscaped}" data-field="link" placeholder="https://...">${linkOpen}</div></td>
    <td class="col-bbv"><select data-field="bbv">${bbvOpts}</select></td>
    <td class="col-od">${odCell}</td>
    <td class="col-verif"><button type="button" class="${verifClass}" data-field="geverifieerd" aria-label="Geverifieerd" title="Klik om te verifiëren"></button></td>
    <td class="col-init"><input type="text" value="${initVal}" data-field="initialen" placeholder="XX" maxlength="4" style="width:4rem"></td>
</tr>`;
        }).join('');

        // Event delegation: change voor select, blur voor input
        tbody.querySelectorAll('select').forEach(el => el.addEventListener('change', handleChange));
        tbody.querySelectorAll('input').forEach(el => el.addEventListener('blur', handleChange));
        tbody.querySelectorAll('button.beleidsnotas-vink').forEach(btn => {
            btn.addEventListener('click', handleVinkClick);
        });
    }

    function handleChange(e) {
        const td = e.target.closest('td');
        if (!td) return;
        const tr = td.closest('tr');
        const idx = parseInt(tr.dataset.idx, 10);
        const field = e.target.dataset.field;
        const data = loadData();
        if (idx < 0 || idx >= data.length) return;
        let val = e.target.value;
        if (field === 'geverifieerd') return;
        if (field === 'initialen') val = val.slice(0, 4).toUpperCase();
        data[idx][field] = val;
        saveData(data);
        if (field === 'bbv') renderTable(data);
    }

    function handleVinkClick(e) {
        const btn = e.target;
        const tr = btn.closest('tr');
        const idx = parseInt(tr.dataset.idx, 10);
        const data = loadData();
        if (idx < 0 || idx >= data.length) return;
        data[idx].geverifieerd = !data[idx].geverifieerd;
        saveData(data);
        btn.classList.toggle('checked', data[idx].geverifieerd);
        btn.classList.toggle('beleidsnotas-vink', true);
    }

    function init() {
        const data = loadData();
        renderFilter();
        renderTable(data);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
