// BeleidsBibliotheek Wassenaar v8.0 — april 2026

// ─── Versiebeheer ───

/** Eerste semver-token uit badgetekst, e.g. "7.0.0 (maart 2026)" → "7.0.0" */
function versieNummerUitBadge(txt) {
    const m = (txt || '').trim().match(/^([\d.]+)/);
    return m ? m[1] : (txt || '').trim();
}

const VERSIE_MENU = [
    { versie: '8.0.0', naam: 'BeleidsBibliotheek', beschrijving: 'April 2026 — werklijst sociaal domein verwerkt, alle links geverifieerd', url: 'index.html' },
    { versie: '6.0-lab', naam: 'Publish-after-approval', beschrijving: 'Experimenteel: briefings pas zichtbaar na goedkeuring', url: 'index_v6_verificatie.html' },
    { versie: '5.1.0', naam: 'Dossier-first (archief)', beschrijving: 'Oudere modulaire build', url: 'index_v4_modulair.html' },
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
        const actief = v.versie === versieNummerUitBadge(huidigeVersie);
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
                <span class="versie-panel-titel">BeleidsBibliotheek — versies</span>
                <button type="button" class="versie-sluit" aria-label="Sluiten">&times;</button>
            </div>
            <div class="versie-lijst">${items}</div>
            <p class="versie-hint">Tip: lang indrukken op het versienummer toont oudere builds; dubbelklik voor begrotingsweergave</p>
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

// OD-samenvattingen per BBV-hoofdstuk (Overdrachtsdossier raadsverkiezingen 2026)
const OD_SAMENVATTING_PER_BBV = {
    0: {
        bron: 'Bron: OD hoofdstukken 2, 3, 4 — De staat van de gemeentelijke organisatie; De financiële positie; Regionale samenwerkingen.',
        html: `<p>De gemeentelijke organisatie telt circa 300 medewerkers en kent een open, collegiale cultuur. Circa 80% van het werk bestaat uit wettelijke taken; de ruimte voor extra politieke ambities is beperkt. Het Klant Contact Centrum (KCC) is het eerste aanspreekpunt; bij sociale vragen wordt direct doorverbonden naar het Sociaal Team Wassenaar.</p>
<p>De financiële positie is stabiel voor 2026, maar vanaf 2028 zijn keuzes nodig om de begroting structureel sluitend te houden. Wassenaar gaat vanaf 2026 lenen voor investeringen (o.a. De Paauw, onderwijshuisvesting). De inkomsten uit het gemeentefonds zijn onzeker door het regeerakkoord en het verschoven ravijnjaar.</p>`
    },
    1: {
        bron: 'Bron: OD hoofdstuk 5 — Veiligheid en leefbaarheid.',
        html: `<p>Wassenaar is een relatief veilige gemeente. Het Integraal Veiligheidsbeleid 2024–2027 beschrijft de aanpak. Vermogensdelicten vormen het grootste deel van de criminaliteit. De Lokale Kamer Zorg en Veiligheid verbindt politie, woningcorporaties, GGD en Sociaal Team bij complexe casussen.</p>
<p>Toezicht en handhaving onder de Omgevingswet vragen om scherpe prioriteiten bij beperkte capaciteit. De openbare ruimte (3,2 km²) wordt beheerd op niveau B. Afvalverwerking loopt via Avalex; Wassenaar werkt aan reductie van restafval (servicedifferentiatie per 2027, verkennen diftar 2028).</p>
<p>Opgaven: maatschappelijke weerbaarheid, ondermijning, digitale dreigingen, femicide en geweld achter de voordeur. Wijkgericht werken en de BuitenBeter-app ondersteunen signalering en onderhoud.</p>`
    },
    2: {
        bron: 'Bron: OD hoofdstukken 5, 6 — Veiligheid en leefbaarheid; Wonen en fysieke leefomgeving (mobiliteit).',
        html: `<p>Het Wegencategoriseringsplan (dec 2025) vormt het uitgangspunt voor een veilige en bereikbare inrichting van het wegennet. Na het Burgerberaad Verkeer is het plan aangescherpt. Het aantal (fiets-)verkeersongevallen is relatief hoog door drukke regionale wegen.</p>
<p>Wassenaar maakt deel uit van de MRDH voor openbaar vervoer. Vier buslijnen, uitgevoerd door EBS en Qbuzz; halteknooppunt Van Oldenbarneveltweg. Bij de MRDH is aandacht gevraagd voor station Voorschoten en verbindingen.</p>
<p>Opgaven: N44, Rozenplein, verkeersdruk door Valkenhorst en Maaldrift. Actualisatie parkeerbeleid nodig. Netcongestie kan ontwikkeling vertragen.</p>`
    },
    3: {
        bron: 'Bron: OD hoofdstuk 8 — Economie, recreatie en toerisme.',
        html: `<p>Wassenaar heeft een gevarieerde lokale economie: recreatie, toerisme, detailhandel, horeca. De Economische Visie en strandvisie De Wassenaarse Slag zijn vastgesteld. De dorpskern is heringericht (dec 2025). Duinrell en De Wassenaarse Slag zijn belangrijke pijlers.</p>
<p>De BIZ Maaldrift en centrum-BIZ ondersteunen ondernemers. Werkloosheid is laag (1,3%); het aandeel zelfstandigen is groot. Netcongestie beperkt bedrijven in groei en verduurzaming.</p>
<p>Opgaven: vergrijzing verandert vraag naar voorzieningen; woningkrapte beperkt instroom jonge werkenden; Maaldrift: balans Defensie–mkb, verkeersdruk. Recreatie: spreiding bezoekers, bescherming natuur, duurzame kustinrichting.</p>`
    },
    4: {
        bron: 'Bron: OD hoofdstuk 9 — Sport, cultuur en onderwijs.',
        html: `<p>Wassenaar heeft acht basisscholen, twee middelbare scholen en twee internationale scholen. Het herijkte Integraal Huisvestingsplan (IHP) onderwijs 2024–2039 vormt het kader voor capaciteit en huisvesting. Rond de Lokale Educatieve Agenda (LEA) werken gemeente, scholen en partners samen; de LEA staat niet als apart document in deze bibliotheek. Scholen spelen een grotere rol in vroegsignalering; samenwerking met STW en jeugdhulp is essentieel.</p>
<p>Een groeiende groep anderstalige kinderen stroomt in (expats, Oekraïners, statushouders). Taalondersteuning en ITK/ISK in Leiden zijn nodig. Leerplicht en Doorstroompunt worden uitgevoerd door Leidschendam-Voorburg.</p>
<p>Opgaven: groeiend aantal leerlingen, late instroom, capaciteitsplanning. Renovaties Kievietschool, Adelbert College, SKOW-fusieschool gepland. Relatief verzuim stijgt; preventie via De Overstap.</p>`
    },
    5: {
        bron: 'Bron: OD hoofdstukken 8, 9 — Economie, recreatie en toerisme; Sport, cultuur en onderwijs.',
        html: `<p>De Sportvisie 2025 is vastgesteld met vier pijlers: sportaanbieders, deelname, beweegvriendelijke omgeving, toekomstbestendige accommodaties. Fit in Wassenaar en buurtsportcoaches dragen bij aan het GALA. Scouting De Paauw en Van Woesikgroep ontvangen jeugdledensubsidie.</p>
<p>Cultuur: De Warenar wordt gerenoveerd en verduurzaamd (start 2026). Museum Voorlinden, kunstcollectie en theater vormen het culturele profiel. Cultuur met Kwaliteit (CmK4) verankert cultuureducatie. De bibliotheekzorgplicht is van kracht.</p>
<p>Opgaven: dalende ledenaantallen, vergrijzing vrijwilligers, energielasten; renovatie sport- en scoutingaccommodaties. Cultuur: actualisatie beleid, toegankelijkheid, Warenar als cultureel centrum. GALA-middelen vervallen 2027; AZWA volgt.</p>`
    },
    7: {
        bron: 'Bron: OD hoofdstukken 5, 6 — Veiligheid (afval); Wonen (energietransitie, milieu).',
        html: `<p>Afvalverwerking loopt via GR Avalex en HVC. Wassenaar hanteert een hoog serviceniveau; restafval is hoger dan gemiddeld. Servicedifferentiatie per 2027, verkennen diftar 2028. CO₂-maatregelen maken verbranding duurder; betere scheiding dempt de afvalstoffenheffing.</p>
<p>De energietransitie: Warmteprogramma in 2026, participatie start. Netcongestie speelt een grote rol. Klimaatadaptatie: stresstest 2024, DPRA-werkregio. Waterkwaliteit voldoet nog niet aan KRW 2027; samenwerking met Hoogheemraadschap en Dunea.</p>
<p>Natura 2000 en stikstof: verkenning Schoon en Emissieloos Bouwen. Milieuzonering, geur en trilling krijgen een plek in het Omgevingsplan. ODH ondersteunt met advies.</p>`
    },
    8: {
        bron: 'Bron: OD hoofdstukken 6, 10 — Wonen en fysieke leefomgeving; Projecten.',
        html: `<p>De woningmarkt is uit evenwicht. Nota Woonbeleid 2025: twee derde betaalbaar bij nieuwbouw. Woningbouwopgave RRA: 991 woningen tot 2030. Lokale Woonzorgvisie 2026 vastgesteld. Woonwagenstandplaatsen: uitbreiding Lagerweide en Ruigelaan, Huisvestingsverordening aangepast (dec 2025).</p>
<p>Omgevingsvisie: participatie 2026, vaststelling 2027. Omgevingsplan uiterlijk 2032. Projecten: ANWB-locatie, Kerkehout, gemeentewerf, Duindigt, De Paauw, SKOW-fusieschool, De Warenar, Programma Noordrand.</p>
<p>Opgaven: periode zonder actueel beleidskader (jan–apr 2027); doorstroming woningmarkt; Warmteprogramma; netcongestie; klimaatadaptatie. Integrale keuzes nodig voor wonen, energie, natuur en leefomgeving.</p>
`
    },
    6: {
        bron: 'Bron: OD hoofdstuk 7 — Sociaal Domein en asielopvang (papier aan raadsleden). Mapping: OD hoofdstuk 7 = BBV 6 (Sociaal domein).',
        html: (ibabs) => `<p>Het sociaal domein draait om drie wetten: de <strong>Wmo</strong>, de <strong>Jeugdwet</strong> en de <strong>Participatiewet</strong>. Voor Wmo en Jeugdwet is het Sociaal Team Wassenaar (STW) de toegangspoort. De gemeente richt zich op preventie: versterken van de sociale basis, toegankelijke informatie en passende ondersteuning. Verordeningen zijn vernieuwd.</p>
<p>De uitdagingen zijn groot: meer regie en samenwerking binnen een complexer zorglandschap. De kosten gaan vaak voor de baten uit. Samenwerking met huisartsen, scholen, zorgaanbieders en vrijwilligers is onmisbaar.</p>
<p>Investeren in de voorkant is noodzakelijk — vroeg hulp voorkomt later dure specialistische zorg. Dit vraagt om duidelijke keuzes. Zonder keuzes lopen de kosten verder op.</p>
<figure class="overdracht-figuur">
<img src="assets/beleidsmatig-overzicht-sociaal-domein.png" alt="Beleidsmatig overzicht Sociaal Domein: Beleidsplan, beleidsnota's en uitvoeringsprogramma's met aangrenzende beleidsterreinen" class="overdracht-infographic">
</figure>
`
    }
};

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

// Sub-taakvelden per hoofdstuk — verrijkte versie uit taakvelden_iv3.js
// Bevat: omschrijving (IV3), niet (afbakening), keywords (trefwoorden-index)
const BBV_TAAKVELDEN_PER_HOOFDSTUK = (typeof BBV_TAAKVELDEN_IV3 !== 'undefined') ? BBV_TAAKVELDEN_IV3 : {
    0: [
        { code: '0.1', naam: 'Bestuur', omschrijving: 'Democratisch bestuur en ambtelijke ondersteuning: college, raad, griffie, burgemeester, democratie.' },
        { code: '0.2', naam: 'Burgerzaken', omschrijving: 'Dienstverlening aan burgers: burgerlijke stand, reisdocumenten, basisregistratie (BRP-keten).' },
        { code: '0.3', naam: 'Beheer overige gebouwen en gronden', omschrijving: 'Beheer en onderhoud van gemeentelijke panden en gronden (niet onderwijs- of woningbouw).' },
        { code: '0.4', naam: 'Overhead', omschrijving: 'Interne bedrijfsvoering: stafdiensten, ICT, huisvesting ambtelijk apparaat, algemene bedrijfskosten.' },
        { code: '0.5', naam: 'Treasury', omschrijving: 'Liquiditeitsbeheer, kasstromen, leningen en beleggingen (treasuryfunctie).' },
        { code: '0.61', naam: 'OZB woningen', omschrijving: 'Onroerendezaakbelasting op woningen.' },
        { code: '0.62', naam: 'OZB niet-woningen', omschrijving: 'OZB op niet-woningen (bedrijven, instellingen).' },
        { code: '0.63', naam: 'Parkeerbelasting', omschrijving: 'Parkeer- en stilstaanbelasting.' },
        { code: '0.64', naam: 'Belastingen overig', omschrijving: 'Overige heffingen en retributies (niet OZB of parkeerbelasting), bv. precario, leges, toeristenbelasting.' },
        { code: '0.7', naam: 'Algemene uitkering en overige uitkeringen gemeentefonds', omschrijving: 'Middelen uit het gemeentefonds: algemene uitkering en overige uitkeringen.' },
        { code: '0.8', naam: 'Overige baten en lasten', omschrijving: 'Baten en lasten die niet onder een ander taakveld vallen.' },
        { code: '0.9', naam: 'Vennootschapsbelasting (VpB)', omschrijving: 'VpB over gemeentelijke rechtspersonen (bv. nv, bv).' },
        { code: '0.10', naam: 'Mutaties reserves', omschrijving: 'Toevoegingen aan en onttrekkingen uit reserves en voorzieningen.' },
        { code: '0.11', naam: 'Resultaat van de rekening van baten en lasten', omschrijving: 'Saldo op de rekening van baten en lasten (tekort/overschot).' },
    ],
    1: [
        { code: '1.1', naam: 'Crisisbeheersing en brandweer', omschrijving: 'Brandweer, crisisbeheersing, rampenbestrijding (incl. VRH-samenwerking).' },
        { code: '1.2', naam: 'Openbare orde en veiligheid', omschrijving: 'Openbare orde, handhaving, integrale veiligheid (niet brandweer).' },
    ],
    2: [
        { code: '2.1', naam: 'Verkeer en vervoer', omschrijving: 'Wegen, verkeersveiligheid, verkeersmaatregelen (excl. openbaar vervoer).' },
        { code: '2.2', naam: 'Parkeren', omschrijving: 'Parkeerbeleid en parkeervoorzieningen (niet de parkeerbelasting zelf — die zit onder 0.63).' },
        { code: '2.3', naam: 'Recreatieve havens', omschrijving: 'Havens en aanleg met vooral recreatieve functie.' },
        { code: '2.4', naam: 'Economische havens en waterwegen', omschrijving: 'Bedrijfshavens en economisch gebruik van waterwegen.' },
        { code: '2.5', naam: 'Openbaar vervoer', omschrijving: 'OV-concessies en gemeentelijke bijdragen aan openbaar vervoer.' },
    ],
    3: [
        { code: '3.1', naam: 'Economische ontwikkeling', omschrijving: 'Werkgelegenheid, bedrijventerreinen, bedrijfsvestiging en economische structuur.' },
        { code: '3.2', naam: 'Fysieke bedrijfsinfrastructuur', omschrijving: 'Kabels, leidingen, bedrijventerreinen en fysieke bedrijfsvoorzieningen.' },
        { code: '3.3', naam: 'Bedrijvenloket en bedrijfsregelingen', omschrijving: 'Vergunningen, ondernemersloket en regelingen voor bedrijven.' },
        { code: '3.4', naam: 'Economische promotie', omschrijving: 'Promotie, toerisme, winkel- en centrumbeleid, acquisitie.' },
    ],
    4: [
        { code: '4.1', naam: 'Openbaar basisonderwijs', omschrijving: 'Primair onderwijs en gemeentelijke rol in openbaar onderwijs.' },
        { code: '4.2', naam: 'Onderwijshuisvesting', omschrijving: 'Gebouwen en huisvesting voor onderwijs en peuteropvang (incl. investeringen).' },
        { code: '4.3', naam: 'Onderwijsbeleid en leerlingzaken', omschrijving: 'Leerplicht, leerlingenvervoer, onderwijsbeleid en leerlingondersteuning.' },
    ],
    5: [
        { code: '5.1', naam: 'Sportbeleid en activering', omschrijving: 'Sportbeleid, subsidies en programma\'s (niet de accommodaties zelf).' },
        { code: '5.2', naam: 'Sportaccommodaties', omschrijving: 'Sporthallen, velden, zwembaden en overige sportaccommodaties.' },
        { code: '5.3', naam: 'Cultuurpresentatie, cultuurproductie en cultuurparticipatie', omschrijving: 'Podia, cultuurprogramma\'s en cultuurparticipatie (niet musea).' },
        { code: '5.4', naam: 'Musea', omschrijving: 'Musea, collecties en tentoonstellingen.' },
        { code: '5.5', naam: 'Cultureel erfgoed', omschrijving: 'Monumenten, archeologie en beheer van cultureel erfgoed.' },
        { code: '5.6', naam: 'Media', omschrijving: 'Lokale publieke omroep en media-informatievoorziening.' },
        { code: '5.7', naam: 'Openbaar groen en (openlucht) recreatie', omschrijving: 'Parken, plantsoenen, bos en openluchtrecreatie.' },
    ],
    6: [
        { code: '6.1', naam: 'Samenkracht en burgerparticipatie', omschrijving: 'Participatie, wijkinitiatieven en sociale samenhang (Iv3: samenkracht).' },
        { code: '6.2', naam: 'Toegang eerste lijns', omschrijving: 'Cluster Iv3 6.21–6.23: toegang en eerstelijnsvoorzieningen Wmo, jeugd en integraal.' },
        { code: '6.3 - 6.5', naam: 'Werk en inkomen', omschrijving: 'Cluster: inkomensregelingen, WSW, beschut werk en arbeidsparticipatie (6.3 t/m 6.5).' },
        { code: '6.60 - 6.91', naam: 'WMO', omschrijving: 'Cluster: maatwerkarrangementen, hulp, beschermd wonen en coördinatie Wmo (Iv3-codes 6.60 e.v.).' },
        { code: '6.7 - 6.9', naam: 'Jeugd', omschrijving: 'Cluster: jeugdhulp, jeugdbescherming, jeugdreclassering en coördinatie jeugd (Iv3 6.7x e.v.).' },
    ],
    7: [
        { code: '7.1', naam: 'Volksgezondheid', omschrijving: 'GGD, publieke gezondheid, infectieziektebestrijding en gezondheidsbeleid.' },
        { code: '7.2', naam: 'Riolering', omschrijving: 'Rioolwaterzuivering, rioolbeheer en waterketen (riolering).' },
        { code: '7.3', naam: 'Afval', omschrijving: 'Inzameling, verwerking en beleid rond afvalstoffen.' },
        { code: '7.4', naam: 'Milieubeheer', omschrijving: 'Milieubeleid, bodem, geluid, lucht en milieuvergunningen (niet afval/riool).' },
        { code: '7.5', naam: 'Begraafplaatsen en crematoria', omschrijving: 'Begraafplaatsen, crematorium en uitvaartvoorzieningen.' },
    ],
    8: [
        { code: '8.1', naam: 'Ruimte en leefomgeving', omschrijving: 'Ruimtelijke ordening, bestemmingsplannen, leefomgeving en fysieke kwaliteit.' },
        { code: '8.2', naam: 'Grondexploitatie (niet-bedrijventerreinen)', omschrijving: 'Grondposities en exploitatie voor woningbouw en niet-bedrijventerreinen.' },
        { code: '8.3', naam: 'Wonen en bouwen', omschrijving: 'Woningbouw, volkshuisvesting en stedelijke vernieuwing.' },
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

const BBV_HOOFDSTUK_META = {
    0: {
        kleur: { accent: '#1e3a5f', light: '#e8eef5', lighter: '#f4f7fb' },
        icoon: '<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><rect x="9" y="13" width="6" height="8"/><path d="M9 9h2v2H9zM13 9h2v2h-2z"/></svg>',
        ondertitel: 'Gemeentebestuur, burgerzaken, financiën, belastingen en overhead',
    },
    1: {
        kleur: { accent: '#b71c1c', light: '#fce4e4', lighter: '#fef0f0' },
        icoon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
        ondertitel: 'Openbare orde, brandweer en crisisbeheersing',
        intro: 'Veiligheid bij een gemeente gaat over alles wat nodig is om inwoners te beschermen tegen criminaliteit, overlast, brand, ongevallen en andere risico\u2019s. De gemeente heeft hierbij de regierol: zij bepaalt lokale prioriteiten en werkt samen met partners zoals politie en hulpdiensten om een veilige leefomgeving te cre\u00ebren.\n\nDe Veiligheidsregio komt in beeld wanneer risico\u2019s groter worden of meerdere gemeenten raken. Zij zorgt onder meer voor de brandweer, bereidt zich voor op rampen en crises, maakt gezamenlijke afspraken tussen hulpdiensten en co\u00f6rdineert de aanpak tijdens een incident.\n\nOnderdeel van de Veiligheidsregio is de GHOR (Geneeskundige Hulpverleningsorganisatie in de Regio), die ervoor zorgt dat alle medische hulp \u2014 zoals ambulancezorg, ziekenhuizen en GGD \u2014 goed op elkaar is afgestemd bij rampen of grote ongevallen. Zo kunnen hulpdiensten 24/7 samenwerken om schade te beperken en snel terug te keren naar een normale situatie.',
    },
    2: {
        kleur: { accent: '#00695c', light: '#e0f2f1', lighter: '#f1f9f8' },
        icoon: '<svg viewBox="0 0 24 24"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h2M15 17h2M9 17h6M4 12h16M7 12V8l5-3 5 3v4"/></svg>',
        ondertitel: 'Wegen, verkeer, parkeren en openbaar vervoer',
    },
    3: {
        kleur: { accent: '#6a1b9a', light: '#f3e5f5', lighter: '#faf2fc' },
        icoon: '<svg viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
        ondertitel: 'Economische ontwikkeling, promotie en bedrijventerreinen',
    },
    4: {
        kleur: { accent: '#e65100', light: '#fff3e0', lighter: '#fff8ee' },
        icoon: '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
        ondertitel: 'Basisonderwijs, huisvesting en leerlingenbeleid',
    },
    5: {
        kleur: { accent: '#2e7d32', light: '#e8f5e9', lighter: '#f1f8f2' },
        icoon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M12 13v8M8 18h8"/><path d="M7.5 5.5l-2-2M16.5 5.5l2-2"/></svg>',
        ondertitel: 'Sport, cultuur, erfgoed en recreatie',
    },
    6: {
        kleur: { accent: '#ad1457', light: '#fce4ec', lighter: '#fef0f4' },
        icoon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
        ondertitel: 'Wmo, jeugdhulp, participatie en schuldhulpverlening',
    },
    7: {
        kleur: { accent: '#33691e', light: '#f1f8e9', lighter: '#f8fbf3' },
        icoon: '<svg viewBox="0 0 24 24"><path d="M12 22c-4 0-8-2-8-6 0-3 2-5 4-6s4-4 4-8c0 4 2 7 4 8s4 3 4 6c0 4-4 6-8 6z"/><path d="M12 22v-7"/></svg>',
        ondertitel: 'GGD, riolering, afval en milieubeheer',
    },
    8: {
        kleur: { accent: '#283593', light: '#e8eaf6', lighter: '#f1f2fa' },
        icoon: '<svg viewBox="0 0 24 24"><path d="M3 21h18M4 21V10l8-7 8 7v11"/><rect x="9" y="14" width="6" height="7"/><rect x="10" y="8" width="4" height="3" rx="0.5"/></svg>',
        ondertitel: 'Woningbouw, ruimtelijke ordening en stedelijke vernieuwing',
    },
};

// Beleidssamenvatting per thema (binnen portefeuille) — Cultuur & Welzijn, Bestuur & Veiligheid, etc.
const SAMENVATTING_PER_THEMA = {
    'Cultuur & Welzijn': [
        { thema: 'De Warenar', samenvatting: 'Cultuurhuis blijft eigendom gemeente. Raad koos sept 2025 voor voorkeursvariant 2: herbestemming, renovatie en verduurzaming (€5 mln). Investering pas na geregelde erfpacht. Ambitie: cultuurhuis + buurtfunctie + museum.' },
        { thema: 'Erfgoed & Welstand', samenvatting: 'Eerste technische aanpassing Erfgoedverordening 2016 (2023). Commissie Welstand en Cultureel Erfgoed (WCE). Klankbordgroep Erfgoed. Coalitie: erfgoed behouden, verduurzaming faciliteren.' },
        { thema: 'GGD & Volksgezondheid', samenvatting: 'GR GGD en Veilig Thuis Haaglanden. Zienswijzen op begrotingen en wijzigingen. Evaluatie GR uitgesteld (zienswijze raad apr 2025). Regiovisie Aanpak Huiselijk Geweld 2026+ vastgesteld dec 2025.' },
        { thema: 'Welzijn & Buurtwerk', samenvatting: 'Overeenkomst Gro-Up Buurtwerk (apr 2024) voor welzijnsactiviteiten in wijken. Subsidies preventief veld. IPS-trajecten. Gezond en Actief Leven Akkoord (GALA).' },
    ],
    'Bestuur & Veiligheid': [
        { thema: 'Subsidiebeleid', samenvatting: 'Jaarlijkse vaststelling subsidieplafonds. 2025: Economie €35.960, SAD €478.969, Volksgezondheid €34.228. Subsidieregeling structurele activiteiten (2024). Coalitie onderzoekt subsidies, fondsen en cofinanciering.' },
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
        { thema: 'Onderwijs & Huisvesting', samenvatting: 'Herijking IHP onderwijs 2024-2039 (apr 2025). Verordening leerlingenvervoer 2025. Onderwijshuisvesting en investeringen volgen uit het IHP (o.a. fusieschool, renovaties). Den Deylschool herontwikkeling. SchoolAdviesDienst, American School, peuteropvang.' },
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
        { naam: 'Erfgoed & Welstand', keywords: ['erfgoed', 'welstand', 'monument', 'cultureel erfgoed', 'wce', 'klankbordgroep erfgoed'] },
        { naam: 'GGD & Volksgezondheid', keywords: ['gezondheid', 'volksgezondheid', 'ggd', 'preventie', 'veilig thuis', 'haaglanden'] },
        { naam: 'Welzijn & Buurtwerk', keywords: ['welzijn', 'buurtwerk', 'buurt', 'gro-up', 'preventief veld', 'ips-traject'] },
    ],
    'Bestuur & Veiligheid': [
        { naam: 'Subsidiebeleid', keywords: ['subsidie', 'plafond', 'subsidieplafond', 'subsidieregeling', 'subsidieaanvraag'] },
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
    '0.1': [
        { naam: 'Verordening rechtspositie raads- en commissieleden Wassenaar 2019', datum: '2019-12-17', link: 'https://lokaleregelgeving.overheid.nl/CVDR633659/1', type: 'Verordening' },
        { naam: 'Klachtenverordening', datum: '2020-11-24', link: 'https://lokaleregelgeving.overheid.nl/CVDR647579', type: 'Verordening' },
        { naam: 'Verordening op de Vertrouwenscommissie Wassenaar 2019', datum: '2022-07-05', link: 'https://lokaleregelgeving.overheid.nl/CVDR621121/2', type: 'Verordening' },
        { naam: 'Verordening Werkgeverscommissie gemeenteraad Wassenaar', datum: '2024-04-23', link: 'https://lokaleregelgeving.overheid.nl/CVDR609406/4', type: 'Verordening' },
        { naam: 'Verordening op het onderzoeksrecht van de raad', datum: '2024-04-23', link: 'https://lokaleregelgeving.overheid.nl/CVDR100592/2', type: 'Verordening' },
        { naam: 'Gemeenschappelijke Regeling Rekenkamer', datum: '2024-03-26', link: 'https://lokaleregelgeving.overheid.nl/CVDR720420', type: 'GR' },
        { naam: 'Verbetervoorstel op basis van het rapport \'Onderzoek sociale veiligheid en bestuurscultuur gemeente Wassenaar\'', datum: '2023-06-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/03ed8088-4b3d-4027-977f-47034cc27773?documentId=971488eb-ae01-4653-ad19-27a4ab170002&agendaItemId=f612554c-daa6-4b2a-a1f2-f84123a8fcca', type: 'Besluit' },
        { naam: 'Pilot spreektijden raadsvergaderingen', datum: '2024-07-02', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/2064a8ae-eaaa-4422-959d-d778da893d99?documentId=3af15634-5d11-4316-8f14-ebf4c2c20f2a&agendaItemId=6de3e447-c468-4411-ae1f-66893e67432c', type: 'Besluit' },
        { naam: 'Verlengen bestaande contract met de huidige accountant voor de verslagjaren 2026 en 2027', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=5bded780-06ba-4256-872c-5a23dbcd8be1&agendaItemId=31fb53d1-0cad-418f-aa26-5aa73e835800', type: 'Besluit' },
        { naam: 'Verordening onderzoeken doelmatigheid en doeltreffendheid van het gevoerde bestuur in de gemeente Wassenaar 2023', datum: '2023-05-09', link: 'https://lokaleregelgeving.overheid.nl/CVDR696191', type: 'Verordening' },
        { naam: 'Controleverordening gemeente Wassenaar 2023', datum: '2023-05-09', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/b2acfe9b-2f9f-4ac1-a57f-0b6eb78a6f6d?documentId=e383026a-3569-46c9-8bb4-1419472af03b&agendaItemId=c15a196c-960b-4df2-9764-34588594cf57', type: 'Verordening' }
    ],
    '0.2': [
        { naam: 'Dienstverleningsmodel gemeente Wassenaar', datum: '2024-12-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Reports/Document/d90c795e-273f-4c2a-9ccf-02693592592c?documentId=160b2774-4771-4018-b96e-734ef8b6d5ae', type: 'Nota' },
        { naam: 'Aanwijzen gemeentehuizen (huwelijk en geregistreerd partnerschap) Wassenaar', datum: '2023-06-06', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/527bdef9-3294-4a18-8344-1ec9b174b267?documentId=5ee5be18-604b-4254-8d20-fcbd7a87a291&agendaItemId=1de51a09-35da-4e51-b66b-c3c904fe0cb1', type: 'Besluit' }
    ],
    '0.3': [
        { naam: 'Scenario\'s ontwikkeling locatie Gemeentewerf/-kantoor.', datum: '2021-10-12', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/ce0a8157-c4ef-480a-ad55-8e29331fadda', type: 'Beleidsnota' },
        { naam: 'Vestiging Wet voorkeursrecht gemeenten Maaldrift/Oude Trambaan', datum: '2023-09-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8b213f81-c9f8-4870-865e-cdd42cf0b09a?documentId=17ce4eaa-fe4b-4e0a-86be-ee0b9b400f47&agendaItemId=2b4862f9-0a84-4abe-8668-a55045c880b4', type: 'Besluit' },
        { naam: 'Ontwerpkeuzes voor de renovatie en restauratie van De Paauw', datum: '2025-09-23', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=7ce67756-9dea-4c1b-9390-68df6d169b35&agendaItemId=48351a64-8b4e-4c43-9c3f-9d6a024abb8a', type: 'Besluit' },
        { naam: 'Haalbaarheidsonderzoek herbestemming de Warenar', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=4be4fe40-6256-40a5-856f-2b01bd390144&agendaItemId=2f3a6985-9cfd-4175-aa07-03a3456f139c', type: 'Besluit' }
    ],
    '0.4': [
        { naam: 'Algemene Subsidieverordening (ASV) gemeente Wassenaar 2025', datum: '2024-11-26', link: 'https://lokaleregelgeving.overheid.nl/CVDR728295/1', type: 'Verordening' },
        { naam: 'Subsidiebeleid gemeente Wassenaar 2025', datum: '2024-11-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/00ff4460-6476-48f8-b312-e8c4505247a7?documentId=d15c497c-0504-468b-a5c1-2f914af08801&agendaItemId=87e9e940-6bcc-48e7-9c58-40f9e8eba921', type: 'Beleidsnota', toelichting: 'Raad 26 nov 2024; subsidiebeleid en ASV gezamenlijk vastgesteld.' },
        { naam: 'Nota reserves en voorzieningen 2025', datum: '2024-06-04', link: 'https://lokaleregelgeving.overheid.nl/CVDR751585/1', type: 'Nota' },
        { naam: 'Nota waardering en afschrijving vaste activa', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=e1d16acb-cf6e-4c20-9c4f-63cf94d45b0b&agendaItemId=94a299db-4d50-46a0-b571-8e25b4b47176', type: 'Nota' },
        { naam: 'RKC onderzoeksrapport informatiebeveiliging', datum: '2021-09-21', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/280573e8-fc6e-4084-915c-62db9582fb3e', type: 'Rekenkameronderzoek' },
        { naam: 'Beleidsnotitie risicomanagement en weerstandsvermogen', datum: '2023-10-24', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4f49ecf7-f76c-46f3-8ea3-60821d1ccaad?documentId=a5df0331-fdd7-4ace-9b81-30384b036443&agendaItemId=7d789298-8584-4017-871e-28be03437e51', type: 'Beleidsnota' },
        { naam: 'Rechtmatigheidsverantwoording college', datum: '2023-05-09', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/b2acfe9b-2f9f-4ac1-a57f-0b6eb78a6f6d?documentId=473eb016-23bd-4bb0-9c2f-4f5d9ff0fbfe&agendaItemId=aa1154ff-ad24-4240-b904-077034365af1', type: 'Beleidsnota' }
    ],
    '0.5': [
        { naam: 'Raadpleegbrief Kapitaalversterking Alliander – wensen en bedenkingen', datum: '2021-11-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/f72bff25-4c77-4eb1-9b1c-2a87d82ee9c3', type: 'Besluit' }
    ],
    '0.6 - 0.9': [
        { naam: 'Raadsbesluit Verordening onroerendezaakbelastingen Wassenaar 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=cac9a825-311d-4997-9f21-7278d8f14b5f&agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', type: 'Verordening', toelichting: 'Grondslag OZB woningen en niet-woningen (0.61/0.62). Uitvoering BSGR.' },
        { naam: 'Verordening precariobelasting Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=944e92a0-f637-4e1b-9da8-f70fae59827d&agendaItemId=b1705ab6-aaaf-43ca-99c1-26cf09496419', type: 'Verordening', toelichting: 'Belasting op gebruik gemeentegrond (0.64).' },
        { naam: 'Raadsbesluit Verordening hondenbelasting Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=6a7b41f7-da3b-4000-8247-437a8af61761&agendaItemId=63f90655-66e9-4f60-833b-b2b7194c4b3c', type: 'Verordening', toelichting: 'Heffing hondenhouders (0.64). Uitvoering BSGR.' },
        { naam: 'Raadsbesluit Legesverordening 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=53fe2e44-b077-4163-8bb5-9a95284a33d0&agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', type: 'Verordening', toelichting: 'Tarieventabel leges dienstverlening (0.64).' },
        { naam: 'Retributieverordening Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=57b7fa4c-ddc4-45ad-b7f0-60c828f01f9b&agendaItemId=0ed97f25-b533-4c6a-a26f-7b3a4ad97914', type: 'Verordening', toelichting: 'Retributies (0.64).' },
        { naam: 'Raadsbesluit Verordening toeristenbelasting Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=ef4c4862-3fd3-498b-b412-a43185e58faa&agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', type: 'Verordening', toelichting: 'Heffing op overnachtingen (BBV 3.4 Economische promotie).' },
        { naam: 'Verordening op de heffing en de invordering van riool- en waterzorgheffing gemeente Wassenaar 2026', datum: '2025-12-19', link: 'https://zoek.officielebekendmakingen.nl/gmb-2025-557418.html', type: 'Verordening', toelichting: 'Officiële bekendmaking; BBV 7.2 Riolering (mutatielijst: iBabs-raadsbesluit verwijderd).' },
        { naam: 'Verordening afvalstoffenheffing Wassenaar 2026', datum: '2025-11-04', link: 'https://lokaleregelgeving.overheid.nl/CVDR748859/1', type: 'Verordening', toelichting: 'Heffing afvalinzameling (BBV 7.3 Afval).' },
        { naam: 'Verordening kwijtschelding gemeentelijke belastingen Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=57b7fa4c-ddc4-45ad-b7f0-60c828f01f9b&agendaItemId=0ed97f25-b533-4c6a-a26f-7b3a4ad97914', type: 'Verordening', toelichting: 'Kwijtscheldingsbeleid (BBV 6.3 Inkomensregelingen).' },
        { naam: 'Verordening marktgeld Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=2897d6c8-0346-4e89-9391-67edc22cd48a&agendaItemId=ed895ca6-84eb-4502-a75c-686bba2d0ae0', type: 'Verordening', toelichting: 'Heffing marktstandplaatsen (BBV 3.3 Bedrijvenloket).' },
        { naam: 'Verordening liggeld Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=b7d8ee51-1039-46de-85e0-9931986efab7&agendaItemId=8cae7ed0-45d4-4714-8181-c565279f31cd', type: 'Verordening', toelichting: 'Berth/liggelden (BBV 2.4 Havens en waterwegen).' },
        { naam: 'Verordening op de heffing en de invordering van rechten voor de algemene begraafplaats Persijnhof gemeente Wassenaar 2026', datum: '2025-12-19', link: 'https://zoek.officielebekendmakingen.nl/gmb-2025-558621.html', type: 'Verordening', toelichting: 'Grafrechten (BBV 7.5); officiële bekendmaking i.p.v. iBabs-raadsbesluit.' },
        { naam: 'Raadsbesluit Verordening ondernemersheffing Wassenaar 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=53fe2e44-b077-4163-8bb5-9a95284a33d0&agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', type: 'Verordening', toelichting: 'BIZ-heffing ondernemers (BBV 3.3 Bedrijvenloket).' },
        { naam: 'Gewijzigde gemeenschappelijke regeling BSGR', datum: '2024-10-15', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/55c3d3ec-054f-4773-9e25-29eee67b2454?documentId=10d1d083-a26d-4237-aaaf-1a67fff6390d&agendaItemId=442e7743-69d3-41c4-a838-1dfd18787134', type: 'GR', toelichting: 'Uitvoeringsorganisatie alle gemeentelijke belastingen.' },
        { naam: 'Zienswijze ontwerpbegroting 2026 Belastingsamenwerking Gouwe-Rijnland (BSGR)', datum: '2025-07-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/756adab0-f3ef-4298-87db-32c3a693e4b3?documentId=62fce322-a3c8-4bbb-a814-58bb222fb5e6&agendaItemId=49e2db46-f254-43fc-a249-fca43f3ee87f', type: 'GR' }
    ],
    '0.61': [
        { naam: 'Raadsbesluit Verordening onroerendezaakbelastingen Wassenaar 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=cac9a825-311d-4997-9f21-7278d8f14b5f&agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', type: 'Verordening' }
    ],
    '0.8 - 0.10 - 0.11': [
        { naam: 'Voorjaarsnota 2025', datum: '2025-07-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/756adab0-f3ef-4298-87db-32c3a693e4b3?documentId=99fda9c1-a4eb-4af8-9ffa-f1d82ae91ccc&agendaItemId=f8054240-3405-4e87-8e13-c80bde3af166', type: 'P&C' },
        { naam: 'Najaarsnota 2025', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=b0c65dcd-d44c-4e1a-8fda-9276ca0da9a7&agendaItemId=ed3af2b5-d8fc-4650-930c-46682ebc8401', type: 'P&C' },
        { naam: 'Jaarstukken 2024', datum: '2025-07-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/756adab0-f3ef-4298-87db-32c3a693e4b3?documentId=7424ae6a-15b2-4e56-b1bc-12a38e77266d&agendaItemId=82626e1c-2301-4c9f-b7c2-847adc7325aa', type: 'Jaarrekening' },
        { naam: 'Financiën gemeente Wassenaar', link: 'https://www.wassenaar.nl/financien/', type: 'Overzicht', toelichting: 'Begrotingen en jaarrekeningen op wassenaar.nl.' },
        { naam: 'Subsidiebeleid / Subsidieregelingen', link: 'https://www.wassenaar.nl/subsidieregelingen', type: 'Overzicht' }
    ],
    '0.64': [
        { naam: 'Verordening precariobelasting Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=944e92a0-f637-4e1b-9da8-f70fae59827d&agendaItemId=b1705ab6-aaaf-43ca-99c1-26cf09496419', type: 'Verordening' },
        { naam: 'Raadsbesluit Verordening hondenbelasting Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=6a7b41f7-da3b-4000-8247-437a8af61761&agendaItemId=63f90655-66e9-4f60-833b-b2b7194c4b3c', type: 'Verordening' },
        { naam: 'Raadsbesluit Legesverordening 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=53fe2e44-b077-4163-8bb5-9a95284a33d0&agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', type: 'Verordening' },
        { naam: 'Gewijzigde gemeenschappelijke regeling BSGR', datum: '2024-10-15', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/55c3d3ec-054f-4773-9e25-29eee67b2454?documentId=10d1d083-a26d-4237-aaaf-1a67fff6390d&agendaItemId=442e7743-69d3-41c4-a838-1dfd18787134', type: 'GR' },
        { naam: 'Zienswijze ontwerpbegroting 2026 Belastingsamenwerking Gouwe-Rijnland (BSGR)', datum: '2025-07-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/756adab0-f3ef-4298-87db-32c3a693e4b3?documentId=62fce322-a3c8-4bbb-a814-58bb222fb5e6&agendaItemId=49e2db46-f254-43fc-a249-fca43f3ee87f', type: 'GR' }
    ],
    '1.1': [
        { naam: 'Zienswijze op ontwerpbesluit deelname Stichting Risicobeheer Veiligheidsregio\'s', datum: '2023-07-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/11caa43a-902a-493b-9004-3dbabad739cf?documentId=c377ba70-9ffd-4677-b79b-6af4818db2d1&agendaItemId=22148ff1-d780-4b87-a471-9f8d2c12bc73', type: 'GR' },
        { naam: 'Wensen en bedenkingen deelname Veiligheidsregio Haaglanden aan Stichting Waarborgfonds Veiligheidsregio\'s', datum: '2024-10-15', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/55c3d3ec-054f-4773-9e25-29eee67b2454?documentId=37d1e382-e29f-472b-8eb8-91c820b8bf62&agendaItemId=49ad5877-c9d2-4e62-b43a-8c29bd88fc7d', type: 'Besluit' }
    ],
    '1.2': [
        { naam: 'Algemene Plaatselijke Verordening (APV) 2024', datum: '2024-10-15', link: 'https://lokaleregelgeving.overheid.nl/CVDR725819', type: 'Verordening' },
        { naam: 'Regiovisie Aanpak Huiselijk Geweld Haaglanden 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=c349b273-ff0c-4199-a92e-638f051c7953&agendaItemId=994549eb-e2ff-48d7-abb8-c9acd3d9d4d7', type: 'Regiovisie' },
        { naam: 'Bekrachtiging Noodverordening NAVO-top 2025', datum: '2025-06-03', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/37e4fd08-333d-4616-9304-e15b9444f657?documentId=554b128e-d10b-4b2c-bace-e2fd2a405e6b&agendaItemId=6ef51e08-d21a-4a49-974e-cad22b0ab0af', type: 'Verordening' },
        { naam: 'Actualisering wijk- en buurtindeling', datum: '2023-12-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/d338a903-674a-46c6-8d0a-2e2745322486?documentId=94f0f334-f15b-4122-aac1-6b2908eac0d5&agendaItemId=d60cf56f-04a9-4f88-9a31-01857983994b', type: 'Besluit' },
        { naam: 'Beleidsplan: Gemeentelijke aanpak tegen ondermijnende criminaliteit Wassenaar 2025 – 2028', datum: '2024-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/0a14e050-9de3-4e7e-8bab-7bb8070542e4?documentId=a24853bd-064b-4a21-85f2-306e94ce08f9&agendaItemId=471de35e-33ab-41a0-9911-6fdcaa82d461', type: 'Beleidsnota' },
        { naam: 'Integraal veiligheidsbeleid 2024-2027', datum: '2023-12-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/d338a903-674a-46c6-8d0a-2e2745322486?documentId=53abdaa2-5ac7-488e-af20-dd7d3a0cc9ac&agendaItemId=4ef91a89-f47a-47a8-a028-759367a3b945', type: 'Besluit' },
        { naam: 'Suppletieregeling opsporen en opruimen ontplofbare oorlogsresten uit de Tweede Wereldoorlog', datum: '2026-01-27', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Calendar', type: 'Besluit' }
    ],
    '2.1': [
        { naam: 'Rekenkamerrapport Onderzoek naar onderhoud aan wegen, bruggen en onderdoorgangen', datum: '2023-10-30', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/ba97caee-7645-4ab4-819b-8d3d5557bafd?documentId=7452096e-af56-4d4b-95f3-0f98ce518689&agendaItemId=ce720c7e-abec-448b-9fec-e8ab29a1d62d', type: 'Rekenkameronderzoek' },
        { naam: 'Verkeersonderzoek wegennet Wassenaar', datum: '2021-09-21', link: 'https://www.wassenaar.nl/verkeersonderzoek', type: 'Besluit' },
        { naam: 'Krediet voor Duurzaam Veilig inrichten Storm (zuid) en Schouwweg (noord)', datum: '2023-06-06', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/527bdef9-3294-4a18-8344-1ec9b174b267?documentId=4c4011dc-185f-4755-81be-9ab364a2160a&agendaItemId=b74ce6d9-bc91-4fc9-8bab-5227c9c67183', type: 'Besluit' },
        { naam: 'Adviesrapport Burgerberaad Verkeer', datum: '2025-06-03', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/37e4fd08-333d-4616-9304-e15b9444f657?documentId=f11a6078-a2e7-4f07-8459-d70a33adbc25&agendaItemId=3e394706-6cbd-462c-9e19-9e40465dc3b7', type: 'Besluit' },
        { naam: 'Wegencategoriseringsplan Wassenaar', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=18b4849d-5034-4b4e-9999-a685006151c7&agendaItemId=d719036c-afdd-4017-9a1c-706c403ff295', type: 'Besluit' }
    ],
    '2.2': [
        { naam: 'Parkeerverordening', datum: '2025-01-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4cf0d5ba-c36f-47f5-80f9-46bdabde639b?documentId=15b86133-d070-4561-a923-474f86eeda0f&agendaItemId=75d16064-3f84-4344-b66a-8bc8dc336154', type: 'Verordening' },
        { naam: 'Startnotitie \"Nota parkeerbeleid\"', datum: '2022-10-18', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Calendar?year=2022', type: 'Besluit' }
    ],
    '2.4': [
        { naam: 'Bijstelling investeringsbudget Damwand Havenkade', datum: '2022-12-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/007f68bb-39a0-4d61-b0c5-0ff9c80a17b6?documentId=9834206c-9c4a-4d4f-ba93-ea9df0e36a5a&agendaItemId=76f73239-fd2a-4507-a26e-0a8ebe7fb48f', type: 'Besluit' },
        { naam: 'Verordening liggeld Wassenaar 2026', datum: '2025-11-04', link: 'https://lokaleregelgeving.overheid.nl/CVDR748860/1', type: 'Verordening' }
    ],
    '2.5': [
        { naam: 'Strategische agenda MRDH', link: 'https://wassenaar.bestuurlijkeinformatie.nl/reports/document/219ead80-09ca-4b5c-b5f1-b668b640ddf7?documentId=d87d8215-26a3-417d-8889-96029e57f968', type: 'Visie/Strategie' },
        { naam: 'Brandbrief 23 raden OV in MRDH regio - Voortbestaan openbaar vervoer in Metropoolregio Rotterdam-Den Haag onder druk', datum: '2021-05-18', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/6a9dfae1-81a6-4b10-9d6f-19cd9617d592?documentId=9586ca78-1ba7-4813-8201-c79bc74e25a4&agendaItemId=ec24a3d1-1475-488a-bfb6-7e32080fad61', type: 'Besluit' }
    ],
    '3.1': [
        { naam: 'Economische Visie Wassenaar 2025', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=2d283b8f-0580-42f9-8037-f24534de38f9&agendaItemId=6b62ad8a-4072-49a9-b3a2-ef980e3be13d', type: 'Visie/Strategie' },
        { naam: 'Zienswijze op de conceptontwerp Visie Economisch Vestigingsklimaat MRDH 2025', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=d325a3ce-73e4-45d6-a94e-110728a86864&agendaItemId=56b75768-2727-41dc-96c2-c2b05c47f7b8', type: 'Visie/Strategie' },
        { naam: 'Beheerplannen openbare ruimte', link: 'https://www.wassenaar.nl/beheerplannen-openbare-ruimte', type: 'Overzicht' }
    ],
    '3.3': [
        { naam: 'Verordening BIZ Maaldrift 2026–2030', datum: '2025-10-14', link: 'https://lokaleregelgeving.overheid.nl/CVDR748760/1', type: 'Verordening' },
        { naam: 'Verordening marktgeld Wassenaar 2026', datum: '2025-11-04', link: 'https://lokaleregelgeving.overheid.nl/CVDR748858/1', type: 'Verordening' }
    ],
    '3.4': [
        { naam: 'Zienswijze Visie Economisch Vestigingsklimaat MRDH', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=d325a3ce-73e4-45d6-a94e-110728a86864&agendaItemId=56b75768-2727-41dc-96c2-c2b05c47f7b8', type: 'Zienswijze' },
        { naam: 'Nota Internationals in Wassenaar', datum: '2024-10-15', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/55c3d3ec-054f-4773-9e25-29eee67b2454?documentId=63d57462-b5b2-4b7d-87e7-c39175e246cf&agendaItemId=bc938db7-cafb-45ce-8274-9407c09693c6', type: 'Nota', toelichting: 'Raad 15 okt 2024 (geamendeerd).' },
        { naam: 'Retributieverordening Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=57b7fa4c-ddc4-45ad-b7f0-60c828f01f9b&agendaItemId=0ed97f25-b533-4c6a-a26f-7b3a4ad97914', type: 'Verordening' },
        { naam: 'Verordening toeristenbelasting Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=ef4c4862-3fd3-498b-b412-a43185e58faa&agendaItemId=6e2a1dd2-5477-47f5-ae98-b4971458edb7', type: 'Verordening' },
        { naam: 'Startnotitie evenementenbeleid', datum: '2022-11-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a1e0df82-3491-46de-8cc7-138629de9708?documentId=41bea0f9-90bc-4b22-bf83-872bb713f1f8&agendaItemId=ba853240-d91a-4345-84b9-ebc526f38471', type: 'Besluit' }
    ],
    '4.1': [
        { naam: 'Statutenwijziging en benoeming bestuursleden Stichting Openbaar Primair Onderwijs Wassenaar (Bloemcampschool)', datum: '2020-07-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/58425d50-dffb-493c-874b-8cfc2e6dd6d4?documentId=3348ed1b-efbf-4b63-ada1-cb949c7721c5&agendaItemId=6a517d70-854a-4d31-9f29-96f8cdfdc1d1', type: 'Besluit' }
    ],
    '4.2': [
        { naam: 'Rapport Rekenkamercommissie over Onderwijshuisvesting', datum: '2022-02-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/5a23e4a2-e804-47e6-b2e2-6966103784c0?documentId=5e28c405-1286-4bb6-ad76-467e889ee985&agendaItemId=85695761-56bd-4cff-ac1c-90eb34292eb6', type: 'Rekenkameronderzoek' },
        { naam: 'Vaststellen definitieve locatie SKOW', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=61a87f4f-ba5d-41b9-8081-2672503ceccd&agendaItemId=8531102f-1505-42cb-a0d1-4e66328f1e06', type: 'Besluit' },
        { naam: 'Herijking Integraal Huisvestingsplan (IHP) onderwijs (2024-2039)', datum: '2025-04-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/271db830-fe76-477f-ac64-1d68e329da63?documentId=5aa88524-fe67-4a2e-8234-a90daad8e049&agendaItemId=126c9ef7-1bf2-4c4b-b4fc-237d2a77a14a', type: 'Besluit' }
    ],
    '4.3': [
        { naam: 'Verordening leerlingenvervoer 2025', datum: '2025-09-22', link: 'https://lokaleregelgeving.overheid.nl/CVDR745567/1', type: 'Verordening' },
        { naam: 'Beleidsplan voor- en vroegschoolse educatie 2024–2027', datum: '2023-10-24', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4f49ecf7-f76c-46f3-8ea3-60821d1ccaad?documentId=bdac4f0e-4690-4f8e-a3e9-5d5e45f8f28d&agendaItemId=c5b55bf1-d57c-4230-80a4-42822bfd36f4', type: 'Beleidsplan' }
    ],
    '5.1': [
        { naam: 'Sportvisie Wassenaar 2025', datum: '2025-09-23', link: 'https://cuatro.sim-cdn.nl/wassenaar/uploads/sportvisie_wassenaar_2025.pdf?cb=LEruT1mN', type: 'Visie/Strategie', toelichting: 'PDF gemeente (SIM-cdn), conform mutatielijst 2 apr 2026.' }
    ],
    '5.2': [
        { naam: 'Aanvullende krediet onvoorziene maatregelen sporthal', datum: '2023-10-24', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4f49ecf7-f76c-46f3-8ea3-60821d1ccaad?documentId=13a1186b-81dd-45fb-8e4a-e4d9eaf3d6e8&agendaItemId=84230573-06c4-4b61-b3a6-532cc570f4e5', type: 'Besluit' }
    ],
    '5.3': [],
    '5.5': [
        { naam: 'Nota van uitgangspunten Commandopost Clingendael', datum: '2024-01-30', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/75d21a36-5fac-41b4-bc05-66a1801c7892?documentId=f0359bde-9423-4b1d-aa1b-e327accbffd9&agendaItemId=149a3c36-bdc8-4a63-bad9-72c255268278', type: 'Besluit' }
    ],
    '5.6': [
        { naam: 'Vaststellen toetsingscriteria aanwijzingsprocedure lokale publieke omroep', datum: '2025-04-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/271db830-fe76-477f-ac64-1d68e329da63?documentId=5234ff00-1696-4278-b305-dd1d0379886f&agendaItemId=d4308415-8215-47d1-b910-a31ba0fe9f1d', type: 'Besluit' },
        { naam: 'Advies aanwijzing lokale omroep', datum: '2026-01-27', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/53b702cc-06a7-4ba1-87af-2f1d7e746ef0?documentId=5234ff00-1696-4278-b305-2a4c4e6fed31&agendaItemId=3b4dd2c4-111a-42e8-80cf-6f4dfd03b10f', type: 'Besluit' },
        { naam: 'Beleidsplan Stichting Lokale Media Wassenaar + invulling toetsingscriteria', datum: '2026-01-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/51ddf92e-0e56-47e3-8019-ba063f8554e1?documentId=4ef7fb4d-ed23-458f-a574-23cd9662ce39&agendaItemId=9c9f0439-9cbc-4902-a555-5e4d98147bb3', type: 'Beleidsplan' }
    ],
    '5.7': [
        { naam: 'Vaststelling beheersverordening diverse locaties', datum: '2023-01-31', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/740c48f5-0e49-4d82-b0c9-b114c1340d30?documentId=8f4ece4c-612a-40f7-8d87-793a58e44d74&agendaItemId=6eb7daae-f24c-426d-965a-7b6b21d684f9', type: 'Verordening' },
        { naam: 'Raadpleegbrief Wensen en bedenkingen samenwerkingsovereenkomst met Rijksvastgoedbedrijf', datum: '2022-12-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/007f68bb-39a0-4d61-b0c5-0ff9c80a17b6?documentId=23f55f27-7435-4a32-8366-94de483c2e53&agendaItemId=d40d188d-d99e-4eac-9f1f-43e30fc6b66a', type: 'Besluit' },
        { naam: 'Herstelbesluit bestemmingsplan \"Woongebied Valkenhorst\"', datum: '2025-06-23', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4deff26e-984f-4762-8135-fac74abf4afb?documentId=43135686-4970-4f3f-b7a4-b7600ccbe012&agendaItemId=4fb461f3-7cb3-4d3c-a4f2-071f91839464', type: 'Besluit' },
        { naam: 'Vernieuwen van de huidige skatevoorziening gelegen in het Geesbert van Barneveldpark', datum: '2024-02-27', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/ae3bb1c2-7ca0-4228-95e6-51697fd4aa0e?documentId=9efaf594-b27c-4694-94df-edad9157795b&agendaItemId=d93fa9fc-f146-4a78-b2f7-0e2411797914', type: 'Besluit' },
        { naam: 'Visie De Wassenaarse Slag', datum: '2025-03-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=ae1f505f-1c39-4f65-af01-7ef35f1d053a&agendaItemId=6038eaee-e37d-4d6d-a760-a222db95d7a6', type: 'Visie/Strategie' },
        { naam: 'Asfaltonderhoud aan de rijbaan van De Wassenaarse Slag combineren met het verbeteren van de veiligheid van de fietsoversteek bij hotel Duinoord', datum: '2023-04-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/64d6e027-857b-4642-9251-e8f6967947e7?documentId=af3db0c6-5005-451c-8fd2-9fec60ce6da3&agendaItemId=495e136c-79e4-4519-8263-554f6c7bd75b', type: 'Besluit' }
    ],
    '6.1': [
        { naam: 'Verordening Adviesraad Sociaal Domein 2025', datum: '2025-06-03', link: 'https://lokaleregelgeving.overheid.nl/CVDR742966/1', type: 'Verordening', toelichting: 'Lokale regelgeving; iBabs-raadsbesluit niet als hoofdlink (mutatielijst 2 apr 2026).' },
        { naam: 'Regiovisie Aanpak Huiselijk Geweld 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=e34891e9-c105-4d18-9d9b-e2a9b6d66806&agendaItemId=994549eb-e2ff-48d7-abb8-c9acd3d9d4d7', type: 'Regiovisie', toelichting: 'Bijlage 1 iBabs; ook relevant voor BBV 1.' },
        { naam: 'Beleidsplan inburgering Wassenaar', datum: '2021-03-30', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/d2f300f0-a707-4f03-98c4-aa913038632e?documentId=8ff9ac1c-99c3-4de8-bee4-2a2e3349fa91&agendaItemId=8d7226ad-285a-4419-a6e3-8ba4504ebbae', type: 'Beleidsnota' },
        { naam: 'Verordening Inburgering Wassenaar 2022', datum: '2022-11-08', link: 'https://lokaleregelgeving.overheid.nl/CVDR683759/1', type: 'Verordening' },
        { naam: 'Nota Internationals', datum: '2024-10-15', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/55c3d3ec-054f-4773-9e25-29eee67b2454?documentId=696006b0-7ff3-4966-9211-8c9f6d05b918&agendaItemId=bc938db7-cafb-45ce-8274-9407c09693c6', type: 'Beleidsnota' },
        { naam: 'Verordening antidiscriminatievoorziening gemeente Wassenaar 2026', datum: '2026-01-27', link: 'https://lokaleregelgeving.overheid.nl/CVDR757453/1', type: 'Verordening' }
    ],
    '6.2': [
        { naam: 'Toegang eerste lijns', type: 'Clustering', toelichting: 'Deze tegel is een clustering van de BBV-taakvelden 6.21 (Toegang en eerstelijnsvoorzieningen Wmo), 6.22 (Toegang en eerstelijnsvoorzieningen Jeugd) en 6.23 (Toegang en eerstelijnsvoorzieningen Integraal). Besluiten van het Sociaal Domein worden hier op hoofdniveau weergegeven.' }
    ],
    '6.3 - 6.5': [
        { naam: 'Werk en inkomen', type: 'Clustering', toelichting: 'Deze tegel is een clustering van de BBV-taakvelden 6.3 (Inkomensregelingen), 6.4 (WSW en beschut werk) en 6.5 (Arbeidsparticipatie). Besluiten van het Sociaal Domein worden hier op hoofdniveau weergegeven.' },
        { naam: 'Re-integratie- en participatieverordening 2023', datum: '2023-12-19', link: 'https://lokaleregelgeving.overheid.nl/CVDR714007/1', type: 'Verordening', toelichting: 'Raad 19 dec 2023 (geamendeerd).' },
        { naam: 'Beleidsplan re-integratie en participatie', datum: '2023-09-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8b213f81-c9f8-4870-865e-cdd42cf0b09a?documentId=356b07de-affb-47eb-96c0-0f6ebe329580&agendaItemId=851d5e9e-f1fa-41b9-94dc-229cc6bc48a6', type: 'Beleidsplan' },
        { naam: 'Tweede wijziging Gemeenschappelijke Regeling Kust-, Duin- en Bollenstreek', datum: '2024-11-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/00ff4460-6476-48f8-b312-e8c4505247a7?documentId=4b9dd349-6446-4d32-977d-2175bf5dca3a&agendaItemId=dce7fa65-0e8e-4028-a52e-f25317da39ab', type: 'GR' },
        { naam: 'Verordening kwijtschelding gemeentelijke belastingen Wassenaar 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8?documentId=5cd99a33-66b5-4ac4-a6c1-499e311f9f03&agendaItemId=e5929d69-9697-41d4-b2fa-10eb6731e462', type: 'Verordening' },
        { naam: 'Rapport Rekenkamercommissie Minimabeleid', datum: '2023-12-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/d338a903-674a-46c6-8d0a-2e2745322486?documentId=09705f6e-8080-4c42-b9af-63d3889919a4&agendaItemId=72e2e265-f4c5-4e81-8cf0-4b3ffd2dfb87', type: 'Rekenkameronderzoek' },
        { naam: 'Dynamisch Minimabeleid Wassenaar 2024', datum: '2024-10-15', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/55c3d3ec-054f-4773-9e25-29eee67b2454?documentId=82a9578e-d672-41c2-ab24-78a317a87ed8&agendaItemId=1a9d9218-8820-4285-9ede-946ad82d86e8#', type: 'Beleidsnota', toelichting: 'URL conform mutatielijst (fragment #).' },
        { naam: 'Beleidsnota schuldhulpverlening 2025-2028', datum: '2025-04-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/271db830-fe76-477f-ac64-1d68e329da63?documentId=8992182e-7fc7-4bdf-9874-f3ca5df4a8b1&agendaItemId=f537e129-28d2-4cea-8f4c-128ca0037086', type: 'Beleidsnota' }
    ],
    '6.60 - 6.91': [
        { naam: 'WMO', type: 'Clustering', toelichting: 'Deze tegel is een clustering van alle Wmo-gerelateerde BBV-taakvelden: 6.60 (Hulpmiddelen en diensten), 6.711 (Huishoudelijke hulp), 6.712 (Begeleiding), 6.713 (Dagbesteding), 6.714 (Overige maatwerkarrangementen), 6.791 (PGB Wmo), 6.811 (Beschermd wonen), 6.812 (Maatschappelijke- en vrouwenopvang) en 6.91 (Coördinatie en beleid Wmo). Besluiten van het Sociaal Domein worden hier op hoofdniveau weergegeven.' },
        { naam: 'Achtste wijziging Verordening Wmo', datum: '2024-03-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a514a1cb-10c7-4af5-9fdc-2346c18996d6?documentId=5757b8bf-5b63-47cc-a65d-cda4fed90a7a&agendaItemId=b3b6af7b-1019-47db-b91d-662d185ff049', type: 'Verordening' },
        { naam: 'Beleidsnota Ouderenbeleid 2025', datum: '2025-01-28', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/85393b37-a676-4ffb-a9f2-33b6f0d9b58b?documentId=79a101d9-552b-49cc-9d34-31f6923cc1a9&agendaItemId=6ac84012-a995-46de-b19f-d58cb5aa952a', type: 'Beleidsnota' },
        { naam: 'Regiovisie beschermd Wonen en maatschappelijke opvang 2022-2025 \'Samen bouwen aan maatschappelijk herstel\'', datum: '2021-11-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/6afc2f69-9753-4459-9f00-521e285489dc?documentId=d85a90bd-790e-457e-a490-45fbfa873a58&agendaItemId=08ebef84-6fd6-4004-9b07-705f2c301ab1', type: 'Visie/Strategie' },
        { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=847d0caa-b04b-493e-9d14-d72c9d85b640&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b', type: 'Startnotitie' }
    ],
    '6.7 - 6.9': [
        { naam: 'Jeugd', type: 'Clustering', toelichting: 'Deze tegel is een clustering van alle jeugdgerelateerde BBV-taakvelden: 6.751–6.753 (Jeugdhulp ambulant lokaal/regionaal/landelijk), 6.761–6.763 (Jeugdhulp met verblijf lokaal/regionaal/landelijk), 6.792 (PGB Jeugd), 6.821 (Jeugdbescherming), 6.822 (Jeugdreclassering) en 6.92 (Coördinatie en beleid Jeugd). Besluiten van het Sociaal Domein worden hier op hoofdniveau weergegeven.' },
        { naam: 'Verordening Jeugdhulp 2025', datum: '2025-11-25', link: 'https://lokaleregelgeving.overheid.nl/CVDR749873/1', type: 'Verordening' },
        { naam: 'Nieuw inkoopkader jeugdhulp GR SbJH', datum: '2025-06-03', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/37e4fd08-333d-4616-9304-e15b9444f657?documentId=96777f2a-640c-432c-94e2-ffd9f8825445&agendaItemId=95316a18-f7b8-483a-a252-3d491f042373', type: 'Kader' },
        { naam: 'Regiovisie jeugdhulp Haaglanden', datum: '2021-10-12', link: 'https://jeugdhulphaaglanden.nl/regionale+bibliotheek/handlerdownloadfiles.ashx?idnv=2184098', type: 'Visie/Strategie' },
        { naam: 'Verordening leerlingenvervoer 2025 gemeente Wassenaar', datum: '2025-09-22', link: 'https://lokaleregelgeving.overheid.nl/CVDR745567/1', type: 'Verordening' },
        { naam: 'Gemeenschappelijke regeling Servicebureau Jeugdhulp Haaglanden', datum: '2024-06-04', link: 'https://lokaleregelgeving.overheid.nl/CVDR721620/1', type: 'GR', toelichting: 'Lokale regelgeving (huidige GR-tekst); mutatielijst 2 apr 2026.' },
        { naam: 'Lokaal Jeugdbeleid Wassenaar 2026', datum: '2025-11-25', link: 'https://www.wassenaar.nl/lokaal-jeugdbeleid', type: 'Beleidsnota' }
    ],
    '6.811': [
        { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=847d0caa-b04b-493e-9d14-d72c9d85b640&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b', type: 'Startnotitie' },
        { naam: 'Beleidsnota Ouderenbeleid 2025', datum: '2025-01-28', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/85393b37-a676-4ffb-a9f2-33b6f0d9b58b?documentId=79a101d9-552b-49cc-9d34-31f6923cc1a9&agendaItemId=6ac84012-a995-46de-b19f-d58cb5aa952a', type: 'Beleidsnota' }
    ],
    '7.1': [
        { naam: 'Regiovisie Aanpak Huiselijk Geweld Haaglanden voor de periode 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=e34891e9-c105-4d18-9d9b-e2a9b6d66806&agendaItemId=994549eb-e2ff-48d7-abb8-c9acd3d9d4d7', type: 'Visie/Strategie' }
    ],
    '7.2': [
        { naam: 'Verordening afvoer hemel- en grondwater Gemeente Wassenaar 2021', datum: '2021-04-01', link: 'https://lokaleregelgeving.overheid.nl/CVDR657050/1', type: 'Verordening' },
        { naam: 'Rekenkamerrapport \'Onderhoud en vervanging rioleringen\'', datum: '2019-01-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/62e63061-ab48-4f7c-b1c9-f5a42146bee6?documentId=08afb437-c425-4eca-a17b-f4fedd9c9561&agendaItemId=9a09c57f-53da-4147-a01d-68e504511a14#', type: 'Rekenkameronderzoek' },
        { naam: 'Integraal Waterketenplan (IWKp) 2024-2028 vanuit de regionale samenwerking in de waterketen Leidse regio', datum: '2024-03-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a514a1cb-10c7-4af5-9fdc-2346c18996d6?documentId=52c28a88-7328-4ae1-9cd7-b3a116d40445&agendaItemId=8ada5b45-3a51-4648-8e25-bd092cbe6c5c', type: 'Besluit' }
    ],
    '7.3': [
        { naam: 'Afvalstoffenverordening Wassenaar 2024', datum: '2024-03-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a514a1cb-10c7-4af5-9fdc-2346c18996d6?documentId=800fc254-3771-44fd-8f0b-7ff404fefe78&agendaItemId=be7acf0a-cac9-4d53-8982-083973ca88a8', type: 'Verordening' },
        { naam: 'Verkenning reductie restafval', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Reports/Document/13e0eeae-ce9a-454d-8530-b43864972f79?documentId=3d92ea1b-1a04-4bf3-9bb2-07c976603c43', type: 'Notitie' },
        { naam: 'Intensiveren bronscheiding', datum: '2019-07-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/0ef15169-f2e2-4793-91e8-5b759e420f5d?documentId=7e0569c3-21eb-4ddf-802d-9e5f24299cf0&agendaItemId=85ac8236-7fbe-4b42-b0c4-9d97ef71f236', type: 'Beleidsnota' },
        { naam: 'Verordening afvalstoffenheffing Wassenaar 2026', datum: '2025-11-04', link: 'https://lokaleregelgeving.overheid.nl/CVDR748859/1', type: 'Verordening' },
        { naam: 'Definitieve keuze verwerking restafval', datum: '2021-03-11', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/816735e3-7c9e-4d3b-9ed8-0fb6f10ad9cd?documentId=55cdd1f5-f954-414a-87e8-7484a6e59a42&agendaItemId=bf4ca80a-a3e3-45c2-8907-772e50af5b2b#', type: 'GR' }
    ],
    '7.4': [
        { naam: 'Nota bodembeheer Wassenaar 2023', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=7d3f89b2-722b-4736-bec4-67cdb42fcb12&agendaItemId=e88332bc-f459-4f74-9ca4-08f6dd490a6e', type: 'Beleidsnota' },
        { naam: 'Transitievisie warmte 1.0 Wassenaar', datum: '2021-11-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/3e3d5ad0-ed2e-4ff9-9f2c-7bdfb511b900?documentId=421e9cb1-cd17-4dd5-bce6-0b6b7256a006&agendaItemId=2fd6a9c7-65fe-441e-b758-0859c884e38e', type: 'Visie/Strategie' },
        { naam: 'Lokale Energiestrategie 2023-2026', datum: '2023-04-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/64d6e027-857b-4642-9251-e8f6967947e7?documentId=1bf2554a-c8dd-41ec-8bb6-11131a940001&agendaItemId=138edc9f-cf9d-4a71-a0d6-0732dd30b830', type: 'Beleidsnota' },
        { naam: 'Verordening Duurzaamheidsvoucher Wassenaar 2020', datum: '2020-07-14', link: 'https://lokaleregelgeving.overheid.nl/CVDR642847/1', type: 'Verordening' },
        { naam: 'Verordening Energiebesparende maatregelen woningen 2021 (RREW)', datum: '2021-11-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/c0e8e13a-21d2-451e-96dd-c8a96d277eac?documentId=06e13a81-2c96-4056-a3cf-0c952b9f1f0d&agendaItemId=5727e137-e899-48d7-b4cf-b2087c289824', type: 'Verordening' },
        { naam: 'Onderzoek Rekenkamercommissie participatie in de RES', datum: '2022-12-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/007f68bb-39a0-4d61-b0c5-0ff9c80a17b6?documentId=412eaf2b-6c89-48c5-a2c3-37b7a8f752f6&agendaItemId=904b8587-f9e3-4781-b600-79038a775705#', type: 'Rekenkameronderzoek' },
        { naam: 'Rekenkamercommissierapport \'Onderzoek naar energiebesparingsplicht\'', datum: '2020-11-24', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1576ea5a-0fb4-4987-9a71-041970146bb6?documentId=f9e2be93-f303-4b2c-9f32-6b6e7ab20b65&agendaItemId=2e35a30f-9e0a-4756-b5c8-4a96bb9e6710', type: 'Rekenkameronderzoek' },
        { naam: 'CO2-Prestatieladder', datum: '2022-02-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/67715b87-28ff-4ba5-b701-aae4bf903aa0?documentId=fc89cb5c-930b-4d5d-8ef8-093085340941&agendaItemId=e379f414-9b66-4e6c-ad48-cd6f21370481', type: 'Besluit' },
        { naam: 'Beschikbaar stellen van cofinanciering voor het verkrijgen van een gebiedsgerichte  ontheffing natuurvriendelijk isoleren', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=6b7c19b2-16cb-435e-bce4-7e72b37bd7f5&agendaItemId=439cb93b-fffd-4e0b-987a-e16560caa20d', type: 'Besluit' }
    ],
    '7.5': [
        { naam: 'Verordening op de heffing en de invordering van rechten voor de algemene begraafplaats Persijnhof gemeente Wassenaar 2026', datum: '2025-12-19', link: 'https://zoek.officielebekendmakingen.nl/gmb-2025-558621.html', type: 'Verordening', toelichting: 'Officiële bekendmaking (mutatielijst: iBabs-raadsbesluit verwijderd).' }
    ],
    '8.1': [
        { naam: 'Ontwerp verklaring van geen bedenking Van Polanenpark 105', datum: '2021-03-30', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/d2f300f0-a707-4f03-98c4-aa913038632e?documentId=3d9b6792-5951-46df-a965-380cd78766b6&agendaItemId=3724d34a-57f4-4814-86a4-6004d33619d8', type: 'Raadsbesluit' },
        { naam: 'Raadpleegbrief Verklaring van geen bedenkingen aanvraag omgevingsvergunning Viskiosk Stadhoudersplein 1a', datum: '2021-09-21', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/280573e8-fc6e-4084-915c-62db9582fb3e', type: 'Raadsbesluit' },
        { naam: 'Principeverzoek Buurtweg 113A', datum: '2022-05-31', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/07af22b2-dbe3-4bb0-94e8-7bf836e9d261?documentId=b629379e-2c9a-4abc-9265-44b460c8f5fa&agendaItemId=822c9bda-9545-454f-ae01-3c4baa145661', type: 'Raadsbesluit' },
        { naam: 'Weigering Verklaring van geen bedenkingen voor de ontwikkeling van een nieuwe woning achterop het perceel van Rijksstraatweg 785', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=03c913c4-3369-4c29-9f05-793f6b3188f4&agendaItemId=f763cb25-cc78-4b16-a46a-cb8a41a709c9', type: 'Raadsbesluit' },
        { naam: 'Definitieve weigering aanvraag omgevingsvergunning Rijksstraatweg 785', datum: '2025-03-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=9f2b6db5-7489-404b-97b7-38fedf3412de&agendaItemId=8dff8faf-6aba-44eb-8388-e12765d3d875', type: 'Raadsbesluit' },
        { naam: 'Weigering Verklaring Van Geen Bedenkingen voor het legaliseren van een paddock/buitenstallen op de Katwijkseweg 22a', datum: '2025-07-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/756adab0-f3ef-4298-87db-32c3a693e4b3?documentId=25546ad3-854b-45c0-b700-4ae5a819ce9f&agendaItemId=9fd02b09-3d69-46c3-9386-011077cb2267', type: 'Raadsbesluit' },
        { naam: 'Verklaring van geen bedenkingen Ruigelaan 1a', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=98fdd2ea-cc15-421f-8893-4abe82ea6e36&agendaItemId=963fa536-5cf7-40da-9f65-d4e105504607', type: 'Raadsbesluit' },
        { naam: 'Wensen en bedenkingen Concept-Programma Noordrand', datum: '2025-06-03', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/37e4fd08-333d-4616-9304-e15b9444f657?documentId=2455d6c8-1c90-4564-be5b-62ee8bc8eb71&agendaItemId=fcf97e62-007f-4e8f-8d93-c6e6582496c1', type: 'Besluit' },
        { naam: 'Vooroverlegplan herontwikkeling draf- en renbaan Duindigt', datum: '2019-03-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Calendar?year=2019', type: 'Besluit' },
        { naam: 'Vaststelling Startdocument en Stedenbouwkundig plan van eisen Ontwikkeling Duindigt', datum: '2021-12-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Calendar?year=2021', type: 'Besluit' },
        { naam: 'Vestiging vervroegd voorkeursrecht Draf- en Renbaan Duindig', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=ba1e5c4f-b0f7-402c-a81d-78a4a69793df&agendaItemId=2e4a9fcb-8262-450a-8001-e63cb2cefeae', type: 'Besluit' },
        { naam: 'Beslissing op bezwaar voorkeursrecht Renbaan Duindigt', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=6b8980be-44dc-43d1-a4ed-20fab5cc7912&agendaItemId=311976b9-124a-49d0-8e0c-75a42ac65bc9', type: 'Besluit' },
        { naam: 'Zienswijze herontwikkeling van het MOC Maaldrift', datum: '2024-02-27', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/ae3bb1c2-7ca0-4228-95e6-51697fd4aa0e?documentId=1f155858-0f2c-48dc-ae6e-aa89214212f8&agendaItemId=0ff24ae4-888e-4816-a9c3-a1d82f9601dd', type: 'Besluit' },
        { naam: 'Zienswijze ontwerpbegroting 2026 Omgevingsdienst Haaglanden', datum: '2025-07-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/756adab0-f3ef-4298-87db-32c3a693e4b3?documentId=62fce322-a3c8-4bbb-a814-58bb222fb5e6&agendaItemId=49e2db46-f254-43fc-a249-fca43f3ee87f', type: 'GR' },
        { naam: 'Vijfde Wijziging GR Omgevingsdienst Haaglanden', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=bcac4e64-c98d-4ef3-b36e-1b9096a01f49&agendaItemId=d2c97976-d38a-4871-873a-9f2cdbdff127', type: 'GR' },
        { naam: 'Startnotitie Participatie Omgevingsvisie', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=fdfc6f6c-abfb-43f6-be46-0633fba4efeb&agendaItemId=ceb200d6-e05c-4b44-97fc-aa1e3f2a547b', type: 'Visie/Strategie' },
        { naam: 'Verordening uitvoering en handhaving omgevingsrecht Wassenaar 2023', datum: '2022-12-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/007f68bb-39a0-4d61-b0c5-0ff9c80a17b6?documentId=bd24611c-ca7f-4fc4-be30-971b7333be0b&agendaItemId=cab9ca33-397c-445a-ab50-4de769cc7668', type: 'Verordening' },
        { naam: 'Verordening Instelling Adviescommissie Omgevingskwaliteit Wassenaar', datum: '2022-12-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/007f68bb-39a0-4d61-b0c5-0ff9c80a17b6?documentId=8da7cd55-a6a0-4929-a30a-3baad7668d51&agendaItemId=10d0e800-c32e-4dd4-bb44-9a74e4b68530', type: 'Verordening' },
        { naam: 'Verordening Nadeelcompensatie Wassenaar 2022', datum: '2023-01-31', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/740c48f5-0e49-4d82-b0c9-b114c1340d30?documentId=c63db7ff-6d6a-4396-9de8-821479a64af0&agendaItemId=655048be-95fa-405f-bb5d-09cd9a402cf7', type: 'Verordening' },
        { naam: 'Uitwerking Omgevingswet: Beleidsregels Milieuzonering Richtafstanden Wassenaar 2024', datum: '2024-09-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/fe0355bd-d666-4cfe-84c7-5e2258e929e4?documentId=977d39f6-fe1b-4ac0-a91d-5b1b602d0a21&agendaItemId=eb7a24cf-8c2b-411b-a7d9-ba80d8293dc6', type: 'Beleidsregels' },
        { naam: 'Regionale Omgevingsagenda 2040, Aan de slag met Hart van Holland', datum: '2020-10-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/b390ea74-6552-4de8-a424-875cf2bb23a4', type: 'Besluit' },
        { naam: 'Buitenplanse activiteiten met een verplichte participatie-eis inclusief toetsingskader participatie Omgevingswet', datum: '2021-06-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/882466ce-f51b-4725-a425-ed7107e7750b?documentId=9c6ae5f5-35a4-4487-8b80-1df4e158ba5e&agendaItemId=da266e41-4f68-44f9-b9df-9bd4c1af8459', type: 'Besluit' },
        { naam: 'Buitenplanse activiteiten met een adviesrecht met instemming van de raad (verzwaard adviesrecht)', datum: '2021-06-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/2396fdb4-4afa-4e65-a780-a47524e033d3', type: 'Besluit' },
        { naam: 'Herijking/aanscherping van het beleid t.a.v. zonnepanelen in beschermd dorpsgezicht/monumenten vrijgeven voor inspraak', datum: '2021-07-13', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Calendar?year=2021', type: 'Besluit' },
        { naam: 'Besluit delegatie aan college partiële wijziging of actualisering omgevingsplan', datum: '2021-09-21', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/280573e8-fc6e-4084-915c-62db9582fb3e', type: 'Besluit' },
        { naam: 'Uitwerking begrip \'initiatieven met veel impact\' ten behoeve van Verzwaard Adviesrecht en verplichte participatie', datum: '2023-10-30', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/ba97caee-7645-4ab4-819b-8d3d5557bafd?documentId=9c6ae5f5-35a4-4487-8b80-1df4e158ba5e&agendaItemId=da266e41-4f68-44f9-b9df-9bd4c1af8459', type: 'Besluit' },
        { naam: 'Uitwerking Omgevingswet: Nota Hogere Waarden Verkeerslawaai Wassenaar 2023', datum: '2024-03-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a514a1cb-10c7-4af5-9fdc-2346c18996d6?documentId=56916eae-e133-49fa-b50b-2282a64c48c8&agendaItemId=30863947-c20f-4e26-a56d-6e3b0e15357c', type: 'Besluit' },
        { naam: 'Uitwerking Omgevingswet: Nota Hogere Waarden Verkeerslawaai Wassenaar 2024', datum: '2024-09-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/fe0355bd-d666-4cfe-84c7-5e2258e929e4?documentId=9702fdf6-75c5-4207-be22-6246d4aba4ce&agendaItemId=4f6181b7-d8f7-4e1c-8cbf-82f4f9b84a6d', type: 'Besluit' }
    ],
    '8.3': [
        { naam: 'Startnotitie Woonvisie Wassenaar', datum: '2019-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Calendar?year=2019', type: 'Visie/Strategie' },
        { naam: 'Vaststellen Woonvisie Wassenaar 2021-2025 \'Grip op Wonen\'', datum: '2021-03-30', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Calendar?year=2021', type: 'Visie/Strategie' },
        { naam: 'Tweede wijziging Huisvestingsverordening Wassenaar 2023', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=f4dfcc53-672e-4d58-aa9e-edaa034c860b&agendaItemId=a46c480a-6a05-4612-87a9-9bef1fc58382', type: 'Verordening' },
        { naam: 'Rekenkamer Rapportage onderzoek effectiviteit woonbeleid', datum: '2025-03-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=d674b892-42ee-4daa-85db-23fb769822a3&agendaItemId=c8a1ad52-ac18-4100-abbe-5d9e9361c0f0', type: 'Rekenkameronderzoek' },
        { naam: 'Startnotitie Scenariostudies locatie Kerkehout', datum: '2021-10-12', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/ce0a8157-c4ef-480a-ad55-8e29331fadda', type: 'Besluit' },
        { naam: 'Verkoopprocedure en ontwikkelkader Den Deylschool', datum: '2021-11-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Index/f72bff25-4c77-4eb1-9b1c-2a87d82ee9c3', type: 'Besluit' },
        { naam: 'Vaststelling herijkte criteria m.b.t. zonnepanelen- en collectoren in beschermd dorpsgezicht en op en bij monumenten en beeldbepalende panden', datum: '2021-12-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Calendar?year=2021', type: 'Besluit' },
        { naam: 'Handboek Welstand en Beeldkwaliteit Wassenaar', datum: '2022-09-20', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/0b97ccee-b363-4c03-8a89-e8d16a14150b?documentId=01247080-11e4-4299-a2a9-2700c9590cf8&agendaItemId=ac4c9f68-2971-4ed3-885a-285dadf772a0', type: 'Besluit' },
        { naam: 'Uitbreiding capaciteit wonen', datum: '2023-03-07', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a55aa31d-785b-447a-86ec-ca0ee2b93e96?documentId=57e94d51-76d8-487a-97ff-13cb512135d3&agendaItemId=3b4dd2c4-111a-42e8-80cf-6f4dfd03b10f', type: 'Besluit' },
        { naam: 'Ondertekening Regionale Realisatieagenda Haaglanden', datum: '2023-03-07', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a55aa31d-785b-447a-86ec-ca0ee2b93e96?documentId=40f3567b-47cf-4bc6-98e3-2d41c385e5b3&agendaItemId=6b0dcd3f-bb60-4832-9fbb-72f44919c036', type: 'Besluit' },
        { naam: 'Verzwaard adviesrecht voor de herontwikkeling van de voormalige Den Deylschool naar woningbouw', datum: '2025-03-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=80839160-18ed-478e-9776-23cd58fcd000&agendaItemId=284d5597-6661-42a4-a3cb-5ebfbf623049', type: 'Besluit' },
        { naam: 'Nota Woonbeleid gemeente Wassenaar 2025', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=4ba7165c-8bb0-45cd-922b-a358eae33864&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d', type: 'Besluit' },
        { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=cc8bf828-300a-4098-9198-dc67d2e0a15c&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b', type: 'Visie/Strategie' }
    ]
};

const BELEIDSNOTA_PER_HOOFDSTUK_BBV = {
    0: [
        { naam: 'Begroting 2026', datum: '2025-11-04', link: 'https://www.wassenaar.nl/begroting-2026', type: 'Begroting' },
        { naam: 'Kadernota 2026', datum: '2025-07-01', link: 'https://cuatro.sim-cdn.nl/wassenaar/uploads/Kadernota%20%202026.pdf?cb=CQc9rqSd', type: 'Kadernota' },
        { naam: 'Organogram gemeente Wassenaar', datum: '2026-01-01', link: 'https://cuatro.sim-cdn.nl/wassenaar/uploads/Organogram%20gemeente%20Wassenaar%20januari%202026.pdf?cb=Eidtrwq1', type: 'Organisatie' },
        { naam: 'Gemeenschappelijke regelingen', link: 'https://organisaties.overheid.nl/40204/Gemeente_Wassenaar#gemeenschappelijke-regelingen', type: 'Overzicht', toelichting: 'Overzicht GR\'s op Overheid.nl.' }
    ],
    1: [
        { naam: 'Integraal Veiligheidsbeleid 2024–2027', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/df32a5b8-1b14-4a96-b325-bd3af644cc9f?documentId=d55bb8d1-54e5-473f-8302-33434af5914c&agendaItemId=77e257f7-68bb-42a3-92ae-8a2628d2a666', type: 'Beleidsnota' },
        { naam: 'Beleidsplan aanpak ondermijnende criminaliteit 2025–2028', datum: '2024-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/0a14e050-9de3-4e7e-8bab-7bb8070542e4?documentId=a24853bd-064b-4a21-85f2-306e94ce08f9&agendaItemId=471de35e-33ab-41a0-9911-6fdcaa82d461', type: 'Beleidsplan' }
    ],
    2: [
        { naam: 'Wegencategoriseringsplan Wassenaar', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a68138b4-d094-4124-8798-4b0d774c009b?documentId=3a10e3a7-42a0-4d1d-b2d5-4665bcb18442&agendaItemId=fecb037d-9434-46c1-8d7c-d88b5082b02a', type: 'Beleidsplan', toelichting: 'Raad 17 dec 2025; invoering nieuwe snelheidsregimes o.a. per 27 feb 2026.' }
    ],
    3: [
        { naam: 'Economische Visie Wassenaar 2025', datum: '2025-09-22', link: 'https://www.wassenaar.nl/economische-visie-wassenaar', type: 'Beleidsnota' },
        { naam: 'Visie voor De Wassenaarse Slag', datum: '2025-03-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=ae1f505f-1c39-4f65-af01-7ef35f1d053a&agendaItemId=6038eaee-e37d-4d6d-a760-a222db95d7a6', type: 'Beleidsnota', toelichting: 'Raad 4 mrt 2025 (geamendeerd).' }
    ],
    4: [
        { naam: 'Herijking IHP onderwijs 2024–2039', datum: '2025-04-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/271db830-fe76-477f-ac64-1d68e329da63?documentId=5aa88524-fe67-4a2e-8234-a90daad8e049&agendaItemId=126c9ef7-1bf2-4c4b-b4fc-237d2a77a14a', type: 'Beleidsnota' }
    ],
    5: [
        { naam: 'Sportvisie Wassenaar 2025', datum: '2025-09-22', link: 'https://cuatro.sim-cdn.nl/wassenaar/uploads/sportvisie_wassenaar_2025.pdf?cb=LEruT1mN', type: 'Beleidsnota', toelichting: 'PDF gemeente (SIM-cdn); visie ook onder tegel 5.1.' }
    ],
    6: [
        { naam: 'Beleidsplan Sociaal Domein Wassenaar', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=7d19ea73-f4f2-4fe0-853e-c77fe1f77c5e&agendaItemId=84887548-5c4b-4211-a5fd-1bd690ee2fe5', type: 'Beleidsplan', toelichting: 'Raad 4 jun 2024 (geamendeerd). Link: bijlage 1 (beleidsplan). Raadsvoorstel/raadsbesluit niet als aparte bijlage in deze lijst (mutatielijst H6).',
          context: {
              vergadering: 'Raadsvergadering 4 juni 2024',
              agendapunt: '14',
              stemming: 'Geamendeerd vastgesteld',
              samenvatting: 'Richtinggevend kader sociaal domein 2024–2027. Missie: iedereen in Wassenaar kan meedoen. Focus op preventie, vroeg signalering en versterking van de sociale basis. Geamendeerd op advies van de Adviesraad Sociaal Domein.',
              stukken: [
                  { label: 'Beleidsplan (aangepast conform raadsbesluit)', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=7d19ea73-f4f2-4fe0-853e-c77fe1f77c5e&agendaItemId=84887548-5c4b-4211-a5fd-1bd690ee2fe5', huidig: true },
                  { label: 'Advies Adviesraad Sociaal Domein', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=a7aca3e0-ab0b-4061-80d7-63301fa5a2d3&agendaItemId=84887548-5c4b-4211-a5fd-1bd690ee2fe5' },
                  { label: 'B&W-reactie op advies ASD', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=c349b273-ff0c-4199-a92e-638f051c7953&agendaItemId=84887548-5c4b-4211-a5fd-1bd690ee2fe5' }
              ]
          }
        },
        { naam: 'Lokaal Jeugdbeleid Wassenaar 2026', datum: '2025-11-25', link: 'https://www.wassenaar.nl/lokaal-jeugdbeleid', type: 'Beleidsnota' },
        { naam: 'Beleidsnota Ouderenbeleid 2025', datum: '2025-01-28', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/85393b37-a676-4ffb-a9f2-33b6f0d9b58b?documentId=79a101d9-552b-49cc-9d34-31f6923cc1a9&agendaItemId=6ac84012-a995-46de-b19f-d58cb5aa952a', type: 'Beleidsnota' },
        { naam: 'Beleidsnota schuldhulpverlening 2025–2028', datum: '2025-04-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/271db830-fe76-477f-ac64-1d68e329da63?documentId=8992182e-7fc7-4bdf-9874-f3ca5df4a8b1&agendaItemId=f537e129-28d2-4cea-8f4c-128ca0037086', type: 'Beleidsnota' },
        { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=847d0caa-b04b-493e-9d14-d72c9d85b640&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b', type: 'Startnotitie' },
        { naam: 'Verordening Adviesraad Sociaal Domein 2025', datum: '2025-06-03', link: 'https://lokaleregelgeving.overheid.nl/CVDR742966/1', type: 'Verordening', toelichting: 'Zelfde als tegel 6.1 — CVDR i.p.v. iBabs-raadsbesluit.' }
    ],
    7: [
        { naam: 'Nota bodembeheer Wassenaar 2023', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/87b901da-cc1c-46b4-9717-b5640708acc3?documentId=7d3f89b2-722b-4736-bec4-67cdb42fcb12&agendaItemId=e88332bc-f459-4f74-9ca4-08f6dd490a6e', type: 'Nota' },
        { naam: 'Integraal Waterketenplan 2024–2028 (Leidse regio)', datum: '2024-03-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/a514a1cb-10c7-4af5-9fdc-2346c18996d6?documentId=52c28a88-7328-4ae1-9cd7-b3a116d40445&agendaItemId=8ada5b45-3a51-4648-8e25-bd092cbe6c5c', type: 'Beleidsnota' },
        { naam: 'Beleidsregels Milieuzonering Richtafstanden 2024', datum: '2024-09-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/fe0355bd-d666-4cfe-84c7-5e2258e929e4?documentId=977d39f6-fe1b-4ac0-a91d-5b1b602d0a21&agendaItemId=eb7a24cf-8c2b-411b-a7d9-ba80d8293dc6', type: 'Beleidsregels' }
    ],
    8: [
        { naam: 'Startnotitie Participatie Omgevingsvisie', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=c42f813b-833e-4d65-af0a-c76e2824095d&agendaItemId=5abb6d11-0c07-463f-a4c0-10b66f8e58a8', type: 'Raadsvoorstel', toelichting: 'Raad 17 dec 2025 (geamendeerd vastgesteld). Streefdatum definitieve Omgevingsvisie: 1 april 2027.' },
        { naam: 'Eerste proeve Omgevingsvisie 2040', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=1937af73-dc95-419d-a95e-5081654dad2d&agendaItemId=c0a156c8-b6fa-4551-8378-b569e95f29af', type: 'Ontwerpdocument', toelichting: 'Niet als vastgestelde visie aangenomen (dec 2025); gevolgd door participatietraject.' },
        { naam: 'Nota Woonbeleid gemeente Wassenaar 2025', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=bdfb8868-7df2-422f-bfbe-dcd9528fbaa6&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d', type: 'Beleidsnota', toelichting: 'Twee derde nieuwbouw betaalbaar; uiteindelijk in volkshuisvestelijk programma onder Omgevingsvisie.' },
        { naam: 'Woonvisie Wassenaar 2021–2025 (Grip op wonen)', link: 'https://www.wassenaar.nl/_flysystem/media/woonvisie-wassenaar-2021-2025-grip-op-wonen.pdf', type: 'Visie', toelichting: 'Voorloper Nota Woonbeleid; gemeentelijke PDF.' },
        { naam: 'Beheervisie Openbare Ruimte 2024–2028', datum: '2023-09-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8b213f81-c9f8-4870-865e-cdd42cf0b09a?documentId=eacc1bd6-189f-47ee-bbb6-412c644c903e&agendaItemId=67f7fcd0-4f59-4473-98a9-b4c38f703d0a', type: 'Beheervisie', toelichting: 'Raadsbesluit 19 sep 2023; kader beheer openbare ruimte.' }
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
        const bbvMeta = isBBV ? (BBV_HOOFDSTUK_META[item.bbvIndex] || {}) : {};
        const icoon = isBBV ? (bbvMeta.icoon ? `<span class="dossier-icoon-wrap">${bbvMeta.icoon}</span>` : BBV_ICON) : (THEMA_ICONEN[naam] || '');
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
        if (isBBV && bbvMeta.kleur) {
            kaart.style.setProperty('--kaart-accent', bbvMeta.kleur.accent);
            kaart.style.borderLeftColor = bbvMeta.kleur.accent;
        }

        kaart.innerHTML = `
            <div class="dossier-kaart-header">
                <span class="dossier-kaart-icoon">${icoon}</span>
                <span class="dossier-kaart-naam">${escapeHtml(naam)}</span>
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
    const toonHoofdstukken = mode === 'overzicht';
    const ovEl = document.getElementById('dossierOverzicht');
    const detEl = document.getElementById('dossierDetail');
    if (ovEl) {
        ovEl.style.display = toonHoofdstukken ? '' : 'none';
        ovEl.setAttribute('aria-hidden', toonHoofdstukken ? 'false' : 'true');
    }
    if (detEl) detEl.style.display = mode === 'dossier' ? '' : 'none';
    document.body.classList.toggle('dossier-detail-open', mode === 'dossier');
    const zoekEl = document.getElementById('zoekResultaten');
    zoekEl.style.display = mode === 'zoekresultaten' ? '' : 'none';
    if (mode === 'zoekresultaten') zoekEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    const bbvShell = document.getElementById('bbvDossierShell');
    const subTegelsPortefeuille = document.getElementById('subTegels');
    const titelEl = document.getElementById('dossierTitel');
    if (bbvMode) {
        if (titelEl) titelEl.style.display = 'none';
        const meta = BBV_HOOFDSTUK_META[bbvIndex] || {};
        if (bbvShell) {
            bbvShell.hidden = false;
            if (meta.kleur) {
                bbvShell.style.setProperty('--bbv-accent', meta.kleur.accent);
                bbvShell.style.setProperty('--bbv-light', meta.kleur.light);
                bbvShell.style.setProperty('--bbv-lighter', meta.kleur.lighter);
            }
        }
        renderBbvHoofdstukHeader(bbvIndex);
        if (subTegelsPortefeuille) {
            subTegelsPortefeuille.innerHTML = '';
            subTegelsPortefeuille.style.display = 'none';
        }
        renderSubTegelsBBV(bbvIndex);
        document.getElementById('samenvattingGeselecteerdBlok').style.display = 'none';
        document.getElementById('samenvattingPerThemaBlok').style.display = 'none';
        document.getElementById('briefingBlok').style.display = 'none';
        document.getElementById('coalitieAkkoordBlok').style.display = 'none';
        const odBlok = document.getElementById('overdrachtsdossierBlok');
        if (odBlok) {
            const heeftOD = bbvIndex in OD_SAMENVATTING_PER_BBV;
            odBlok.style.display = heeftOD ? '' : 'none';
            if (heeftOD) loadOverdrachtsdossierContent(bbvIndex);
            else {
                const sumSect = document.getElementById('bbvHoofdstukSamenvatting');
                const sumInh = document.getElementById('bbvHoofdstukSamenvattingInhoud');
                const inh = document.getElementById('overdrachtsdossierInhoud');
                if (sumSect) sumSect.style.display = 'none';
                if (sumInh) sumInh.innerHTML = '';
                if (inh) inh.innerHTML = '';
            }
        }
        loadDossierBesluitenBBV(bbvIndex);
        showBeleidsnotaBlokBBV(bbvIndex, activeDossier.subFilter);
    } else {
        if (titelEl) { titelEl.textContent = thema; titelEl.style.display = ''; }
        if (bbvShell) {
            bbvShell.hidden = true;
            const oldHeader = bbvShell.querySelector('.bbv-hoofdstuk-header');
            if (oldHeader) oldHeader.remove();
        }
        if (subTegelsPortefeuille) subTegelsPortefeuille.style.display = '';
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

function renderBbvHoofdstukHeader(bbvIndex) {
    const shell = document.getElementById('bbvDossierShell');
    if (!shell) return;
    let header = shell.querySelector('.bbv-hoofdstuk-header');
    if (!header) {
        header = document.createElement('div');
        header.className = 'bbv-hoofdstuk-header';
        shell.prepend(header);
    }
    const meta = BBV_HOOFDSTUK_META[bbvIndex] || {};
    const naam = BBV_HOOFDTAAKVELDEN[bbvIndex] || `Hoofdstuk ${bbvIndex}`;
    const icoonHtml = meta.icoon || '';
    const ondertitel = meta.ondertitel || '';
    const introTekst = meta.intro || '';
    header.innerHTML = `
        <div class="bbv-hoofdstuk-icoon">${icoonHtml}</div>
        <div>
            <strong>${escapeHtml(naam)}</strong>
            ${ondertitel ? `<br><span class="bbv-hoofdstuk-ondertitel">${escapeHtml(ondertitel)}</span>` : ''}
        </div>`;
    let introEl = shell.querySelector('.bbv-hoofdstuk-intro');
    if (introTekst) {
        if (!introEl) {
            introEl = document.createElement('p');
            introEl.className = 'bbv-hoofdstuk-intro';
            header.after(introEl);
        }
        introEl.innerHTML = introTekst.split('\n\n').map(p => escapeHtml(p)).join('<br><br>');
    } else if (introEl) {
        introEl.remove();
    }
    header.style.cursor = 'pointer';
    header.title = `Terug naar ${naam}`;
    header.onclick = () => {
        activeDossier.subFilter = null;
        renderSubTegelsBBV(bbvIndex);
        loadDossierBesluitenBBV(bbvIndex);
        showBeleidsnotaBlokBBV(bbvIndex, null);
        updateBbvTaakveldContext(bbvIndex);
        const sumSect = document.getElementById('bbvHoofdstukSamenvatting');
        if (sumSect) sumSect.style.display = '';
    };
}

function renderSubTegelsBBV(bbvIndex) {
    const container = document.getElementById('bbvSubTegels');
    if (!container) return;
    container.innerHTML = '';
    const taakvelden = BBV_TAAKVELDEN_PER_HOOFDSTUK[bbvIndex];
    if (!taakvelden || !taakvelden.length) return;

    const heading = document.createElement('p');
    heading.className = 'bbv-tv-hint';
    heading.id = 'bbvTvHint';
    heading.textContent = 'Kies een taakveld — hover voor toelichting';
    container.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'bbv-taakveld-lijst';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Iv3-taakvelden');
    const subFilter = activeDossier && activeDossier.subFilter;
    taakvelden.forEach(tv => {
        const label = `${tv.code} ${tv.naam}`;
        const isActief = subFilter === tv.code;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'bbv-tv-item' + (isActief ? ' bbv-tv-item--actief' : '');
        card.setAttribute('role', 'option');
        card.setAttribute('aria-selected', isActief ? 'true' : 'false');
        const oms = (tv.omschrijving || '').trim();
        const niet = (tv.niet || '').trim();
        if (oms) {
            const fullTip = niet ? `${oms}\n\nNiet: ${niet}` : oms;
            card.setAttribute('title', `${label}\n\n${fullTip}`);
            card.setAttribute('aria-label', `${label}. ${oms}`);
        } else {
            card.setAttribute('title', label);
            card.setAttribute('aria-label', label);
        }
        card.innerHTML = `<span class="bbv-tv-code">${escapeHtml(tv.code)}</span><span class="bbv-tv-naam">${escapeHtml(tv.naam)}</span>`;
        card.onclick = () => {
            activeDossier.subFilter = activeDossier.subFilter === tv.code ? null : tv.code;
            renderSubTegelsBBV(bbvIndex);
            loadDossierBesluitenBBV(bbvIndex);
            showBeleidsnotaBlokBBV(bbvIndex, activeDossier.subFilter);
            updateBbvTaakveldContext(bbvIndex);
            const sumSect = document.getElementById('bbvHoofdstukSamenvatting');
            if (sumSect) sumSect.style.display = activeDossier.subFilter ? 'none' : '';
        };
        list.appendChild(card);
    });
    container.appendChild(list);
    updateBbvTaakveldContext(bbvIndex);
}

function loadDossierBesluitenBBV(bbvIndex) {
    const details = document.getElementById('dossierBesluiten');
    if (details) details.open = false; // standaard ingeklapt
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
        const mutatieBlokEl = document.getElementById('mutatieBlok');
        if (mutatieBlokEl) mutatieBlokEl.style.display = 'none';
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

function mergeBeleidsnotaLijsten(...lijsten) {
    const seen = new Set();
    const out = [];
    for (const lijst of lijsten) {
        if (!lijst || !lijst.length) continue;
        for (const n of lijst) {
            const key = `${n.naam || ''}|${n.link || ''}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(n);
        }
    }
    return out;
}

// ─── Beleidsnota voorstellen (Voorstel → Beoordeling → Publicatie) ───
// Acceptatie = besluit-wijzer.nl / localhost; productie = alles anders (geen mutatie-UI)
const IS_ACCEPTATIE = ['localhost','127.0.0.1','wassenaar.besluit-wijzer.nl'].includes(location.hostname);
const BELEIDSNOTA_API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5050/api'
    : 'https://api.besluit-wijzer.nl/api';

let goedgekeurdeVoorstellen = [];
let beleidsnotaAddScope = null;
let beleidsnotaAddUiInitialized = false;

async function fetchGoedgekeurdeVoorstellen() {
    try {
        const r = await fetch(`${BELEIDSNOTA_API_BASE}/beleidsbibliotheek/wassenaar/voorstellen`, {
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        });
        if (!r.ok) return;
        const data = await r.json();
        if (data && Array.isArray(data.items)) {
            goedgekeurdeVoorstellen = data.items;
        }
    } catch (e) { /* offline */ }
}

function getGoedgekeurdeVoorstellenForScope(bbvIndex, taakveldCode) {
    const code = taakveldCode || null;
    return goedgekeurdeVoorstellen.filter(r => {
        const s = r && r.scope;
        if (!s || s.bbvIndex !== bbvIndex) return false;
        return (s.taakveldCode || null) === code;
    });
}

function mapVoorstelToItem(rec) {
    return {
        naam: rec.titel,
        link: rec.link,
        type: 'Bijdrage',
        datum: rec.beoordeeldOp || rec.ingediendOp || null,
        toelichting: (rec.extra || '').trim(),
        _bijdrage: true,
        _bijdrageId: rec.id,
        _toevoegDatum: rec.beoordeeldOp || rec.ingediendOp || null
    };
}

async function submitVoorstel(record, statusEl) {
    const payload = {
        titel: record.titel,
        link: record.link,
        extra: record.extra || '',
        scope: record.scope
    };
    try {
        const r = await fetch(`${BELEIDSNOTA_API_BASE}/beleidsbibliotheek/wassenaar/voorstellen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });
        if (r.ok) {
            if (statusEl) statusEl.textContent = 'Bedankt! Je voorstel is ingediend en wordt beoordeeld door de redactie.';
            return 'ok';
        }
        if (r.status === 400) {
            if (statusEl) statusEl.textContent = 'Gegevens geweigerd. Controleer titel en link.';
            return 'error';
        }
        if (r.status === 429) {
            if (statusEl) statusEl.textContent = 'Te veel voorstellen vanaf dit netwerk. Probeer het later opnieuw.';
            return 'error';
        }
        if (statusEl) statusEl.textContent = 'Er ging iets mis op de server. Probeer het later opnieuw.';
        return 'error';
    } catch (e) {
        if (statusEl) statusEl.textContent = 'Geen verbinding met de server. Controleer je internetverbinding.';
        return 'error';
    }
}


function getTaakveldNaam(bbvIndex, taakveldCode) {
    const tvs = BBV_TAAKVELDEN_PER_HOOFDSTUK[bbvIndex] || [];
    const tv = tvs.find(t => t.code === taakveldCode);
    return tv ? tv.naam : '';
}

function getTaakveldInfo(bbvIndex, taakveldCode) {
    const tvs = BBV_TAAKVELDEN_PER_HOOFDSTUK[bbvIndex] || [];
    const tv = tvs.find(t => t.code === taakveldCode);
    if (!tv) return { naam: '', omschrijving: '', niet: '', toelichting: '', type: '' };
    return { naam: tv.naam || '', omschrijving: (tv.omschrijving || '').trim(), niet: (tv.niet || '').trim(), toelichting: (tv.toelichting || '').trim(), type: tv.type || '' };
}

/** Toont Iv3-context rechts wanneer een taakveld is gekozen */
function updateBbvTaakveldContext(bbvIndex) {
    const box = document.getElementById('bbvTaakveldContext');
    const p = document.getElementById('bbvTaakveldContextTekst');
    if (!box || !p) return;
    const sub = activeDossier && activeDossier.subFilter;
    if (!sub) {
        box.style.display = 'none';
        return;
    }
    const info = getTaakveldInfo(bbvIndex, sub);
    const kopEl = box.querySelector('.bbv-taakveld-context-kop');
    const typeLabel = info.type === 'Clustering' ? ' [clustering]' : '';
    if (kopEl) kopEl.textContent = `${sub} — ${info.naam || '(onbekend)'}${typeLabel}`;
    let tekst = info.omschrijving || '';
    if (info.niet) tekst += '\n\nNiet onder dit taakveld: ' + info.niet;
    if (info.toelichting) tekst += '\n\n⚙ ' + info.toelichting;
    p.textContent = tekst;
    box.style.display = '';
}

function populateScopeSelect(bbvIndex, taakveldCode) {
    const sel = document.getElementById('bnAddScope');
    if (!sel) return;
    sel.innerHTML = '';

    for (let i = 0; i <= 8; i++) {
        const hNaam = BBV_HOOFDTAAKVELDEN[i] || `Hoofdstuk ${i}`;
        const optH = document.createElement('option');
        optH.value = JSON.stringify({ bbvIndex: i, taakveldCode: null });
        optH.textContent = hNaam;
        if (i === bbvIndex && !taakveldCode) optH.selected = true;
        sel.appendChild(optH);

        const tvs = BBV_TAAKVELDEN_PER_HOOFDSTUK[i] || [];
        tvs.forEach(tv => {
            const code = tv.code || tv;
            const naam = tv.naam || code;
            const opt = document.createElement('option');
            opt.value = JSON.stringify({ bbvIndex: i, taakveldCode: code });
            opt.textContent = `   ${code} ${naam}`;
            if (i === bbvIndex && code === taakveldCode) opt.selected = true;
            sel.appendChild(opt);
        });
    }
}

function initBeleidsnotaAddUiOnce() {
    if (beleidsnotaAddUiInitialized) return;
    beleidsnotaAddUiInitialized = true;

    const modal = document.getElementById('bnAddModal');
    const overlay = document.getElementById('bnAddOverlay');
    const closeBtn = document.getElementById('bnAddModalSluit');
    const cancelBtn = document.getElementById('bnAddCancel');
    const saveBtn = document.getElementById('bnAddSave');

    const setOpen = (open) => {
        if (overlay) overlay.style.display = open ? 'block' : 'none';
        if (modal) modal.style.display = open ? 'flex' : 'none';
        if (open) {
            const t = document.getElementById('bnAddTitel');
            if (t) t.focus({ preventScroll: true });
        }
    };

    const close = () => {
        beleidsnotaAddScope = null;
        setOpen(false);
        const st = document.getElementById('bnAddStatus');
        if (st) st.textContent = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    const testBtn = document.getElementById('bnTestLink');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            const linkVal = (document.getElementById('bnAddLink').value || '').trim();
            if (!linkVal) {
                const st = document.getElementById('bnAddStatus');
                if (st) st.textContent = 'Vul eerst een link in om te testen.';
                return;
            }
            try {
                const u = new URL(linkVal);
                if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
                window.open(u.href, 'bw_linktest', 'width=900,height=700,scrollbars=yes,resizable=yes');
            } catch(e) {
                const st = document.getElementById('bnAddStatus');
                if (st) st.textContent = 'Ongeldige URL. Controleer de link.';
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const status = document.getElementById('bnAddStatus');
            if (!beleidsnotaAddScope) {
                if (status) status.textContent = 'Geen plek gekozen. Open een BBV-dossier en gebruik de knop opnieuw.';
                return;
            }

            const titel = (document.getElementById('bnAddTitel').value || '').trim();
            const link = (document.getElementById('bnAddLink').value || '').trim();
            const extra = (document.getElementById('bnAddExtra').value || '').trim();

            if (!titel) { if (status) status.textContent = 'Titel is verplicht.'; return; }
            if (!link) { if (status) status.textContent = 'Link is verplicht.'; return; }

            let urlObj = null;
            try { urlObj = new URL(link); } catch (e) {
                if (status) status.textContent = 'Link is geen geldige URL.';
                return;
            }
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                if (status) status.textContent = 'Alleen http/https links toegestaan.';
                return;
            }

            const scopeSel = document.getElementById('bnAddScope');
            let selectedScope = beleidsnotaAddScope;
            if (scopeSel && scopeSel.value) {
                try { selectedScope = JSON.parse(scopeSel.value); } catch(e) {}
            }

            const record = {
                titel,
                link: urlObj.href,
                extra: extra || '',
                scope: {
                    bbvIndex: selectedScope.bbvIndex,
                    taakveldCode: selectedScope.taakveldCode || null,
                    niveau: selectedScope.taakveldCode ? 'kindtegel' : 'hoofdniveau'
                }
            };

            saveBtn.disabled = true;
            const result = await submitVoorstel(record, status);
            saveBtn.disabled = false;

            if (result === 'ok') {
                document.getElementById('bnAddTitel').value = '';
                document.getElementById('bnAddLink').value = '';
                document.getElementById('bnAddExtra').value = '';
            }
        });
    }
}


function openBeleidsnotaAddModal(bbvIndex, taakveldCode) {
    initBeleidsnotaAddUiOnce();
    beleidsnotaAddScope = { bbvIndex, taakveldCode: taakveldCode || null };
    populateScopeSelect(bbvIndex, taakveldCode || null);

    const modal = document.getElementById('bnAddModal');
    const overlay = document.getElementById('bnAddOverlay');
    if (overlay) overlay.style.display = 'block';
    if (modal) modal.style.display = 'flex';
}

function showBeleidsnotaBlokBBV(bbvIndex, taakveldCode) {
    const blok = document.getElementById('beleidsnotaBlok');
    const lijst = document.getElementById('beleidsnotaLijst');
    if (!blok || !lijst) return;

    const hoofd = taakveldCode ? [] : (BELEIDSNOTA_PER_HOOFDSTUK_BBV[bbvIndex] || []);
    const sub = taakveldCode ? (BELEIDSNOTA_PER_TAAKVELD[taakveldCode] || []) : [];
    const bijdragen = getGoedgekeurdeVoorstellenForScope(bbvIndex, taakveldCode || null).map(mapVoorstelToItem);
    const items = mergeBeleidsnotaLijsten(hoofd, sub, bijdragen);

    blok.style.borderLeftColor = '#059669';
    if (!items.length) {
        lijst.innerHTML = '<li class="beleidsnota-item">Nog geen beleidsnota\'s voor dit BBV-onderdeel. Klik op "+ Beleidsnota voorstellen".</li>';
    } else {
        lijst.innerHTML = items.map(n => {
            const datumStr = n.datum ? formatDatumKort(n.datum) : '';
            const typeLabel = n.type && !(n._bijdrage && n.type === 'Bijdrage') ? `<span class="beleidsnota-type">${escapeHtml(n.type)}</span>` : '';
            const bijdrageBadge = n._bijdrage
                ? `<span class="beleidsnota-badge-recent" title="Ingediend door een bezoeker en goedgekeurd door de redactie.">Toegevoegd${n._toevoegDatum ? ' ' + formatDatumKort(n._toevoegDatum) : ''}</span>`
                : '';
            const meta = [typeLabel, datumStr ? `<span class="beleidsnota-datum">${datumStr}</span>` : ''].filter(Boolean).join(' \u00b7 ');
            const toelichtingHtml = n.toelichting ? `<p class="beleidsnota-toelichting">${escapeHtml(n.toelichting)}</p>` : '';

            if (n.context) {
                const uid = 'ctx-' + (n.naam || '').replace(/\W+/g, '-').substring(0, 40);
                const c = n.context;
                const stukkenHtml = (c.stukken || []).map(s =>
                    `<li class="ctx-stuk${s.huidig ? ' ctx-stuk--huidig' : ''}"><a href="${escapeHtml(s.link)}" target="_blank" rel="noopener">${escapeHtml(s.label)}${s.huidig ? ' ← huidig' : ''}</a></li>`
                ).join('');
                const contextPanel = `<div class="ctx-panel" id="${uid}" style="display:none">
                    <div class="ctx-test-banner">⚗ Testweergave besluitcontext — ter bespreking met strategen en concerncontroller</div>
                    <div class="ctx-body">
                        <p class="ctx-vergadering">${escapeHtml(c.vergadering)} · agendapunt ${escapeHtml(c.agendapunt)}</p>
                        <p class="ctx-stemming">${escapeHtml(c.stemming)}</p>
                        ${c.samenvatting ? `<p class="ctx-samenvatting">${escapeHtml(c.samenvatting)}</p>` : ''}
                        ${stukkenHtml ? `<p class="ctx-stukken-kop">Gerelateerde stukken:</p><ul class="ctx-stukken">${stukkenHtml}</ul>` : ''}
                        <a href="${escapeHtml(n.link)}" target="_blank" rel="noopener" class="ctx-open-btn">Open document ↗</a>
                    </div>
                </div>`;
                const toggleBtn = `<button class="ctx-toggle" onclick="var p=document.getElementById('${uid}');var open=p.style.display!=='none';p.style.display=open?'none':'';this.setAttribute('aria-expanded',!open);this.querySelector('.ctx-chevron').textContent=open?'▸':'▾'" aria-expanded="false"><span class="ctx-chevron">▸</span> ${escapeHtml(n.naam)}</button>`;
                const main = `${bijdrageBadge}${toggleBtn}${meta ? ` <span class="beleidsnota-meta">${meta}</span>` : ''}${toelichtingHtml}${contextPanel}`;
                return `<li class="beleidsnota-item beleidsnota-item--context"><div class="beleidsnota-item-main">${main}</div></li>`;
            }

            const linkHtml = n.link
                ? `<a href="${escapeHtml(n.link)}" target="_blank" rel="noopener" class="beleidsnota-link">${escapeHtml(n.naam)}</a>`
                : escapeHtml(n.naam);
            const main = `${bijdrageBadge}${linkHtml}${meta ? ` <span class="beleidsnota-meta">${meta}</span>` : ''}${toelichtingHtml}`;
            return `<li class="beleidsnota-item${n._bijdrage ? ' beleidsnota-item--bijdrage' : ''}"><div class="beleidsnota-item-main">${main}</div></li>`;
        }).join('');
    }
    blok.style.display = '';

    const mutatieBlok = document.getElementById('mutatieBlok');
    const addBtn = document.getElementById('beleidsnotaAddBtn');
    if (IS_ACCEPTATIE) {
        if (mutatieBlok) mutatieBlok.style.display = '';
        if (addBtn) {
            addBtn.textContent = '+ Document voorstellen';
            addBtn.onclick = () => openBeleidsnotaAddModal(bbvIndex, taakveldCode || null);
        }
    } else {
        if (mutatieBlok) mutatieBlok.style.display = 'none';
        if (addBtn) addBtn.style.display = 'none';
    }
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

    const cupStatusIcon = (val) => {
        const v = val.trim();
        if (v === 'ü') return '<span class="cup-status cup-status--gerealiseerd" title="Gerealiseerd" aria-label="Gerealiseerd">✓</span>';
        if (v === '!') return '<span class="cup-status cup-status--knelpunt" title="Aandachtspunt of knelpunt" aria-label="Aandachtspunt of knelpunt">!</span>';
        if (v === '') return '<span class="cup-status cup-status--gepland" title="Gepland of in behandeling" aria-label="Gepland of in behandeling">🏃</span>';
        return inlineMd(val);
    };

    const flushTable = () => {
        if (tableRows.length === 0) return;
        const isCup = currentChapter && /Bijlage 2/.test(currentChapter.title || '');
        let html = '<table class="overdracht-tabel"><tbody>';
        tableRows.forEach((row, i) => {
            const tag = i === 0 ? 'th' : 'td';
            const cells = row.map((c, j) => {
                const v = c.trim();
                if (isCup && i > 0 && j === 1 && (v === 'ü' || v === '!' || v === '')) return `<${tag}>${cupStatusIcon(v)}</${tag}>`;
                return `<${tag}>${inlineMd(v)}</${tag}>`;
            });
            html += '<tr>' + cells.join('') + '</tr>';
        });
        html += '</tbody></table>';
        currentContent.push(html);
        tableRows = [];
    };

    const flushParagraph = (text) => {
        const t = text.trim();
        if (!t) return;
        if (t === '---') return;
        const isCup = currentChapter && /Bijlage 2/.test(currentChapter.title || '');
        let html;
        if (isCup && t.includes('gerealiseerd') && t.includes('ü')) {
            html = escapeHtml(t.replace('(ü)', '').trim()) + ' ' + cupStatusIcon('ü');
        } else if (isCup && (t.includes('gepland') || t.includes('behandeling')) && t.includes('()')) {
            html = escapeHtml(t.replace('()', '').trim()) + ' ' + cupStatusIcon('');
        } else if (isCup && t.includes('knelpunt') && t.includes('!')) {
            html = escapeHtml(t.replace('(!)', '').trim()) + ' ' + cupStatusIcon('!');
        } else {
            html = inlineMd(t);
        }
        currentContent.push('<p>' + html + '</p>');
    };

    const flushList = (items) => {
        if (!items.length) return;
        currentContent.push('<ul>' + items.map(it => '<li>' + inlineMd(it) + '</li>').join('') + '</ul>');
    };
    const flushOlList = (olItems) => {
        if (!olItems.length) return;
        let html = '<ol type="I" class="lta-bevoegdheden">';
        olItems.forEach(content => {
            const parts = content.split('<br>');
            const safe = parts.map(p => inlineMd(p)).join('<br>');
            html += '<li>' + safe + '</li>';
        });
        html += '</ol>';
        currentContent.push(html);
    };

    const pushChapter = (title, content) => {
        if (!title) return;
        const body = content.join('\n');
        if (body) chapters.push({ title: stripPageNum(title), body });
    };

    let listItems = [];
    let olItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const h1 = line.match(/^#\s+(.+)$/);
        const h2 = line.match(/^##\s+(.+)$/);
        const h3 = line.match(/^###\s+(.+)$/);
        const isTable = line.trim().startsWith('|');
        const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);

        if (h1) {
            flushTable();
            flushList(listItems);
            flushOlList(olItems);
            listItems = [];
            olItems = [];
            if (currentChapter) {
                pushChapter(currentChapter.title, currentContent);
            }
            currentChapter = { title: h1[1] };
            currentContent = [];
        } else if (h2) {
            flushTable();
            flushList(listItems);
            flushOlList(olItems);
            listItems = [];
            olItems = [];
            currentContent.push('<h2>' + escapeHtml(stripPageNum(h2[1])) + '</h2>');
        } else if (h3) {
            flushTable();
            flushList(listItems);
            flushOlList(olItems);
            listItems = [];
            olItems = [];
            currentContent.push('<h3>' + escapeHtml(stripPageNum(h3[1])) + '</h3>');
        } else if (isTable) {
            flushList(listItems);
            flushOlList(olItems);
            listItems = [];
            olItems = [];
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            const isSeparator = cells.every(c => !c || /^-+$/.test(c));
            if (cells.some(c => c) && !isSeparator) tableRows.push(cells);
        } else if (line.trim() === 'Raadsbevoegdheid:' || line.trim() === 'Collegebevoegdheid:') {
            flushList(listItems);
            flushOlList(olItems);
            olItems = [];
            currentContent.push('<p class="lta-sectie-kop"><strong>' + escapeHtml(line.trim()) + '</strong></p>');
        } else if (/^(I{1,3}|IV|V|VI{0,3}|IX|X)\.\s+/.test(line.trim())) {
            if (tableRows.length > 0) flushTable();
            flushList(listItems);
            // Strip Romeins nummer uit tekst (ol type="I" voegt die automatisch toe)
            let content = line.trim().replace(/^(I{1,3}|IV|V|VI{0,3}|IX|X)\.\s+/, '');
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine.startsWith('Voorbeelden zijn') || nextLine.startsWith('De gemeenteraad')) {
                    content += '<br>' + nextLine;
                    i++;
                }
            }
            olItems.push(content);
        } else if (ulMatch) {
            if (tableRows.length > 0) flushTable();
            flushOlList(olItems);
            olItems = [];
            listItems.push(ulMatch[2].trim());
        } else if (line.trim()) {
            flushList(listItems);
            flushOlList(olItems);
            listItems = [];
            olItems = [];
            if (tableRows.length > 0) flushTable();
            flushParagraph(line);
        }
    }
    flushTable();
    flushList(listItems);
    flushOlList(olItems);
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

// BBV-index → OD-hoofdstuk (deeplink overdrachtsdossier.html#od-ch-X)
const BBV_TO_OD_CHAPTER = { 0: 8, 1: 12, 2: 13, 3: 15, 4: 16, 5: 16, 6: 14, 7: 13, 8: 13 };

/** Eerste twee top-level <p>\'s (opeenvolgend vanaf het begin) naar samenvatting; rest = verdieping. */
function splitOverdrachtHtmlToSummaryAndRest(htmlString) {
    const wrap = document.createElement('div');
    wrap.innerHTML = htmlString || '';
    const summaryParts = [];
    let taken = 0;
    const maxP = 2;
    while (taken < maxP) {
        const ch = wrap.firstElementChild;
        if (!ch || ch.tagName !== 'P') break;
        summaryParts.push(ch.outerHTML);
        ch.remove();
        taken++;
    }
    return {
        summaryHtml: summaryParts.join(''),
        remainderHtml: wrap.innerHTML.trim()
    };
}

function loadOverdrachtsdossierContent(bbvIndex) {
    const blok = document.getElementById('overdrachtsdossierBlok');
    const container = document.getElementById('overdrachtsdossierInhoud');
    const bron = document.getElementById('overdrachtsdossierBron');
    const odLink = document.getElementById('overdrachtsdossierLink');
    const sumSect = document.getElementById('bbvHoofdstukSamenvatting');
    const sumInh = document.getElementById('bbvHoofdstukSamenvattingInhoud');
    if (!container) return;

    const od = OD_SAMENVATTING_PER_BBV[bbvIndex];
    if (!od) {
        if (sumSect) sumSect.style.display = 'none';
        if (sumInh) sumInh.innerHTML = '';
        if (blok) blok.style.display = 'none';
        return;
    }

    const odCh = BBV_TO_OD_CHAPTER[bbvIndex];
    if (odLink && odCh != null) {
        odLink.href = `overdrachtsdossier.html#od-ch-${odCh}`;
    }

    const ibabs = 'https://wassenaar.bestuurlijkeinformatie.nl/';
    const fullHtml = typeof od.html === 'function' ? od.html(ibabs) : od.html;
    const { summaryHtml, remainderHtml } = splitOverdrachtHtmlToSummaryAndRest(fullHtml || '');

    const combinedHtml = [summaryHtml, remainderHtml].filter(Boolean).join('<hr class="od-scheiding">');
    if (sumInh) sumInh.innerHTML = combinedHtml || '';
    if (sumSect) sumSect.style.display = combinedHtml ? '' : 'none';

    container.innerHTML = '';
    if (bron) bron.textContent = '';
    if (blok) blok.style.display = 'none';
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
    const details = document.getElementById('dossierBesluiten');
    if (details) details.open = false; // standaard ingeklapt
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

// ─── Zoekfunctie (gegroepeerd: beleidsnota's, taakvelden, OD, besluiten) ───

function zoekNormalize(s) {
    if (!s) return '';
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function zoekStem(term) {
    let s = term;
    if (s.length > 6) s = s.replace(/(ering|elijk|ische|heid|ting|ing|end|ige|ste)$/, '');
    return s.length >= 4 ? s : term;
}

function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    let curr = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

let _zoekWoordenIndex = null;
function getZoekWoordenIndex() {
    if (_zoekWoordenIndex) return _zoekWoordenIndex;
    const woorden = new Set();
    function addWords(s) {
        if (!s) return;
        zoekNormalize(s).split(/[^a-z0-9]+/).forEach(w => {
            if (w.length >= 3) woorden.add(w);
        });
    }
    for (const items of Object.values(BELEIDSNOTA_PER_HOOFDSTUK_BBV)) {
        (items || []).forEach(i => addWords(i.naam + ' ' + (i.type || '')));
    }
    for (const items of Object.values(BELEIDSNOTA_PER_TAAKVELD)) {
        (items || []).forEach(i => addWords(i.naam + ' ' + (i.type || '')));
    }
    for (const tvs of Object.values(BBV_TAAKVELDEN_PER_HOOFDSTUK)) {
        (tvs || []).forEach(tv => addWords(tv.naam + ' ' + tv.omschrijving));
    }
    for (const od of Object.values(OD_SAMENVATTING_PER_BBV)) {
        const h = typeof od.html === 'function' ? od.html() : (od.html || '');
        addWords(String(h).replace(/<[^>]*>/g, ' '));
    }
    Object.values(BBV_HOOFDTAAKVELDEN).forEach(n => addWords(n));
    _zoekWoordenIndex = woorden;
    return woorden;
}

function fuzzyVindBesteTerm(term, maxAfstand) {
    maxAfstand = maxAfstand || 2;
    if (term.length < 4) return null;
    const woorden = getZoekWoordenIndex();
    let beste = null, besteAfstand = maxAfstand + 1;
    for (const w of woorden) {
        if (Math.abs(w.length - term.length) > maxAfstand) continue;
        const d = levenshtein(term, w);
        if (d > 0 && d < besteAfstand) {
            besteAfstand = d;
            beste = w;
            if (d === 1) break;
        }
    }
    return besteAfstand <= maxAfstand ? beste : null;
}

function zoekScoreEnkel(text, term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp('\\b' + escaped + '\\b', 'i').test(text)) return 3;
    if (new RegExp('\\b' + escaped, 'i').test(text)) return 2;
    if (text.includes(term)) return 1.5;
    const stem = zoekStem(term);
    if (stem !== term) {
        const stemEsc = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp('\\b' + stemEsc + '\\w', 'i').test(text)) return 1;
    }
    return 0;
}

function zoekSplitTerms(q) {
    return q.trim().split(/\s+/).filter(t => t.length >= 2);
}

function zoekScore(text, term) {
    const termen = zoekSplitTerms(term);
    if (termen.length <= 1) return zoekScoreEnkel(text, term);
    let totaal = 0;
    for (const t of termen) {
        const s = zoekScoreEnkel(text, t);
        if (s === 0) return 0;
        totaal += s;
    }
    return totaal;
}

function zoekMatch(text, term) {
    return zoekScore(text, term) > 0;
}

function zoekHighlight(tekst, term) {
    if (!tekst || !term) return escapeHtml(tekst || '');
    const safe = escapeHtml(tekst);
    const termen = zoekSplitTerms(term.trim().toLowerCase());
    if (!termen.length) return safe;
    const parts = [];
    for (const t of termen) {
        const stem = zoekStem(t);
        const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const stemEsc = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        parts.push(escaped + '\\w*');
        if (stem !== t) parts.push(stemEsc + '\\w*');
    }
    const pattern = new RegExp('(' + parts.join('|') + ')', 'gi');
    return safe.replace(pattern, '<mark class="zoek-markering">$1</mark>');
}

function zoekContextSnippet(tekst, term, maxLen) {
    if (!tekst) return '';
    maxLen = maxLen || 250;
    const lowerTekst = tekst.toLowerCase();
    const termen = zoekSplitTerms(term.toLowerCase());
    const lowerTerm = termen[0] || term.toLowerCase();
    const stem = zoekStem(lowerTerm);
    let pos = lowerTekst.indexOf(lowerTerm);
    if (pos < 0 && stem !== lowerTerm) {
        pos = lowerTekst.indexOf(stem);
    }
    if (pos < 0) return tekst.substring(0, maxLen) + (tekst.length > maxLen ? '…' : '');
    const margin = Math.floor((maxLen - lowerTerm.length) / 2);
    let start = Math.max(0, pos - margin);
    let end = Math.min(tekst.length, pos + lowerTerm.length + margin);
    if (start > 0) {
        const sp = tekst.indexOf(' ', start);
        if (sp > 0 && sp < start + 20) start = sp + 1;
    }
    if (end < tekst.length) {
        const sp = tekst.lastIndexOf(' ', end);
        if (sp > end - 20) end = sp;
    }
    let snippet = tekst.substring(start, end);
    if (start > 0) snippet = '…' + snippet;
    if (end < tekst.length) snippet += '…';
    return snippet;
}

function setZoekSuggestiesOpen(open) {
    const sugEl = document.getElementById('zoekSuggesties');
    const inp = document.getElementById('searchInput');
    if (sugEl) {
        sugEl.classList.toggle('is-open', !!open);
        sugEl.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (inp) inp.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function handleSearch() {
    const term = document.getElementById('searchInput').value.trim();
    if (!term) {
        if (viewMode === 'zoekresultaten') showView('overzicht');
        return;
    }

    setZoekSuggestiesOpen(false);

    const q = zoekNormalize(term);
    const groepen = [];

    // 1) Beleidsnota's per hoofdstuk
    const notaResultaten = [];
    for (const [idx, items] of Object.entries(BELEIDSNOTA_PER_HOOFDSTUK_BBV)) {
        const hNaam = BBV_HOOFDTAAKVELDEN[idx] || `Hoofdstuk ${idx}`;
        (items || []).forEach(item => {
            const score = zoekScore(zoekNormalize(item.naam + ' ' + (item.type || '')), q);
            if (score > 0) {
                notaResultaten.push({ ...item, context: hNaam, bbvIndex: parseInt(idx), _score: score });
            }
        });
    }
    // 1b) Beleidsnota's per taakveld
    for (const [code, items] of Object.entries(BELEIDSNOTA_PER_TAAKVELD)) {
        (items || []).forEach(item => {
            const al = notaResultaten.some(r => r.naam === item.naam && r.link === item.link);
            if (!al) {
                const score = zoekScore(zoekNormalize(item.naam + ' ' + (item.type || '')), q);
                if (score > 0) {
                    const hi = parseInt(code);
                    const hNaam = BBV_HOOFDTAAKVELDEN[hi] || `Taakveld ${code}`;
                    notaResultaten.push({ ...item, context: `${code} — ${hNaam}`, bbvIndex: hi, taakveldCode: code, _score: score });
                }
            }
        });
    }
    notaResultaten.sort((a, b) => b._score - a._score);
    if (notaResultaten.length > 0) {
        groepen.push({ titel: 'Beleidsdocumenten', icoon: '📄', items: notaResultaten, type: 'nota' });
    }

    // 2) Taakvelden (naam + omschrijving)
    const tvResultaten = [];
    for (const [idx, tvs] of Object.entries(BBV_TAAKVELDEN_PER_HOOFDSTUK)) {
        const hNaam = BBV_HOOFDTAAKVELDEN[idx] || '';
        (tvs || []).forEach(tv => {
            const text = zoekNormalize([tv.code, tv.naam, tv.omschrijving, hNaam].join(' '));
            const score = zoekScore(text, q);
            if (score > 0) {
                tvResultaten.push({ code: tv.code, naam: tv.naam, omschrijving: tv.omschrijving, hoofdstuk: hNaam, bbvIndex: parseInt(idx), _score: score });
            }
        });
    }
    tvResultaten.sort((a, b) => b._score - a._score);
    if (tvResultaten.length > 0) {
        groepen.push({ titel: 'Taakvelden', icoon: '🏛', items: tvResultaten, type: 'taakveld' });
    }

    // 3) OD-samenvattingen
    const odResultaten = [];
    for (const [idx, od] of Object.entries(OD_SAMENVATTING_PER_BBV)) {
        const hNaam = BBV_HOOFDTAAKVELDEN[idx] || '';
        const rawHtml = typeof od.html === 'function' ? od.html() : (od.html || od.tekst || '');
        const odTekst = String(rawHtml).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const text = zoekNormalize(hNaam + ' ' + odTekst + ' ' + (od.bron || ''));
        const score = zoekScore(text, q);
        if (score > 0) {
            odResultaten.push({ hoofdstuk: hNaam, volledigeTekst: odTekst, bbvIndex: parseInt(idx), _score: score });
        }
    }
    odResultaten.sort((a, b) => b._score - a._score);
    if (odResultaten.length > 0) {
        groepen.push({ titel: 'Overdrachtsdossier', icoon: '📋', items: odResultaten, type: 'od' });
    }

    let fuzzySuggestie = null;
    if (groepen.reduce((s, g) => s + g.items.length, 0) === 0) {
        const correctie = fuzzyVindBesteTerm(q);
        if (correctie) {
            fuzzySuggestie = correctie;
            const fq = correctie;
            for (const [idx, items] of Object.entries(BELEIDSNOTA_PER_HOOFDSTUK_BBV)) {
                const hNaam = BBV_HOOFDTAAKVELDEN[idx] || `Hoofdstuk ${idx}`;
                (items || []).forEach(item => {
                    const score = zoekScore(zoekNormalize(item.naam + ' ' + (item.type || '')), fq);
                    if (score > 0) notaResultaten.push({ ...item, context: hNaam, bbvIndex: parseInt(idx), _score: score * 0.5 });
                });
            }
            for (const [code, items] of Object.entries(BELEIDSNOTA_PER_TAAKVELD)) {
                (items || []).forEach(item => {
                    const al = notaResultaten.some(r => r.naam === item.naam && r.link === item.link);
                    if (!al) {
                        const score = zoekScore(zoekNormalize(item.naam + ' ' + (item.type || '')), fq);
                        if (score > 0) {
                            const hi = parseInt(code);
                            const hNaam = BBV_HOOFDTAAKVELDEN[hi] || `Taakveld ${code}`;
                            notaResultaten.push({ ...item, context: `${code} — ${hNaam}`, bbvIndex: hi, taakveldCode: code, _score: score * 0.5 });
                        }
                    }
                });
            }
            notaResultaten.sort((a, b) => b._score - a._score);
            if (notaResultaten.length > 0) groepen.push({ titel: 'Beleidsdocumenten', icoon: '📄', items: notaResultaten, type: 'nota' });

            for (const [idx, tvs] of Object.entries(BBV_TAAKVELDEN_PER_HOOFDSTUK)) {
                const hNaam = BBV_HOOFDTAAKVELDEN[idx] || '';
                (tvs || []).forEach(tv => {
                    const text = zoekNormalize([tv.code, tv.naam, tv.omschrijving, hNaam].join(' '));
                    const score = zoekScore(text, fq);
                    if (score > 0) tvResultaten.push({ code: tv.code, naam: tv.naam, omschrijving: tv.omschrijving, hoofdstuk: hNaam, bbvIndex: parseInt(idx), _score: score * 0.5 });
                });
            }
            tvResultaten.sort((a, b) => b._score - a._score);
            if (tvResultaten.length > 0) groepen.push({ titel: 'Taakvelden', icoon: '🏛', items: tvResultaten, type: 'taakveld' });

            for (const [idx, od] of Object.entries(OD_SAMENVATTING_PER_BBV)) {
                const hNaam = BBV_HOOFDTAAKVELDEN[idx] || '';
                const rawHtml = typeof od.html === 'function' ? od.html() : (od.html || od.tekst || '');
                const odTekst = String(rawHtml).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const text = zoekNormalize(hNaam + ' ' + odTekst + ' ' + (od.bron || ''));
                const score = zoekScore(text, fq);
                if (score > 0) odResultaten.push({ hoofdstuk: hNaam, volledigeTekst: odTekst, bbvIndex: parseInt(idx), _score: score * 0.5 });
            }
            odResultaten.sort((a, b) => b._score - a._score);
            if (odResultaten.length > 0) groepen.push({ titel: 'Overdrachtsdossier', icoon: '📋', items: odResultaten, type: 'od' });
        }
    }

    showView('zoekresultaten');
    activeDossier = null;
    renderZoekGroepen(groepen, fuzzySuggestie || term, fuzzySuggestie ? term : null);
}

function renderZoekGroepen(groepen, term, origineleTerm) {
    const container = document.getElementById('zoekGegroepeerd');
    const noEl = document.getElementById('zoekNoResults');
    const totaal = groepen.reduce((s, g) => s + g.items.length, 0);

    if (totaal === 0) {
        container.innerHTML = '';
        noEl.style.display = 'block';
        return;
    }
    noEl.style.display = 'none';

    let html = '';
    if (origineleTerm) {
        html += `<div class="zoek-fuzzy-hint">
            <p>Geen resultaten voor "<strong>${escapeHtml(origineleTerm)}</strong>".</p>
            <p>Bedoelde je: <button type="button" class="zoek-fuzzy-link" data-term="${escapeHtml(term)}">${escapeHtml(term)}</button>?</p>
        </div>`;
        html += `<p class="zoek-samenvatting">${totaal} resultaat${totaal !== 1 ? 'en' : ''} voor "<strong>${escapeHtml(term)}</strong>"</p>`;
    } else {
        html += `<p class="zoek-samenvatting">${totaal} resultaat${totaal !== 1 ? 'en' : ''} voor "<strong>${escapeHtml(term)}</strong>"</p>`;
    }

    groepen.forEach(g => {
        html += `<div class="zoek-groep">`;
        html += `<h3 class="zoek-groep-kop">${g.icoon} ${escapeHtml(g.titel)} <span class="zoek-groep-count">(${g.items.length})</span></h3>`;
        html += `<ul class="zoek-groep-lijst">`;

        if (g.type === 'nota') {
            g.items.forEach(item => {
                const typeLabel = item.type ? `<span class="zoek-item-type">${escapeHtml(item.type)}</span>` : '';
                const datumLabel = item.datum ? `<span class="zoek-item-datum">${item.datum}</span>` : '';
                const ctx = item.context ? `<span class="zoek-item-context">${escapeHtml(item.context)}</span>` : '';
                const linkAttr = item.link ? ` href="${escapeHtml(item.link)}" target="_blank" rel="noopener"` : '';
                html += `<li class="zoek-groep-item">
                    <a class="zoek-item-link"${linkAttr}>${zoekHighlight(item.naam, term)}</a>
                    <span class="zoek-item-meta">${typeLabel}${datumLabel}${ctx}</span>
                </li>`;
            });
        } else if (g.type === 'taakveld') {
            g.items.forEach(item => {
                html += `<li class="zoek-groep-item zoek-groep-item--klik" data-bbv="${item.bbvIndex}" data-tv="${item.code}">
                    <span class="zoek-item-link zoek-tv-link">${escapeHtml(item.code)} — ${zoekHighlight(item.naam, term)}</span>
                    <span class="zoek-item-meta"><span class="zoek-item-context">${escapeHtml(item.hoofdstuk)}</span></span>
                    <p class="zoek-item-omschrijving">${zoekHighlight(item.omschrijving, term)}</p>
                </li>`;
            });
        } else if (g.type === 'od') {
            g.items.forEach(item => {
                const snippet = zoekContextSnippet(item.volledigeTekst, term, 250);
                const odCh = BBV_TO_OD_CHAPTER[item.bbvIndex];
                const odUrl = `overdrachtsdossier.html?q=${encodeURIComponent(term)}${odCh != null ? '#od-ch-' + odCh : ''}`;
                html += `<li class="zoek-groep-item">
                    <a class="zoek-item-link zoek-od-link" href="${escapeHtml(odUrl)}">${escapeHtml(item.hoofdstuk)}</a>
                    <p class="zoek-item-omschrijving">${zoekHighlight(snippet, term)}</p>
                </li>`;
            });
        }

        html += `</ul></div>`;
    });

    container.innerHTML = html;

    container.querySelectorAll('.zoek-groep-item--klik').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            const bbvIdx = parseInt(el.dataset.bbv);
            const hNaam = BBV_HOOFDTAAKVELDEN[bbvIdx];
            if (!hNaam) return;
            const tvCode = el.dataset.tv || null;
            openDossier(hNaam, tvCode);
            setTimeout(() => markeerZoekterm(term, false), 300);
        });
    });

    container.querySelectorAll('.zoek-fuzzy-link').forEach(btn => {
        btn.addEventListener('click', () => {
            const nieuweTerm = btn.dataset.term;
            document.getElementById('searchInput').value = nieuweTerm;
            handleSearch();
        });
    });
}

function markeerZoekterm(term, scrollToOD) {
    const targets = [];
    if (scrollToOD) {
        const odInh = document.getElementById('bbvHoofdstukSamenvattingInhoud');
        if (odInh) targets.push(odInh);
    }
    const beleidsBlok = document.getElementById('beleidsnotaLijst');
    if (beleidsBlok) targets.push(beleidsBlok);

    if (targets.length === 0) return;

    const normTerm = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const stem = zoekStem(normTerm);
    const pattern = stem !== normTerm
        ? new RegExp(`(${normTerm}\\w*|${stem}\\w*)`, 'gi')
        : new RegExp(`(${normTerm}\\w*)`, 'gi');

    targets.forEach(el => {
        highlightTextNodes(el, pattern);
    });

    const firstMark = document.querySelector('.zoek-markering');
    if (firstMark) {
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function highlightTextNodes(root, pattern) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const matches = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement.closest('mark, .zoek-markering')) continue;
        if (pattern.test(node.textContent)) {
            matches.push(node);
        }
        pattern.lastIndex = 0;
    }
    matches.forEach(node => {
        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        const text = node.textContent;
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(text)) !== null) {
            if (m.index > lastIdx) {
                frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
            }
            const mark = document.createElement('mark');
            mark.className = 'zoek-markering';
            mark.textContent = m[0];
            frag.appendChild(mark);
            lastIdx = pattern.lastIndex;
        }
        if (lastIdx < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        }
        if (frag.childNodes.length > 0) {
            node.parentNode.replaceChild(frag, node);
        }
    });
}

function sluitZoekresultaten() {
    document.getElementById('searchInput').value = '';
    setZoekSuggestiesOpen(false);
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

// ─── Methodologie (in Compliance) ───

function renderMethodologie() {
    const container = document.getElementById('methodologieInhoud');
    if (!container) return;

    const dates = allDecisions.map(d => d.datum).filter(Boolean).sort();
    const newest = dates.length ? dates[dates.length - 1] : '—';
    const oldest = dates.length ? dates[0] : '—';

    container.innerHTML = `
        <p>De BeleidsBibliotheek verzamelt publicaties uit het <strong>Gemeenteblad</strong> via de SRU-API van
        <a href="https://repository.overheid.nl" target="_blank" rel="noopener">repository.overheid.nl</a>.
        Elke publicatie wordt automatisch geclassificeerd naar beleidsdomein op basis van type en trefwoorden in de titel.
        Alle data is openbaar en vrij beschikbaar. Elke publicatie bevat een directe link naar het origineel op
        <a href="https://zoek.officielebekendmakingen.nl" target="_blank" rel="noopener">zoek.officielebekendmakingen.nl</a>.</p>
        <p>Periode: <strong>${oldest}</strong> t/m <strong>${newest}</strong>
        · Laatst bijgewerkt: <strong>april 2026</strong></p>
    `;
}

// ─── Event listeners ───

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderMethodologie();
    fetchGoedgekeurdeVoorstellen().then(() => {
        if (typeof activeDossier !== 'undefined' && activeDossier && activeDossier.bbvMode) {
            showBeleidsnotaBlokBBV(activeDossier.bbvIndex, activeDossier.subFilter || null);
        }
    });

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
    // Zoeken
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
    });
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('zoekSluiten').addEventListener('click', sluitZoekresultaten);

    const headerZoekCombo = document.getElementById('headerZoekCombo');
    if (headerZoekCombo) {
        headerZoekCombo.addEventListener('focusin', () => setZoekSuggestiesOpen(true));
        headerZoekCombo.addEventListener('focusout', (e) => {
            if (!headerZoekCombo.contains(e.relatedTarget)) setZoekSuggestiesOpen(false);
        });
    }

    document.querySelectorAll('.zoek-chip').forEach(chip => {
        chip.addEventListener('mousedown', (e) => e.preventDefault());
        chip.addEventListener('click', () => {
            document.getElementById('searchInput').value = chip.dataset.zoek;
            handleSearch();
        });
    });

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

    // Zoekresultaten sluiten
    // (filters verwijderd — zoekresultaten zijn nu gegroepeerd)

    // Nav-links in groene balk — hash + click voor betrouwbare navigatie
    function navFromHash() {
        const hash = (location.hash || '').replace(/^#/, '');
        if (hash === 'overdrachtsdossier') showView('overdrachtsdossier');
        else if (hash === 'compliance') showView('compliance');
        else {
            if (activeDossier) sluitDossier();
            else showView('overzicht');
        }
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
