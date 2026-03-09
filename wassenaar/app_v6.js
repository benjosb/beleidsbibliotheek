// BeleidsWijzer Wassenaar v6 — publish-after-approval

// ─── Versiebeheer ───

const VERSIE_MENU = [
    { versie: '6.0.0', naam: 'Publish-after-approval', beschrijving: 'Briefings pas zichtbaar na goedkeuring beleidsadviseur', url: 'index_v6_verificatie.html' },
    { versie: '5.1.0', naam: 'Dossier-first', beschrijving: 'Modulaire opzet met beleidsdossiers, briefings en coalitieakkoord', url: 'index_v4_modulair.html' },
    { versie: '3.0',   naam: 'Alles-in-één', beschrijving: 'Complete dataset in één HTML-bestand (457 KB)', url: 'index_v3_alles_in_een.html' },
    { versie: '2.0',   naam: 'Verbeterd', beschrijving: 'Verbeterde layout en zoekfunctie', url: 'index_v2.html' },
    { versie: '1.0',   naam: 'Prototype', beschrijving: 'Eerste werkende prototype', url: 'index_v1.html' },
];

// ─── Verificatie configuratie ───

const REVIEW_TOKEN = 'wassenaar2026review';
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://187.77.93.148/api'
    : '/api';

const DOSSIER_SLUGS = {
    'Bestuur & Veiligheid':              'bestuur-veiligheid',
    'Financiën, Economie & Sport':       'financien-economie',
    'Ruimte, Duurzaamheid & Mobiliteit': 'ruimte-duurzaamheid',
    'Sociaal Domein, Wonen & Onderwijs': 'sociaal-wonen',
    'Cultuur & Welzijn':                 'cultuur-welzijn',
    'Bedrijfsvoering':                   'bedrijfsvoering'
};

const DOSSIER_ADVISEURS = {
    'Bestuur & Veiligheid':              { email: 'adviseur@wassenaar.nl', naam: 'Beleidsadviseur Bestuur & Veiligheid' },
    'Financiën, Economie & Sport':       { email: 'adviseur@wassenaar.nl', naam: 'Beleidsadviseur Financiën' },
    'Ruimte, Duurzaamheid & Mobiliteit': { email: 'adviseur@wassenaar.nl', naam: 'Beleidsadviseur Ruimte & Duurzaamheid' },
    'Sociaal Domein, Wonen & Onderwijs': { email: 'adviseur@wassenaar.nl', naam: 'Beleidsadviseur Sociaal Domein' },
    'Cultuur & Welzijn':                 { email: 'adviseur@wassenaar.nl', naam: 'Beleidsadviseur Cultuur & Welzijn' },
    'Bedrijfsvoering':                   { email: 'adviseur@wassenaar.nl', naam: 'Beleidsadviseur Bedrijfsvoering' }
};

const SECTIE_NAMEN = ['Samenvatting', 'Beleidsclusters', 'Beleidswijzigingen & opvolging', 'Lacunes & kanttekeningen', 'Bronnenlijst'];

let verificatieData = {};
let isReviewMode = false;

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

    if (typeof BRIEFING_HTML_DATA === 'undefined' || !BRIEFING_HTML_DATA[thema]) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">Geen beleidsdossier beschikbaar voor dit thema.</p>';
        return;
    }

    const body = extractBodyContent(BRIEFING_HTML_DATA[thema]);
    const sections = splitBySections(body);
    const slug = DOSSIER_SLUGS[thema] || 'onbekend';
    const adviseur = DOSSIER_ADVISEURS[thema] || { email: '', naam: 'Beleidsadviseur' };

    let html = '';
    let verifIdx = 0;
    sections.forEach((section) => {
        const headingLower = section.heading.toLowerCase();
        const isAlwaysVisible = headingLower.includes('bronnenlijst') || headingLower.includes('opmerkingen') || !section.heading;

        if (isAlwaysVisible) {
            html += section.html;
            return;
        }

        verifIdx++;
        const key = slug + '_' + verifIdx;
        const verif = verificatieData[key];
        const isApproved = verif && verif.status === 'akkoord';
        const needsCorrection = verif && verif.status === 'correctie_nodig';

        html += `<div class="briefing-sectie" id="sectie-${key}" data-sectie-key="${key}">`;

        if (isApproved || isReviewMode) {
            if (isApproved) {
                html += `<div class="verif-badge verif-akkoord">Geverifieerd ${formatVerifDatum(verif.datum)}</div>`;
            } else if (needsCorrection) {
                html += `<div class="verif-badge verif-correctie">Correctie nodig</div>`;
                if (verif.opmerking) html += `<div class="verif-opmerking">${escapeHtml(verif.opmerking)}</div>`;
            } else {
                html += `<div class="verif-badge verif-concept">Concept — niet gepubliceerd</div>`;
            }
            html += section.html;
            if (isReviewMode) {
                html += renderReviewButtons(key, verif);
            }
        } else {
            html += section.heading;
            html += renderPlaceholder(thema, verifIdx, adviseur);
        }

        html += '</div>';
    });

    container.innerHTML = html;
}

