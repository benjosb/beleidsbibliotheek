// Besluit-wijzer Gemeente X — v0.1 · Iv3-structuur (9 BBV-hoofdstukken, 48 taakvelden)

let allDecisions = [];
let filteredDecisions = [];
let activeDossier = null; // { domein: hoofdstukNaam, subFilter: taakveldCode|null }
let viewMode = 'overzicht';
let zoekBaseResults = [];

// Iv3-kleuren per BBV-hoofdstuk (code 0–8)
const IV3_KLEUREN = {
    '0': { accent: '#5c6bc0', light: '#c5cae9', lighter: '#e8eaf6' },
    '1': { accent: '#e53935', light: '#ffcdd2', lighter: '#ffebee' },
    '2': { accent: '#43a047', light: '#a5d6a7', lighter: '#e8f5e9' },
    '3': { accent: '#fb8c00', light: '#ffe0b2', lighter: '#fff3e0' },
    '4': { accent: '#8e24aa', light: '#e1bee7', lighter: '#f3e5f5' },
    '5': { accent: '#00acc1', light: '#b2ebf2', lighter: '#e0f7fa' },
    '6': { accent: '#7cb342', light: '#c5e1a5', lighter: '#f1f8e9' },
    '7': { accent: '#26a69a', light: '#80cbc4', lighter: '#e0f2f1' },
    '8': { accent: '#1565c0', light: '#90caf9', lighter: '#e3f2fd' },
};

function getThemaKleur(hoofdstukNaam) {
    const code = (hoofdstukNaam || '').split(' ')[0];
    return IV3_KLEUREN[code] || IV3_KLEUREN['0'];
}

