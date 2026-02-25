// BeleidsWijzer Wassenaar v4 — dossier-first

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
                <span class="versie-panel-titel">BeleidsWijzer — versies</span>
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
let activeDossier = null; // { domein: string, subFilter: string|null }
let viewMode = 'overzicht'; // 'overzicht' | 'dossier' | 'zoekresultaten'
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
    'P&C-cyclus': ['begroting','jaarrekening','burap','bestuursrapportage','kadernota'],
    'Sport': ['sport','bewegen','voetbal','tennis','zwem','hockey','sporthal'],
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
    'Onderwijs': ['school','onderwijs','leerling','leerplicht','kinderopvang'],
    'WMO': ['wmo','voorziening','hulpmiddel','zorg','welzijn'],
    'Jeugdzorg': ['jeugd','kind','jongere','jeugdhulp','jeugdzorg'],
    'Volksgezondheid': ['gezondheid','volksgezondheid','ggd','preventie'],
    'Warenar': ['warenar','theater','cultuur'],
    'Overig': [],
};

function matchSubthema(decision, keywords) {
    if (!keywords.length) return false;
    const text = [decision.naam || '', decision.besluit || ''].join(' ').toLowerCase();
    return keywords.some(kw => text.includes(kw.toLowerCase()));
}

const THEMA_ICONEN = {
    'Bestuur & Veiligheid': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'Financiën, Economie & Sport': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'Ruimte, Duurzaamheid & Mobiliteit': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    'Sociaal Domein, Wonen & Onderwijs': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'Cultuur & Welzijn': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    'Bedrijfsvoering': '<svg class="dossier-icoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
};

const BRIEFING_BESTANDEN = {
    'Bestuur & Veiligheid': 'briefings/briefing_bestuur_veiligheid.html',
    'Financiën, Economie & Sport': 'briefings/briefing_financien_economie_sport.html',
    'Ruimte, Duurzaamheid & Mobiliteit': 'briefings/briefing_ruimte_duurzaamheid_mobiliteit.html',
    'Sociaal Domein, Wonen & Onderwijs': 'briefings/briefing_sociaal_domein_wonen_onderwijs.html',
    'Cultuur & Welzijn': 'briefings/briefing_cultuur_welzijn.html',
    'Bedrijfsvoering': 'briefings/briefing_bedrijfsvoering.html'
};

// ─── Initialisation ───