function splitBySections(html) {
    const parts = html.split(/(?=<h2>)/i);
    return parts.filter(p => p.trim()).map(p => {
        const headingMatch = p.match(/<h2>(.*?)<\/h2>/i);
        return {
            heading: headingMatch ? `<h2>${headingMatch[1]}</h2>` : '',
            html: p
        };
    });
}

function renderPlaceholder(thema, sectionNr, adviseur) {
    const slug = DOSSIER_SLUGS[thema] || 'onbekend';
    const sectieNaam = SECTIE_NAMEN[sectionNr - 1] || `Sectie ${sectionNr}`;
    const subject = encodeURIComponent(`BeleidsWijzer: verzoek goedkeuring "${sectieNaam}" — ${thema}`);
    const reviewUrl = `${window.location.origin}${window.location.pathname}?review=${REVIEW_TOKEN}#sectie-${slug}_${sectionNr}`;
    const body = encodeURIComponent(
        `Beste ${adviseur.naam},\n\n` +
        `Via de BeleidsWijzer is een verzoek ingediend om de sectie "${sectieNaam}" ` +
        `van het dossier "${thema}" goed te keuren.\n\n` +
        `U kunt de sectie reviewen via deze link:\n${reviewUrl}\n\n` +
        `Met vriendelijke groet,\nBeleidsWijzer Wassenaar`
    );
    const mailto = `mailto:${adviseur.email}?subject=${subject}&body=${body}`;

    return `
        <div class="sectie-placeholder">
            <p class="sectie-placeholder-tekst">Deze sectie wordt momenteel geverifieerd door de beleidsadviseur van dit dossier.</p>
            <a href="${mailto}" class="btn-verzoek-goedkeuring">Verzoek goedkeuring</a>
        </div>`;
}

function renderReviewButtons(key, verif) {
    const currentStatus = verif ? verif.status : '';
    return `
        <div class="review-buttons" data-key="${key}">
            <button type="button" class="btn-review btn-akkoord ${currentStatus === 'akkoord' ? 'active' : ''}" data-action="akkoord">Akkoord — publiceren</button>
            <button type="button" class="btn-review btn-correctie ${currentStatus === 'correctie_nodig' ? 'active' : ''}" data-action="correctie">Correctie nodig</button>
            ${currentStatus ? `<button type="button" class="btn-review btn-reset" data-action="reset">Intrekken</button>` : ''}
        </div>`;
}

function formatVerifDatum(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

async function loadVerificatieStatus() {
    try {
        const resp = await fetch(API_BASE + '/verificatie.json');
        if (resp.ok) verificatieData = await resp.json();
    } catch (e) {
        console.warn('Verificatie-status niet beschikbaar:', e.message);
    }
}

async function sendVerificatie(key, status, opmerking) {
    try {
        const resp = await fetch(API_BASE + '/verificatie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: REVIEW_TOKEN, key, status, opmerking: opmerking || '' })
        });
        const result = await resp.json();
        if (result.ok) {
            if (status === 'reset') {
                delete verificatieData[key];
            } else {
                verificatieData[key] = { status, datum: new Date().toISOString(), opmerking: opmerking || '' };
            }
            if (activeDossier) loadSyntheseContent(activeDossier);
        } else {
            alert('Fout: ' + (result.error || 'Onbekende fout'));
        }
    } catch (e) {
        alert('Kon verificatie niet opslaan: ' + e.message);
    }
}

function extractBodyContent(html) {
    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (match) return match[1];
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
    if (yf) yf.value = '';
    if (tf) tf.value = '';
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

    return `
        <div class="result-item" data-bron="${decision.bron || ''}" data-besluit-naam="${searchNaam}" data-besluit-datum="${decision.datum || ''}">
            <div class="result-header">
                <div>
                    <div class="result-title">${escapeHtml(decision.naam || (isCollege ? 'Naamloos collegebesluit' : 'Naamloos raadsbesluit'))}</div>
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

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    isReviewMode = params.get('review') === REVIEW_TOKEN;

    await loadVerificatieStatus();

    if (isReviewMode) {
        document.body.classList.add('review-mode');
        const banner = document.createElement('div');
        banner.className = 'review-banner';
        banner.innerHTML = 'Reviewmodus actief — niet-gepubliceerde secties zijn zichtbaar';
        document.body.prepend(banner);
    }

    // Scroll to section if hash present
    if (window.location.hash && window.location.hash.startsWith('#sectie-')) {
        setTimeout(() => {
            const el = document.querySelector(window.location.hash);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }

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

    // Review-knoppen (event delegation)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-review');
        if (!btn || !isReviewMode) return;
        const container = btn.closest('.review-buttons');
        const key = container.getAttribute('data-key');
        const action = btn.getAttribute('data-action');

        if (action === 'akkoord') {
            sendVerificatie(key, 'akkoord');
        } else if (action === 'correctie') {
            const opmerking = prompt('Wat moet er gecorrigeerd worden?');
            if (opmerking !== null) sendVerificatie(key, 'correctie_nodig', opmerking);
        } else if (action === 'reset') {
            if (confirm('Weet je zeker dat je de goedkeuring wilt intrekken?')) {
                sendVerificatie(key, 'reset');
            }
        }
    });

    // Verborgen versiemenu (long-press op versienummer)
    initVersieMenu();
});