// Toelichting Iv3 (bron: informatievoorschrift BBV 2026)
const HOOFDSTUK_TOELICHTING = {
    '0 Bestuur en ondersteuning': 'Bestuursorganen, burgerzaken, beheer gebouwen, overhead, treasury, belastingen (OZB, parkeer, overig), algemene uitkeringen, overige baten en lasten, reserves en resultaat.',
    '1 Veiligheid': 'Crisisbeheersing, brandweer, rampenbestrijding; openbare orde, handhaving, BOA\'s, preventie criminaliteit, APV, leges.',
    '2 Verkeer, vervoer en waterstaat': 'Verkeer, wegen, fietspaden, openbare verlichting; parkeren; recreatieve en economische havens; openbaar vervoer.',
    '3 Economie': 'Economische ontwikkeling, bedrijfsinfrastructuur, bedrijvenloket, stimuleringsregelingen, economische promotie, toerisme.',
    '4 Onderwijs': 'Openbaar basisonderwijs, onderwijshuisvesting, onderwijsbeleid, leerlingzaken, passend onderwijs, peuteropvang.',
    '5 Sport, cultuur en recreatie': 'Sportbeleid en accommodaties; cultuur, musea, erfgoed; media; openbaar groen en recreatie.',
    '6 Sociaal domein': 'Burgerparticipatie, toegang Wmo/Jeugd, inkomensregelingen, WSW, arbeidsparticipatie, maatwerkvoorzieningen.',
    '7 Volksgezondheid en milieu': 'Volksgezondheid, JGZ; riolering; afval; milieubeheer; begraafplaatsen en crematoria.',
    '8 Volkshuisvesting, leefomgeving en stedelijke vernieuwing': 'Ruimte en leefomgeving, omgevingsplan; grondexploitatie; wonen en bouwen.',
};
const TAAKVELD_TOELICHTING = {
    '0.1': 'Tot dit taakveld behoren de kosten van de bestuursorganen en de facilitering ervan: college van burgemeester en wethouders, raad en raadscommissies, griffie, regionale en landelijke bestuurlijke samenwerking, lokale rekenkamer, ombudsfunctie, accountantscontrole, leges bestuur- en commissieverslagen. Niet: ambtelijke ondersteuning en beleidsadvisering (0.4); gemeentesecretaris (0.4).',
    '0.2': 'Bevolkingsregister en burgerlijke stand; rijbewijzen, paspoorten en andere reisdocumenten; straatnaamgeving en kadastrale informatie; burgerschap; VOG; verkiezingen, referenda; leges burgerzaken.',
    '0.3': 'Beheer, verhuur, instandhouding van gebouwen, gronden en landerijen die de gemeente in bezit heeft en niet in exploitatie neemt.',
    '0.4': 'Alle kosten van sturing en ondersteuning van medewerkers in het primaire proces: leidinggevenden, financiën, P&O, inkoop, communicatie, juridische zaken, ICT, facilitaire zaken. Volgt de notitie Overhead 2023. Niet: griffie (0.1); klantcommunicatie specifieke taakvelden; projectleiders; afhandeling bezwaar- en beroepsschriften.',
    '0.5': 'Financiering, beleggingen, dividenden; schenkingen en legaten. Alle reële rente wordt hier geboekt en via categorie 7.4 toegerekend aan taakvelden.',
    '0.61': 'Onroerende-zaakbelasting op woningen: heffing, invordering, waardering, bezwaar en beroep. Niet: verrekening kwijtscheldingen OZB (6.3).',
    '0.62': 'Onroerende-zaakbelasting op niet-woningen: heffing, invordering, waardering, bezwaar en beroep.',
    '0.63': 'Parkeerbelasting; opbrengsten parkeerfaciliteiten; opbrengsten boetes (wielklem, wegsleepregeling). Niet: parkeerpolitie (1.2); ontwikkeling en beheer parkeervoorzieningen (2.2).',
    '0.64': 'Hondenbelasting, precariobelasting, baatbelasting, reclamebelasting, roerende zaakbelasting; heffing en invordering; bezwaar en beroep. Niet: toeristenbelasting (3.4); forensenbelasting (3.4); kwijtscheldingen (6.3).',
    '0.7': 'Algemene uitkering; integratie-uitkeringen; decentralisatie-uitkeringen; artikel 12-uitkering. Niet: specifieke uitkeringen (op het taakveld waarop ze betrekking hebben).',
    '0.8': 'Stelposten, taakstellende bezuinigingen, begrotingsruimte; terugbetalingen overschotten GR aan deelnemers; niet voorziene uitgaven; loonkosten bovenformatief personeel dat niet meer aan het werk is.',
    '0.9': 'Raming/verantwoording te betalen vennootschapsbelasting; verschil tussen definitieve aanslag en raming.',
    '0.10': 'Toevoegingen en onttrekkingen aan reserves (taakvelden 0–8). Alleen economische categorie 7.1.',
    '0.11': 'Saldo van alle andere taakvelden. Alleen economische categorie 7.1.',
    '1.1': 'Brandbestrijding; preventieve maatregelen fysieke veiligheid; rampenbestrijding; leges vergunning brandveilig gebruik inrichting. Niet: opruiming explosieven als onderdeel grondexploitatie (8.2).',
    '1.2': 'Toezicht en handhaving; BOA\'s, stadswachten; Wet Bibob; bureau Halt; preventie criminaliteit; APV; leges (aanwezigheidsvergunning, APV, BIBOB, drank & horeca, evenementenvergunning, vuurwapenwet); beleid explosieven; veilige woon- en leefomgeving; gevonden voorwerpen; antidiscriminatiebeleid; doodsschouw; dierenbescherming; radicalisering. Niet: verkeersveiligheid (2.1); explosieven bij grondexploitatie (8.2).',
    '2.1': 'Verkeersmaatregelen; verkeersveiligheid; aanleg en onderhoud wegen, fietspaden, voetpaden; civieltechnische kunstwerken; openbare verlichting; laadpalen; gladheidbestrijding; straatreiniging; reguleren openbare ruimte; leges (ontheffingen wegenverkeerswet, kabels, graafwerkzaamheden). Niet: wegen in grondexploitatie (8.2 of 3.2); busstations (2.5); parkeervoorzieningen (2.2); toeristische fiets- en wandelpaden (5.7); CAI/glasvezel financiering (3.1).',
    '2.2': 'Parkeerbeleid; inrichting en onderhoud parkeervoorzieningen; parkeermeters; fietsenstalling; parkeervoorzieningen gehandicapten. Niet: parkeerbelasting (0.63); parkeerpolitie (1.2); parkeerhavens als onderdeel wegen (2.1); parkeerplek Wmo-beschikking (6.60).',
    '2.3': 'Jachthaven; passantenhaven; brug- en sluisgelden voor pleziervaart; haven- en liggelden; scheepvaartrechten; wal- en kadegelden pleziervaart. Niet: ligplaatsgelden woonschepen (8.3).',
    '2.4': 'Zeehavens; binnenhavens; doorgaande waterwegen; waterkering, afwatering, landaanwinning; brug- en sluisgelden voor beroepsvaart; haven- en liggelden; scheepvaartrechten; wal- en kadegelden beroepsvaart. Niet: vijvers, sloten (5.7); havenloodsen, pakhuizen (3.2); veerponten (2.5); waterkwaliteit (7.2); jachthavens (2.3).',
    '2.5': 'Bus, tram, metro; taxivervoer; veerdiensten; busstation, metrostation; OV-experimenten; veergelden. Niet: bus- en tramhaltes (2.1); collectief vervoer Wmo (6.60).',
    '3.1': 'Algemeen beleid versterking economische bedrijvigheid; clusterontwikkeling; samenwerking bedrijfsleven en kennisinstellingen; stedelijke en wijkgerichte economische programma\'s; aanleg CAI, breedband, glasvezel. Niet: ondersteuning individuele bedrijven (3.3); acquisitie (3.3); praktische uitvoering (3.2 of 3.4); leges CAI/glasvezel (2.1).',
    '3.2': 'Grondexploitatie bedrijventerreinen; ontwikkeling en onderhoud bedrijfslocaties; herstructurering en verduurzaming; investeringen winkelgebieden; land- en tuinbouwgronden. Niet: grondexploitatie niet-bedrijventerreinen (8.2).',
    '3.3': 'Bedrijvenloket; stimuleren startende ondernemers; aantrekken nieuwe bedrijven; financiële steunregelingen; straathandel, markten, veemarkten; BIZ-bijdrage; kosten en opbrengsten nutsbedrijven (excl. dividend). Niet: netwerken en samenwerkingsverbanden (3.1); handelsmissies en promotie (3.4); dividenden nutsbedrijven (0.5).',
    '3.4': 'Promotionele activiteiten; aantrekken bedrijvigheid en nieuwe werkers; toerisme; beurzen, jaarmarkten, volksfeesten; toeristenbelasting; forensenbelasting; kermisgelden; vermakelijkhedenretributies. Niet: lokale recreatieve wijkvoorzieningen (5.7); accountmanagement (3.3); kampeerterreinen (5.7); toeristische fietspaden, dierentuinen (5.7).',
    '4.1': 'Bestuurskosten openbaar basisonderwijs; primair openbaar basisonderwijs; bewegingsonderwijs, schoolzwemmen; passend onderwijs. Niet: onderwijshuisvesting (4.2); bijzonder onderwijs (4.3).',
    '4.2': 'Nieuwbouw, aanpassing, uitbreiding schoolgebouwen (openbaar en bijzonder); verhuur; programma onderwijshuisvesting; vandalismebestrijding. Niet: aanpassing en onderhoud door schoolbesturen (bij schoolbesturen).',
    '4.3': 'Lokaal onderwijsbeleid; onderwijsondersteuning; bestuurskosten openbaar middelbaar onderwijs; uitgaven bijzonder onderwijs; achterstandenbeleid; passend onderwijs; volwasseneducatie; peuteropvang; leerlingzorg; leerlingenvervoer; leerplicht; voorkomen voortijdig schoolverlaten. Niet: kinderopvang (6.1); openbaar basisonderwijs (4.1).',
    '5.1': 'Stimuleren topsport en recreatieve sport; ondersteuning sportorganisaties; sport in de buurt; combinatiefuncties sport. Lokaal sportakkoord; leefomgeving (Brede SPUK). Niet: sportvelden en accommodaties (5.2); schoolsportdagen (4.3).',
    '5.2': 'Sporthallen, zwembaden, schaatshallen; velden, terreinen; trapveldjes in de wijk. Niet: gymlokalen bij scholen (4.2).',
    '5.3': 'Subsidies podia; gezelschappen voor muziek, dans, toneel; accommodaties beeldende kunst; kunstzinnige vorming; cultuureducatie; culturele manifestaties; overkoepelende organen kunstbeoefening. Niet: jaarmarkten; volksfeesten (3.4); musea (5.4); kunstwerken openbare ruimte onderhoud (5.7); historische gebouwen (5.5).',
    '5.4': 'Musea; exposities; archeologie; heemkunde; historische archieven. Niet: reguliere archieven (0.4); historische gebouwen, beschermde gezichten (5.5).',
    '5.5': 'Historische gebouwen; beschermde stads- en dorpsgezichten; objecten met historische waarde; subsidie, beheer, onderhoud, toezicht cultureel erfgoed.',
    '5.6': 'Bibliotheken; kunstotheek; videotheek; lokale pers; lokale omroep; lokale informatievoorziening; overkoepelende organen.',
    '5.7': 'Natuur- en landschapsbescherming; openbaar groen, parken; aanleg en onderhoud waterwegen (niet doorgaand); speelvoorzieningen; recreatievoorzieningen (hertenkampen, kinderboerderijen, kampeerterreinen, dierentuinen, volkstuinen, toeristische fiets- en wandelpaden); leges kampeervergunning, jagen. Niet: doorgaande watergangen (2.4).',
    '6.1': 'Sociale basis: burgerinitiatieven, vrijwilligers, mantelzorg; sociaal en cultureel werk; AMW; wijkopbouw; jongerenwerk; schoolmaatschappelijk werk; preventie (eenzaamheid, GGZ, risicojongeren); buurt- en clubhuizen; collectief aanvullend vervoer; toegankelijkheid; kinderopvang (toezicht, handhaving); kinderopvangtoeslag SMI; Wet Inburgering; noodopvang vluchtelingen; vreemdelingenbeleid; LHBTQIA+-beleid; Brede SPUK. Niet: peuteropvang (4.3); inburgering oudkomers (6.5); kansrijke start (7.1); toegang/eerstelijn Wmo/Jeugd (6.21–6.23).',
    '6.2': 'Vrij toegankelijke hulp; lokale teams; toegang tot maatwerkvoorzieningen Wmo/Jeugd; voorlichting; advisering; cliëntondersteuning; POH-GGZ jeugd; aanpak Veilig Thuis; preventief justitieel kader; verwijsindex risicojongeren. Niet: basistakenpakket JGZ (7.1); beleidsmedewerkers, contractmanagers (6.91/6.92); maatwerk na doorverwijzing (6.711 e.v.).',
    '6.3': 'Participatiewet; loonkostensubsidies; IOAW; IOAZ; Bbz; sociale zekerheidsregelingen; schuldhulpverlening; armoedebeleid; bijzondere bijstand; kwijtschelding belastingen; korting musea, sportclubs; meerkosten werk bij handicap.',
    '6.4': 'Beschut werken; sociale werkvoorziening; arbeidsmatige dagbesteding. Niet: re-integratie (6.5); dagbesteding Wmo (6.713); dagbesteding beschermd wonen/opvang (6.811/6.812).',
    '6.5': 'Re-integratie; Work First; proefplaatsing; participatieplaatsen; scholing; EVC; Jobcoach; Werkvoorzieningen; loonwaardebepaling; Bbz startende ondernemers. Niet: volwasseneneducatie (4.3); WSW (6.4); dagbesteding niet op arbeid (6.4); permanente loonkostensubsidie (6.3).',
    '6.6': 'Wmo-productcodes: woondiensten; vervoersdiensten; rolstoelvoorzieningen; woningaanpassingen; parkeerbeleid invaliden; huishoudelijke hulp; begeleiding; persoonlijke verzorging; kortdurend verblijf; dagbesteding; overige maatwerkarrangementen.',
    '6.71': 'Maatwerkdienstverlening 18+: beschermd wonen; maatschappelijke- en vrouwenopvang; jeugdbescherming; jeugdreclassering; PGB Wmo; coördinatie en beleid Wmo. (Geaggregeerd uit Iv3 6.751–6.763, 6.791, 6.811, 6.812, 6.821, 6.91.)',
    '6.72': 'Maatwerkdienstverlening 18-: jeugdhulp ambulant en met verblijf; PGB Jeugd; coördinatie en beleid Jeugd. (Geaggregeerd uit Iv3 6.751–6.763, 6.792, 6.92.)',
    '7.1': 'Monitoren gezondheidssituatie; preventieprogramma\'s; vroegsignalering; gezondheidsbevordering; bestrijding infectieziekten; vaccinaties; voorlichting; prenatale voorlichting; medisch milieukundige zorg; technische hygiëne zorg; psychosociale hulp bij rampen; basistakenpakket JGZ; ambulance en ziekenvervoer. Brede SPUK: Kansrijke Start; Mentale Gezondheid; overgewicht en obesitas; Valpreventie; GGD; regionale aanpak preventie. Niet: ondersteuning JGZ na signalering (6.22/6.23).',
    '7.2': 'Afvalwater en waterhuishouding; opvang en verwerking hemelwater; inzameling en transport afvalwater; grondwater; rioolwaterzuivering; bestrijding verontreiniging oppervlaktewater; rioolheffing; leges rioolaansluiting. Niet: kwijtschelding rioolrechten (6.3).',
    '7.3': 'Inzameling en verwerking bedrijfs- en huishoudelijk afval; afvalscheiding; recycling; vuilophaal; afvalstoffenheffing; reinigingsrechten; diftar. Niet: zwerfvuil, veegdiensten (2.1); kwijtschelding (6.3).',
    '7.4': 'Bodembescherming; sanering; luchtkwaliteit; geluidhinder; straling; verplaatsing milieuhinderlijke bedrijven; ongediertebestrijding; RUD; leges omgevingsvergunningen milieubelastende activiteit. Niet: waterkwaliteit (7.2); milieueducatie (4.3); afvalscheiding (7.3); verduurzaming op ander taakveld.',
    '7.5': 'Begraafplaatsen; crematoria; lijkschouw; grafrechten; afkoopsommen. Niet: registratie overlijden (0.2).',
    '8.1': 'Structuurplannen; bestemmingsplannen; omgevingsvisie; gebiedsgerichte programma\'s; omgevingsplan; Digitaal Stelsel Omgevingswet; leges omgevingsvergunning buitenplanse activiteit; faciliterend grondbeleid; BRO; BGT. Niet: veiligheid leefomgeving (1.2); thematische programma\'s (desbetreffend taakveld); actief grondbeleid (8.2 of 3.2).',
    '8.2': 'Bouwgrondexploitatie: voorbereidingskosten, grondverwerving, bouwrijp maken; bovenwijkse voorzieningen; financiering; verkoop bouwrijpe gronden; erfpacht; explosieven bij grondexploitatie. Niet: bedrijventerreinen (3.2); explosieven buiten grondexploitatie (1.2).',
    '8.3': 'Omgevingsvergunning (bouw, monumenten, aanleg, kap, ligplaatsen woonschepen, reclame, sloop, etc.); leges huisvestingswet; bouwtoezicht; BAG; woningbouw; woningverbetering; renovatie; woonruimteverdeling; stedelijke vernieuwing; subsidie verduurzaming woning; uitkoopregeling hoogspanningsverbindingen. Niet: woningverbetering Wmo (6.60).',
};

