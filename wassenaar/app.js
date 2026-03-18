// Besluit-Wijzer Wassenaar v4 — dossier-first

// ─── Versiebeheer ───

const VERSIE_MENU = [
    { versie: '6.0.0', naam: 'Publish-after-approval', beschrijving: 'Briefings pas zichtbaar na goedkeuring beleidsadviseur', url: 'index_v6_verificatie.html' },
    { versie: '5.1.0', naam: 'Dossier-first', beschrijving: 'Modulaire opzet met beleidsdossiers, briefings en coalitieakkoord', url: 'index_v4_modulair.html' },
    { versie: '3.0',   naam: 'Alles-in-één', beschrijving: 'Complete dataset in één HTML-bestand (457 KB)', url: 'index_v3_alles_in_een.html' },
    { versie: '2.0',   naam: 'Verbeterd', beschrijving: 'Verbeterde layout en zoekfunctie', url: 'index_v2.html' },
    { versie: '1.0',   naam: 'Prototype', beschrijving: 'Eerste werkende prototype', url: 'index_v1.html' },
];

function initVersieMenu() {
    const badge = document.getElementById('appVersion');
    if (!badge) return;
    const huidigeVersie = badge.textContent.trim();
    let pressTimer = null;

    badge.style.cursor = 'default';
    badge.addEventListener('mousedown', (e) => {
        pressTimer = setTimeout(() => { pressTimer = null; toonVersieMenu(huidigeVersie); }, 800);
    });
    badge.addEventListener('mouseup', () => { if (pressTimer) clearTimeout(pressTimer); });
    badge.addEventListener('mouseleave', () => { if (pressTimer) clearTimeout(pressTimer); });
    badge.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => { pressTimer = null; toonVersieMenu(huidigeVersie); }, 800);
    }, { passive: true });
    badge.addEventListener('touchend', () => { if (pressTimer) clearTimeout(pressTimer); });
}

