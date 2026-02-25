// BeleidsWijzer Wassenaar v5 — verificatie

// ─── Versiebeheer ───

const VERSIE_MENU = [
    { versie: '5.2.0', naam: 'Verificatie', beschrijving: 'Review-modus voor bestuursadviseurs met goedkeuringssysteem', url: 'index_v5_verificatie.html' },
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
let activeDossier = null; // { domein: string }
let viewMode = 'overzicht'; // 'overzicht' | 'dossier' | 'zoekresultaten'
let briefingCache = {};
let previewCache = {};

// ─── Verificatie-systeem ───

let reviewMode = false;
let verificatieData = {};
const VERIFICATIE_KEY = 'beleidswijzer_verificatie';

function getDecisionKey(d) {
    return (d.datum || '') + '_' + (d.naam || '').replace(/\s+/g, '_').substring(0, 60);
}

function loadVerificatieData() {
    try {
        const raw = localStorage.getItem(VERIFICATIE_KEY);
        verificatieData = raw ? JSON.parse(raw) : {};
    } catch { verificatieData = {}; }
}

function saveVerificatieData() {
    localStorage.setItem(VERIFICATIE_KEY, JSON.stringify(verificatieData));
}

function getVerificatieStatus(d) {
    return verificatieData[getDecisionKey(d)] || 'niet_geverifieerd';
}

function setVerificatieStatus(d, status, opmerking) {
    const key = getDecisionKey(d);
    verificatieData[key] = status;
    if (opmerking) {
        if (!verificatieData._opmerkingen) verificatieData._opmerkingen = {};
        verificatieData._opmerkingen[key] = opmerking;
    }
    saveVerificatieData();
}

function toggleReviewMode() {
    reviewMode = !reviewMode;
    document.body.classList.toggle('review-mode', reviewMode);
    const btn = document.getElementById('reviewModeBtn');
    if (btn) btn.textContent = reviewMode ? 'Review-modus uit' : 'Review-modus';
    if (activeDossier) {
        loadDossierBesluiten(activeDossier.domein);
    } else if (viewMode === 'zoekresultaten') {
        applyZoekFilters();
    }
}

function handleVerificatieAction(key, action) {
    const decision = allDecisions.find(d => getDecisionKey(d) === key);
    if (!decision) return;

    if (action === 'akkoord') {
        setVerificatieStatus(decision, 'geverifieerd');
    } else if (action === 'correctie') {
        const opmerking = prompt('Wat moet gecorrigeerd worden?');
        if (opmerking !== null) {
            setVerificatieStatus(decision, 'correctie_nodig', opmerking);
        } else {
            return;
        }
    }

    updateVerificatieBalk();
    if (activeDossier) {
        loadDossierBesluiten(activeDossier.domein);
    } else if (viewMode === 'zoekresultaten') {
        applyZoekFilters();
    }
}

function exportVerificatieData() {
    const blob = new Blob([JSON.stringify(verificatieData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verificatie_beleidswijzer_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importVerificatieData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                Object.assign(verificatieData, imported);
                saveVerificatieData();
                if (activeDossier) loadDossierBesluiten(activeDossier.domein);
                else if (viewMode === 'zoekresultaten') applyZoekFilters();
                alert(`Verificatiedata geïmporteerd (${Object.keys(imported).length} items).`);
            } catch { alert('Ongeldig bestand.'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function getVerificatieStats() {
    let totaal = allDecisions.length;
    let geverifieerd = 0, correctie = 0;
    allDecisions.forEach(d => {
        const s = getVerificatieStatus(d);
        if (s === 'geverifieerd') geverifieerd++;
        else if (s === 'correctie_nodig') correctie++;
    });
    return { totaal, geverifieerd, correctie, open: totaal - geverifieerd - correctie };
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
        loadVerificatieData();
        console.log(`Data geladen: ${allDecisions.length} raads- en collegebesluiten`);

        buildPreviewCache();
        renderDossierKaarten(THEMA_BOOM_DATA);
        updateVerificatieBalk();
    } catch (error) {
        console.error('Fout bij laden data:', error);
    }
}

function updateVerificatieBalk() {
    const balk = document.getElementById('verificatieBalk');
    if (!balk) return;
    const s = getVerificatieStats();
    const pct = s.totaal ? Math.round((s.geverifieerd / s.totaal) * 100) : 0;
    balk.innerHTML = `
        <span class="verif-stats-tekst">${s.geverifieerd} van ${s.totaal} geverifieerd (${pct}%)</span>
        <span class="verif-stats-detail">${s.correctie ? ` · ${s.correctie} correctie nodig` : ''}</span>
        <div class="verif-bar"><div class="verif-bar-fill" style="width:${pct}%"></div></div>
    `;
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

function openDossier(thema) {
    activeDossier = { domein: thema };
    showView('dossier');

    document.getElementById('dossierTitel').textContent = thema;
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

function loadSyntheseContent(thema) {
    const container = document.getElementById('dossierSynthese');
    if (!container) return;

    if (briefingCache[thema]) {
        container.innerHTML = briefingCache[thema];
        return;
    }

    if (typeof BRIEFING_HTML_DATA !== 'undefined' && BRIEFING_HTML_DATA[thema]) {
        const body = extractBodyContent(BRIEFING_HTML_DATA[thema]);
        briefingCache[thema] = body;
        container.innerHTML = body;
    } else {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">Geen beleidsdossier beschikbaar voor dit thema.</p>';
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
    filteredDecisions = allDecisions.filter(d => (d.domein || 'Niet geclassificeerd') === thema);

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
    const verif = document.getElementById('zoekVerifFilter')?.value || '';

    let filtered = zoekBaseResults.slice();

    if (year) filtered = filtered.filter(d => (d.datum || '').startsWith(year));
    if (type) {
        if (type === 'raad') filtered = filtered.filter(d => d.type === 'Raadsbesluit');
        else if (type === 'college') filtered = filtered.filter(d => d.type === 'Collegebesluit (B&W)');
    }
    if (verif) {
        filtered = filtered.filter(d => getVerificatieStatus(d) === verif);
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
    const verif = document.getElementById('verifFilter')?.value || '';

    let results = allDecisions.filter(d => (d.domein || 'Niet geclassificeerd') === activeDossier.domein);

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
    if (verif) {
        results = results.filter(d => getVerificatieStatus(d) === verif);
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
    const vf = document.getElementById('verifFilter');
    if (yf) yf.value = '';
    if (tf) tf.value = '';
    if (vf) vf.value = '';
}

function sortDecisions(sortBy) {
    filteredDecisions.sort((a, b) => {
        switch (sortBy) {
            case 'datum-desc': return (b.datum || '').localeCompare(a.datum || '');
            case 'datum-asc':  return (a.datum || '').localeCompare(b.datum || '');
            case 'naam-asc':   return (a.naam || '').localeCompare(b.naam || '');
            case 'naam-desc':  return (b.naam || '').localeCompare(a.naam || '');
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

    const besluitText = (decision.besluit || '').trim();
    const isCollege = decision.bron === 'college';
    const maxPreview = isCollege ? 500 : 300;
    const isLong = besluitText.length > maxPreview;
    const previewPart = isLong ? besluitText.substring(0, maxPreview) + '…' : besluitText;
    const fullPart = isLong ? besluitText.substring(maxPreview) : '';
    const idSuffix = Math.random().toString(36).slice(2, 9);
    const links = buildDecisionLinks(decision);

    const searchNaam = (decision.naam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const verifStatus = getVerificatieStatus(decision);
    const decKey = getDecisionKey(decision);
    const verifBadge = renderVerificatieBadge(verifStatus);
    const reviewButtons = reviewMode ? renderReviewButtons(decKey, verifStatus) : '';

    return `
        <div class="result-item verif-${verifStatus}" data-bron="${decision.bron || ''}" data-besluit-naam="${searchNaam}" data-besluit-datum="${decision.datum || ''}">
            <div class="result-header">
                <div>
                    <div class="result-title">${escapeHtml(decision.naam || (isCollege ? 'Naamloos collegebesluit' : 'Naamloos raadsbesluit'))} ${verifBadge}</div>
                    <div class="result-meta">
                        <span>📅 ${datum}</span>
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
            ${reviewButtons}
        </div>
    `;
}

function renderVerificatieBadge(status) {
    const labels = {
        'geverifieerd': '<span class="verif-badge verif-ok" title="Geverifieerd door bestuursadviseur">✓</span>',
        'correctie_nodig': '<span class="verif-badge verif-correctie" title="Correctie nodig">⚠</span>',
        'niet_geverifieerd': '<span class="verif-badge verif-open" title="Nog niet geverifieerd">○</span>'
    };
    return labels[status] || labels['niet_geverifieerd'];
}

function renderReviewButtons(decKey, status) {
    const safeKey = decKey.replace(/"/g, '&quot;');
    const akkoordDisabled = status === 'geverifieerd' ? ' disabled' : '';
    return `
        <div class="review-actions">
            <button type="button" class="review-btn review-btn-ok${status === 'geverifieerd' ? ' review-btn-active' : ''}" data-verif-key="${safeKey}" data-verif-action="akkoord"${akkoordDisabled}>✓ Akkoord</button>
            <button type="button" class="review-btn review-btn-flag${status === 'correctie_nodig' ? ' review-btn-active' : ''}" data-verif-key="${safeKey}" data-verif-action="correctie">⚠ Correctie nodig</button>
            ${status === 'correctie_nodig' && verificatieData._opmerkingen && verificatieData._opmerkingen[decKey]
                ? `<span class="review-opmerking" title="${escapeHtml(verificatieData._opmerkingen[decKey])}">💬 ${escapeHtml(verificatieData._opmerkingen[decKey])}</span>`
                : ''}
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
    const cleaned = refText.replace(/[\[\]]/g, '').trim();
    const parts = cleaned.split(';').map(s => s.trim());
    const firstRef = parts[0];

    if (/coalitieakkoord/i.test(firstRef)) {
        navigateToCoalitieSection(firstRef);
        return;
    }

    const details = document.getElementById('dossierBesluiten');
    if (!details) return;

    const datumMatch = firstRef.match(/(\d{2}-\d{2}-\d{4})/);
    const refDatum = datumMatch ? datumMatch[1] : null;
    const refDatumISO = refDatum ? refDatum.split('-').reverse().join('-') : null;

    const namePart = firstRef
        .replace(/^(Raadsbesluit|Collegebesluit)\s*:\s*/i, '')
        .replace(/,\s*\d{2}-\d{2}-\d{4}.*$/, '')
        .replace(/,\s*\d{4}.*$/, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    if (!namePart || namePart.length < 4) {
        if (!details.open) details.open = true;
        details.querySelector('.dossier-besluiten-kop').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    const items = document.querySelectorAll('#resultsList .result-item');
    let bestMatch = null;
    let bestScore = 0;

    items.forEach(item => {
        const itemNaam = item.getAttribute('data-besluit-naam') || '';
        const itemDatum = item.getAttribute('data-besluit-datum') || '';
        if (!itemNaam) return;

        let score = 0;

        if (namePart.length > 6 && itemNaam.includes(namePart)) {
            score += namePart.length * 3;
        } else {
            const words = namePart.match(/.{4,}/g) || [namePart];
            words.forEach(w => { if (itemNaam.includes(w)) score += w.length; });
        }

        if (refDatumISO && itemDatum === refDatumISO) {
            score += 20;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
        }
    });

    const minScore = refDatumISO ? 24 : 8;
    if (bestMatch && bestScore >= minScore) {
        if (!details.open) details.open = true;
        document.querySelectorAll('.result-item.highlight').forEach(el => el.classList.remove('highlight'));
        bestMatch.classList.add('highlight');
        setTimeout(() => {
            bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        setTimeout(() => bestMatch.classList.remove('highlight'), 4000);
    } else {
        showRefToast(firstRef, refDatum);
    }
}

function showRefToast(refText, datum) {
    let toast = document.getElementById('refToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'refToast';
        toast.className = 'ref-toast';
        document.body.appendChild(toast);
    }
    const name = refText
        .replace(/^(Raadsbesluit|Collegebesluit)\s*:\s*/i, '')
        .replace(/,\s*\d{2}-\d{2}-\d{4}.*$/, '')
        .trim();
    const year = datum ? datum.split('-')[2] : '?';
    toast.innerHTML = `<strong>${escapeHtml(name)}</strong><br><span style="font-size:0.85em">Dit raads- of collegebesluit (${year}) is nog niet opgenomen.<br>De data voor 2022–2024 wordt binnenkort toegevoegd.</span>`;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 5000);
}

function navigateToCoalitieSection(refText) {
    const blok = document.getElementById('coalitieAkkoordBlok');
    if (!blok) return;
    if (!blok.open) blok.open = true;

    const sectionHint = refText
        .replace(/coalitieakkoord\s*\d*/i, '')
        .replace(/^[\s,]+|[\s,]+$/g, '')
        .trim()
        .toLowerCase();

    if (!sectionHint || sectionHint.length < 3) {
        blok.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    const secties = blok.querySelectorAll('.coalitie-sectie');
    let bestMatch = null;
    let bestScore = 0;

    secties.forEach(el => {
        const titel = (el.querySelector('.coalitie-sectie-titel')?.textContent || '').toLowerCase();
        const hint = sectionHint.replace(/[^a-z]/g, '');
        const titelClean = titel.replace(/[^a-z]/g, '');

        let score = 0;
        if (titelClean.includes(hint)) score = hint.length * 3;
        else {
            const words = hint.match(/.{3,}/g) || [hint];
            words.forEach(w => { if (titelClean.includes(w)) score += w.length; });
        }
        if (score > bestScore) { bestScore = score; bestMatch = el; }
    });

    const target = (bestMatch && bestScore >= 4) ? bestMatch : blok;
    target.classList.add('highlight');
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    setTimeout(() => target.classList.remove('highlight'), 4000);
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

    // Bronnenlijst-rijen → klikbaar naar besluit of coalitieakkoord
    document.addEventListener('click', (e) => {
        const row = e.target.closest('.bronnenlijst tbody tr');
        if (!row) return;
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;
        const datum = cells[0].textContent.trim();
        const naam = cells[1].textContent.trim();
        const type = cells[2].textContent.trim();
        if (/coalitieakkoord/i.test(type)) {
            navigateToDecision('[Coalitieakkoord 2022]');
        } else {
            const prefix = /raad/i.test(type) ? 'Raadsbesluit' : 'Collegebesluit';
            navigateToDecision(`[${prefix}: ${naam}, ${datum}]`);
        }
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

    // Review-actie knoppen (via event delegation)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-verif-action]');
        if (!btn) return;
        const key = btn.getAttribute('data-verif-key');
        const action = btn.getAttribute('data-verif-action');
        if (key && action) handleVerificatieAction(key, action);
    });

    // Review-modus
    const reviewBtn = document.getElementById('reviewModeBtn');
    if (reviewBtn) reviewBtn.addEventListener('click', toggleReviewMode);

    const exportBtn = document.getElementById('exportVerifBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportVerificatieData);

    const importBtn = document.getElementById('importVerifBtn');
    if (importBtn) importBtn.addEventListener('click', importVerificatieData);

    // Verificatiefilter binnen dossier
    const verifFilter = document.getElementById('verifFilter');
    if (verifFilter) verifFilter.addEventListener('change', applyDossierFilters);

    const zoekVerifFilter = document.getElementById('zoekVerifFilter');
    if (zoekVerifFilter) zoekVerifFilter.addEventListener('change', applyZoekFilters);
});