function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

// ─── Initialisatie ───

function loadData() {
    try {
        if (typeof ALL_DECISIONS_DATA === 'undefined' || typeof THEMA_BOOM_DATA === 'undefined') {
            throw new Error('data.js niet geladen.');
        }
        allDecisions = ALL_DECISIONS_DATA.slice();
        console.log(`Data geladen: ${allDecisions.length} besluiten (Iv3-structuur)`);
        vulJaarFilters();
        renderDossierKaarten(THEMA_BOOM_DATA);
    } catch (error) {
        console.error('Fout bij laden data:', error);
    }
}

function vulJaarFilters() {
    const jaren = [...new Set(allDecisions.map(d => (d.datum || '').substring(0, 4)).filter(Boolean))].sort().reverse();
    [document.getElementById('yearFilter'), document.getElementById('zoekYearFilter')].forEach(sel => {
        if (!sel) return;
        const current = sel.innerHTML;
        sel.innerHTML = '<option value="">Alle jaren</option>' + jaren.map(j => `<option value="${j}">${j}</option>`).join('');
    });
}

function calculateThemaCounts(decisions) {
    const counts = {};
    decisions.forEach(d => {
        const h = d.hoofdstuk || '0 Bestuur en ondersteuning';
        counts[h] = (counts[h] || 0) + 1;
    });
    return counts;
}