function toonVersieMenu(huidigeVersie) {
    let overlay = document.getElementById('versieMenuOverlay');
    if (overlay) { overlay.remove(); return; }

    overlay = document.createElement('div');
    overlay.id = 'versieMenuOverlay';
    overlay.className = 'versie-overlay';

    const items = VERSIE_MENU.map(v => {
        const actief = v.versie === huidigeVersie;
        return `
            <a href="${v.url}" class="versie-item ${actief ? 'versie-actief' : ''}">
                <div class="versie-item-header">
                    <span class="versie-nummer">${v.versie}</span>
                    <span class="versie-naam">${v.naam}</span>
                    ${actief ? '<span class="versie-huidig">huidige versie</span>' : ''}
                </div>
                <p class="versie-beschrijving">${v.beschrijving}</p>
            </a>`;
    }).join('');

    overlay.innerHTML = `
        <div class="versie-panel">
            <div class="versie-panel-kop">
                <span class="versie-panel-titel">Besluit-Wijzer — versies</span>
                <button type="button" class="versie-sluit" aria-label="Sluiten">&times;</button>
            </div>
            <div class="versie-lijst">${items}</div>
            <p class="versie-hint">Tip: dubbelklik op het versienummer voor begrotingsweergave</p>
        </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('versie-overlay-visible'));

    overlay.querySelector('.versie-sluit').addEventListener('click', () => sluitVersieMenu());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) sluitVersieMenu(); });
    document.addEventListener('keydown', versieMenuEsc);
}

function sluitVersieMenu() {
    const overlay = document.getElementById('versieMenuOverlay');
    if (!overlay) return;
    overlay.classList.remove('versie-overlay-visible');
    setTimeout(() => overlay.remove(), 200);
    document.removeEventListener('keydown', versieMenuEsc);
}

function versieMenuEsc(e) { if (e.key === 'Escape') sluitVersieMenu(); }

let allDecisions = [];
let filteredDecisions = [];
let activeDossier = null; // { domein: string, subFilter: string|null } of { bbvMode: true, bbvIndex: number }
let viewMode = 'overzicht'; // 'overzicht' | 'dossier' | 'zoekresultaten'
let dossierViewMode = 'bbv';
let briefingCache = {};
let previewCache = {};

const THEMA_KLEUREN = {
    'Bestuur & Veiligheid':              { accent: '#002244', light: '#d6e4f0', lighter: '#eaf1f8', text: '#001833' },
    'Financiën, Economie & Sport':       { accent: '#57589D', light: '#ddddf0', lighter: '#ededf7', text: '#3a3b6e' },
    'Ruimte, Duurzaamheid & Mobiliteit': { accent: '#1565c0', light: '#bbdefb', lighter: '#e3f2fd', text: '#0d47a1' },
    'Sociaal Domein, Wonen & Onderwijs': { accent: '#c0392b', light: '#f5d0cc', lighter: '#fae8e6', text: '#922b20' },
    'Cultuur & Welzijn':                 { accent: '#e67e22', light: '#fce4cc', lighter: '#fdf2e6', text: '#b35f0f' },
    'Bedrijfsvoering':                   { accent: '#438527', light: '#d4edcc', lighter: '#eaf5e6', text: '#2d5c1a' },
};

const BELEIDSNIVEAU = {
    STRATEGISCH: { label: 'Strategisch', rang: 1, kleur: '#8e24aa', icon: '▲' },
    TACTISCH:    { label: 'Tactisch',    rang: 2, kleur: '#1565c0', icon: '◆' },
    OPERATIONEEL:{ label: 'Operationeel',rang: 3, kleur: '#6d7681', icon: '●' },
};

const STRATEGISCH_KEYWORDS = ['visie','kader','structuurvisie','omgevingsvisie','woonvisie',
    'programma','strategie','agenda','akkoord','actieplan','beleidsnota','toekomst'];

function classifyNiveau(decision) {
    const td = decision.type_document || '';
    if (td.startsWith('1.')) return 'STRATEGISCH';

    const jc = decision.juridische_classificatie || '';
    if (jc.includes('Algemeen Verbindend Voorschrift')) return 'TACTISCH';
    if (jc.includes('Besluit van Algemene Strekking')) return 'TACTISCH';

    const titel = (decision.naam || '').toLowerCase();
    if (STRATEGISCH_KEYWORDS.some(kw => titel.includes(kw))) return 'STRATEGISCH';

    if (td.startsWith('2.')) return 'TACTISCH';
    if (td.includes('Gemeenschappelijke Regeling')) return 'STRATEGISCH';
    if (td.startsWith('4.') || td.startsWith('3.')) return 'OPERATIONEEL';

    if (decision.bron === 'raad') return 'TACTISCH';
    return 'OPERATIONEEL';
}

const SUBTHEMA_KEYWORDS = {
    'Bestuur': ['bestuur','gemeenteraad','raad','burgemeester','wethouder','college','griffie'],
    'Veiligheid': ['veiligheid','politie','brandweer','noodverordening','cameratoezicht','boa','handhaving'],
    'Lokale media': ['media','omroep','pers','communicatie'],
    'Belastingen': ['belasting','ozb','rioolheffing','leges','tarief','heffing'],
    'Economie': ['economie','bedrijv','ondernem','winkel','markt'],
    'Financiën': ['financ','begroting','jaarrekening','reserves','voorzieningen'],
    'P&C-cyclus': ['voorjaarsnota','najaarsnota','kadernota','begroting','jaarrekening','burap','bestuursrapportage'],
    'Sport': ['sport','bewegen','voetbal','tennis','zwem','hockey'],
    'Sportaccommodaties': ['sporthal','zwembad','sportaccommodatie','accommodatie sport'],
    'Gemeentelijke huisvesting': ['huisvesting','gemeentehuis','kantoor'],
    'Afval': ['afval','inzameling','container','recycl'],
    'Bestemmingsplannen': ['bestemmingsplan','omgevingsplan','wijzigingsplan','uitwerkingsplan'],
    'Duurzaamheid': ['duurzaam','energie','zonnepanel','warmte','isolatie','klimaat','co2'],
    'Groene Zone': ['groen','natuur','park','boom','kap'],
    'Herontwikkeling Duindigt': ['duindigt'],
    'MRDH': ['mrdh','metropoolregio'],
    'ODH': ['odh','omgevingsdienst'],
    'Omgevingswet': ['omgevingswet','omgevingsvergunning','omgevingsvisie'],
    'Riolering': ['riool','riolering','rioolheffing'],
    'Strandvisie': ['strand','kust','strandvisie'],
    'Verkeer': ['verkeer','parkeer','fiets','weg','straat','rotonde','snelheid'],
    'Wonen': ['woning','wonen','huur','woningbouw','huisvesting'],
    'Onderwijs': ['school','onderwijs','leerling','leerplicht','kinderopvang','leerlingenvervoer','vve','voorschools','vroegschools','oab','rmc','schooladvies'],
    'WMO': ['wmo','voorziening','hulpmiddel','zorg','welzijn'],
    'Jeugdzorg': ['jeugd','kind','jongere','jeugdhulp','jeugdzorg','antidiscriminatie'],
    'Werk en Inkomen': ['werk en inkomen','participatie','bijstand','re-integrat','uitkering','werkbedrijf'],
    'Inburgering': ['inburgering','inburgeren'],
    'Volksgezondheid': ['gezondheid','volksgezondheid','ggd','preventie'],
    'Warenar': ['warenar','theater','cultuur'],
    'Overig': [],
};

// Uitsluitingen: besluiten die deze termen bevatten tellen niet mee voor dit subthema
const SUBTHEMA_EXCLUSIONS = {
    'WMO': ['rioolheffing', 'waterzorgheffing'],  // "zorg" in waterzorgheffing → geen WMO
};

function matchSubthema(decision, keywords, subthemaNaam) {
    if (!keywords.length) return false;
    const text = [decision.naam || '', decision.besluit || ''].join(' ').toLowerCase();
    const exclusions = subthemaNaam && SUBTHEMA_EXCLUSIONS[subthemaNaam];
    if (exclusions && exclusions.some(ex => text.includes(ex))) return false;
    return keywords.some(kw => text.includes(kw.toLowerCase()));
}

// BBV-taakvelden (Findo.nl / Iv3) — hoofdstukken en sub-taakvelden
const BBV_HOOFDTAAKVELDEN = {
    0: "0. Bestuur en ondersteuning",
    1: "1. Veiligheid",
    2: "2. Verkeer, vervoer en waterstaat",
    3: "3. Economie",
    4: "4. Onderwijs",
    5: "5. Sport, cultuur en recreatie",
    6: "6. Sociaal domein",
    7: "7. Volksgezondheid en milieu",
    8: "8. Volkshuisvesting, leefomgeving en stedelijke vernieuwing",
};

// Sub-taakvelden per hoofdstuk (Findo.nl / Iv3)
const BBV_TAAKVELDEN_PER_HOOFDSTUK = {
    0: [
        { code: '0.1', naam: 'Bestuur' },
        { code: '0.2', naam: 'Burgerzaken' },
        { code: '0.3', naam: 'Beheer overige gebouwen en gronden' },
        { code: '0.4', naam: 'Overhead' },
        { code: '0.5', naam: 'Treasury' },
        { code: '0.61', naam: 'OZB woningen' },
        { code: '0.62', naam: 'OZB niet-woningen' },
        { code: '0.63', naam: 'Parkeerbelasting' },
        { code: '0.64', naam: 'Belastingen overig' },
        { code: '0.7', naam: 'Algemene uitkering en overige uitkeringen gemeentefonds' },
        { code: '0.8', naam: 'Overige baten en lasten' },
        { code: '0.9', naam: 'Vennootschapsbelasting (VpB)' },
        { code: '0.10', naam: 'Mutaties reserves' },
        { code: '0.11', naam: 'Resultaat van de rekening van baten en lasten' },
    ],
    1: [
        { code: '1.1', naam: 'Crisisbeheersing en brandweer' },
        { code: '1.2', naam: 'Openbare orde en veiligheid' },
    ],
    2: [
        { code: '2.1', naam: 'Verkeer en vervoer' },
        { code: '2.2', naam: 'Parkeren' },
        { code: '2.3', naam: 'Recreatieve havens' },
        { code: '2.4', naam: 'Economische havens en waterwegen' },
        { code: '2.5', naam: 'Openbaar vervoer' },
    ],
    3: [
        { code: '3.1', naam: 'Economische ontwikkeling' },
        { code: '3.2', naam: 'Fysieke bedrijfsinfrastructuur' },
        { code: '3.3', naam: 'Bedrijvenloket en bedrijfsregelingen' },
        { code: '3.4', naam: 'Economische promotie' },
    ],
    4: [
        { code: '4.1', naam: 'Openbaar basisonderwijs' },
        { code: '4.2', naam: 'Onderwijshuisvesting' },
        { code: '4.3', naam: 'Onderwijsbeleid en leerlingzaken' },
    ],
    5: [
        { code: '5.1', naam: 'Sportbeleid en activering' },
        { code: '5.2', naam: 'Sportaccommodaties' },
        { code: '5.3', naam: 'Cultuurpresentatie, cultuurproductie en cultuurparticipatie' },
        { code: '5.4', naam: 'Musea' },
        { code: '5.5', naam: 'Cultureel erfgoed' },
        { code: '5.6', naam: 'Media' },
        { code: '5.7', naam: 'Openbaar groen en (openlucht) recreatie' },
    ],
    6: [
        { code: '6.1', naam: 'Samenkracht en burgerparticipatie' },
        { code: '6.2', naam: 'Toegang eerste lijns' },
        { code: '6.3 - 6.5', naam: 'Werk en inkomen' },
        { code: '6.60 - 6.91', naam: 'WMO' },
        { code: '6.7 - 6.9', naam: 'Jeugd' },
    ],
    7: [
        { code: '7.1', naam: 'Volksgezondheid' },
        { code: '7.2', naam: 'Riolering' },
        { code: '7.3', naam: 'Afval' },
        { code: '7.4', naam: 'Milieubeheer' },
        { code: '7.5', naam: 'Begraafplaatsen en crematoria' },
    ],
    8: [
        { code: '8.1', naam: 'Ruimte en leefomgeving' },
        { code: '8.2', naam: 'Grondexploitatie (niet-bedrijventerreinen)' },
        { code: '8.3', naam: 'Wonen en bouwen' },
    ],
};
const PORTEFEUILLE_NAAR_BBV = {
    'Bestuur & Veiligheid': 0,
    'Financiën, Economie & Sport': 3,
    'Ruimte, Duurzaamheid & Mobiliteit': 8,
    'Sociaal Domein, Wonen & Onderwijs': 6,
    'Cultuur & Welzijn': 5,
    'Bedrijfsvoering': 0,
};

const THEMA_ICONEN = {
    'Bestuur & Veiligheid': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'Financiën, Economie & Sport': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'Ruimte, Duurzaamheid & Mobiliteit': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    'Sociaal Domein, Wonen & Onderwijs': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'Cultuur & Welzijn': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    'Bedrijfsvoering': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
};
const BBV_ICON = '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>';

// Beleidssamenvatting per thema (binnen portefeuille) — Cultuur & Welzijn, Bestuur & Veiligheid, etc.
const SAMENVATTING_PER_THEMA = {
    'Cultuur & Welzijn': [
        { thema: 'De Warenar', samenvatting: 'Cultuurhuis blijft eigendom gemeente. Raad koos sept 2025 voor voorkeursvariant 2: herbestemming, renovatie en verduurzaming (€5 mln). Investering pas na geregelde erfpacht. Ambitie: cultuurhuis + buurtfunctie + museum.' },
        { thema: 'Subsidiebeleid', samenvatting: 'Jaarlijkse vaststelling subsidieplafonds. 2025: Economie €35.960, SAD €478.969, Volksgezondheid €34.228. Subsidieregeling structurele activiteiten (2024). Coalitie onderzoekt subsidies, fondsen en cofinanciering.' },
        { thema: 'Erfgoed & Welstand', samenvatting: 'Eerste technische aanpassing Erfgoedverordening 2016 (2023). Commissie Welstand en Cultureel Erfgoed (WCE). Klankbordgroep Erfgoed. Coalitie: erfgoed behouden, verduurzaming faciliteren.' },
        { thema: 'GGD & Volksgezondheid', samenvatting: 'GR GGD en Veilig Thuis Haaglanden. Zienswijzen op begrotingen en wijzigingen. Evaluatie GR uitgesteld (zienswijze raad apr 2025). Regiovisie Aanpak Huiselijk Geweld 2026+ vastgesteld dec 2025.' },
        { thema: 'Welzijn & Buurtwerk', samenvatting: 'Overeenkomst Gro-Up Buurtwerk (apr 2024) voor welzijnsactiviteiten in wijken. Subsidies preventief veld. IPS-trajecten. Gezond en Actief Leven Akkoord (GALA).' },
    ],
    'Bestuur & Veiligheid': [
        { thema: 'Openbare Orde & Veiligheid', samenvatting: 'Integraal veiligheidsbeleid. Burgemeester als eenhoofdig bestuursorgaan. Noodverordening NAVO-top 2025 bekrachtigd (juni 2025). APV-toelichting geactualiseerd (mei 2022).' },
        { thema: 'Gemeenschappelijke Regelingen & Regionale Samenwerking', samenvatting: 'GR Veiligheidsregio Haaglanden gewijzigd (maart 2025). Zienswijzen op begrotingen VRH en GR Rekenkamer WVOLV. Mandaatbesluit ODH geactualiseerd.' },
        { thema: 'Publieke Omroep & Communicatie', samenvatting: 'Toetsingscriteria aanwijzingsprocedure lokale publieke omroep gewijzigd vastgesteld (april 2025). Kader voor lokale informatievoorziening. Wet open overheid geïmplementeerd.' },
        { thema: 'Opvang Ontheemden', samenvatting: 'Opvang Oekraïense ontheemden (2022): noodverordening, kostendelersnorm niet toegepast. Dossier via openbare orde en crisisbeheersing.' },
        { thema: 'Handhaving & APV', samenvatting: 'Ontruiming Huize Ivicke (mei/juni 2022). APV-toelichting geactualiseerd. Schriftelijke vragen o.a. Felyx-deelscooters, geluidsoverlast vliegtuigen.' },
    ],
    'Financiën, Economie & Sport': [
        { thema: 'Financieel Beleid & P&C-cyclus', samenvatting: 'Sluitende meerjarenbegroting. P&C-cyclus: Kadernota, Begroting, Voorjaarsnota, Najaarsnota, Jaarstukken. Financiële Verordening en Controleprotocol 2025 geactualiseerd. Najaarsnota 2025: positief saldo €5.243.' },
        { thema: 'Belastingen & Heffingen', samenvatting: 'Belastingverordeningen 2026 vastgesteld: OZB, afvalstoffenheffing, toeristenbelasting, hondenbelasting, leges, retributie, marktgeld, liggeld, precariobelasting, ondernemersheffing, kwijtschelding, begraafplaatsrechten.' },
        { thema: 'Economie', samenvatting: 'Economische Visie Wassenaar 2025 vastgesteld (sept 2025) met zes ambities. BIZ Maaldrift 2026-2030. Zienswijze Visie Economisch Vestigingsklimaat MRDH. Stichting Wassenaar-Voorschoten (toerisme).' },
        { thema: 'Sport', samenvatting: 'Sportvisie Wassenaar 2025 vastgesteld (sept 2025) met vier pijlers. Lokaal Sportakkoord II "Sport versterkt" (2023). Bouw gemeentelijke sporthal in uitvoering.' },
        { thema: 'Vastgoed, Afval & GR\'s', samenvatting: 'De Paauw: renovatie/restauratie zonder extra krediet, subsidie-opbrengsten voor verduurzaming. Avalex (afval): zienswijze begroting 2026. Zienswijzen BSGR, GR GGD/VT Haaglanden. Procesafspraken Duindigt.' },
    ],
    'Ruimte, Duurzaamheid & Mobiliteit': [
        { thema: 'Omgevingswet & Ruimtelijke ordening', samenvatting: 'Implementatie Omgevingswet. Startnotitie Participatie Omgevingsvisie (dec 2025). Beleidsregels milieuzonering, hogere waarden verkeerslawaai. Bestemmingsplannen, beheersverordeningen. ODH: vijfde wijziging GR, zienswijze begroting 2026.' },
        { thema: 'Woningbouw & Woonbeleid', samenvatting: 'Nota Woonbeleid 2025 vastgesteld. Huisvestingsverordening 2023 (tweede wijziging dec 2025). Valkenhorst: herstelbesluit bestemmingsplan (juni 2025). Duindigt: vervroegd voorkeursrecht, bezwaarprocedure. Den Deylschool herontwikkeling.' },
        { thema: 'Kust, Duin & Groene Zone', samenvatting: 'Visie De Wassenaarse Slag vastgesteld (maart 2025). Concept-Programma Noordrand: wensen en bedenkingen (juni 2025). Nationaal Park Hollandse Duinen, Duin Horst en Weide.' },
        { thema: 'Duurzaamheid & Energietransitie', samenvatting: 'Lokale Energiestrategie 2023-2026. Voortgangsrapportages RES. Subsidieplafond Milieubeheer. Energietoeslag en compensatie energiekosten (crisis 2022-2023).' },
        { thema: 'Verkeer & Mobiliteit', samenvatting: 'Burgerberaad Verkeer (juni 2025). Wegencategoriseringsplan vastgesteld (dec 2025). Herziene Realisatieplan Verkeer. Verkeersdoseerinstallatie Kokshornlaan, Duurzaam Veilig Storm/Schouwweg. Zienswijze Mobiliteitsvisie MRDH.' },
        { thema: 'Openbare Ruimte & Riolering', samenvatting: 'Uitvoeringsprogramma Openbare Ruimte 2024-2028. Verordening riool- en waterzorgheffing 2026 vastgesteld (dec 2025). Beheer openbare ruimte, onderhoudsniveau B.' },
    ],
    'Sociaal Domein, Wonen & Onderwijs': [
        { thema: 'Jeugdhulp & Jeugdbeleid', samenvatting: 'Lokaal Jeugdbeleid Wassenaar 2026 en Verordening Jeugdhulp 2025 vastgesteld (nov 2025). Nieuw inkoopkader jeugdhulp via GR SbJH (juni 2025). Dashboard Jeugdhulp, Uitvoeringsplan Jeugdhulp Haaglanden.' },
        { thema: 'Wmo & Maatschappelijke Ondersteuning', samenvatting: '7e wijziging Verordening maatschappelijke ondersteuning (juni 2022). Wmo-tarieven H6 geïndexeerd. Verordening Adviesraad Sociaal Domein 2025 (juni 2025). Stichting MO Wassenaar. Cliëntervaringsonderzoek Wmo.' },
        { thema: 'Participatie & Schuldhulp', samenvatting: 'Beleidsnota schuldhulpverlening 2025-2028 vastgesteld (apr 2025). Evaluatie en koers re-integratie- en participatiebeleid (2022-2023). Verordening inburgering 2022. Hardheidsclausule, kostendelersnorm.' },
        { thema: 'Onderwijs & Huisvesting', samenvatting: 'Herijking IHP onderwijs 2024-2039 (apr 2025). Voorbereidingskredieten Sint Baptistschool/Sint Jozefschool (€950.500) en Kievietschool (€69.090). Verordening leerlingenvervoer 2025. Den Deylschool herontwikkeling. SchoolAdviesDienst, American School, peuteropvang.' },
        { thema: 'Wonen, Woonzorg & Ouderen', samenvatting: 'Startnotitie Lokale Woonzorgvisie (sept 2025). Beleidsnota Ouderenbeleid 2025 (jan 2025). Convenant beschermd wonen. Vragen wonen voor ouderen en starters.' },
    ],
    'Bedrijfsvoering': [
        { thema: 'Ambtelijke Organisatie & Personeel', samenvatting: 'College Uitvoeringsprogramma (CUP). Ledenraadpleging Cao Gemeenten en Cao SGO (2022-2023). Uitbreiding formatie juridische ondersteuning per 1-1-2023. Uitvoeringsplan werkgeversdienstverlening ZHC 2023. Portefeuilleverdeling en locoschap.' },
        { thema: 'Dienstverlening & Samenwerking', samenvatting: 'Werkorganisatie Duivenvoorde (samenwerking Voorschoten). DVO Maatschappij & Samenleving, DVO MO. Dienstverleningsovereenkomst Secretariaat Behandeling Bezwaarschriften. Voorgenomen opzegging DVO MO (maart 2023).' },
        { thema: 'Informatievoorziening & ICT', samenvatting: 'Wet open overheid (Woo). Aanwijzing gemeentearchivaris (feb 2022). Raadsinformatiebrieven. Communicatie en ICT als aandachtspunten (dec 2022).' },
        { thema: 'Centrum & Inrichting', samenvatting: 'Inrichtingsplan Centrum Wassenaar. Aanbesteding Inrichtingsplan Centrum. Herinrichting Storm/Schouwweg. Plan van Aanpak RES 2.0. Onderzoek 30 km/uur.' },
        { thema: 'Buurtgericht Werken & Sociaal Kernteam', samenvatting: 'Nota Inrichting Sociaal Kernteam Wassenaar (juni 2022). Routekaart Buurtgerichte Uitvoeringsplannen (jan 2023). Bijeenkomsten jongeren. Opvang Oekraïne, beleidsregels leefgeld.' },
    ],
};

// Tegels per portefeuille — keywords voor filter/count (zelfde structuur als Cultuur & Welzijn)
const PORTEFEUILLE_TEGELS = {
    'Cultuur & Welzijn': [
        { naam: 'De Warenar', keywords: ['warenar', 'theater', 'cultuurhuis', 'kerkstraat 75', 'sbw', 'stichting beheer warenar'] },
        { naam: 'Subsidiebeleid', keywords: ['subsidie', 'plafond', 'subsidieplafond', 'subsidieregeling', 'subsidieaanvraag'] },
        { naam: 'Erfgoed & Welstand', keywords: ['erfgoed', 'welstand', 'monument', 'cultureel erfgoed', 'wce', 'klankbordgroep erfgoed'] },
        { naam: 'GGD & Volksgezondheid', keywords: ['gezondheid', 'volksgezondheid', 'ggd', 'preventie', 'veilig thuis', 'haaglanden'] },
        { naam: 'Welzijn & Buurtwerk', keywords: ['welzijn', 'buurtwerk', 'buurt', 'gro-up', 'preventief veld', 'ips-traject'] },
    ],
    'Bestuur & Veiligheid': [
        { naam: 'Openbare Orde & Veiligheid', keywords: ['veiligheid', 'politie', 'brandweer', 'noodverordening', 'navo', 'openbare orde', 'cameratoezicht'] },
        { naam: 'Gemeenschappelijke Regelingen & Regionale Samenwerking', keywords: ['gemeenschappelijke regeling', 'veiligheidsregio', 'vrh', 'haaglanden', 'rekenkamer', 'wvolv', 'odh', 'omgevingsdienst'] },
        { naam: 'Publieke Omroep & Communicatie', keywords: ['lokale omroep', 'publieke omroep', 'communicatie', 'aanwijzingsprocedure', 'media'] },
        { naam: 'Opvang Ontheemden', keywords: ['oekraïne', 'ontheemden', 'opvang', 'asielzoekers', 'statushouders'] },
        { naam: 'Handhaving & APV', keywords: ['handhaving', 'apv', 'algemene plaatselijke verordening', 'huize ivicke', 'boa'] },
    ],
    'Financiën, Economie & Sport': [
        { naam: 'Financieel Beleid & P&C-cyclus', keywords: ['voorjaarsnota', 'najaarsnota', 'kadernota', 'begroting', 'jaarrekening', 'jaarstukken', 'financiële verordening', 'controleprotocol', 'burap', 'bestuursrapportage'] },
        { naam: 'Belastingen & Heffingen', keywords: ['belasting', 'ozb', 'rioolheffing', 'leges', 'tarief', 'heffing', 'afvalstoffenheffing', 'toeristenbelasting', 'hondenbelasting', 'kwijtschelding', 'ondernemersheffing'] },
        { naam: 'Economie', keywords: ['economie', 'economische visie', 'biz', 'maaldrift', 'mrdh', 'vestigingsklimaat', 'bedrijventerrein'] },
        { naam: 'Sport', keywords: ['sport', 'sportvisie', 'sportakkoord', 'sporthal', 'sportaccommodatie', 'zwembad'] },
        { naam: 'Vastgoed, Afval & GR\'s', keywords: ['paauw', 'vastgoed', 'afval', 'avalex', 'bsgr', 'ggd', 'veilig thuis', 'gemeenschappelijke regeling'] },
    ],
    'Ruimte, Duurzaamheid & Mobiliteit': [
        { naam: 'Omgevingswet & Ruimtelijke ordening', keywords: ['omgevingswet', 'omgevingsvisie', 'omgevingsvergunning', 'bestemmingsplan', 'beheersverordening', 'odh', 'omgevingsdienst'] },
        { naam: 'Woningbouw & Woonbeleid', keywords: ['woning', 'wonen', 'woonbeleid', 'huisvestingsverordening', 'valkenhorst', 'duindigt', 'den deylschool'] },
        { naam: 'Kust, Duin & Groene Zone', keywords: ['wassenaarse slag', 'noordrand', 'nationaal park', 'hollandse duinen', 'duin', 'groen', 'strand'] },
        { naam: 'Duurzaamheid & Energietransitie', keywords: ['duurzaam', 'energie', 'energiestrategie', 'res', 'zonnepanel', 'klimaat', 'milieu', 'energietoeslag'] },
        { naam: 'Verkeer & Mobiliteit', keywords: ['verkeer', 'parkeer', 'fiets', 'wegencategoriseringsplan', 'burgerberaad verkeer', 'mobiliteitsvisie', 'n44'] },
        { naam: 'Openbare Ruimte & Riolering', keywords: ['riool', 'riolering', 'rioolheffing', 'waterzorgheffing', 'openbare ruimte', 'uitvoeringsprogramma openbare ruimte', 'waterketen'] },
    ],
    'Sociaal Domein, Wonen & Onderwijs': [
        { naam: 'Jeugdhulp & Jeugdbeleid', keywords: ['jeugd', 'jeugdhulp', 'jeugdzorg', 'antidiscriminatie', 'sbjh', 'haaglanden'] },
        { naam: 'Wmo & Maatschappelijke Ondersteuning', keywords: ['wmo', 'maatschappelijke ondersteuning', 'voorziening', 'hulpmiddel', 'zorg', 'welzijn', 'adviesraad sociaal domein'] },
        { naam: 'Participatie & Schuldhulp', keywords: ['participatie', 'bijstand', 're-integrat', 'uitkering', 'werkbedrijf', 'schuldhulp', 'inburgering', 'inburgeren'] },
        { naam: 'Onderwijs & Huisvesting', keywords: ['onderwijs', 'school', 'leerling', 'leerplicht', 'kinderopvang', 'leerlingenvervoer', 'vve', 'oab', 'rmc', 'schooladvies', 'ihp', 'den deylschool', 'kievietschool'] },
        { naam: 'Wonen, Woonzorg & Ouderen', keywords: ['wonen', 'woonzorg', 'ouderen', 'beschermd wonen', 'woonzorgvisie', 'starters'] },
    ],
    'Bedrijfsvoering': [
        { naam: 'Ambtelijke Organisatie & Personeel', keywords: ['personeel', 'organisatie', 'cao', 'formatie', 'cup', 'werkgeversdienstverlening', 'zhc', 'portefeuilleverdeling', 'locoschap'] },
        { naam: 'Dienstverlening & Samenwerking', keywords: ['dvo', 'duivenvoorde', 'voorschoten', 'dienstverleningsovereenkomst', 'bezwaarschriften', 'maatschappij', 'samenleving'] },
        { naam: 'Informatievoorziening & ICT', keywords: ['woo', 'archief', 'archivaris', 'ict', 'informatie', 'communicatie', 'raadsinformatiebrief', 'privacy'] },
        { naam: 'Centrum & Inrichting', keywords: ['inrichtingsplan', 'centrum wassenaar', 'aanbesteding centrum', 'storm', 'schouwweg', 'res 2.0', '30 km'] },
        { naam: 'Buurtgericht Werken & Sociaal Kernteam', keywords: ['sociaal kernteam', 'buurtgericht', 'routekaart', 'uitvoeringsplannen', 'jongeren', 'oekraïne', 'leefgeld', 'herstructurering wijk'] },
    ],
};

const BRIEFING_BESTANDEN = {
    'Bestuur & Veiligheid': 'briefings/briefing_bestuur_veiligheid.html',
    'Financiën, Economie & Sport': 'briefings/briefing_financien_economie_sport.html',
    'Ruimte, Duurzaamheid & Mobiliteit': 'briefings/briefing_ruimte_duurzaamheid_mobiliteit.html',
    'Sociaal Domein, Wonen & Onderwijs': 'briefings/briefing_sociaal_domein_wonen_onderwijs.html',
    'Cultuur & Welzijn': 'briefings/briefing_cultuur_welzijn.html',
    'Bedrijfsvoering': 'briefings/briefing_bedrijfsvoering.html'
};

// Beleidsnota's (losse stukken) per kind-tegel — essentieel beleid dat prominent getoond moet worden
// Controle iBabs-links: zie LEESMIJ_IBABS_LINKS.md — documentId moet wijzen naar het beleidsdocument (Bijlage), niet naar Raadsbesluit
const BELEIDSNOTA_PER_THEMA = {
    'Ruimte, Duurzaamheid & Mobiliteit': {
        'Omgevingswet & Ruimtelijke ordening': [
            { naam: 'Startnotitie Participatie Omgevingsvisie', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=416f5b70-c39b-47d4-b662-be73d3e71c63&agendaItemId=5abb6d11-0c07-463f-a4c0-10b66f8e58a8', type: 'Startnotitie', toelichting: 'De raad heeft deze startnotitie vastgesteld (17 dec 2025). De Eerste proeve Omgevingsvisie 2040 is niet als vastgestelde visie aangenomen; de raad koos voor een nieuw participatietraject. Streefdatum vaststelling Omgevingsvisie: 1 april 2027.' }
        ],
        'Woningbouw & Woonbeleid': [
            { naam: 'Nota Woonbeleid gemeente Wassenaar 2025', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=bdfb8868-7df2-422f-bfbe-dcd9528fbaa6&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d', type: 'Beleidsnota' }
        ]
    },
    'Sociaal Domein, Wonen & Onderwijs': {
        'Wonen, Woonzorg & Ouderen': [
            { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: null, type: 'Startnotitie' },
            { naam: 'Beleidsnota Ouderenbeleid 2025', datum: '2025-01-28', link: null, type: 'Beleidsnota' }
        ]
    }
};

// Beleidsnota's per BBV-taakveld (voor hoofdstukken/taakvelden-weergave)
const BELEIDSNOTA_PER_TAAKVELD = {
    '8.1': [ // Ruimte en leefomgeving
        { naam: 'Startnotitie Participatie Omgevingsvisie', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=416f5b70-c39b-47d4-b662-be73d3e71c63&agendaItemId=5abb6d11-0c07-463f-a4c0-10b66f8e58a8', type: 'Startnotitie', toelichting: 'De raad heeft deze startnotitie vastgesteld (17 dec 2025). De Eerste proeve Omgevingsvisie 2040 is niet als vastgestelde visie aangenomen; de raad koos voor een nieuw participatietraject. Streefdatum vaststelling Omgevingsvisie: 1 april 2027.' }
    ],
    '8.3': [ // Wonen en bouwen
        { naam: 'Nota Woonbeleid gemeente Wassenaar 2025', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=bdfb8868-7df2-422f-bfbe-dcd9528fbaa6&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d', type: 'Beleidsnota' }
    ],
    '6.811': [ // Beschermd wonen (Wmo)
        { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: null, type: 'Startnotitie' },
        { naam: 'Beleidsnota Ouderenbeleid 2025', datum: '2025-01-28', link: null, type: 'Beleidsnota' }
    ],
    '6.60 - 6.91': [ // Clustering: 6.60, 6.711-6.714, 6.791, 6.811, 6.812, 6.91
        { naam: 'WMO', type: 'Clustering', toelichting: 'Deze tegel is een clustering van alle Wmo-gerelateerde BBV-taakvelden: 6.60 (Hulpmiddelen en diensten), 6.711 (Huishoudelijke hulp), 6.712 (Begeleiding), 6.713 (Dagbesteding), 6.714 (Overige maatwerkarrangementen), 6.791 (PGB Wmo), 6.811 (Beschermd wonen), 6.812 (Maatschappelijke- en vrouwenopvang) en 6.91 (Coördinatie en beleid Wmo). Besluiten van het Sociaal Domein worden hier op hoofdniveau weergegeven.' },
        { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: null, type: 'Startnotitie' },
        { naam: 'Beleidsnota Ouderenbeleid 2025', datum: '2025-01-28', link: null, type: 'Beleidsnota' }
    ],
    '6.2': [ // Clustering: 6.21, 6.22, 6.23
        { naam: 'Toegang eerste lijns', type: 'Clustering', toelichting: 'Deze tegel is een clustering van de BBV-taakvelden 6.21 (Toegang en eerstelijnsvoorzieningen Wmo), 6.22 (Toegang en eerstelijnsvoorzieningen Jeugd) en 6.23 (Toegang en eerstelijnsvoorzieningen Integraal). Besluiten van het Sociaal Domein worden hier op hoofdniveau weergegeven.' }
    ],
    '6.7 - 6.9': [ // Clustering: 6.751-6.753, 6.761-6.763, 6.792, 6.821, 6.822, 6.92
        { naam: 'Jeugd', type: 'Clustering', toelichting: 'Deze tegel is een clustering van alle jeugdgerelateerde BBV-taakvelden: 6.751–6.753 (Jeugdhulp ambulant lokaal/regionaal/landelijk), 6.761–6.763 (Jeugdhulp met verblijf lokaal/regionaal/landelijk), 6.792 (PGB Jeugd), 6.821 (Jeugdbescherming), 6.822 (Jeugdreclassering) en 6.92 (Coördinatie en beleid Jeugd). Besluiten van het Sociaal Domein worden hier op hoofdniveau weergegeven.' }
    ],
    '6.3 - 6.5': [ // Clustering: 6.3, 6.4, 6.5
        { naam: 'Werk en inkomen', type: 'Clustering', toelichting: 'Deze tegel is een clustering van de BBV-taakvelden 6.3 (Inkomensregelingen), 6.4 (WSW en beschut werk) en 6.5 (Arbeidsparticipatie). Besluiten van het Sociaal Domein worden hier op hoofdniveau weergegeven.' }
    ]
};

// ─── Initialisation ───

const PORTEFEUILLE_HEADERS = [
    'Financiën, Economie en Sport', 'Financiën, Economie & Sport',
    'Sociaal Domein, Wonen en Onderwijs', 'Sociaal Domein, Wonen & Onderwijs',
    'Ruimte, Duurzaamheid en Mobiliteit', 'Ruimte, Duurzaamheid & Mobiliteit',
    'Cultuur en Welzijn', 'Cultuur & Welzijn',
    'Bedrijfsvoering', 'Portefeuille Burgemeester'
];

function isPortefeuilleHeader(decision) {
    if (decision.bron !== 'college') return false;
    const besluit = (decision.besluit || '').trim();
    if (besluit.length > 50) return false;
    const naam = (decision.naam || '').trim();
    // Exact match of met prefix (bijv. "5.b Sociaal Domein, Wonen en Onderwijs")
    return PORTEFEUILLE_HEADERS.some(h => naam === h || naam.endsWith(h));
}

function loadData() {
    try {
        if (typeof ALL_DECISIONS_DATA === 'undefined' || typeof THEMA_BOOM_DATA === 'undefined') {
            throw new Error('data.js niet geladen.');
        }
        allDecisions = ALL_DECISIONS_DATA.filter(d => !isPortefeuilleHeader(d));
        console.log(`Data geladen: ${allDecisions.length} raads- en collegebesluiten (portefeuille-kopjes uitgefilterd)`);

        buildPreviewCache();
        renderDossierKaarten(THEMA_BOOM_DATA);
    } catch (error) {
        console.error('Fout bij laden data:', error);
    }
}

function buildPreviewCache() {
    if (typeof BRIEFING_HTML_DATA === 'undefined') return;
    Object.keys(BRIEFING_HTML_DATA).forEach(thema => {
        const html = BRIEFING_HTML_DATA[thema];
        previewCache[thema] = extractPreview(html);
    });
}

function extractPreview(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const paragraphs = tmp.querySelectorAll('p');
    for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i].textContent.trim();
        if (text.length > 60 && !text.startsWith('Versie') && !text.startsWith('Datum')) {
            const sentences = text.split(/(?<=[.!?])\s+/);
            return sentences.slice(0, 3).join(' ');
        }
    }
    return '';
}

const BEGROTING_DATA = {
    'Bestuur & Veiligheid':              { programma: 'P1 Veiligheid en Handhaving', bedrag: 4641000 },
    'Financiën, Economie & Sport':       { programma: 'P3 Bestuur en Middelen', bedrag: 24433000, gedeeld: true },
    'Ruimte, Duurzaamheid & Mobiliteit': { programma: 'P4 + P5 Fysiek en Natuur', bedrag: 24910000 },
    'Sociaal Domein, Wonen & Onderwijs': { programma: 'P2 Mens en Maatschappij', bedrag: 41536000, gedeeld: true },
    'Cultuur & Welzijn':                 { programma: 'P2 Mens en Maatschappij', bedrag: 41536000, gedeeld: true },
    'Bedrijfsvoering':                   { programma: 'P3 Bestuur en Middelen', bedrag: 24433000, gedeeld: true }
};

function formatBedrag(n) {
    if (n >= 1000000) return '€' + (n / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (n >= 1000) return '€' + Math.round(n / 1000) + 'K';
    return '€' + n;
}

// ─── Dossier-kaarten (startpagina) ───

function getBBVTree() {
    return Object.entries(BBV_HOOFDTAAKVELDEN).map(([idx, naam]) => ({ naam, bbvIndex: parseInt(idx, 10) }));
}

function calculateBBVCounts(decisions) {
    const counts = {};
    for (let i = 0; i < 9; i++) counts[i] = 0;
    decisions.forEach(d => {
        const idx = PORTEFEUILLE_NAAR_BBV[d.domein];
        if (idx !== undefined) counts[idx] = (counts[idx] || 0) + 1;
    });
    return counts;
}

function getDecisionsForBBV(bbvIndex) {
    return allDecisions.filter(d => PORTEFEUILLE_NAAR_BBV[d.domein] === bbvIndex);
}

function isBBVThema(naam) {
    return Object.values(BBV_HOOFDTAAKVELDEN).includes(naam);
}

function getBBVIndexFromNaam(naam) {
    const entry = Object.entries(BBV_HOOFDTAAKVELDEN).find(([, n]) => n === naam);
    return entry ? parseInt(entry[0], 10) : 0;
}

function renderDossierKaarten(tree) {
    window.themaTree = tree;
    const container = document.getElementById('dossierKaarten');
    if (!container) return;
    container.innerHTML = '';

    const isBBV = dossierViewMode === 'bbv';
    const items = isBBV ? getBBVTree() : tree;
    const counts = isBBV ? calculateBBVCounts(allDecisions) : calculateThemaCounts(allDecisions);

    items.forEach((item, i) => {
        const naam = item.naam;
        const count = isBBV ? (counts[item.bbvIndex] || 0) : (counts[naam] || 0);
        const preview = isBBV ? '' : (previewCache[naam] || '');
        const icoon = isBBV ? BBV_ICON : (THEMA_ICONEN[naam] || '');
        const begr = !isBBV && BEGROTING_DATA[naam];
        const begrHtml = begr ? `
            <div class="dossier-kaart-begroting">
                <span class="begroting-bedrag">${formatBedrag(begr.bedrag)}</span>
                <span class="begroting-label">${escapeHtml(begr.programma)}${begr.gedeeld ? ' *' : ''}</span>
            </div>
        ` : '';

        const kaart = document.createElement('button');
        kaart.type = 'button';
        kaart.className = 'dossier-kaart';
        kaart.setAttribute('data-thema', naam);

        kaart.innerHTML = `
            <div class="dossier-kaart-header">
                <span class="dossier-kaart-icoon">${icoon}</span>
                <span class="dossier-kaart-naam">${escapeHtml(naam)}</span>
                <span class="dossier-kaart-count">${count}</span>
            </div>
            ${preview ? `<p class="dossier-kaart-preview">${escapeHtml(preview)}</p>` : ''}
            ${begrHtml}
            <span class="dossier-kaart-cta">Lees dossier →</span>
        `;
        kaart.onclick = () => openDossier(naam);
        container.appendChild(kaart);
    });
}

function calculateThemaCounts(decisions) {
    const counts = {};
    decisions.forEach(d => {
        const dom = d.domein || 'Niet geclassificeerd';
        counts[dom] = (counts[dom] || 0) + 1;
    });
    return counts;
}

// ─── View switching ───

function showView(mode) {
    viewMode = mode;
    const hub = document.getElementById('hubOverzicht');
    if (hub) hub.style.display = 'none';
    const isOverzicht = mode === 'overzicht' || mode === 'dossier' || mode === 'zoekresultaten';
    document.getElementById('dossierOverzicht').style.display = isOverzicht ? '' : 'none';
    document.getElementById('dossierDetail').style.display = mode === 'dossier' ? '' : 'none';
    document.getElementById('zoekResultaten').style.display = mode === 'zoekresultaten' ? '' : 'none';
    const compliance = document.getElementById('compliance');
    if (compliance) compliance.style.display = mode === 'compliance' ? '' : 'none';
    const odSectie = document.getElementById('overdrachtsdossier');
    if (odSectie) odSectie.style.display = mode === 'overdrachtsdossier' ? '' : 'none';
    if (mode === 'overdrachtsdossier') loadOverdrachtsdossierPagina();
    updateNavActief(mode);
}

function updateNavActief(mode) {
    const navOD = document.getElementById('navOverdrachtsdossier');
    const navBB = document.getElementById('navBeleidsBibliotheek');
    const navC = document.getElementById('navCompliance');
    if (navOD) navOD.classList.toggle('site-nav-actief', mode === 'overdrachtsdossier');
    if (navBB) navBB.classList.toggle('site-nav-actief', mode === 'overzicht' || mode === 'dossier' || mode === 'zoekresultaten');
    if (navC) navC.classList.toggle('site-nav-actief', mode === 'compliance');
}

// ─── Open / sluit dossier ───

function openDossier(thema, subFilter) {
    const bbvMode = isBBVThema(thema);
    const bbvIndex = bbvMode ? getBBVIndexFromNaam(thema) : null;
    activeDossier = bbvMode ? { bbvMode: true, bbvIndex, domein: thema, subFilter: subFilter || null } : { domein: thema, subFilter: subFilter || null };

    showView('dossier');

    document.getElementById('dossierTitel').textContent = thema;
    if (bbvMode) {
        renderSubTegelsBBV(bbvIndex);
        document.getElementById('samenvattingGeselecteerdBlok').style.display = 'none';
        document.getElementById('samenvattingPerThemaBlok').style.display = 'none';
        document.getElementById('beleidsnotaBlok').style.display = 'none';
        document.getElementById('briefingBlok').style.display = 'none';
        document.getElementById('coalitieAkkoordBlok').style.display = 'none';
        // BBV 6 = Sociaal domein: toon overdrachtsdossier-blok op niveau van kindtegels
        const odBlok = document.getElementById('overdrachtsdossierBlok');
        if (odBlok) {
            if (bbvIndex === 6) {
                odBlok.style.display = '';
                loadOverdrachtsdossierContent();
            } else {
                odBlok.style.display = 'none';
            }
        }
        loadDossierBesluitenBBV(bbvIndex);
    } else {
        const odBlok = document.getElementById('overdrachtsdossierBlok');
        if (odBlok) odBlok.style.display = 'none';
        document.getElementById('samenvattingGeselecteerdBlok').style.display = '';
        document.getElementById('samenvattingPerThemaBlok').style.display = '';
        document.getElementById('briefingBlok').style.display = '';
        document.getElementById('coalitieAkkoordBlok').style.display = '';
        renderSubTegels(thema, subFilter);
        loadSamenvattingPerThema(thema);
        loadSyntheseContent(thema);
        loadCoalitieAkkoord(thema);
        loadDossierBesluiten(thema);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSubTegelsBBV(bbvIndex) {
    const container = document.getElementById('subTegels');
    if (!container) return;
    container.innerHTML = '';
    const taakvelden = BBV_TAAKVELDEN_PER_HOOFDSTUK[bbvIndex];
    if (!taakvelden || !taakvelden.length) return;
    const dossierBesluiten = getDecisionsForBBV(bbvIndex);
    const grid = document.createElement('div');
    grid.className = 'sub-tegels-grid';
    const subFilter = activeDossier && activeDossier.subFilter;
    const accent = '#059669';
    const totaalCount = dossierBesluiten.length;
    taakvelden.forEach(tv => {
        const count = totaalCount; // Hoofdstuk-totaal; per-taakveld filtering kan later worden toegevoegd
        const label = `${tv.code} ${tv.naam}`;
        const isActief = subFilter === tv.code;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'sub-kaart sub-kaart-taakveld' + (isActief ? ' sub-kaart-actief' : '');
        card.style.borderLeftColor = isActief ? accent : 'rgba(0,0,0,0.15)';
        if (isActief) card.style.background = accent;
        if (isActief) card.style.color = '#fff';
        card.innerHTML = `<div class="sub-kaart-top"><span class="sub-kaart-code">${escapeHtml(tv.code)}</span><span class="sub-kaart-naam">${escapeHtml(tv.naam)}</span><span class="sub-kaart-count">${count}</span></div>`;
        card.onclick = () => {
            activeDossier.subFilter = activeDossier.subFilter === tv.code ? null : tv.code;
            renderSubTegelsBBV(bbvIndex);
            loadDossierBesluitenBBV(bbvIndex);
            showBeleidsnotaBlokBBV(bbvIndex, activeDossier.subFilter);
        };
        grid.appendChild(card);
    });
    container.appendChild(grid);
}

function loadDossierBesluitenBBV(bbvIndex) {
    const details = document.getElementById('dossierBesluiten');
    if (details) details.open = true;
    applyDossierFilters();
}

function sluitDossier() {
    activeDossier = null;
    resetFilters();
    showView('overzicht');
}

function getRecentDate(decisions, keywords, subthemaNaam) {
    let latest = '';
    for (const d of decisions) {
        if ((!keywords.length || matchSubthema(d, keywords, subthemaNaam)) && d.datum && d.datum > latest) latest = d.datum;
    }
    return latest;
}

function formatDatumKort(datum) {
    if (!datum) return '';
    const parts = datum.split('-');
    if (parts.length < 2) return datum;
    const maanden = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
    const m = parseInt(parts[1], 10);
    return maanden[m - 1] + ' ' + parts[0];
}

function getHoverPreview(decisions, keywords, subthemaNaam) {
    const matches = (keywords && keywords.length)
        ? decisions.filter(d => matchSubthema(d, keywords, subthemaNaam))
        : decisions.slice();
    matches.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
    return matches.slice(0, 3).map(d => (d.naam || '').substring(0, 80)).filter(Boolean);
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function renderSubTegels(thema, activeSubFilter) {
    const container = document.getElementById('subTegels');
    if (!container) return;
    container.innerHTML = '';

    const kleuren = THEMA_KLEUREN[thema] || { accent: '#002244', light: '#d6e4f0', lighter: '#eaf1f8', text: '#001833' };
    const dossierBesluiten = allDecisions.filter(d => (d.domein || '') === thema);

    let subData;
    const tegels = PORTEFEUILLE_TEGELS[thema];
    if (tegels) {
        subData = tegels.map(t => {
            const keywords = t.keywords;
            const count = dossierBesluiten.filter(d => matchSubthema(d, keywords, t.naam)).length;
            const recentDate = getRecentDate(dossierBesluiten, keywords, t.naam);
            const preview = getHoverPreview(dossierBesluiten, keywords, t.naam);
            return { naam: t.naam, count, keywords, recentDate, preview };
        });
    } else {
        const domein = (window.themaTree || THEMA_BOOM_DATA).find(d => d.naam === thema);
        if (!domein || !domein.kinderen || !domein.kinderen.length) return;

        const alleNietOverigKeywords = Object.entries(SUBTHEMA_KEYWORDS)
            .filter(([naam]) => naam !== 'Overig')
            .flatMap(([, kws]) => kws);

        subData = domein.kinderen.map(kind => {
            if (kind.naam === 'Overig') {
                const overig = alleNietOverigKeywords.length
                    ? dossierBesluiten.filter(d => !matchSubthema(d, alleNietOverigKeywords))
                    : dossierBesluiten.slice();
                const count = overig.length;
                const recentDate = getRecentDate(overig, []);
                const preview = getHoverPreview(overig, []);
                return { naam: kind.naam, count, keywords: [], recentDate, preview };
            }
            const keywords = SUBTHEMA_KEYWORDS[kind.naam] || [kind.naam.toLowerCase()];
            const count = dossierBesluiten.filter(d => matchSubthema(d, keywords, kind.naam)).length;
            const recentDate = getRecentDate(dossierBesluiten, keywords, kind.naam);
            const preview = getHoverPreview(dossierBesluiten, keywords, kind.naam);
            return { naam: kind.naam, count, keywords, recentDate, preview };
        });
    }

    const maxCount = Math.max(...subData.map(s => s.count), 1);

    const grid = document.createElement('div');
    grid.className = 'sub-tegels-grid';

    const toShow = tegels
        ? subData
        : subData.filter(s => s.count > 0 || !activeSubFilter);
    toShow.forEach(sub => {
        const card = document.createElement('button');
        card.type = 'button';
        const isActive = activeSubFilter === sub.naam;
        card.className = 'sub-kaart' + (isActive ? ' sub-kaart-actief' : '') + (sub.count === 0 ? ' sub-kaart-leeg' : '');

        const intensity = Math.max(0.06, (sub.count / maxCount) * 0.25);

        if (isActive) {
            card.style.background = kleuren.accent;
            card.style.color = '#fff';
            card.style.borderColor = kleuren.accent;
        } else {
            card.style.borderLeftColor = kleuren.accent;
            if (sub.count > 0) {
                card.style.background = hexToRgba(kleuren.accent, intensity);
            }
        }

        const datumHtml = sub.recentDate
            ? `<span class="sub-kaart-datum">${formatDatumKort(sub.recentDate)}</span>`
            : '';

        card.innerHTML = `
            <div class="sub-kaart-top">
                <span class="sub-kaart-naam">${escapeHtml(sub.naam)}</span>
                <span class="sub-kaart-count">${sub.count}</span>
            </div>
            ${datumHtml}
        `;

        if (sub.preview.length && !isActive) {
            card.title = sub.preview.join('\n');
        }

        if (sub.count > 0 || tegels) {
            card.onclick = () => {
                activeDossier.subFilter = sub.naam;
                renderSubTegels(thema, sub.naam);
                updateBreadcrumb(thema, sub.naam, sub.count, kleuren);
                showBeleidsnotaBlok(thema, sub.naam);
                if (tegels && SAMENVATTING_PER_THEMA[thema]) {
                    showSamenvattingGeselecteerd(thema, sub.naam);
                    filterBySubthema(thema, sub.keywords || [], sub.naam);
                } else if (sub.naam === 'Overig') {
                    filterByOverig(thema);
                } else {
                    filterBySubthema(thema, sub.keywords, sub.naam);
                }
            };
        }
        grid.appendChild(card);
    });

    container.appendChild(grid);

    if (!activeSubFilter) {
        updateBreadcrumb(thema, null, 0, kleuren);
    }
}

function updateBreadcrumb(thema, subFilter, count, kleuren) {
    const el = document.getElementById('subBreadcrumb');
    if (!el) return;
    if (!subFilter) {
        el.style.display = 'none';
        el.innerHTML = '';
        return;
    }
    el.style.display = '';
    el.innerHTML = `
        <span class="breadcrumb-thema">${escapeHtml(thema)}</span>
        <span class="breadcrumb-sep">→</span>
        <span class="breadcrumb-sub" style="color:${kleuren.accent}">${escapeHtml(subFilter)}</span>
        <span class="breadcrumb-count">(${count})</span>
        <button class="breadcrumb-reset" onclick="activeDossier.subFilter=null;openDossier('${thema.replace(/'/g,"\\'")}')">✕ Wis filter</button>
    `;
}

function scrollToBesluiten() {
    const details = document.getElementById('dossierBesluiten');
    if (!details) return;
    if (!details.open) details.open = true;
    setTimeout(() => {
        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
}

function filterByOverig(thema) {
    const dossierBesluiten = allDecisions.filter(d => (d.domein || '') === thema);
    const alleNietOverigKeywords = Object.entries(SUBTHEMA_KEYWORDS)
        .filter(([naam]) => naam !== 'Overig')
        .flatMap(([, kws]) => kws);
    filteredDecisions = alleNietOverigKeywords.length
        ? dossierBesluiten.filter(d => !matchSubthema(d, alleNietOverigKeywords))
        : dossierBesluiten.slice();

    const countEl = document.getElementById('besluitenCount');
    if (countEl) countEl.textContent = `(${filteredDecisions.length})`;
    const sortBy = document.getElementById('sortBy').value;
    sortDecisions(sortBy);
    displayDecisions('resultsList', 'resultsCount', 'noResults');
    if (!PORTEFEUILLE_TEGELS[thema]) scrollToBesluiten();
}

function filterBySubthema(thema, keywords, subFilter) {
    const dossierBesluiten = allDecisions.filter(d => (d.domein || '') === thema);
    filteredDecisions = dossierBesluiten.filter(d => matchSubthema(d, keywords, subFilter));

    const countEl = document.getElementById('besluitenCount');
    if (countEl) countEl.textContent = `(${filteredDecisions.length})`;

    const sortBy = document.getElementById('sortBy').value;
    sortDecisions(sortBy);
    displayDecisions('resultsList', 'resultsCount', 'noResults');
    if (!PORTEFEUILLE_TEGELS[thema]) scrollToBesluiten();
}

function loadSamenvattingPerThema(thema) {
    const blok = document.getElementById('samenvattingPerThemaBlok');
    const inhoud = document.getElementById('samenvattingPerThemaInhoud');
    const geselecteerdBlok = document.getElementById('samenvattingGeselecteerdBlok');
    if (!blok || !inhoud) return;

    const items = SAMENVATTING_PER_THEMA[thema];
    if (!items || !items.length) {
        blok.style.display = 'none';
        if (geselecteerdBlok) geselecteerdBlok.style.display = 'none';
        return;
    }

    const subFilter = activeDossier?.subFilter;
    if (PORTEFEUILLE_TEGELS[thema] && SAMENVATTING_PER_THEMA[thema] && subFilter && geselecteerdBlok) {
        showSamenvattingGeselecteerd(thema, subFilter);
        showBeleidsnotaBlok(thema, subFilter);
        blok.style.display = 'none';
        return;
    }

    if (subFilter) showBeleidsnotaBlok(thema, subFilter);
    else {
        const beleidsnotaBlok = document.getElementById('beleidsnotaBlok');
        if (beleidsnotaBlok) beleidsnotaBlok.style.display = 'none';
    }
    if (geselecteerdBlok) geselecteerdBlok.style.display = 'none';
    const kleuren = THEMA_KLEUREN[thema] || { accent: '#0060ac' };
    inhoud.innerHTML = items.map(item => `
        <div class="samenvatting-kaart" style="border-left-color:${kleuren.accent}">
            <div class="kaart-thema">${escapeHtml(item.thema)}</div>
            <div class="kaart-tekst">${escapeHtml(item.samenvatting)}</div>
        </div>
    `).join('');
    blok.style.display = '';
}

function showSamenvattingGeselecteerd(thema, subFilter) {
    const blok = document.getElementById('samenvattingGeselecteerdBlok');
    const titelEl = document.getElementById('samenvattingGeselecteerdTitel');
    const tekstEl = document.getElementById('samenvattingGeselecteerdTekst');
    const perThemaBlok = document.getElementById('samenvattingPerThemaBlok');
    if (!blok || !titelEl || !tekstEl) return;

    const items = SAMENVATTING_PER_THEMA[thema];
    const item = items?.find(i => i.thema === subFilter);
    if (!item) {
        blok.style.display = 'none';
        if (perThemaBlok) perThemaBlok.style.display = '';
        return;
    }

    titelEl.textContent = item.thema;
    tekstEl.textContent = item.samenvatting;
    const kleuren = THEMA_KLEUREN[thema] || { accent: '#0060ac' };
    blok.style.borderLeftColor = kleuren.accent;
    blok.style.display = '';
    if (perThemaBlok) perThemaBlok.style.display = 'none';
}

function showBeleidsnotaBlok(thema, subFilter) {
    const blok = document.getElementById('beleidsnotaBlok');
    const lijst = document.getElementById('beleidsnotaLijst');
    if (!blok || !lijst) return;

    const perThema = BELEIDSNOTA_PER_THEMA[thema];
    const items = perThema?.[subFilter];
    if (!items || !items.length) {
        blok.style.display = 'none';
        return;
    }

    const kleuren = THEMA_KLEUREN[thema] || { accent: '#0060ac' };
    blok.style.borderLeftColor = kleuren.accent;
    lijst.innerHTML = items.map(n => {
        const datumStr = n.datum ? formatDatumKort(n.datum) : '';
        const typeLabel = n.type ? `<span class="beleidsnota-type">${escapeHtml(n.type)}</span>` : '';
        const linkHtml = n.link
            ? `<a href="${escapeHtml(n.link)}" target="_blank" rel="noopener" class="beleidsnota-link">${escapeHtml(n.naam)}</a>`
            : escapeHtml(n.naam);
        const meta = [typeLabel, datumStr ? `<span class="beleidsnota-datum">${datumStr}</span>` : ''].filter(Boolean).join(' · ');
        const toelichtingHtml = n.toelichting ? `<p class="beleidsnota-toelichting">${escapeHtml(n.toelichting)}</p>` : '';
        return `<li class="beleidsnota-item">${linkHtml}${meta ? ` <span class="beleidsnota-meta">${meta}</span>` : ''}${toelichtingHtml}</li>`;
    }).join('');
    blok.style.display = '';
}

function showBeleidsnotaBlokBBV(bbvIndex, taakveldCode) {
    const blok = document.getElementById('beleidsnotaBlok');
    const lijst = document.getElementById('beleidsnotaLijst');
    if (!blok || !lijst) return;

    const items = taakveldCode ? (BELEIDSNOTA_PER_TAAKVELD[taakveldCode] || []) : [];
    if (!items.length) {
        blok.style.display = 'none';
        return;
    }

    blok.style.borderLeftColor = '#059669';
    lijst.innerHTML = items.map(n => {
        const datumStr = n.datum ? formatDatumKort(n.datum) : '';
        const typeLabel = n.type ? `<span class="beleidsnota-type">${escapeHtml(n.type)}</span>` : '';
        const linkHtml = n.link
            ? `<a href="${escapeHtml(n.link)}" target="_blank" rel="noopener" class="beleidsnota-link">${escapeHtml(n.naam)}</a>`
            : escapeHtml(n.naam);
        const meta = [typeLabel, datumStr ? `<span class="beleidsnota-datum">${datumStr}</span>` : ''].filter(Boolean).join(' · ');
        const toelichtingHtml = n.toelichting ? `<p class="beleidsnota-toelichting">${escapeHtml(n.toelichting)}</p>` : '';
        return `<li class="beleidsnota-item">${linkHtml}${meta ? ` <span class="beleidsnota-meta">${meta}</span>` : ''}${toelichtingHtml}</li>`;
    }).join('');
    blok.style.display = '';
}

function loadSyntheseContent(thema) {
    const container = document.getElementById('dossierSynthese');
    const blok = document.getElementById('briefingBlok');
    if (!container) return;

    let hasContent = false;

    if (briefingCache[thema]) {
        container.innerHTML = briefingCache[thema];
        hasContent = true;
    } else if (typeof BRIEFING_HTML_DATA !== 'undefined' && BRIEFING_HTML_DATA[thema]) {
        const body = extractBodyContent(BRIEFING_HTML_DATA[thema]);
        briefingCache[thema] = body;
        container.innerHTML = body;
        hasContent = true;
    } else {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">Geen beleidsdossier beschikbaar voor dit thema.</p>';
    }

    if (blok) {
        blok.style.display = hasContent ? '' : 'none';
    }
}

function extractBodyContent(html) {
    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (match) return match[1];
    return html;
}

let overdrachtsdossierPaginaCache = null;

function parseOverdrachtsdossierMd(md) {
    const stripPageNum = (s) => s.replace(/\t\d+\s*$/, '').trim();
    const escapeHtml = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const inlineMd = (s) => escapeHtml(s)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    const lines = md.split(/\r?\n/);
    const chapters = [];
    let currentChapter = null;
    let currentContent = [];
    let tableRows = [];

    const flushTable = () => {
        if (tableRows.length === 0) return;
        let html = '<table class="overdracht-tabel"><tbody>';
        tableRows.forEach((row, i) => {
            const tag = i === 0 ? 'th' : 'td';
            html += '<tr>' + row.map(c => `<${tag}>${inlineMd(c.trim())}</${tag}>`).join('') + '</tr>';
        });
        html += '</tbody></table>';
        currentContent.push(html);
        tableRows = [];
    };

    const flushParagraph = (text) => {
        const t = text.trim();
        if (!t) return;
        if (t === '---') return;
        currentContent.push('<p>' + inlineMd(t) + '</p>');
    };

    const pushChapter = (title, content) => {
        if (!title) return;
        const body = content.join('\n');
        if (body) chapters.push({ title: stripPageNum(title), body });
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const h1 = line.match(/^#\s+(.+)$/);
        const h2 = line.match(/^##\s+(.+)$/);
        const h3 = line.match(/^###\s+(.+)$/);
        const isTable = line.trim().startsWith('|');

        if (h1) {
            flushTable();
            if (currentChapter) {
                pushChapter(currentChapter.title, currentContent);
            }
            currentChapter = { title: h1[1] };
            currentContent = [];
        } else if (h2) {
            flushTable();
            currentContent.push('<h2>' + escapeHtml(stripPageNum(h2[1])) + '</h2>');
        } else if (h3) {
            flushTable();
            currentContent.push('<h3>' + escapeHtml(stripPageNum(h3[1])) + '</h3>');
        } else if (isTable) {
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            const isSeparator = cells.every(c => !c || /^-+$/.test(c));
            if (cells.some(c => c) && !isSeparator) tableRows.push(cells);
        } else {
            if (tableRows.length > 0) {
                flushTable();
            }
            flushParagraph(line);
        }
    }
    flushTable();
    if (currentChapter) pushChapter(currentChapter.title, currentContent);

    return chapters;
}

function loadOverdrachtsdossierPagina() {
    const container = document.getElementById('overdrachtsdossierInhoudPagina');
    if (!container) return;
    if (overdrachtsdossierPaginaCache) {
        container.innerHTML = overdrachtsdossierPaginaCache;
        return;
    }
    container.innerHTML = '<p class="overdrachtsdossier-placeholder" role="status">Laden…</p>';
    const mdUrl = new URL('overdracht_raadsverkiezingen_2026.md', window.location.href).href;
    fetch(mdUrl)
        .then(r => r.ok ? r.text() : Promise.reject(new Error('Bestand niet gevonden')))
        .then(md => {
            const chapters = parseOverdrachtsdossierMd(md);
            const skipToc = ['Inhoud', 'Overdrachtsdossier raadsverkiezingen 2026 — Gemeente Wassenaar'];
            const filtered = chapters.filter(c => !skipToc.includes(c.title) && c.title.length > 2);
            let html = '';
            filtered.forEach((ch, i) => {
                const id = 'od-ch-' + i;
                const open = i < 2;
                html += `<details class="overdrachtsdossier-details" id="${id}"${open ? ' open' : ''}>`;
                html += `<summary class="overdrachtsdossier-summary">${escapeHtml(ch.title)}</summary>`;
                html += `<div class="overdrachtsdossier-details-inhoud">${ch.body}</div>`;
                html += '</details>';
            });
            overdrachtsdossierPaginaCache = html;
            container.innerHTML = html;
        })
        .catch((err) => {
            console.warn('Overdrachtsdossier laden mislukt:', err);
            container.innerHTML = '<p class="overdrachtsdossier-placeholder">Het overdrachtsdossier kon niet worden geladen. Zorg dat het bestand <code>overdracht_raadsverkiezingen_2026.md</code> in dezelfde map staat en dat de pagina via HTTP wordt geopend (niet file://). Start bijvoorbeeld: <code>python3 -m http.server 8765</code> in de map wassenaar.</p>';
        });
}

function loadOverdrachtsdossierContent() {
    const container = document.getElementById('overdrachtsdossierInhoud');
    if (!container) return;
    const ibabs = 'https://wassenaar.bestuurlijkeinformatie.nl/';
    container.innerHTML = `
