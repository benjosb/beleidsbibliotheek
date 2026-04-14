// Schrijf-Wijzer Formulier — tweetraps, knoppen in document
(function () {
    'use strict';

    const STORAGE_KEY = 'schrijf-wijzer-voorstel';
    const SECTIE_IDS = ['aanleiding', 'gevraagde_beslissing', 'beslispunten', 'financieel', 'juridisch'];
    const SECTIE_ELEMENT_IDS = {
        aanleiding: { knoppen: 'swfKnoppenAanleiding', beleid: 'swfBeleidAanleiding', textarea: 'swfAanleiding' },
        gevraagde_beslissing: { knoppen: 'swfKnoppenBeslissing', beleid: 'swfBeleidBeslissing', textarea: 'swfBeslissing' },
        beslispunten: { knoppen: 'swfKnoppenBeslispunten', beleid: 'swfBeleidBeslispunten', textarea: 'swfBeslispunten' },
        financieel: { knoppen: 'swfKnoppenFinancieel', beleid: 'swfBeleidFinancieel', textarea: 'swfFinancieel' },
        juridisch: { knoppen: 'swfKnoppenJuridisch', beleid: 'swfBeleidJuridisch', textarea: 'swfJuridisch' },
    };

    let gekozenPortefeuille = null;
    const sectieSelecties = {}; // { aanleiding: Set(['Jeugdhulp', ...]), ... }

    const trap1 = document.getElementById('swfTrap1');
    const formulier = document.getElementById('swfFormulier');
    const portefeuilleKnoppen = document.getElementById('swfPortefeuilleKnoppen');
    const portefeuilleHidden = document.getElementById('swfPortefeuille');

    function escapeHtml(s) {
        if (!s) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    // ─── Trap 1: Portefeuille ───
    function renderPortefeuilleKnoppen() {
        portefeuilleKnoppen.innerHTML = '';
        SCHRIJF_WIJZER_DOMEINEN.forEach(p => {
            const kleur = SCHRIJF_WIJZER_KLEUREN[p] || { accent: '#0060ac' };
            const isGekozen = gekozenPortefeuille === p;
            const knop = document.createElement('button');
            knop.type = 'button';
            knop.className = 'swf-portefeuille-knop' + (isGekozen ? ' swf-geselecteerd' : '');
            knop.textContent = p;
            knop.style.borderColor = isGekozen ? kleur.accent : '';
            knop.style.background = isGekozen ? kleur.accent : '';
            knop.style.color = isGekozen ? '#fff' : kleur.accent;
            knop.addEventListener('click', () => selectPortefeuille(p));
            portefeuilleKnoppen.appendChild(knop);
        });
    }

    function selectPortefeuille(p) {
        gekozenPortefeuille = p;
        portefeuilleHidden.value = p;
        const label = document.getElementById('swfPortefeuilleLabel');
        if (label) label.textContent = p;
        trap1.style.display = 'none';
        formulier.style.display = 'block';
        renderPortefeuilleKnoppen();

        // Init sectie-selecties
        SECTIE_IDS.forEach(id => {
            if (!sectieSelecties[id]) sectieSelecties[id] = new Set();
        });
        renderAlleSectieKnoppen();
        laadOpgeslagen();
    }

    // ─── Trap 2: Subthema's per sectie ───
    function getSubthemasVoorPortefeuille() {
        if (!gekozenPortefeuille) return [];
        const items = SCHRIJF_WIJZER_SAMENVATTINGEN[gekozenPortefeuille] || [];
        return items.map(i => ({ thema: i.thema, samenvatting: i.samenvatting }));
    }

    function renderSectieKnoppen(sectieId) {
        const ids = SECTIE_ELEMENT_IDS[sectieId];
        if (!ids) return;
        const knoppenEl = document.getElementById(ids.knoppen);
        const beleidEl = document.getElementById(ids.beleid);
        if (!knoppenEl || !beleidEl) return;

        const subthemas = getSubthemasVoorPortefeuille();
        const kleur = SCHRIJF_WIJZER_KLEUREN[gekozenPortefeuille] || { accent: '#0060ac' };
        const geselecteerd = sectieSelecties[sectieId] || new Set();

        knoppenEl.innerHTML = '';
        subthemas.forEach(item => {
            const knop = document.createElement('button');
            knop.type = 'button';
            knop.className = 'swf-subthema-knop' + (geselecteerd.has(item.thema) ? ' swf-geselecteerd' : '');
            knop.textContent = item.thema;
            knop.style.borderColor = geselecteerd.has(item.thema) ? kleur.accent : '';
            knop.style.background = geselecteerd.has(item.thema) ? kleur.accent : '';
            knop.style.color = geselecteerd.has(item.thema) ? '#fff' : kleur.accent;
            knop.addEventListener('click', () => toggleSubthema(sectieId, item.thema));
            knoppenEl.appendChild(knop);
        });

        // Beleidspanel
        if (geselecteerd.size === 0) {
            beleidEl.innerHTML = '';
            beleidEl.style.borderLeftColor = '';
        } else {
            let html = '';
            subthemas.filter(i => geselecteerd.has(i.thema)).forEach(item => {
                html += `<div class="swf-beleid-item">
                    <div class="swf-beleid-thema">${escapeHtml(item.thema)}</div>
                    <div class="swf-beleid-tekst">${escapeHtml(item.samenvatting)}</div>
                </div>`;
            });
            beleidEl.innerHTML = html;
            beleidEl.style.borderLeftColor = kleur.accent;
        }
    }

    function toggleSubthema(sectieId, thema) {
        if (!sectieSelecties[sectieId]) sectieSelecties[sectieId] = new Set();
        if (sectieSelecties[sectieId].has(thema)) {
            sectieSelecties[sectieId].delete(thema);
        } else {
            sectieSelecties[sectieId].add(thema);
        }
        renderSectieKnoppen(sectieId);
        opslaan();
    }

    function renderAlleSectieKnoppen() {
        SECTIE_IDS.forEach(id => renderSectieKnoppen(id));
    }

    // ─── Opslaan / laden ───
    function getDocumentState() {
        const secties = {};
        SECTIE_IDS.forEach(id => {
            const ids = SECTIE_ELEMENT_IDS[id];
            const ta = ids ? document.getElementById(ids.textarea) : null;
            secties[id] = {
                tekst: ta ? ta.value : '',
                geselecteerdeSubthemas: Array.from(sectieSelecties[id] || [])
            };
        });
        return {
            versie: '1.0',
            portefeuille: gekozenPortefeuille,
            titel: document.getElementById('swfTitel')?.value || '',
            secties
        };
    }

    function opslaan() {
        if (!gekozenPortefeuille) return;
        const state = getDocumentState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function laadOpgeslagen() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const state = JSON.parse(raw);
            if (state.portefeuille !== gekozenPortefeuille) return;

            document.getElementById('swfTitel').value = state.titel || '';
            SECTIE_IDS.forEach(id => {
                const s = state.secties?.[id];
                const ids = SECTIE_ELEMENT_IDS[id];
                if (s && ids) {
                    sectieSelecties[id] = new Set(s.geselecteerdeSubthemas || []);
                    const ta = document.getElementById(ids.textarea);
                    if (ta) ta.value = s.tekst || '';
                }
            });
            renderAlleSectieKnoppen();
        } catch (_) {}
    }

    // Event listeners
    ['swfTitel', 'swfAanleiding', 'swfBeslissing', 'swfBeslispunten', 'swfFinancieel', 'swfJuridisch'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', opslaan);
    });

    document.getElementById('swfOpslaan')?.addEventListener('click', () => {
        opslaan();
        alert('Opgeslagen in browser.');
    });

    document.getElementById('swfExporteren')?.addEventListener('click', () => {
        const state = getDocumentState();
        let txt = `CONCEPT COLLEGEVOORSTEL\n`;
        txt += `Portefeuille: ${state.portefeuille}\n`;
        txt += `Titel: ${state.titel}\n\n`;
        txt += `=== Aanleiding ===\n${state.secties.aanleiding?.tekst || ''}\n\n`;
        txt += `=== Gevraagde beslissing ===\n${state.secties.gevraagde_beslissing?.tekst || ''}\n\n`;
        txt += `=== Gevraagde beslispunten ===\n${state.secties.beslispunten?.tekst || ''}\n\n`;
        txt += `=== Financiële consequenties ===\n${state.secties.financieel?.tekst || ''}\n\n`;
        txt += `=== Juridisch kader ===\n${state.secties.juridisch?.tekst || ''}\n`;
        const blob = new Blob([txt], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'collegevoorstel-concept.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    document.getElementById('swfExportJson')?.addEventListener('click', () => {
        const state = getDocumentState();
        const subthemas = SCHRIJF_WIJZER_SAMENVATTINGEN[state.portefeuille] || [];
        const sectiesMetBeleid = {};
        SECTIE_IDS.forEach(id => {
            const s = state.secties[id];
            const geselecteerd = s?.geselecteerdeSubthemas || [];
            const beleidItems = subthemas.filter(i => geselecteerd.includes(i.thema));
            sectiesMetBeleid[id] = {
                tekst: s?.tekst || '',
                geselecteerdeSubthemas: geselecteerd,
                beleidTekst: beleidItems.map(i => `**${i.thema}**\n${i.samenvatting}`).join('\n\n')
            };
        });
        const exportData = {
            versie: '1.0',
            portefeuille: state.portefeuille,
            titel: state.titel,
            secties: sectiesMetBeleid,
            exportDatum: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'collegevoorstel-agent.json';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    document.getElementById('swfWijzigPortefeuille')?.addEventListener('click', () => {
        if (!confirm('Weet je het zeker? Het huidige voorstel wordt gewist.')) return;
        trap1.style.display = 'block';
        formulier.style.display = 'none';
        gekozenPortefeuille = null;
        SECTIE_IDS.forEach(id => { sectieSelecties[id] = new Set(); });
        formulier.reset();
        localStorage.removeItem(STORAGE_KEY);
    });

    // Init
    renderPortefeuilleKnoppen();

    // Check of er al een portefeuille was gekozen (bij refresh)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            if (state.portefeuille && SCHRIJF_WIJZER_DOMEINEN.includes(state.portefeuille)) {
                selectPortefeuille(state.portefeuille);
            }
        } catch (_) {}
    }
})();