// ─── Dossier-kaarten (9 hoofdstukken) ───

function renderDossierKaarten(tree) {
    window.themaTree = tree;
    const container = document.getElementById('dossierKaarten');
    if (!container) return;

    const counts = calculateThemaCounts(allDecisions);
    container.innerHTML = '';

    tree.forEach(hoofdstuk => {
        const naam = hoofdstuk.naam;
        const count = counts[naam] || 0;
        const kleuren = getThemaKleur(naam);

        const kaart = document.createElement('button');
        kaart.type = 'button';
        kaart.className = 'dossier-kaart';
        kaart.setAttribute('data-thema', naam);
        kaart.style.borderLeftColor = kleuren.accent;

        const toelichting = HOOFDSTUK_TOELICHTING[naam];
        kaart.innerHTML = `
            <div class="dossier-kaart-header">
                <span class="dossier-kaart-naam">${escapeHtml(naam)}</span>
                <span class="dossier-kaart-count">${count}</span>
            </div>
            ${toelichting ? `<p class="dossier-kaart-toelichting">${escapeHtml(toelichting)}</p>` : ''}
            <span class="dossier-kaart-cta">Bekijk taakvelden →</span>
        `;
        kaart.onclick = () => openDossier(naam);
        container.appendChild(kaart);
    });
}

