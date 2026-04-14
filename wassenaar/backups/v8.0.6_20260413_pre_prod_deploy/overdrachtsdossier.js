/**
 * Zoekfunctie voor Overdrachtsdossier-pagina
 * Met normalisatie van diacritica (ó→o, ë→e), inhoudsopgave en markering van treffers
 */
(function () {
    const searchInput = document.getElementById('odSearchInput');
    const searchBtn = document.getElementById('odSearchBtn');
    const wisBtn = document.getElementById('odSearchWis');
    const detailsContainer = document.getElementById('overdrachtsdossierInhoudPagina');
    const noResults = document.getElementById('odNoResults');
    const liveStatus = document.getElementById('odZoekLiveStatus');

    if (!searchInput || !detailsContainer) return;

    /** Normaliseert tekst: lowercase, diacritica verwijderen (ó→o, ë→e, etc.) */
    function normalize(s) {
        if (!s) return '';
        return String(s)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ');
    }

    /** Verwijdert alle <mark> in container en herstelt platte tekst */
    function unmarkAll(container) {
        container.querySelectorAll('mark.od-zoek-treffer').forEach(m => {
            m.replaceWith(m.textContent);
        });
    }

    /** Markeert zoekterm in tekstnodes van element (prefix-matching, case-insensitive) */
    function highlightInElement(el, searchTerm) {
        if (!el || !searchTerm || searchTerm.length < 2) return;
        const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(\\b' + escaped + '[\\w]*)', 'gi');

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach(node => {
            const text = node.textContent;
            const parts = text.split(regex);
            if (parts.length <= 1) return;

            const fragment = document.createDocumentFragment();
            const matchRegex = new RegExp('^' + escaped + '[\\w]*$', 'i');
            parts.forEach(part => {
                if (matchRegex.test(part)) {
                    const mark = document.createElement('mark');
                    mark.className = 'od-zoek-treffer';
                    mark.textContent = part;
                    fragment.appendChild(mark);
                } else {
                    fragment.appendChild(document.createTextNode(part));
                }
            });
            node.parentNode.replaceChild(fragment, node);
        });
    }

    const details = detailsContainer.querySelectorAll('.overdrachtsdossier-details');

    function nadrukNaZoekopdracht(matchCount, qWeergave) {
        const q = (qWeergave || '').trim() || 'uw zoekterm';
        if (liveStatus) {
            if (matchCount === 0) {
                liveStatus.textContent = 'Geen resultaten voor ‘' + q + '’.';
            } else if (matchCount === 1) {
                liveStatus.textContent = '1 sectie met treffers voor ‘' + q + '’. Scroll naar de eerste markering.';
            } else {
                liveStatus.textContent = matchCount + ' secties met treffers voor ‘' + q + '’. Scroll naar de eerste markering.';
            }
        }
        const uitvoer = function () {
            if (matchCount === 0) {
                if (noResults) {
                    noResults.hidden = false;
                    const y = noResults.getBoundingClientRect().top + window.scrollY - 12;
                    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                }
                return;
            }
            const first = detailsContainer.querySelector('mark.od-zoek-treffer');
            if (first) {
                const y = first.getBoundingClientRect().top + window.scrollY - 16;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                first.classList.remove('od-zoek-treffer--pulse');
                void first.offsetWidth;
                first.classList.add('od-zoek-treffer--pulse');
                setTimeout(function () {
                    first.classList.remove('od-zoek-treffer--pulse');
                }, 1200);
                const sectie = first.closest('.overdrachtsdossier-details');
                if (sectie) {
                    sectie.classList.remove('od-zoek-sectie-nadruk');
                    void sectie.offsetWidth;
                    sectie.classList.add('od-zoek-sectie-nadruk');
                    setTimeout(function () {
                        sectie.classList.remove('od-zoek-sectie-nadruk');
                    }, 1400);
                }
            } else {
                const y = detailsContainer.getBoundingClientRect().top + window.scrollY - 12;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }
        };
        requestAnimationFrame(function () {
            requestAnimationFrame(uitvoer);
        });
    }

    function searchOD() {
        const q = searchInput.value.trim();
        const qNorm = normalize(q);

        if (!qNorm) {
            details.forEach(d => {
                d.style.display = '';
                d.open = false;
                unmarkAll(d);
            });
            if (noResults) noResults.hidden = true;
            if (liveStatus) liveStatus.textContent = '';
            return;
        }

        let matchCount = 0;
        details.forEach(d => {
            const summary = d.querySelector('.overdrachtsdossier-summary');
            const inhoud = d.querySelector('.overdrachtsdossier-details-inhoud');
            const text = (summary?.textContent || '') + ' ' + (inhoud?.textContent || '');
            const textNorm = normalize(text);
            const escaped = qNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const prefixRegex = new RegExp('\\b' + escaped, 'i');
            const matches = prefixRegex.test(textNorm);

            unmarkAll(d);
            d.style.display = matches ? '' : 'none';
            if (matches) {
                matchCount++;
                d.open = true;
                if (summary) highlightInElement(summary, q);
                if (inhoud) highlightInElement(inhoud, q);
            }
        });

        if (noResults) noResults.hidden = matchCount > 0;
        nadrukNaZoekopdracht(matchCount, q);
    }

    function clearSearch() {
        searchInput.value = '';
        searchOD();
        if (liveStatus) liveStatus.textContent = '';
        searchInput.focus();
    }

    if (searchBtn) searchBtn.addEventListener('click', searchOD);
    if (wisBtn) wisBtn.addEventListener('click', clearSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); searchOD(); }
    });

    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ) {
        searchInput.value = urlQ;
        searchOD();
    }
})();