<p>Het sociaal domein draait om drie wetten: de <strong>Wmo</strong>, de <strong>Jeugdwet</strong> en de <strong>Participatiewet</strong>. Voor Wmo en Jeugdwet is het Sociaal Team Wassenaar (STW) de toegangspoort. De gemeente richt zich op preventie: versterken van de sociale basis, toegankelijke informatie en passende ondersteuning. Verordeningen zijn vernieuwd.</p>

<p>De uitdagingen zijn groot: meer regie en samenwerking binnen een complexer zorglandschap. De kosten gaan vaak voor de baten uit. Samenwerking met huisartsen, scholen, zorgaanbieders en vrijwilligers is onmisbaar.</p>

<p>Investeren in de voorkant is noodzakelijk — vroeg hulp voorkomt later dure specialistische zorg. Dit vraagt om duidelijke keuzes. Zonder keuzes lopen de kosten verder op.</p>

<h4>Relevante visies en beleidsdocumenten</h4>
<ul class="overdracht-doclist">
<li><a href="${ibabs}" target="_blank" rel="noopener noreferrer">Beleidsplan Sociaal Domein Wassenaar</a> (juni 2024)</li>
<li><a href="${ibabs}" target="_blank" rel="noopener noreferrer">Lokaal Jeugdbeleid Wassenaar 2026</a></li>
<li><a href="${ibabs}" target="_blank" rel="noopener noreferrer">Beleidsnota Ouderenbeleid 2025</a></li>
<li><a href="${ibabs}" target="_blank" rel="noopener noreferrer">Startnotitie Lokale Woonzorgvisie</a> (sept 2025)</li>
<li><a href="${ibabs}" target="_blank" rel="noopener noreferrer">Beleidsnota Schuldhulpverlening 2025–2028</a></li>
<li><a href="${ibabs}" target="_blank" rel="noopener noreferrer">Verordening Adviesraad Sociaal Domein 2025</a></li>
</ul>`;
}

function loadCoalitieAkkoord(thema) {
    const container = document.getElementById('coalitieAkkoordInhoud');
    const blok = document.getElementById('coalitieAkkoordBlok');
    if (!container || !blok) return;

    if (typeof COALITIEAKKOORD_DATA === 'undefined') {
        blok.style.display = 'none';
        return;
    }

    const secties = COALITIEAKKOORD_DATA.secties.filter(s => s.thema === thema);

    if (!secties.length) {
        blok.style.display = 'none';
        return;
    }

    blok.style.display = '';

    const grouped = {};
    secties.forEach(s => {
        if (!grouped[s.hoofdstuk]) grouped[s.hoofdstuk] = [];
        grouped[s.hoofdstuk].push(s);
    });

    let html = `<p class="coalitie-intro">Onderstaande passages komen uit het coalitieakkoord <em>"${escapeHtml(COALITIEAKKOORD_DATA.titel)}"</em> (${escapeHtml(COALITIEAKKOORD_DATA.datum)}) en zijn relevant voor dit beleidsdossier.</p>`;

    for (const [hoofdstuk, items] of Object.entries(grouped)) {
        html += `<div class="coalitie-hoofdstuk"><h4 class="coalitie-hoofdstuk-titel">${escapeHtml(hoofdstuk)}</h4>`;
        items.forEach(s => {
            const paragraphs = s.tekst.split('\n\n').map(p =>
                `<p>${escapeHtml(p.trim())}</p>`
            ).join('');
            html += `
                <div class="coalitie-sectie" id="ca-${s.id}">
                    <h5 class="coalitie-sectie-titel">
                        <a href="#ca-${s.id}" class="coalitie-anchor">${escapeHtml(s.titel)}</a>
                    </h5>
                    <div class="coalitie-sectie-tekst">${paragraphs}</div>
                </div>`;
        });
        html += `</div>`;
    }

    html += buildPortefeuilleBlock(thema);
    html += `<p class="coalitie-bron"><a href="${COALITIEAKKOORD_DATA.bron_url}" target="_blank" rel="noopener noreferrer">Bekijk volledig coalitieakkoord (PDF) →</a></p>`;

    container.innerHTML = html;
}

function buildPortefeuilleBlock(thema) {
    if (typeof COALITIEAKKOORD_DATA === 'undefined' || !COALITIEAKKOORD_DATA.portefeuilleverdeling) return '';

    const THEMA_PORTEFEUILLE = {
        'Bestuur & Veiligheid': ['Burgemeester Leendert de Lange'],
        'Financiën, Economie & Sport': ['Wethouder Laurens van Doeveren (VVD) — Financiën, Economie & Sport'],
        'Ruimte, Duurzaamheid & Mobiliteit': ['Wethouder Wim Koetsier (CDA) — Ruimte, Duurzaamheid & Mobiliteit'],
        'Sociaal Domein, Wonen & Onderwijs': ['Wethouder Ritske Bloemendaal (D66/PvdA) — Sociaal Domein, Wonen & Onderwijs'],
        'Cultuur & Welzijn': ['Wethouder Ronald Zoutendijk (DLW) — Cultuur & Welzijn'],
        'Bedrijfsvoering': []
    };

    const pv = COALITIEAKKOORD_DATA.portefeuilleverdeling;
    const keys = THEMA_PORTEFEUILLE[thema];
    const relevant = [];

    if (keys && keys.length) {
        keys.forEach(k => { if (pv[k]) relevant.push({ functie: k, taken: pv[k] }); });
    } else {
        Object.entries(pv).forEach(([functie, taken]) => relevant.push({ functie, taken }));
    }

    if (!relevant.length) return '';

    let html = `<div class="coalitie-sectie coalitie-portefeuille" id="ca-portefeuilleverdeling">
        <h5 class="coalitie-sectie-titel"><a href="#ca-portefeuilleverdeling" class="coalitie-anchor">Portefeuilleverdeling</a></h5>
        <div class="coalitie-sectie-tekst">`;

    relevant.forEach(({ functie, taken }) => {
        html += `<p><strong>${escapeHtml(functie)}:</strong> ${taken.map(t => escapeHtml(t)).join(', ')}</p>`;
    });

    html += `</div></div>`;
    return html;
}

function getSubFilterKeywords(thema, subFilter) {
    const tegels = PORTEFEUILLE_TEGELS[thema];
    if (tegels) {
        const t = tegels.find(x => x.naam === subFilter);
        return t ? t.keywords : [];
    }
    if (subFilter === 'Overig') return null;
    return SUBTHEMA_KEYWORDS[subFilter] || [subFilter.toLowerCase()];
}

function loadDossierBesluiten(thema) {
    let besluiten = allDecisions.filter(d => (d.domein || 'Niet geclassificeerd') === thema);

    if (activeDossier && activeDossier.subFilter) {
        const keywords = getSubFilterKeywords(thema, activeDossier.subFilter);
        if (keywords === null) {
            const alleNietOverig = Object.entries(SUBTHEMA_KEYWORDS).filter(([n]) => n !== 'Overig').flatMap(([, k]) => k);
            besluiten = alleNietOverig.length ? besluiten.filter(d => !matchSubthema(d, alleNietOverig)) : besluiten;
        } else if (keywords.length) {
            besluiten = besluiten.filter(d => matchSubthema(d, keywords, activeDossier.subFilter));
        }
    }

    filteredDecisions = besluiten;

    const countEl = document.getElementById('besluitenCount');
    if (countEl) countEl.textContent = `(${filteredDecisions.length})`;

    const sortBy = document.getElementById('sortBy').value;
    sortDecisions(sortBy);
    displayDecisions('resultsList', 'resultsCount', 'noResults');
}

// ─── Zoekfunctie (zelfstandig) ───

let zoekBaseResults = [];

function handleSearch() {
    const term = document.getElementById('searchInput').value.trim();
    if (!term) {
        if (viewMode === 'zoekresultaten') showView('overzicht');
        return;
    }

    const lowerTerm = term.toLowerCase();
    zoekBaseResults = allDecisions.filter(d => {
        const searchable = [d.naam || '', d.besluit || '', d.domein || '', d.onderwerp_begroting || '', d.portefeuille || ''].join(' ').toLowerCase();
        return searchable.includes(lowerTerm);
    });

    showView('zoekresultaten');
    activeDossier = null;

    document.getElementById('zoekYearFilter').value = '';
    document.getElementById('zoekTypeFilter').value = '';
    document.getElementById('zoekSortBy').value = 'datum-desc';

    applyZoekFilters();
}

function applyZoekFilters() {
    const year = document.getElementById('zoekYearFilter').value;
    const type = document.getElementById('zoekTypeFilter').value;
    const sort = document.getElementById('zoekSortBy').value;

    let filtered = zoekBaseResults.slice();

    if (year) filtered = filtered.filter(d => (d.datum || '').startsWith(year));
    if (type) {
        if (type === 'raad') filtered = filtered.filter(d => d.type === 'Raadsbesluit');
        else if (type === 'college') filtered = filtered.filter(d => d.type === 'Collegebesluit (B&W)');
    }

    if (sort === 'datum-desc') filtered.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
    else if (sort === 'datum-asc') filtered.sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
    else if (sort === 'naam-asc') filtered.sort((a, b) => (a.naam || '').localeCompare(b.naam || ''));
    else if (sort === 'naam-desc') filtered.sort((a, b) => (b.naam || '').localeCompare(a.naam || ''));

    const countEl = document.getElementById('zoekResultsCount');
    const listEl = document.getElementById('zoekResultsList');
    const noEl = document.getElementById('zoekNoResults');

    if (filtered.length === 0) {
        listEl.style.display = 'none';
        noEl.style.display = 'block';
        countEl.textContent = '0 raads- en collegebesluiten';
        return;
    }

    listEl.style.display = 'block';
    noEl.style.display = 'none';
    countEl.textContent = `${filtered.length} raads- en collegebesluit${filtered.length !== 1 ? 'en' : ''}`;
    listEl.innerHTML = filtered.map(d => renderDecisionItem(d)).join('');
}

function sluitZoekresultaten() {
    document.getElementById('searchInput').value = '';
    zoekBaseResults = [];
    showView('overzicht');
}

// ─── Filtering (binnen dossier) ───

function applyDossierFilters() {
    if (!activeDossier) return;
    const year = document.getElementById('yearFilter').value;
    const type = document.getElementById('typeFilter').value;
    const niveau = document.getElementById('niveauFilter') ? document.getElementById('niveauFilter').value : '';

    let results;
    if (activeDossier.bbvMode) {
        results = getDecisionsForBBV(activeDossier.bbvIndex);
        if (activeDossier.subFilter) results = results.filter(d => d.domein === activeDossier.subFilter);
    } else {
        results = allDecisions.filter(d => (d.domein || 'Niet geclassificeerd') === activeDossier.domein);
        if (activeDossier.subFilter) {
            const keywords = getSubFilterKeywords(activeDossier.domein, activeDossier.subFilter);
            if (keywords === null) {
                const alleNietOverig = Object.entries(SUBTHEMA_KEYWORDS).filter(([n]) => n !== 'Overig').flatMap(([, k]) => k);
                results = alleNietOverig.length ? results.filter(d => !matchSubthema(d, alleNietOverig)) : results;
            } else if (keywords.length) {
                results = results.filter(d => matchSubthema(d, keywords, activeDossier.subFilter));
            }
        }
    }

    if (year) {
        results = results.filter(d => {
            const dy = d.datum ? d.datum.substring(0, 4) : '';
            const jy = d.jaar ? String(d.jaar) : '';
            return dy === year || jy === year;
        });
    }
    if (type) {
        results = results.filter(d => d.bron === type);
    }
    if (niveau) {
        results = results.filter(d => classifyNiveau(d) === niveau);
    }

    filteredDecisions = results;

    const countEl = document.getElementById('besluitenCount');
    if (countEl) countEl.textContent = `(${filteredDecisions.length})`;

    const sortBy = document.getElementById('sortBy').value;
    sortDecisions(sortBy);
    displayDecisions('resultsList', 'resultsCount', 'noResults');
}

function resetFilters() {
    const yf = document.getElementById('yearFilter');
    const tf = document.getElementById('typeFilter');
    const nf = document.getElementById('niveauFilter');
    if (yf) yf.value = '';
    if (tf) tf.value = '';
    if (nf) nf.value = '';
}

function getNiveauRang(decision) {
    const niv = classifyNiveau(decision);
    return BELEIDSNIVEAU[niv] ? BELEIDSNIVEAU[niv].rang : 9;
}

function sortDecisions(sortBy) {
    filteredDecisions.sort((a, b) => {
        switch (sortBy) {
            case 'datum-desc': return (b.datum || '').localeCompare(a.datum || '');
            case 'datum-asc':  return (a.datum || '').localeCompare(b.datum || '');
            case 'naam-asc':   return (a.naam || '').localeCompare(b.naam || '');
            case 'naam-desc':  return (b.naam || '').localeCompare(a.naam || '');
            case 'niveau-desc': {
                const ra = getNiveauRang(a), rb = getNiveauRang(b);
                if (ra !== rb) return ra - rb;
                return (b.datum || '').localeCompare(a.datum || '');
            }
            default: return 0;
        }
    });
}

// ─── Render decisions ───

function displayDecisions(listId, countId, noResultsId) {
    const container = document.getElementById(listId);
    const noResults = document.getElementById(noResultsId);
    const countEl = document.getElementById(countId);

    if (!filteredDecisions.length) {
        container.style.display = 'none';
        noResults.style.display = 'block';
        if (countEl) countEl.textContent = '0 raads- en collegebesluiten';
        return;
    }

    const n = filteredDecisions.length;
    if (countEl) countEl.textContent = `${n} raads- en collegebesluit${n !== 1 ? 'en' : ''}`;

    container.style.display = 'block';
    noResults.style.display = 'none';
    container.innerHTML = filteredDecisions.map(d => renderDecisionItem(d)).join('');
}

function renderDecisionItem(decision) {
    const datum = decision.datum ? formatDate(decision.datum) : 'Onbekend';
    const badgeClass = decision.bron === 'raad' ? 'raad' : 'college';
    const badgeText = decision.type_besluit || (decision.bron === 'raad' ? 'Raadsbesluit' : 'Collegebesluit');
    const niveauKey = classifyNiveau(decision);
    const niveau = BELEIDSNIVEAU[niveauKey];

    const besluitText = (decision.besluit || '').trim();
    const isCollege = decision.bron === 'college';
    const maxPreview = isCollege ? 500 : 300;
    const isLong = besluitText.length > maxPreview;
    const previewPart = isLong ? besluitText.substring(0, maxPreview) + '…' : besluitText;
    const fullPart = isLong ? besluitText.substring(maxPreview) : '';
    const idSuffix = Math.random().toString(36).slice(2, 9);
    const links = buildDecisionLinks(decision);

    const searchNaam = (decision.naam || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    return `
        <div class="result-item" data-bron="${decision.bron || ''}" data-besluit-naam="${searchNaam}" data-besluit-datum="${decision.datum || ''}" data-niveau="${niveauKey}">
            <div class="result-header">
                <div>
                    <div class="result-title">${escapeHtml(decision.naam || (isCollege ? 'Naamloos collegebesluit' : 'Naamloos raadsbesluit'))}</div>
                    <div class="result-meta">
                        <span>📅 ${datum}</span>
                        <span class="result-badge niveau-badge niveau-${niveauKey.toLowerCase()}">${niveau.icon} ${niveau.label}</span>
                        <span class="result-badge ${badgeClass}">${badgeText}</span>
                        ${decision.domein ? `<span>📁 ${escapeHtml(decision.domein)}</span>` : ''}
                        ${decision.portefeuille ? `<span>👤 ${escapeHtml(decision.portefeuille)}</span>` : ''}
                    </div>
                </div>
            </div>
            ${besluitText ? `
                <div class="result-besluit ${isCollege ? 'result-besluit-college' : ''}">
                    <strong class="result-besluit-label">${isCollege ? 'Collegebesluit:' : 'Raadsbesluit:'}</strong>
                    <div class="result-besluit-tekst">
                        <span class="result-text-inhoud">${escapeHtml(previewPart)}</span>
                        ${fullPart ? `<span class="result-text-meer" id="meer-${idSuffix}" hidden>${escapeHtml(fullPart)}</span>` : ''}
                    </div>
                    ${isLong ? `<button type="button" class="btn-uitklappen" data-id="meer-${idSuffix}" aria-expanded="false">Toon volledige tekst</button>` : ''}
                </div>
            ` : ''}
            ${links}
        </div>
    `;
}

function buildDecisionLinks(decision) {
    const parts = [];
    const isOB = decision.bron_systeem === 'Officiële Bekendmakingen';

    if (isOB && decision.link) {
        parts.push(`<a href="${decision.link}" target="_blank" rel="noopener noreferrer" class="result-link">Bekijk op Officiële Bekendmakingen →</a>`);
    }
    if (decision.pdf_url) {
        const label = isOB ? 'Download PDF →' : 'Bekijk besluitenlijst (PDF) →';
        parts.push(`<a href="${decision.pdf_url}" target="_blank" rel="noopener noreferrer" class="result-link">${label}</a>`);
    }
    if (!isOB && decision.link && decision.link.startsWith('http')) {
        parts.push(`<a href="${decision.link}" target="_blank" rel="noopener noreferrer" class="result-link">Bekijk document →</a>`);
    } else if (!isOB && decision.link && decision.link.includes('iBabs')) {
        const q = encodeURIComponent(`"${decision.naam || ''}" site:wassenaar.bestuurlijkeinformatie.nl`);
        parts.push(`<a href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener noreferrer" class="result-link">Zoek in iBabs →</a>`);
    }
    if (!parts.length && decision.bron === 'raad') {
        const q = encodeURIComponent(`"${decision.naam || ''}" wassenaar raadsbesluit`);
        parts.push(`<a href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener noreferrer" class="result-link">Zoek document →</a>`);
    }
    return parts.length ? `<div class="result-links">${parts.join('')}</div>` : '';
}