function loadData() {
    try {
        if (typeof ALL_DECISIONS_DATA === 'undefined' || typeof THEMA_BOOM_DATA === 'undefined') {
            throw new Error('data.js niet geladen.');
        }
        allDecisions = ALL_DECISIONS_DATA;
        console.log(`Data geladen: ${allDecisions.length} raads- en collegebesluiten`);

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

function renderDossierKaarten(tree) {
    window.themaTree = tree;
    const container = document.getElementById('dossierKaarten');
    if (!container) return;
    container.innerHTML = '';

    const counts = calculateThemaCounts(allDecisions);

    tree.forEach(domein => {
        const naam = domein.naam;
        const count = counts[naam] || 0;
        const preview = previewCache[naam] || '';
        const icoon = THEMA_ICONEN[naam] || '';

        const kaart = document.createElement('button');
        kaart.type = 'button';
        kaart.className = 'dossier-kaart';
        kaart.setAttribute('data-thema', naam);
        const begr = BEGROTING_DATA[naam];
        const begrHtml = begr ? `
            <div class="dossier-kaart-begroting">
                <span class="begroting-bedrag">${formatBedrag(begr.bedrag)}</span>
                <span class="begroting-label">${escapeHtml(begr.programma)}${begr.gedeeld ? ' *' : ''}</span>
            </div>
        ` : '';

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
    document.getElementById('dossierOverzicht').style.display = mode === 'overzicht' ? '' : 'none';
    document.getElementById('dossierDetail').style.display = mode === 'dossier' ? '' : 'none';
    document.getElementById('zoekResultaten').style.display = mode === 'zoekresultaten' ? '' : 'none';
}

// ─── Open / sluit dossier ───

function openDossier(thema, subFilter) {
    activeDossier = { domein: thema, subFilter: subFilter || null };
    showView('dossier');

    document.getElementById('dossierTitel').textContent = thema;
    renderSubTegels(thema, subFilter);
    loadSyntheseContent(thema);
    loadCoalitieAkkoord(thema);
    loadDossierBesluiten(thema);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sluitDossier() {
    activeDossier = null;
    resetFilters();
    showView('overzicht');
}

function getRecentDate(decisions, keywords) {
    let latest = '';
    for (const d of decisions) {
        if (matchSubthema(d, keywords) && d.datum && d.datum > latest) latest = d.datum;
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

function getHoverPreview(decisions, keywords) {
    const matches = decisions.filter(d => matchSubthema(d, keywords));
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

    const domein = (window.themaTree || THEMA_BOOM_DATA).find(d => d.naam === thema);
    if (!domein || !domein.kinderen || !domein.kinderen.length) return;

    const kleuren = THEMA_KLEUREN[thema] || { accent: '#002244', light: '#d6e4f0', lighter: '#eaf1f8', text: '#001833' };
    const dossierBesluiten = allDecisions.filter(d => (d.domein || '') === thema);

    const subData = domein.kinderen.map(kind => {
        const keywords = SUBTHEMA_KEYWORDS[kind.naam] || [kind.naam.toLowerCase()];
        const count = keywords.length ? dossierBesluiten.filter(d => matchSubthema(d, keywords)).length : kind.aantal || 0;
        const recentDate = keywords.length ? getRecentDate(dossierBesluiten, keywords) : '';
        const preview = keywords.length ? getHoverPreview(dossierBesluiten, keywords) : [];
        return { naam: kind.naam, count, keywords, recentDate, preview };
    });

    const maxCount = Math.max(...subData.map(s => s.count), 1);

    const grid = document.createElement('div');
    grid.className = 'sub-tegels-grid';

    subData.filter(s => s.count > 0 || !activeSubFilter).forEach(sub => {
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

        if (sub.count > 0 && sub.keywords.length) {
            card.onclick = () => {
                activeDossier.subFilter = sub.naam;
                renderSubTegels(thema, sub.naam);
                updateBreadcrumb(thema, sub.naam, sub.count, kleuren);
                filterBySubthema(thema, sub.keywords);
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

function filterBySubthema(thema, keywords) {
    const dossierBesluiten = allDecisions.filter(d => (d.domein || '') === thema);
    filteredDecisions = dossierBesluiten.filter(d => matchSubthema(d, keywords));

    const countEl = document.getElementById('besluitenCount');
    if (countEl) countEl.textContent = `(${filteredDecisions.length})`;

    const sortBy = document.getElementById('sortBy').value;
    sortDecisions(sortBy);
    displayDecisions('resultsList', 'resultsCount', 'noResults');
    scrollToBesluiten();
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
        'Bestuur & Veiligheid': ['Burgemeester'],
        'Financiën, Economie & Sport': ['Wethouder Financiën, Economie en Sport'],
        'Ruimte, Duurzaamheid & Mobiliteit': ['Wethouder Ruimte, Duurzaamheid en Mobiliteit'],
        'Sociaal Domein, Wonen & Onderwijs': ['Wethouder Sociaal, Wonen en Onderwijs'],
        'Cultuur & Welzijn': ['Wethouder Cultuur en Welzijn'],
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

function loadDossierBesluiten(thema) {
    let besluiten = allDecisions.filter(d => (d.domein || 'Niet geclassificeerd') === thema);

    if (activeDossier && activeDossier.subFilter) {
        const keywords = SUBTHEMA_KEYWORDS[activeDossier.subFilter] || [activeDossier.subFilter.toLowerCase()];
        besluiten = besluiten.filter(d => matchSubthema(d, keywords));
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

    let results = allDecisions.filter(d => (d.domein || 'Niet geclassificeerd') === activeDossier.domein);

    if (activeDossier.subFilter) {
        const keywords = SUBTHEMA_KEYWORDS[activeDossier.subFilter] || [activeDossier.subFilter.toLowerCase()];
        results = results.filter(d => matchSubthema(d, keywords));
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
    if (decision.pdf_url) {
        parts.push(`<a href="${decision.pdf_url}" target="_blank" rel="noopener noreferrer" class="result-link">Bekijk besluitenlijst (PDF) →</a>`);
    }
    if (decision.link && decision.link.startsWith('http')) {
        parts.push(`<a href="${decision.link}" target="_blank" rel="noopener noreferrer" class="result-link">Bekijk document →</a>`);
    } else if (decision.link && decision.link.includes('iBabs')) {
        const q = encodeURIComponent(`"${decision.naam || ''}" site:wassenaar.bestuurlijkeinformatie.nl`);
        parts.push(`<a href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener noreferrer" class="result-link">Zoek in iBabs →</a>`);
        parts.push(`<a href="https://wassenaar.bestuurlijkeinformatie.nl/" target="_blank" rel="noopener noreferrer" class="result-link result-link-secondary">iBabs Portaal →</a>`);
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

// ─── Event listeners ───

document.addEventListener('DOMContentLoaded', () => {
    loadData();

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