// ─── View switching ───

function showView(mode) {
    viewMode = mode;
    document.getElementById('dossierOverzicht').style.display = mode === 'overzicht' ? '' : 'none';
    document.getElementById('dossierDetail').style.display = mode === 'dossier' ? '' : 'none';
    document.getElementById('zoekResultaten').style.display = mode === 'zoekresultaten' ? '' : 'none';
}

function openDossier(hoofdstukNaam, subFilter) {
    activeDossier = { domein: hoofdstukNaam, subFilter: subFilter || null };
    showView('dossier');

    document.getElementById('dossierTitel').textContent = hoofdstukNaam;
    renderToelichting(hoofdstukNaam, subFilter || null);
    renderSubTegels(hoofdstukNaam, subFilter);
    loadDossierBesluiten(hoofdstukNaam);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderToelichting(hoofdstukNaam, taakveldCode) {
    const el = document.getElementById('toelichtingBlok');
    if (!el) return;
    let tekst = null;
    if (taakveldCode && TAAKVELD_TOELICHTING[taakveldCode]) {
        tekst = TAAKVELD_TOELICHTING[taakveldCode];
    } else if (HOOFDSTUK_TOELICHTING[hoofdstukNaam]) {
        tekst = HOOFDSTUK_TOELICHTING[hoofdstukNaam];
    }
    if (tekst) {
        el.style.display = '';
        el.innerHTML = `<p class="toelichting-tekst">${escapeHtml(tekst)}</p>`;
    } else {
        el.style.display = 'none';
        el.innerHTML = '';
    }
}

function sluitDossier() {
    activeDossier = null;
    resetFilters();
    showView('overzicht');
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Sub-tegels (taakvelden) ───

function parseTaakveldCode(naam) {
    const m = (naam || '').match(/^([\d.]+)\s/);
    return m ? m[1] : null;
}

function renderSubTegels(hoofdstukNaam, activeTaakveldCode) {
    const container = document.getElementById('subTegels');
    if (!container) return;
    container.innerHTML = '';

    const kleuren = getThemaKleur(hoofdstukNaam);
    const domein = (window.themaTree || THEMA_BOOM_DATA).find(d => d.naam === hoofdstukNaam);
    if (!domein || !domein.kinderen || !domein.kinderen.length) return;

    const dossierBesluiten = allDecisions.filter(d => (d.hoofdstuk || '') === hoofdstukNaam);
    const maxCount = Math.max(...domein.kinderen.map(k => k.aantal || 0), 1);

    const grid = document.createElement('div');
    grid.className = 'sub-tegels-grid';

    domein.kinderen.forEach(kind => {
        const code = parseTaakveldCode(kind.naam) || kind.code;
        const count = kind.aantal || dossierBesluiten.filter(d => d.taakveld_code === code).length;
        const isActive = activeTaakveldCode === code;
        const intensity = Math.max(0.06, (count / maxCount) * 0.25);

        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'sub-kaart' + (isActive ? ' sub-kaart-actief' : '') + (count === 0 ? ' sub-kaart-leeg' : '');

        if (isActive) {
            card.style.background = kleuren.accent;
            card.style.color = '#fff';
            card.style.borderColor = kleuren.accent;
        } else {
            card.style.borderLeftColor = kleuren.accent;
            if (count > 0) card.style.background = hexToRgba(kleuren.accent, intensity);
        }

        const toelichting = TAAKVELD_TOELICHTING[code];
        const toelichtingKort = toelichting ? (toelichting.length > 140 ? toelichting.slice(0, 137) + '…' : toelichting) : '';
        card.innerHTML = `
            <div class="sub-kaart-top">
                <span class="sub-kaart-naam">${escapeHtml(kind.naam)}</span>
                <span class="sub-kaart-count">${count}</span>
            </div>
            ${toelichtingKort ? `<p class="sub-kaart-toelichting">${escapeHtml(toelichtingKort)}</p>` : ''}
        `;

        if (count > 0 || !activeTaakveldCode) {
            card.onclick = () => {
                activeDossier.subFilter = code;
                renderToelichting(hoofdstukNaam, code);
                renderSubTegels(hoofdstukNaam, code);
                updateBreadcrumb(hoofdstukNaam, kind.naam, count, kleuren);
                loadDossierBesluiten(hoofdstukNaam);
            };
        }
        grid.appendChild(card);
    });

    container.appendChild(grid);

    if (!activeTaakveldCode) {
        const el = document.getElementById('subBreadcrumb');
        if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    }
}

function updateBreadcrumb(hoofdstukNaam, taakveldNaam, count, kleuren) {
    const el = document.getElementById('subBreadcrumb');
    if (!el) return;
    if (!taakveldNaam) {
        el.style.display = 'none';
        el.innerHTML = '';
        return;
    }
    el.style.display = '';
    el.innerHTML = `
        <span class="breadcrumb-thema">${escapeHtml(hoofdstukNaam)}</span>
        <span class="breadcrumb-sep">→</span>
        <span class="breadcrumb-sub" style="color:${kleuren.accent}">${escapeHtml(taakveldNaam)}</span>
        <span class="breadcrumb-count">(${count})</span>
        <button class="breadcrumb-reset" onclick="activeDossier.subFilter=null;openDossier('${hoofdstukNaam.replace(/'/g, "\\'")}')">✕ Wis filter</button>
    `;
}

// ─── Besluiten laden ───

function loadDossierBesluiten(hoofdstukNaam) {
    let besluiten = allDecisions.filter(d => (d.hoofdstuk || '') === hoofdstukNaam);

    if (activeDossier && activeDossier.subFilter) {
        besluiten = besluiten.filter(d => d.taakveld_code === activeDossier.subFilter);
    }

    filteredDecisions = besluiten;

    const countEl = document.getElementById('besluitenCount');
    if (countEl) countEl.textContent = `(${filteredDecisions.length})`;

    const sortBy = document.getElementById('sortBy').value;
    sortDecisions(sortBy);
    displayDecisions('resultsList', 'resultsCount', 'noResults');
}

function resetFilters() {
    const yearEl = document.getElementById('yearFilter');
    const typeEl = document.getElementById('typeFilter');
    const sortEl = document.getElementById('sortBy');
    if (yearEl) yearEl.value = '';
    if (typeEl) typeEl.value = '';
    if (sortEl) sortEl.value = 'datum-desc';
}

function applyDossierFilters() {
    if (!activeDossier) return;
    const year = document.getElementById('yearFilter')?.value;
    const type = document.getElementById('typeFilter')?.value;

    let results = allDecisions.filter(d => (d.hoofdstuk || '') === activeDossier.domein);
    if (activeDossier.subFilter) {
        results = results.filter(d => d.taakveld_code === activeDossier.subFilter);
    }
    if (year) results = results.filter(d => (d.datum || '').startsWith(year));
    if (type) results = results.filter(d => d.bron === type);

    filteredDecisions = results;
    const sortBy = document.getElementById('sortBy').value;
    sortDecisions(sortBy);
    displayDecisions('resultsList', 'resultsCount', 'noResults');
}

function sortDecisions(sortBy) {
    if (sortBy === 'datum-desc') filteredDecisions.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
    else if (sortBy === 'datum-asc') filteredDecisions.sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
    else if (sortBy === 'naam-asc') filteredDecisions.sort((a, b) => (a.naam || '').localeCompare(b.naam || ''));
    else if (sortBy === 'naam-desc') filteredDecisions.sort((a, b) => (b.naam || '').localeCompare(a.naam || ''));
}

function renderDecisionItem(d) {
    const link = d.link || d.pdf_url || '#';
    const datum = d.datum ? new Date(d.datum).toLocaleDateString('nl-NL') : '';
    const bron = d.bron === 'raad' ? 'Raadsbesluit' : d.bron === 'college' ? 'Collegebesluit (B&W)' : d.bron || '';
    return `
        <div class="result-item">
            <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(d.naam || 'Onbekend')}</a>
            <div class="result-item-meta">${datum} · ${escapeHtml(bron)}</div>
        </div>
    `;
}

function displayDecisions(listId, countId, noResultsId) {
    const listEl = document.getElementById(listId);
    const countEl = document.getElementById(countId);
    const noEl = document.getElementById(noResultsId);
    if (!listEl) return;

    if (filteredDecisions.length === 0) {
        listEl.style.display = 'none';
        if (noEl) noEl.style.display = 'block';
        if (countEl) countEl.textContent = '0 raads- en collegebesluiten';
        return;
    }

    listEl.style.display = 'block';
    if (noEl) noEl.style.display = 'none';
    if (countEl) countEl.textContent = `${filteredDecisions.length} raads- en collegebesluit${filteredDecisions.length !== 1 ? 'en' : ''}`;
    listEl.innerHTML = filteredDecisions.map(d => renderDecisionItem(d)).join('');
}

// ─── Zoekfunctie ───

function handleSearch() {
    const term = document.getElementById('searchInput').value.trim();
    if (!term) {
        if (viewMode === 'zoekresultaten') showView('overzicht');
        return;
    }

    const lowerTerm = term.toLowerCase();
    zoekBaseResults = allDecisions.filter(d => {
        const searchable = [d.naam || '', d.besluit || '', d.besluit_kort || '', d.hoofdstuk || '', d.taakveld || '', d.onderwerp_begroting || ''].join(' ').toLowerCase();
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
    const year = document.getElementById('zoekYearFilter')?.value;
    const type = document.getElementById('zoekTypeFilter')?.value;
    const sort = document.getElementById('zoekSortBy')?.value;

    let filtered = zoekBaseResults.slice();
    if (year) filtered = filtered.filter(d => (d.datum || '').startsWith(year));
    if (type) filtered = filtered.filter(d => d.bron === type);

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

// ─── Event listeners ───

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    document.getElementById('dossierTerug')?.addEventListener('click', sluitDossier);
    document.getElementById('zoekSluiten')?.addEventListener('click', sluitZoekresultaten);

    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('searchInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleSearch();
    });

    document.getElementById('yearFilter')?.addEventListener('change', applyDossierFilters);
    document.getElementById('typeFilter')?.addEventListener('change', applyDossierFilters);
    document.getElementById('sortBy')?.addEventListener('change', applyDossierFilters);
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        resetFilters();
        if (activeDossier) loadDossierBesluiten(activeDossier.domein);
    });

    document.getElementById('zoekYearFilter')?.addEventListener('change', applyZoekFilters);
    document.getElementById('zoekTypeFilter')?.addEventListener('change', applyZoekFilters);
    document.getElementById('zoekSortBy')?.addEventListener('change', applyZoekFilters);
});