// ─── Helpers ───

function formatDate(dateStr) {
    if (!dateStr) return 'Onbekend';
    const date = new Date(dateStr);
    const months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ─── Bronverwijzing navigatie ───

function navigateToDecision(refText) {
    const details = document.getElementById('dossierBesluiten');
    if (!details) return;

    if (!details.open) details.open = true;

    const cleaned = refText.replace(/[\[\]]/g, '').trim();
    const parts = cleaned.split(';').map(s => s.trim());
    const firstRef = parts[0];

    const namePart = firstRef
        .replace(/^(Raadsbesluit|Collegebesluit|Coalitieakkoord)\s*:\s*/i, '')
        .replace(/,\s*\d{2}-\d{2}-\d{4}.*$/, '')
        .replace(/,\s*\d{4}.*$/, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    if (!namePart || namePart.length < 4) {
        details.querySelector('.dossier-besluiten-kop').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    const items = document.querySelectorAll('#resultsList .result-item');
    let bestMatch = null;
    let bestScore = 0;

    items.forEach(item => {
        const itemNaam = item.getAttribute('data-besluit-naam') || '';
        if (!itemNaam) return;

        let score = 0;
        const words = namePart.match(/.{3,}/g) || [namePart];
        words.forEach(w => { if (itemNaam.includes(w)) score += w.length; });

        if (namePart.length > 6 && itemNaam.includes(namePart)) {
            score += namePart.length * 2;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
        }
    });

    if (bestMatch && bestScore >= 6) {
        document.querySelectorAll('.result-item.highlight').forEach(el => el.classList.remove('highlight'));
        bestMatch.classList.add('highlight');
        setTimeout(() => {
            bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        setTimeout(() => bestMatch.classList.remove('highlight'), 4000);
    } else {
        details.querySelector('.dossier-besluiten-kop').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ─── Kwaliteitsdashboard ───

function renderKwaliteit() {
    const container = document.getElementById('kwaliteitInhoud');
    if (!container || !allDecisions.length) return;

    const total = allDecisions.length;
    const dates = allDecisions.map(d => d.datum).filter(Boolean).sort();
    const newest = dates[dates.length - 1];
    const oldest = dates[0];

    const perYear = {};
    const perType = {};
    const perDomein = {};
    let withLink = 0;
    let classified = 0;

    allDecisions.forEach(d => {
        const year = (d.datum || '').substring(0, 4);
        if (year) perYear[year] = (perYear[year] || 0) + 1;

        const type = d.type_besluit || 'Onbekend';
        perType[type] = (perType[type] || 0) + 1;

        const dom = d.domein || 'Niet geclassificeerd';
        perDomein[dom] = (perDomein[dom] || 0) + 1;

        if (d.link) withLink++;
        if (d.domein) classified++;
    });

    const classifiedPct = Math.round((classified / total) * 100);
    const linkedPct = Math.round((withLink / total) * 100);

    const years = Object.keys(perYear).sort();
    const yearRows = years.map(y =>
        `<tr><td>${y}</td><td class="kw-num">${perYear[y].toLocaleString('nl-NL')}</td></tr>`
    ).join('');

    const typeEntries = Object.entries(perType).sort((a, b) => b[1] - a[1]);
    const topTypes = typeEntries.slice(0, 8);
    const typeRows = topTypes.map(([t, c]) =>
        `<tr><td>${escapeHtml(t)}</td><td class="kw-num">${c.toLocaleString('nl-NL')}</td></tr>`
    ).join('');

    const domeinEntries = Object.entries(perDomein).sort((a, b) => b[1] - a[1]);
    const domeinRows = domeinEntries.map(([d, c]) => {
        const pct = Math.round((c / total) * 100);
        return `<tr><td>${escapeHtml(d)}</td><td class="kw-num">${c.toLocaleString('nl-NL')}</td><td class="kw-num kw-pct">${pct}%</td></tr>`;
    }).join('');

    const coalitieSecties = typeof COALITIEAKKOORD_DATA !== 'undefined'
        ? COALITIEAKKOORD_DATA.secties.length : 0;
    let coalitieMetBesluiten = 0;
    if (typeof COALITIEAKKOORD_DATA !== 'undefined') {
        COALITIEAKKOORD_DATA.secties.forEach(s => {
            const thema = s.thema;
            const count = allDecisions.filter(d => d.domein === thema).length;
            if (count > 0) coalitieMetBesluiten++;
        });
    }

    container.innerHTML = `
        <div class="kw-grid">
            <div class="kw-card kw-card-highlight">
                <div class="kw-card-value">${total.toLocaleString('nl-NL')}</div>
                <div class="kw-card-label">Publicaties verwerkt</div>
            </div>
            <div class="kw-card">
                <div class="kw-card-value">${classifiedPct}%</div>
                <div class="kw-card-label">Geclassificeerd naar domein</div>
            </div>
            <div class="kw-card">
                <div class="kw-card-value">${linkedPct}%</div>
                <div class="kw-card-label">Met bronlink naar OB</div>
            </div>
            <div class="kw-card">
                <div class="kw-card-value">${formatDatumKort(newest)}</div>
                <div class="kw-card-label">Nieuwste publicatie</div>
            </div>
        </div>

        <div class="kw-tables">
            <div class="kw-table-wrap">
                <h4>Per jaar</h4>
                <table class="kw-table">
                    <thead><tr><th>Jaar</th><th>Aantal</th></tr></thead>
                    <tbody>${yearRows}</tbody>
                    <tfoot><tr><td><strong>Totaal</strong></td><td class="kw-num"><strong>${total.toLocaleString('nl-NL')}</strong></td></tr></tfoot>
                </table>
            </div>
            <div class="kw-table-wrap">
                <h4>Per domein</h4>
                <table class="kw-table">
                    <thead><tr><th>Domein</th><th>Aantal</th><th>%</th></tr></thead>
                    <tbody>${domeinRows}</tbody>
                </table>
            </div>
            <div class="kw-table-wrap">
                <h4>Top publicatietypen</h4>
                <table class="kw-table">
                    <thead><tr><th>Type</th><th>Aantal</th></tr></thead>
                    <tbody>${typeRows}</tbody>
                </table>
            </div>
        </div>

        ${coalitieSecties > 0 ? `
        <div class="kw-coalitie-dekking">
            <h4>Coalitieakkoord-dekking</h4>
            <p>Van de <strong>${coalitieSecties}</strong> beleidsthema's in het coalitieakkoord hebben
            <strong>${coalitieMetBesluiten}</strong> ten minste één publicatie in Besluit-Wijzer.</p>
        </div>` : ''}

        <div class="kw-methode">
            <h4>Methodologie</h4>
            <p>Besluit-Wijzer verzamelt publicaties uit het <strong>Gemeenteblad</strong> via de SRU-API van
            <a href="https://repository.overheid.nl" target="_blank" rel="noopener">repository.overheid.nl</a>.
            Elke publicatie wordt automatisch geclassificeerd naar beleidsdomein op basis van type en trefwoorden in de titel.
            Alle data is openbaar en vrij beschikbaar. Elke publicatie bevat een directe link naar het origineel op
            <a href="https://zoek.officielebekendmakingen.nl" target="_blank" rel="noopener">zoek.officielebekendmakingen.nl</a>.</p>
            <p>Periode: <strong>${oldest}</strong> t/m <strong>${newest}</strong>
            · Laatst bijgewerkt: <strong>maart 2026</strong></p>
        </div>
    `;
}

// ─── Event listeners ───

const KWALITEIT_OPEN_KEY = 'beleidswijzer_kwaliteit_open';

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderKwaliteit();

    // Kwaliteit & Verantwoording: standaard ingeklapt, voorkeur onthouden
    const kwaliteitDetails = document.getElementById('kwaliteitDetails');
    if (kwaliteitDetails) {
        const opgeslagen = localStorage.getItem(KWALITEIT_OPEN_KEY);
        kwaliteitDetails.open = opgeslagen === 'true';
        kwaliteitDetails.addEventListener('toggle', () => {
            localStorage.setItem(KWALITEIT_OPEN_KEY, kwaliteitDetails.open);
        });
    }

    // Uitklap-knoppen (via event delegation op beide lijsten)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-uitklappen');
        if (!btn) return;
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const el = document.getElementById(id);
        if (!el) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        el.hidden = expanded;
        btn.setAttribute('aria-expanded', !expanded);
        btn.textContent = expanded ? 'Toon volledige tekst' : 'Verberg tekst';
    });

    // Bronverwijzingen in briefing → klikbaar naar besluit
    document.addEventListener('click', (e) => {
        const ref = e.target.closest('.ref');
        if (!ref) return;
        navigateToDecision(ref.textContent);
    });

    // Terug naar overzicht
    document.getElementById('dossierTerug').addEventListener('click', sluitDossier);

    // Zoeken
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('zoekSluiten').addEventListener('click', sluitZoekresultaten);

    // Filters binnen dossier
    document.getElementById('yearFilter').addEventListener('change', applyDossierFilters);
    document.getElementById('typeFilter').addEventListener('change', applyDossierFilters);
    if (document.getElementById('niveauFilter')) {
        document.getElementById('niveauFilter').addEventListener('change', applyDossierFilters);
    }
    document.getElementById('sortBy').addEventListener('change', (e) => {
        sortDecisions(e.target.value);
        displayDecisions('resultsList', 'resultsCount', 'noResults');
    });
    document.getElementById('clearFilters').addEventListener('click', () => {
        resetFilters();
        if (activeDossier) applyDossierFilters();
    });

    // Filters binnen zoekresultaten
    document.getElementById('zoekYearFilter').addEventListener('change', applyZoekFilters);
    document.getElementById('zoekTypeFilter').addEventListener('change', applyZoekFilters);
    document.getElementById('zoekSortBy').addEventListener('change', applyZoekFilters);
    document.getElementById('zoekClearFilters').addEventListener('click', () => {
        document.getElementById('zoekYearFilter').value = '';
        document.getElementById('zoekTypeFilter').value = '';
        document.getElementById('zoekSortBy').value = 'datum-desc';
        applyZoekFilters();
    });

    // Nav-links in groene balk — hash + click voor betrouwbare navigatie
    function navFromHash() {
        const hash = (location.hash || '').replace(/^#/, '');
        if (hash === 'overdrachtsdossier') showView('overdrachtsdossier');
        else if (hash === 'compliance') showView('compliance');
        else showView('overzicht');
        const target = document.getElementById(hash || 'dossierOverzicht');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window.addEventListener('hashchange', navFromHash);

    const siteNav = document.querySelector('.site-nav-inner');
    if (siteNav) {
        siteNav.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            e.preventDefault();
            const hash = (link.getAttribute('href') || '').replace(/^#/, '');
            location.hash = hash || 'dossierOverzicht';
        });
    }

    // Init: sync view met hash bij laden (redirect #overdrachtsdossier naar aparte pagina)
    if (location.hash === '#overdrachtsdossier') {
        location.replace('overdrachtsdossier.html');
    } else {
        navFromHash();
    }
    // Verborgen begroting-toggle (dubbel-klik op versienummer)
    const versieBadge = document.getElementById('appVersion');
    if (versieBadge) {
        versieBadge.addEventListener('dblclick', () => {
            document.body.classList.toggle('toon-begroting');
            const voetnoot = document.querySelector('.begroting-voetnoot');
            if (voetnoot) voetnoot.hidden = !document.body.classList.contains('toon-begroting');
        });
    }

    // Verborgen versiemenu (long-press op versienummer)
    initVersieMenu();
});
