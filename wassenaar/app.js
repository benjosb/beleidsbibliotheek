// BeleidsBibliotheek Wassenaar v6.0 — dossier-first

// ─── Versiebeheer ───

/** Eerste semver-token uit badgetekst, e.g. "6.0.0 (maart 2026)" → "6.0.0" */
function versieNummerUitBadge(txt) {
    const m = (txt || '').trim().match(/^([\d.]+)/);
    return m ? m[1] : (txt || '').trim();
}

const VERSIE_MENU = [
    { versie: '6.0.0', naam: 'BeleidsBibliotheek', beschrijving: 'Huidige productie: dossiers, BBV, briefings, coalitieakkoord', url: 'index.html' },
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
<p>De financiële positie is stabiel voor 2026, maar vanaf 2028 zijn keuzes nodig om de begroting structureel sluitend te houden. Wassenaar gaat vanaf 2026 lenen voor investeringen (o.a. De Paauw, onderwijshuisvesting). De inkomsten uit het gemeentefonds zijn onzeker door het regeerakkoord en het verschoven ravijnjaar.</p>
<p><strong>Subsidiebeleid:</strong> Jaarlijkse vaststelling subsidieplafonds (2025: Economie €35.960, SAD €478.969, Volksgezondheid €34.228). Subsidieregeling structurele activiteiten (2024). Nieuw en herzien subsidiebeleid gerealiseerd; coalitie onderzoekt subsidies, fondsen en cofinanciering.</p>
<p>Regionale samenwerking is essentieel: Veiligheidsregio Haaglanden, GGD, Avalex, MRDH, Servicebureau Jeugdhulp. De Rekenkamer WVOLV onderzoekt de effectiviteit van de samenwerkingsverbanden; het rapport volgt in 2026.</p>
<h4>Relevante visies en beleidsdocumenten</h4>
<ul class="overdracht-doclist">
<li><a href="https://www.wassenaar.nl/coalitieakkoord" target="_blank" rel="noopener noreferrer">Coalitieakkoord 2022–2026</a> (VVD, CDA, D66, DLW, PvdA)</li>
<li><a href="https://www.wassenaar.nl/begroting-2026" target="_blank" rel="noopener noreferrer">Begroting 2026</a></li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/f771bed8-2066-4bd2-95c3-06287cc72379?agendaItemId=ee1e7028-db90-4250-bc31-f94f8a4459d5" target="_blank" rel="noopener noreferrer">Financiële Verordening en Controleprotocol 2025</a> (raadsbesluit 14-10-2025)</li>
<li><a href="https://www.wassenaar.nl/subsidieregelingen" target="_blank" rel="noopener noreferrer">Subsidiebeleid / Subsidieregelingen</a></li>
<li><a href="https://organisaties.overheid.nl/40204/Gemeente_Wassenaar#gemeenschappelijke-regelingen" target="_blank" rel="noopener noreferrer">Gemeenschappelijke regelingen</a> (Overheid.nl)</li>
<li><a href="https://cuatro.sim-cdn.nl/wassenaar/uploads/besluitenlijst_bw_vergadering_17_december_2024.pdf" target="_blank" rel="noopener noreferrer">Dienstverleningsmodel gemeente Wassenaar</a> (dec 2024, 0.2 Burgerzaken)</li>
</ul>`
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
        html: `<p>Wassenaar heeft acht basisscholen, twee middelbare scholen en twee internationale scholen. Het herijkte IHP 2024–2039 en de Lokale Educatieve Agenda (LEA) 2026–2037 bepalen de koers. Scholen spelen een grotere rol in vroegsignalering; samenwerking met STW en jeugdhulp is essentieel.</p>
<p>Een groeiende groep anderstalige kinderen stroomt in (expats, Oekraïners, statushouders). Taalondersteuning en ITK/ISK in Leiden zijn nodig. Leerplicht en Doorstroompunt worden uitgevoerd door Leidschendam-Voorburg.</p>
<p>Opgaven: groeiend aantal leerlingen, late instroom, capaciteitsplanning. Renovaties Kievietschool, Adelbert College, SKOW-fusieschool gepland. Relatief verzuim stijgt; preventie via De Overstap.</p>
<h4>Documenten (aanvulling)</h4>
<ul class="overdracht-doclist">
<li><a href="https://centraalplus.nl/2026/01/17/lokale-educatieve-agenda-van-wassenaar-ondertekend-een-horizon-waarmee-we-aan-de-slag-kunnen/" target="_blank" rel="noopener noreferrer">Lokale Educatieve Agenda (LEA) 2026–2037 — nieuws over ondertekening (jan 2026)</a> <em>(regionale omroep; geen kantoorstuk)</em></li>
<li><em>Zoek het formele stuk in</em> <a href="https://wassenaar.bestuurlijkeinformatie.nl/" target="_blank" rel="noopener noreferrer">iBabs Wassenaar</a> <em>of op wassenaar.nl — bron niet geverifieerd in deze bibliotheek.</em></li>
</ul>`
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
<h4>Documenten en instrumenten (selectie; volledige lijst onder Beleidsnota’s op BBV 8)</h4>
<ul class="overdracht-doclist">
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=416f5b70-c39b-47d4-b662-be73d3e71c63&agendaItemId=5abb6d11-0c07-463f-a4c0-10b66f8e58a8" target="_blank" rel="noopener noreferrer">Startnotitie Participatie Omgevingsvisie</a> (dec 2025)</li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=bdfb8868-7df2-422f-bfbe-dcd9528fbaa6&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d" target="_blank" rel="noopener noreferrer">Nota Woonbeleid gemeente Wassenaar 2025</a></li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/b40189c1-dcea-44f9-a416-e4120fa1eb15?agendaItemId=27762907-377f-4f73-a2ec-bcb9d7282f9f" target="_blank" rel="noopener noreferrer">Bestemmingsplan Residentie Parkzicht + beeldkwaliteitsplan (ANWB-locatie)</a></li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/2455d6c8-1c90-4564-be5b-62ee8bc8eb71?agendaItemId=fcf97e62-007f-4e8f-8d93-c6e6582496c1" target="_blank" rel="noopener noreferrer">Wensen en bedenkingen Concept-Programma Noordrand</a> (jun 2025)</li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=cc8bf828-300a-4098-9198-dc67d2e0a15c&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b" target="_blank" rel="noopener noreferrer">Startnotitie Lokale Woonzorgvisie</a> (sep 2025)</li>
<li><a href="https://zoek.officielebekendmakingen.nl/gmb-2023-261015.html" target="_blank" rel="noopener noreferrer">Delegatie tijdelijk deel omgevingsplan vaststellen</a> (Officiële Bekendmakingen)</li>
<li><em>+ ca. 25 verdere titels in het Beleidsnota-blok (Omgevingsplan, volkshuisvestelijk programma, milieuzonering, erfgoed→visie, enz.)</em></li>
</ul>`
    },
    6: {
        bron: 'Bron: OD hoofdstuk 7 — Sociaal Domein en asielopvang (papier aan raadsleden). Mapping: OD hoofdstuk 7 = BBV 6 (Sociaal domein).',
        html: (ibabs) => `<p>Het sociaal domein draait om drie wetten: de <strong>Wmo</strong>, de <strong>Jeugdwet</strong> en de <strong>Participatiewet</strong>. Voor Wmo en Jeugdwet is het Sociaal Team Wassenaar (STW) de toegangspoort. De gemeente richt zich op preventie: versterken van de sociale basis, toegankelijke informatie en passende ondersteuning. Verordeningen zijn vernieuwd.</p>
<p>De uitdagingen zijn groot: meer regie en samenwerking binnen een complexer zorglandschap. De kosten gaan vaak voor de baten uit. Samenwerking met huisartsen, scholen, zorgaanbieders en vrijwilligers is onmisbaar.</p>
<p>Investeren in de voorkant is noodzakelijk — vroeg hulp voorkomt later dure specialistische zorg. Dit vraagt om duidelijke keuzes. Zonder keuzes lopen de kosten verder op.</p>
<figure class="overdracht-figuur">
<img src="assets/beleidsmatig-overzicht-sociaal-domein.png" alt="Beleidsmatig overzicht Sociaal Domein: Beleidsplan, beleidsnota's en uitvoeringsprogramma's met aangrenzende beleidsterreinen" class="overdracht-infographic">
</figure>
<h4>Relevante visies en beleidsdocumenten</h4>
<ul class="overdracht-doclist">
<li><a href="https://www.wassenaar.nl/beleidsplan-sociaal-domein" target="_blank" rel="noopener noreferrer">Beleidsplan Sociaal Domein Wassenaar</a> (juni 2024)</li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/3e13ce7b-2972-4a14-9e63-5f8a03b8dde6?documentId=a7aca3e0-ab0b-4061-80d7-63301fa5a2d3&agendaItemId=b6056161-8751-4a89-852c-5b92234b07ad" target="_blank" rel="noopener noreferrer">Lokaal Jeugdbeleid Wassenaar 2026</a></li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/85393b37-a676-4ffb-a9f2-33b6f0d9b58b?documentId=79a101d9-552b-49cc-9d34-31f6923cc1a9&agendaItemId=6ac84012-a995-46de-b19f-d58cb5aa952a" target="_blank" rel="noopener noreferrer">Beleidsnota Ouderenbeleid 2025</a></li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=cc8bf828-300a-4098-9198-dc67d2e0a15c&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b" target="_blank" rel="noopener noreferrer">Startnotitie Lokale Woonzorgvisie</a> (sept 2025)</li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/Document/View/4700041f-c274-49ea-9dff-5ca26f4d5e28" target="_blank" rel="noopener noreferrer">Beleidsnota Schuldhulpverlening 2025–2028</a></li>
<li><a href="https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/37e4fd08-333d-4616-9304-e15b9444f657?documentId=e3b07e13-685f-4f44-9388-c2303d93a1e8&agendaItemId=36195d79-8757-4165-9b23-bcb9944b5d19" target="_blank" rel="noopener noreferrer">Verordening Adviesraad Sociaal Domein 2025</a></li>
</ul>`
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

// Sub-taakvelden per hoofdstuk (Iv3 / BBV — zie https://findo.nl/content/taakvelden-gemeenten )
// `omschrijving` = beknopte toelichting welke baten/lasten hier landen (niet ter vervanging van officiële Iv3-handleiding).
const BBV_TAAKVELDEN_PER_HOOFDSTUK = {
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
        { code: '5.1', naam: 'Sportbeleid en activering', omschrijving: 'Sportbeleid, subsidies en programma’s (niet de accommodaties zelf).' },
        { code: '5.2', naam: 'Sportaccommodaties', omschrijving: 'Sporthallen, velden, zwembaden en overige sportaccommodaties.' },
        { code: '5.3', naam: 'Cultuurpresentatie, cultuurproductie en cultuurparticipatie', omschrijving: 'Podia, cultuurprogramma’s en cultuurparticipatie (niet musea).' },
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
    '8.1': [ // Ruimte en leefomgeving — aanvulling op hoofdstuk 8 (merge met BELEIDSNOTA_PER_HOOFDSTUK_BBV[8])
        { naam: 'Startnotitie Participatie Omgevingsvisie', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=416f5b70-c39b-47d4-b662-be73d3e71c63&agendaItemId=5abb6d11-0c07-463f-a4c0-10b66f8e58a8', type: 'Startnotitie', toelichting: 'De raad heeft deze startnotitie vastgesteld (17 dec 2025). De Eerste proeve Omgevingsvisie 2040 is niet als vastgestelde visie aangenomen; de raad koos voor een nieuw participatietraject. Streefdatum vaststelling Omgevingsvisie: 1 april 2027.' }
    ],
    '8.3': [ // Wonen en bouwen — aanvulling op hoofdstuk 8
        { naam: 'Nota Woonbeleid gemeente Wassenaar 2025', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=bdfb8868-7df2-422f-bfbe-dcd9528fbaa6&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d', type: 'Beleidsnota' }
    ],
    // BBV 3 (Economie): algemene beleidsnota's staan op hoofdstukniveau — zie BELEIDSNOTA_PER_HOOFDSTUK_BBV[3]
    // BBV 4 (Onderwijs): zie BELEIDSNOTA_PER_HOOFDSTUK_BBV[4] (o.a. LEA, verordening leerlingenvervoer)
    // BBV 5 (Sport, cultuur, recreatie): zie BELEIDSNOTA_PER_HOOFDSTUK_BBV[5]
    // BBV 8 (Volkshuisvesting, leefomgeving, stedelijke vernieuwing): uitgebreide OD-lijst in BELEIDSNOTA_PER_HOOFDSTUK_BBV[8]
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
    // BBV 7: geen aparte TAAKVELD-lijst — stukken op hoofdstukniveau in BELEIDSNOTA_PER_HOOFDSTUK_BBV[7]
};

// Algemene beleidsnota's per BBV-hoofdstuk: zichtbaar zodra je het hoofdstuk opent (geen subtegel nodig), zelfde patroon als OD op de tegel.
const BELEIDSNOTA_PER_HOOFDSTUK_BBV = {
    1: [
        {
            naam: 'Integraal Veiligheidsbeleid 2024–2027 gemeente Wassenaar',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/df32a5b8-1b14-4a96-b325-bd3af644cc9f?documentId=d55bb8d1-54e5-473f-8302-33434af5914c&agendaItemId=77e257f7-68bb-42a3-92ae-8a2628d2a666',
            type: 'Beleidsnota',
            toelichting: 'Integraal veiligheidsbeleid — iBabs-document (controleer vergadering/stemming in iBabs).'
        }
    ],
    2: [
        {
            naam: 'Wegencategoriseringsplan Wassenaar',
            datum: '2025-12-17',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/3a10e3a7-42a0-4d1d-b2d5-4665bcb18442?agendaItemId=fecb037d-9434-46c1-8d7c-d88b5082b02a',
            type: 'Beleidsplan',
            toelichting: 'Vastgesteld door de raad 17 dec 2025; invoering nieuwe snelheidsregimes o.a. per 27 feb 2026 (zie besluittekst in iBabs). Zelfde link als in briefing Verkeer & Mobiliteit.'
        }
    ],
    3: [
        {
            naam: 'Economische Visie Wassenaar 2025',
            datum: '2025-09-22',
            link: 'https://www.wassenaar.nl/economische-visie-wassenaar',
            type: 'Beleidsnota',
            toelichting: 'Visie lokale economie — officiële gemeentepagina met PDF en bijlagen.'
        },
        {
            naam: 'Visie voor De Wassenaarse Slag',
            datum: '2025-03-04',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/90987d08-8b03-4da3-acdb-20a49b865b45?agendaItemId=2dae2006-9f02-48ab-b696-4d2a25349c42',
            type: 'Beleidsnota',
            toelichting: 'Strand en recreatie (economische promotie)'
        }
    ],
    4: [
        {
            naam: 'Lokale Educatieve Agenda (LEA) 2026–2037',
            datum: '2026-01-16',
            link: 'https://centraalplus.nl/2026/01/17/lokale-educatieve-agenda-van-wassenaar-ondertekend-een-horizon-waarmee-we-aan-de-slag-kunnen/',
            type: 'Samenwerkingsdocument',
            toelichting: 'Ondertekend 16 jan 2026 (18 partijen; o.a. gemeente, scholen, welzijn). Deze link is een nieuwsbericht van Centraal+, géén formeel bestuursdocument. Het openbare PDF-/iBabs-pad stond nog niet in onze data — zoek desgewenst in iBabs of op wassenaar.nl op “Lokale Educatieve Agenda”.'
        },
        {
            naam: 'Verordening leerlingenvervoer 2025 gemeente Wassenaar',
            datum: '2025-09-22',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=eec09f18-31bb-4477-9559-7a73cad358ee&agendaItemId=fea9db3b-6a30-47e4-8337-629eaeca711b',
            type: 'Verordening',
            toelichting: 'Hamerstuk 6.b, raad 22 sept 2025 — Raadsbesluit (iBabs). Geldt o.a. vanaf 1 jan 2026 (zie OD). BBV: hoofdzakelijk 4.3 Onderwijsbeleid en leerlingzaken.'
        }
    ],
    5: [
        {
            naam: 'Sportvisie Wassenaar 2025',
            datum: '2025-09-22',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=6db01b2d-15c8-4801-a2e2-521606bb81c4&agendaItemId=fea9db3b-6a30-47e4-8337-629eaeca711b',
            type: 'Beleidsnota',
            toelichting: 'Agendapunt 11 raadsvergadering 22 sept 2025 — controleer stemming in iBabs indien nodig.'
        }
    ],
    6: [
        { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: null, type: 'Startnotitie' },
        { naam: 'Beleidsnota Ouderenbeleid 2025', datum: '2025-01-28', link: null, type: 'Beleidsnota' }
    ],
    7: [
        {
            naam: 'Bijlage 1. Verkenning reductie restafval',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Reports/Document/13e0eeae-ce9a-454d-8530-b43864972f79?documentId=3d92ea1b-1a04-4bf3-9bb2-07c976603c43',
            type: 'Notitie',
            toelichting: 'Informatiebrief 095 — bijlage verkenning reductie restafval (iBabs Reports/Document).'
        },
        {
            naam: 'Motie reductie restafval en kostenbesparing afvalstoffenheffing',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/3e13ce7b-2972-4a14-9e63-5f8a03b8dde6?documentId=76cff862-0962-4859-85f7-a911708e963f&agendaItemId=a6645f92-6dff-4ca2-80b5-b396b0864d70',
            type: 'Motie',
            toelichting: 'Motie GL PvdA D66 VVD CDA'
        }
    ],
    8: [
        // ─── Omgevingswet: kerninstrumenten & proces (OD hst. 6) ───
        {
            naam: 'Startnotitie Participatie Omgevingsvisie',
            datum: '2025-12-17',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/4df79561-b943-43a1-a21d-da484727f1ad?documentId=416f5b70-c39b-47d4-b662-be73d3e71c63&agendaItemId=5abb6d11-0c07-463f-a4c0-10b66f8e58a8',
            type: 'Startnotitie',
            toelichting: 'Raad 17 dec 2025. Eerste proeve Omgevingsvisie 2040 niet als vastgestelde visie aangenomen; nieuw participatietraject. Streefdatum definitieve Omgevingsvisie: 1 april 2027.'
        },
        {
            naam: 'Eerste proeve Omgevingsvisie 2040',
            datum: '2025-12-17',
            link: null,
            type: 'Ontwerpdocument',
            toelichting: 'Niet als vastgestelde omgevingsvisie aangenomen (dec 2025); gevolgd door participatietraject via Startnotitie. Controleer besluit in iBabs.'
        },
        {
            naam: 'Participatie Omgevingsvisie (breed; fase 2026)',
            link: null,
            type: 'Proces',
            toelichting: 'OD: brede participatie start 2026 (1e helft); periode zonder actueel toetsbaar ruimtelijk kader vanaf 1 jan 2027 tot vaststelling visie (risico OD).'
        },
        {
            naam: 'Ontwerp Omgevingsvisie — eerste concept t.b.v. gemeenteraad',
            link: null,
            type: 'Concept',
            toelichting: 'OD-planning: op basis van participatiedocument en technische sessies; streefdatum behandeling raad okt 2026.'
        },
        {
            naam: 'Definitieve Omgevingsvisie Wassenaar',
            link: null,
            type: 'Omgevingsvisie',
            toelichting: 'Nog niet vastgesteld; streef apr 2027. Wordt centraal koersdocument voor gebiedsontwikkeling en vervolgprogramma’s (OD).'
        },
        {
            naam: 'Omgevingsplan Wassenaar (integraal)',
            link: null,
            type: 'Omgevingsplan',
            toelichting: 'Vervangt alle bestaande bestemmingsplannen en relevante lokale regels; uiterlijk gereed 1 jan 2032. OD: streef gereedheid o.a. 2030. Gefaseerde opbouw.'
        },
        {
            naam: 'Generieke delegatie vaststellen tijdelijk deel omgevingsplan',
            datum: '2023-06-15',
            link: 'https://zoek.officielebekendmakingen.nl/gmb-2023-261015.html',
            type: 'Gemeentelijk besluit (OB)',
            toelichting: 'Besluit gemeenteraad — bevoegdheid college delen tijdelijk omgevingsplan vast te stellen. Officiële Bekendmakingen.'
        },
        {
            naam: 'Volkshuisvestelijk programma',
            link: null,
            type: 'Programma',
            toelichting: 'Verplicht onderdeel van de Omgevingsvisie; woonbeleid en woonzorg ruimtelijk verankerd (OD).'
        },
        {
            naam: 'Gebiedsgerichte uitvoeringsprogramma’s (uitwerking Omgevingsvisie)',
            link: null,
            type: 'Programma',
            toelichting: 'OD: per gebied o.a. water, bodem, natuur, gezondheid, energie, wonen; maatregelen inhoudelijk en financieel haalbaar.'
        },
        {
            naam: 'Klimaatadaptatie — programma na stresstest 2024',
            link: null,
            type: 'Programma',
            toelichting: 'OD: stresstest 2024 → samenhangend programma water, bodem, droogte, hitte, overstromingsrisico’s als onderdeel van de Omgevingsvisie.'
        },
        {
            naam: 'Thema’s en omgevingskwaliteit in het Omgevingsplan',
            link: null,
            type: 'Kader',
            toelichting: 'OD: o.a. milieuzonering, geur, trilling, ontplofbare oorlogsresten, gewasbeschermingsmiddelen, circulariteit; actieplan geluid; Omgevingsdienst Haaglanden (advies).'
        },
        {
            naam: 'Beleidsregels milieuzonering (uitwerking Omgevingswet)',
            datum: '2024-09-16',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/bfa224c5-fa50-4bb5-a8d6-5fa7824fe588?agendaItemId=eb7a24cf-8c2b-411b-a7d9-ba80d8293dc6',
            type: 'Beleidsregels',
            toelichting: 'Raadsbesluit 16 sep 2024; vastgesteld als Beleidsregels Milieuzonering Richtafstanden Wassenaar 2024.'
        },
        {
            naam: 'Nota hogere waarden verkeerslawaai (uitwerking Omgevingswet)',
            datum: '2024-09-16',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/9702fdf6-75c5-4207-be22-6246d4aba4ce?agendaItemId=4f6181b7-d8f7-4e1c-8cbf-82f4f9b84a6d',
            type: 'Beleidsnota',
            toelichting: 'Raadsbesluit 16 sep 2024; vastgesteld als Nota Hogere Waarden Wegverkeerslawaai Wassenaar 2024.'
        },
        {
            naam: 'Informatiebrief financiën invoering Omgevingswet',
            link: null,
            type: 'Informatie',
            toelichting: 'College 10 mei 2022 — genoemd in briefing; link niet in deze bibliotheek gezet.'
        },
        {
            naam: 'Plan van aanpak Omgevingsvisie 2023',
            link: null,
            type: 'Proces',
            toelichting: 'Proces/inrichting — voorkomt in data.js; iBabs/college-archief.'
        },
        // ─── Programma Noordrand / Groene Zone ───
        {
            naam: 'Programma Noordrand (uitvoeringsprogramma Groene Zone)',
            datum: '2024-11-28',
            link: 'https://zoek.officielebekendmakingen.nl/gmb-2024-498607.html',
            type: 'Gebiedsprogramma',
            toelichting: 'Bekendmaking ontwerpprogramma Noordrand (nov 2024). College heeft definitief programma in 2025 vastgesteld na participatietraject 2023–2024.'
        },
        {
            naam: 'Wensen en bedenkingen Concept-Programma Noordrand',
            datum: '2025-06-03',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/2455d6c8-1c90-4564-be5b-62ee8bc8eb71?agendaItemId=fcf97e62-007f-4e8f-8d93-c6e6582496c1',
            type: 'Raadsbesluit',
            toelichting: 'Raad 3 jun 2025 — voorafgaand aan definitief programma (zie briefing Ruimte).'
        },
        {
            naam: 'Onderzoek zweefvliegen / Visie Groene Zone — invoeding Omgevingsvisie',
            link: null,
            type: 'Onderzoek',
            toelichting: 'CUP-doel: meenemen in Omgevingsvisie / Visie Groene Zone (OD Bijlage 2: gerealiseerd).'
        },
        // ─── Bestemmingsplannen (tot volledige overgang naar omgevingsplan) ───
        {
            naam: 'Bestemmingsplan Residentie Parkzicht + beeldkwaliteitsplan (ANWB-locatie)',
            datum: '2024-01-30',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/b40189c1-dcea-44f9-a416-e4120fa1eb15?agendaItemId=27762907-377f-4f73-a2ec-bcb9d7282f9f',
            type: 'Bestemmingsplan',
            toelichting: 'Herontwikkeling Wassenaarseweg 220; OD projecten: beroep RvS mogelijk, omgevingsvergunning, bouw najaar 2027 (doorlooptijd volgens OD).'
        },
        {
            naam: 'Herstelbesluit bestemmingsplan Woongebied Valkenhorst',
            datum: '2025-06-23',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/43135686-4970-4f3f-b7a4-b7600ccbe012?agendaItemId=4fb461f3-7cb3-4d3c-a4f2-071f91839464',
            type: 'Bestemmingsplan',
            toelichting: 'Raad jun 2025.'
        },
        {
            naam: 'Samenhangende aanpak versterking dorpskern Wassenaar',
            datum: '2023-12-19',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/9b3eec18-9f83-45d0-9cbf-610e3f0049ea?agendaItemId=da0b1ced-bff4-4f28-9acb-5a40134b9fbf',
            type: 'Beleidsbesluit',
            toelichting: 'Raadsbesluit 19 dec 2023; vier pilaren: herinrichting, leegstand, winkels→wonen, parkeren. Aanvullend investeringskrediet vastgesteld.'
        },
        // ─── Wonen & huisvesting ───
        {
            naam: 'Nota Woonbeleid gemeente Wassenaar 2025',
            datum: '2025-10-14',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/8f51ef1d-1b7a-4f0c-8343-4bf2f203930d?documentId=bdfb8868-7df2-422f-bfbe-dcd9528fbaa6&agendaItemId=88378d7f-f964-4391-90d3-01e88eb7752d',
            type: 'Beleidsnota',
            toelichting: 'Twee derde nieuwbouw betaalbaar; uiteindelijk in volkshuisvestelijk programma onder Omgevingsvisie (OD).'
        },
        {
            naam: 'Woonvisie Wassenaar 2021–2025 (Grip op wonen)',
            link: 'https://www.wassenaar.nl/_flysystem/media/woonvisie-wassenaar-2021-2025-grip-op-wonen.pdf',
            type: 'Visie',
            toelichting: 'Voorloper Nota Woonbeleid; gemeentelijke PDF.'
        },
        {
            naam: 'Startnotitie Lokale Woonzorgvisie + uitvoeringsprogramma wonen-zorg',
            datum: '2025-09-22',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=cc8bf828-300a-4098-9198-dc67d2e0a15c&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b',
            type: 'Startnotitie',
            toelichting: 'OD: uitvoeringsprogramma onderdeel volkshuisvestelijk programma / Omgevingsvisie. Ook relevant voor BBV 6.'
        },
        {
            naam: 'Tweede wijziging Huisvestingsverordening Wassenaar 2023',
            datum: '2025-12-16',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/f4dfcc53-672e-4d58-aa9e-edaa034c860b?agendaItemId=a46c480a-6a05-4612-87a9-9bef1fc58382',
            type: 'Verordening',
            toelichting: 'Raad dec 2025 — o.a. woonwagenstandplaatsen (OD). CVDR kan aanvullend.'
        },
        {
            naam: 'Vestiging vervroegd voorkeursrecht Draf- en Renbaan Duindigt',
            datum: '2025-09-22',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/ba1e5c4f-b0f7-402c-a81d-78a4a69793df?agendaItemId=2e4a9fcb-8262-450a-8001-e63cb2cefeae',
            type: 'Raadsbesluit',
            toelichting: 'Ruimtelijke ontwikkeling Duindigt (OD projecten).'
        },
        // ─── Beheer openbare ruimte ───
        {
            naam: 'Beheervisie Openbare Ruimte 2024–2028',
            datum: '2023-09-19',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/eacc1bd6-189f-47ee-bbb6-412c644c903e?agendaItemId=67f7fcd0-4f59-4473-98a9-b4c38f703d0a',
            type: 'Beheervisie',
            toelichting: 'Raadsbesluit 19 sep 2023; kader beheer openbare ruimte + uitvoeringsprogramma 2024–2028.'
        },
        // ─── Erfgoed & evenementen → Omgevingsvisie ───
        {
            naam: 'Visienota religieus erfgoed gemeente Wassenaar 2025',
            link: null,
            type: 'Visienota',
            toelichting: 'OD-planning: na vaststelling betrokken bij Omgevingsvisie (streef jun 2026).'
        },
        {
            naam: 'Startnotitie erfgoed gemeente Wassenaar 2026',
            link: null,
            type: 'Startnotitie',
            toelichting: 'Opvolging Erfgoedvisie 2018–2024 en programma cultureel erfgoed; invoeding Omgevingsvisie (OD).'
        },
        {
            naam: 'Evenementenbeleid — uitwerking in Omgevingsvisie',
            datum: '2022-11-08',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/41bea0f9-90bc-4b22-bf83-872bb713f1f8?agendaItemId=ba853240-d91a-4345-84b9-ebc526f38471',
            type: 'Beleid',
            toelichting: 'Startnotitie Evenementenbeleid vastgesteld door raad (nov 2022); uitwerking volgens OD in Omgevingsvisie.'
        },
        // ─── Project / instrument Omgevingswet ───
        {
            naam: 'BOPA (buitenplanse omgevingsplanactiviteit) horeca Raadhuis De Paauw',
            link: null,
            type: 'BOPA',
            toelichting: 'OD: past niet in geldend omgevingsplan; raadsbesluit vereist (Omgevingswet).'
        },
        {
            naam: 'Vijfde wijziging gemeenschappelijke regeling Omgevingsdienst Haaglanden',
            datum: '2025-12-16',
            link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/90987d08-8b03-4da3-acdb-20a49b865b45?agendaItemId=2dae2006-9f02-48ab-b696-4d2a25349c42',
            type: 'GR-wijziging',
            toelichting: 'Raadsbesluit 16 dec 2025; toestemming college voor vijfde wijziging GR Omgevingsdienst Haaglanden.'
        }
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
    const toonHoofdstukken = mode === 'overzicht' || mode === 'zoekresultaten';
    const ovEl = document.getElementById('dossierOverzicht');
    const detEl = document.getElementById('dossierDetail');
    if (ovEl) {
        ovEl.style.display = toonHoofdstukken ? '' : 'none';
        ovEl.setAttribute('aria-hidden', toonHoofdstukken ? 'false' : 'true');
    }
    if (detEl) detEl.style.display = mode === 'dossier' ? '' : 'none';
    document.body.classList.toggle('dossier-detail-open', mode === 'dossier');
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
    header.innerHTML = `
        <div class="bbv-hoofdstuk-icoon">${icoonHtml}</div>
        <div>
            <strong>${escapeHtml(naam)}</strong>
            ${ondertitel ? `<br><span class="bbv-hoofdstuk-ondertitel">${escapeHtml(ondertitel)}</span>` : ''}
        </div>`;
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
        if (oms) {
            card.setAttribute('title', `${label}\n\n${oms}`);
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
        toelichting: (rec.extra || '').trim(),
        _bijdrage: true,
        _bijdrageId: rec.id
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
    if (!tv) return { naam: '', omschrijving: '' };
    return { naam: tv.naam || '', omschrijving: (tv.omschrijving || '').trim() };
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
    if (kopEl) kopEl.textContent = `${sub} — ${info.naam || '(onbekend)'}`;
    p.textContent = info.omschrijving || '';
    box.style.display = '';
}

function setBeleidsnotaAddContext(bbvIndex, taakveldCode) {
    const ctxEl = document.getElementById('bnAddContext');
    if (!ctxEl) return;

    if (taakveldCode) {
        const naam = getTaakveldNaam(bbvIndex, taakveldCode);
        ctxEl.textContent = `Voorstel voor kindtegel: ${taakveldCode}${naam ? ' ' + naam : ''}`;
    } else {
        const hoofdstuk = BBV_HOOFDTAAKVELDEN[bbvIndex] || `Hoofdstuk ${bbvIndex}`;
        ctxEl.textContent = `Voorstel op hoofdniveau: ${hoofdstuk}`;
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

            const record = {
                titel,
                link: urlObj.href,
                extra: extra || '',
                scope: {
                    bbvIndex: beleidsnotaAddScope.bbvIndex,
                    taakveldCode: beleidsnotaAddScope.taakveldCode || null,
                    niveau: beleidsnotaAddScope.taakveldCode ? 'kindtegel' : 'hoofdniveau'
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
    setBeleidsnotaAddContext(bbvIndex, taakveldCode || null);

    const modal = document.getElementById('bnAddModal');
    const overlay = document.getElementById('bnAddOverlay');
    if (overlay) overlay.style.display = 'block';
    if (modal) modal.style.display = 'flex';
}

function showBeleidsnotaBlokBBV(bbvIndex, taakveldCode) {
    const blok = document.getElementById('beleidsnotaBlok');
    const lijst = document.getElementById('beleidsnotaLijst');
    if (!blok || !lijst) return;

    const hoofd = BELEIDSNOTA_PER_HOOFDSTUK_BBV[bbvIndex] || [];
    const sub = taakveldCode ? (BELEIDSNOTA_PER_TAAKVELD[taakveldCode] || []) : [];
    const bijdragen = getGoedgekeurdeVoorstellenForScope(bbvIndex, taakveldCode || null).map(mapVoorstelToItem);
    const items = mergeBeleidsnotaLijsten(hoofd, sub, bijdragen);

    blok.style.borderLeftColor = '#059669';
    if (!items.length) {
        lijst.innerHTML = '<li class="beleidsnota-item">Nog geen beleidsnota\'s voor dit BBV-onderdeel. Klik op "+ Beleidsnota voorstellen".</li>';
    } else {
        lijst.innerHTML = items.map(n => {
            const datumStr = n.datum ? formatDatumKort(n.datum) : '';
            const typeLabel = n.type ? `<span class="beleidsnota-type${n._bijdrage ? ' beleidsnota-type--bijdrage' : ''}">${escapeHtml(n.type)}</span>` : '';
            const bijdrageBadge = n._bijdrage
                ? '<span class="beleidsnota-badge-bijdrage" title="Ingediend door een bezoeker en goedgekeurd door de redactie.">Bijdrage</span>'
                : '';
            const linkHtml = n.link
                ? `<a href="${escapeHtml(n.link)}" target="_blank" rel="noopener" class="beleidsnota-link">${escapeHtml(n.naam)}</a>`
                : escapeHtml(n.naam);
            const meta = [typeLabel, datumStr ? `<span class="beleidsnota-datum">${datumStr}</span>` : ''].filter(Boolean).join(' \u00b7 ');
            const toelichtingHtml = n.toelichting ? `<p class="beleidsnota-toelichting">${escapeHtml(n.toelichting)}</p>` : '';
            const main = `${bijdrageBadge}${linkHtml}${meta ? ` <span class="beleidsnota-meta">${meta}</span>` : ''}${toelichtingHtml}`;
            return `<li class="beleidsnota-item${n._bijdrage ? ' beleidsnota-item--bijdrage' : ''}"><div class="beleidsnota-item-main">${main}</div></li>`;
        }).join('');
    }
    blok.style.display = '';

    const addBtn = document.getElementById('beleidsnotaAddBtn');
    if (addBtn) {
        addBtn.textContent = '+ Beleidsnota voorstellen';
        addBtn.style.display = 'inline-flex';
        addBtn.onclick = () => openBeleidsnotaAddModal(bbvIndex, taakveldCode || null);
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

/** Eerste twee top-level <p>’s (opeenvolgend vanaf het begin) naar samenvatting; rest = verdieping. */
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

    if (sumInh) sumInh.innerHTML = summaryHtml || '';
    if (sumSect) sumSect.style.display = summaryHtml ? '' : 'none';

    container.innerHTML = remainderHtml || '';
    if (bron) bron.textContent = od.bron;

    const hasRemainder = !!remainderHtml;
    if (blok) {
        blok.style.display = hasRemainder ? '' : 'none';
        blok.classList.toggle('overdrachtsdossier-blok--leeg', !hasRemainder);
    }
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
        · Laatst bijgewerkt: <strong>maart 2026</strong></p>
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
