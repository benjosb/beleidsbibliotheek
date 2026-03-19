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
        { value: 'H8', label: '— Hoofdstuk 8: Ruimte en wonen —' },
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
        { document: 'Beleidsplan Sociaal Domein Wassenaar 2024', toelichting: 'Uitwerking sociaal domein', link: 'https://www.wassenaar.nl/beleidsplan-sociaal-domein', bbv: '6.60-6.91', geverifieerd: false, initialen: '' },
        { document: 'Omgevingsvisie', toelichting: 'Langetermijnvisie fysieke leefomgeving (in voorbereiding)', link: '', bbv: '8.1', geverifieerd: false, initialen: '' },
        { document: 'Omgevingsplan', toelichting: 'Vervangt bestemmingsplannen (uiterlijk 2032)', link: '', bbv: '8.1', geverifieerd: false, initialen: '' },
        { document: 'Nota Woonbeleid gemeente Wassenaar 2025', toelichting: 'Kader wonen en huisvesting', link: '', bbv: '8.3', geverifieerd: false, initialen: '' },
        { document: 'Economische Visie Wassenaar 2025', toelichting: 'Visie lokale economie — gemeentepagina met PDF', link: 'https://www.wassenaar.nl/economische-visie-wassenaar', bbv: 'H3', geverifieerd: false, initialen: '' },
        { document: 'Beheervisie Openbare Ruimte 2024–2028', toelichting: 'Kader beheer en onderhoud', link: '', bbv: '8.1', geverifieerd: false, initialen: '' },
        { document: 'Sportvisie 2025', toelichting: 'Kader sport en bewegen', link: '', bbv: '5.1', geverifieerd: false, initialen: '' },
        { document: 'Herijking IHP 2024–2039', toelichting: 'Integraal Huisvestingsplan onderwijs', link: '', bbv: '4.2', geverifieerd: false, initialen: '' },
        { document: 'Lokale Educatieve Agenda (LEA) 2026–2037', toelichting: 'Samenwerking gemeente, scholen en welzijn; ondertekend jan 2026. Link = nieuws Centraal+ (geen formeel stuk); PDF/iBabs zelf zoeken.', link: 'https://centraalplus.nl/2026/01/17/lokale-educatieve-agenda-van-wassenaar-ondertekend-een-horizon-waarmee-we-aan-de-slag-kunnen/', bbv: 'H4', geverifieerd: false, initialen: '' },
        { document: 'Verordening Jeugdhulp gemeente Wassenaar 2025', toelichting: 'Kader jeugdhulp', link: 'https://lokaleregelgeving.overheid.nl/CVDR749873/1', bbv: '6.7-6.9', geverifieerd: false, initialen: '' },
        { document: 'Beleidsnota Schuldhulpverlening 2025–2028', toelichting: 'Kader schuldhulpverlening', link: '', bbv: '6.3-6.5', geverifieerd: false, initialen: '' },
        { document: 'Beleidsnota Ouderenbeleid 2025', toelichting: 'Kader ouderenbeleid', link: '', bbv: '6.60-6.91', geverifieerd: false, initialen: '' },
        { document: 'Lokale Woonzorgvisie Wassenaar 2026', toelichting: 'Wonen met zorg', link: '', bbv: '8.3', geverifieerd: false, initialen: '' },
        { document: 'Algemene plaatselijke verordening (APV) Wassenaar 2024', toelichting: 'Lokale regelgeving', link: '', bbv: '1.2', geverifieerd: false, initialen: '' },
        { document: 'Huisvestingsverordening Wassenaar 2023', toelichting: 'Woonwagenstandplaatsen e.d.', link: 'https://lokaleregelgeving.overheid.nl/CVDR697251', bbv: '8.3', geverifieerd: false, initialen: '' },
        { document: 'Visie voor De Wassenaarse Slag', toelichting: 'Strand en recreatie', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/90987d08-8b03-4da3-acdb-20a49b865b45?agendaItemId=2dae2006-9f02-48ab-b696-4d2a25349c42', bbv: '5.7', geverifieerd: false, initialen: '' },
        { document: 'Visie voor De Wassenaarse Slag', toelichting: 'Strand en recreatie (economische promotie)', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/90987d08-8b03-4da3-acdb-20a49b865b45?agendaItemId=2dae2006-9f02-48ab-b696-4d2a25349c42', bbv: 'H3', geverifieerd: false, initialen: '' },
        { document: 'Programma Noordrand', toelichting: 'Uitvoeringsprogramma Noordrand', link: '', bbv: '8.1', geverifieerd: false, initialen: '' },
        { document: 'Coalitieakkoord 2022–2026', toelichting: 'Coalitieakkoord VVD, CDA, D66, DLW, PvdA', link: 'https://www.wassenaar.nl/coalitieakkoord', bbv: '0.1', geverifieerd: false, initialen: '' },
        { document: 'Begroting 2026', toelichting: 'Begroting gemeente Wassenaar 2026', link: 'https://www.wassenaar.nl/begroting-2026', bbv: '0.4', geverifieerd: false, initialen: '' },
        { document: 'Gemeentelijke aanpak bestrijding ondernemende criminaliteit Wassenaar 2025-2028', toelichting: 'Kader bestrijding ondermijning', link: 'http://lokaleregelgeving.overheid.nl/CVDR735878', bbv: '1.2', geverifieerd: false, initialen: '' },
        { document: 'Woonvisie Wassenaar 2021-2025', toelichting: 'Grip op wonen (voorloper Nota Woonbeleid)', link: 'https://www.wassenaar.nl/_flysystem/media/woonvisie-wassenaar-2021-2025-grip-op-wonen.pdf', bbv: '8.3', geverifieerd: false, initialen: '' },
        { document: 'CBS Statline', toelichting: 'Open data CBS', link: 'https://opendata.cbs.nl/#/CBS/nl/dataset/85146NED/table?ts=1768903835931', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Gemeente Wassenaar gemeenschappelijke regelingen', toelichting: 'Overzicht GR\'s op Overheid.nl', link: 'https://organisaties.overheid.nl/40204/Gemeente_Wassenaar#gemeenschappelijke-regelingen', bbv: '0.1', geverifieerd: false, initialen: '' },
        { document: 'Raad voor Openbaar Bestuur – Beleidsvrijheid geduid', toelichting: 'Adviesrapport 2019', link: 'https://www.raadopenbaarbestuur.nl/documenten/2019/03/14/advies-beleidsvrijheid-geduid', bbv: '0.1', geverifieerd: false, initialen: '' },
        { document: 'Eindrapportage Tijd voor stevige keuzes', toelichting: 'Rijksoverheid rapport 2025', link: 'https://www.rijksoverheid.nl/documenten/rapporten/2025/10/31/eindrapportage-tijd-voor-stevige-keuzes', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Waar staat je gemeente – monitor sociaal domein', toelichting: 'Dashboard gemeentelijke monitor', link: 'https://www.waarstaatjegemeente.nl/mosaic/dashboard/gemeentelijke-monitor-sociaal-domein', bbv: '6.60-6.91', geverifieerd: false, initialen: '' },
        { document: 'Internetconsultatie Reikwijdte Jeugdwet', toelichting: 'Consultatie wetswijziging', link: 'https://www.internetconsultatie.nl/reikwijdtejeugdwet/b1', bbv: '6.7-6.9', geverifieerd: false, initialen: '' },
        { document: 'Raadsvergadering 25 november 2025', toelichting: 'iBabs document', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/3e13ce7b-2972-4a14-9e63-5f8a03b8dde6?documentId=a7aca3e0-ab0b-4061-80d7-63301fa5a2d3&agendaItemId=b6056161-8751-4a89-852c-5b92234b07ad', bbv: '', geverifieerd: false, initialen: '' },
        { document: 'Motie reductie restafval en kostenbesparing afvalstoffenheffing', toelichting: 'Motie GL PvdA D66 VVD CDA', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/3e13ce7b-2972-4a14-9e63-5f8a03b8dde6?documentId=76cff862-0962-4859-85f7-a911708e963f&agendaItemId=a6645f92-6dff-4ca2-80b5-b396b0864d70', bbv: '7.3', geverifieerd: false, initialen: '' },
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
