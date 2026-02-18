// Beleidsbibliotheek Wassenaar - JavaScript

let allDecisions = [];
let filteredDecisions = [];
let activeThema = null;

// Load data
function loadData() {
    try {
        // Data wordt geladen vanuit data.js (statische variabelen)
        // Controleer of data.js geladen is
        if (typeof ALL_DECISIONS_DATA === 'undefined' || typeof THEMA_BOOM_DATA === 'undefined') {
            throw new Error('data.js niet geladen. Zorg dat data.js vóór app.js wordt geladen.');
        }
        
        // Gebruik de data uit data.js
        allDecisions = ALL_DECISIONS_DATA;
        
        // Debug: log counts
        const raadCount = allDecisions.filter(d => d.bron === 'raad').length;
        const collegeCount = allDecisions.filter(d => d.bron === 'college').length;
        console.log(`Data geladen: ${allDecisions.length} totaal (${raadCount} raad, ${collegeCount} college)`);
        
        // Initial display
        filteredDecisions = allDecisions;
        
        // Render thema tree (will update counts after initial render)
        renderThemaTree(THEMA_BOOM_DATA);
        
        displayResults();
    } catch (error) {
        console.error('Fout bij laden data:', error);
        document.getElementById('resultsList').innerHTML = 
            '<p style="color: red;">Fout bij laden van de data: ' + error.message + '</p>';
    }
}

// Render thema tree
function renderThemaTree(tree) {
    const container = document.getElementById('themaTree');
    container.innerHTML = '';
    
    // Store tree structure for later updates
    window.themaTreeStructure = tree;
    
    // Actually render the tree structure
    tree.forEach(domein => {
        const domeinItem = document.createElement('div');
        domeinItem.className = 'thema-item';
        
        const label = document.createElement('div');
        label.className = 'thema-label';
        label.innerHTML = `
            <span class="thema-toggle">▶</span>
            <span>${domein.naam}</span>
            <span class="thema-count">(0)</span>
        `;
        label.onclick = () => toggleThema(domeinItem);
        
        const children = document.createElement('div');
        children.className = 'thema-children';
        
        domein.kinderen.forEach(onderwerp => {
            const child = document.createElement('div');
            child.className = 'thema-child';
            child.innerHTML = `
                <span>${onderwerp.naam}</span>
                <span class="thema-count">0</span>
            `;
            child.onclick = (e) => {
                e.stopPropagation();
                selectThema(onderwerp.naam, domein.naam);
            };
            children.appendChild(child);
        });
        
        domeinItem.appendChild(label);
        domeinItem.appendChild(children);
        container.appendChild(domeinItem);
    });
    
    // Now update counts based on current filtered decisions
    updateThemaTreeCounts();
}

function updateThemaTreeCounts() {
    try {
        if (!window.themaTreeStructure) return;
        
        const container = document.getElementById('themaTree');
        if (!container) return;
        
        // Calculate counts based on current filtered decisions
        const counts = calculateThemaCounts(filteredDecisions);
        
        // Update the tree with new counts
        window.themaTreeStructure.forEach((domein, domeinIdx) => {
            const domeinItem = container.children[domeinIdx];
            if (!domeinItem) return;
            
            const label = domeinItem.querySelector('.thema-label');
            if (!label) return;
            
            const countEl = label.querySelector('.thema-count');
            if (countEl) {
                const domeinCount = counts[domein.naam] || 0;
                countEl.textContent = `(${domeinCount})`;
            }
            
            const children = domeinItem.querySelector('.thema-children');
            if (children && domein.kinderen) {
                domein.kinderen.forEach((onderwerp, onderwerpIdx) => {
                    const child = children.children[onderwerpIdx];
                    if (!child) return;
                    
                    const childCountEl = child.querySelector('.thema-count');
                    if (childCountEl) {
                        const onderwerpCount = counts[`${domein.naam}::${onderwerp.naam}`] || 0;
                        childCountEl.textContent = onderwerpCount;
                        
                        // Dim if count is 0
                        if (onderwerpCount === 0) {
                            child.style.opacity = '0.4';
                        } else {
                            child.style.opacity = '1';
                        }
                    }
                });
            }
            
            // Dim domein if total count is 0
            const domeinCount = counts[domein.naam] || 0;
            if (domeinCount === 0) {
                domeinItem.style.opacity = '0.4';
            } else {
                domeinItem.style.opacity = '1';
            }
        });
    } catch (error) {
        console.error('Fout bij updaten thema counts:', error);
        // Don't break the app if counting fails
    }
}

function calculateThemaCounts(decisions) {
    const counts = {};
    
    if (!window.themaTreeStructure) return counts;
    
    // Count ALL decisions, not just those in tree (to include collegebesluiten)
    decisions.forEach(decision => {
        const domein = decision.domein || 'Niet geclassificeerd';
        const onderwerp = decision.onderwerp_begroting || decision.portefeuille || 'Overig';
        const key = `${domein}::${onderwerp}`;
        
        // Count per domein (always count, even if not in tree)
        counts[domein] = (counts[domein] || 0) + 1;
        
        // Count per onderwerp within domein
        counts[key] = (counts[key] || 0) + 1;
    });
    
    return counts;
}

function toggleThema(item) {
    item.classList.toggle('expanded');
    const toggle = item.querySelector('.thema-toggle');
    toggle.textContent = item.classList.contains('expanded') ? '▼' : '▶';
}

function selectThema(onderwerp, domein) {
    try {
        // Remove active from all
        document.querySelectorAll('.thema-child').forEach(c => c.classList.remove('active'));
        
        // Add active to clicked
        const clicked = event.target.closest('.thema-child');
        if (clicked) {
            clicked.classList.add('active');
        }
        
        activeThema = { onderwerp, domein };
        applyFilters();
    } catch (error) {
        console.error('Fout bij selecteren thema:', error);
    }
}

// Search and filter
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const year = document.getElementById('yearFilter').value;
    const type = document.getElementById('typeFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    filteredDecisions = allDecisions.filter(decision => {
        // Search term
        if (searchTerm) {
            const searchable = [
                decision.naam || '',
                decision.besluit || '',
                decision.domein || '',
                decision.onderwerp_begroting || '',
                decision.portefeuille || ''
            ].join(' ').toLowerCase();
            
            if (!searchable.includes(searchTerm)) {
                return false;
            }
        }
        
        // Year filter
        if (year) {
            const decisionYear = decision.datum ? decision.datum.substring(0, 4) : '';
            // Also check jaar field as fallback
            const jaarField = decision.jaar ? String(decision.jaar) : '';
            if (decisionYear !== year && jaarField !== year) {
                return false;
            }
        }
        
        // Type filter
        if (type) {
            if (decision.bron !== type) {
                return false;
            }
        }
        
        // Date range
        if (dateFrom && decision.datum < dateFrom) {
            return false;
        }
        if (dateTo && decision.datum > dateTo) {
            return false;
        }
        
        // Thema filter
        if (activeThema) {
            const matchesDomein = decision.domein === activeThema.domein;
            const matchesOnderwerp = 
                decision.onderwerp_begroting === activeThema.onderwerp ||
                decision.portefeuille === activeThema.onderwerp;
            
            // Only filter out if we have a domein/onderwerp and it doesn't match
            // Don't filter out decisions without domein/onderwerp (like some collegebesluiten)
            if (decision.domein || decision.onderwerp_begroting || decision.portefeuille) {
                if (!matchesDomein && !matchesOnderwerp) {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    // Debug: log filtered counts
    const filteredRaad = filteredDecisions.filter(d => d.bron === 'raad').length;
    const filteredCollege = filteredDecisions.filter(d => d.bron === 'college').length;
    console.log(`Gefilterd: ${filteredDecisions.length} totaal (${filteredRaad} raad, ${filteredCollege} college)`);
    
    // Sort
    const sortBy = document.getElementById('sortBy').value;
    sortResults(sortBy);
    
    // Update thema tree counts based on filtered results (after a small delay to ensure DOM is ready)
    setTimeout(() => {
        updateThemaTreeCounts();
    }, 100);
    
    displayResults();
}

function sortResults(sortBy) {
    filteredDecisions.sort((a, b) => {
        switch(sortBy) {
            case 'datum-desc':
                return (b.datum || '').localeCompare(a.datum || '');
            case 'datum-asc':
                return (a.datum || '').localeCompare(b.datum || '');
            case 'naam-asc':
                return (a.naam || '').localeCompare(b.naam || '');
            case 'naam-desc':
                return (b.naam || '').localeCompare(a.naam || '');
            default:
                return 0;
        }
    });
}

function displayResults() {
    const container = document.getElementById('resultsList');
    const noResults = document.getElementById('noResults');
    const count = document.getElementById('resultsCount');
    
    if (!filteredDecisions || filteredDecisions.length === 0) {
        container.style.display = 'none';
        noResults.style.display = 'block';
        count.textContent = '0 besluiten gevonden';
        
        // Debug info
        console.warn('Geen besluiten om te tonen!');
        console.log('allDecisions:', allDecisions ? allDecisions.length : 'undefined');
        console.log('filteredDecisions:', filteredDecisions ? filteredDecisions.length : 'undefined');
        return;
    }
    
    count.textContent = `${filteredDecisions.length} besluit${filteredDecisions.length !== 1 ? 'ten' : ''} gevonden`;
    
    container.style.display = 'block';
    noResults.style.display = 'none';
    
    container.innerHTML = filteredDecisions.map(decision => {
        const datum = decision.datum ? formatDate(decision.datum) : 'Onbekend';
        const badgeClass = decision.bron === 'raad' ? 'raad' : 'college';
        const badgeText = decision.type_besluit || (decision.bron === 'raad' ? 'Raadsbesluit' : 'Collegebesluit');
        
        const besluitText = (decision.besluit || '').trim();
        const isCollege = decision.bron === 'college';
        
        // Collegebesluiten: volledige tekst op de voorpagina, met uitklappen bij lange teksten
        const COLLEGE_PREVIEW_CHARS = 500;  // eerste 500 tekens zichtbaar, rest uitklapbaar
        const RAAD_PREVIEW_CHARS = 300;
        const maxPreview = isCollege ? COLLEGE_PREVIEW_CHARS : RAAD_PREVIEW_CHARS;
        const isLong = besluitText.length > maxPreview;
        const previewPart = isLong ? besluitText.substring(0, maxPreview) + '…' : besluitText;
        const fullPart = isLong ? besluitText.substring(maxPreview) : '';
        const idSuffix = Math.random().toString(36).slice(2, 9);
        
        // Determine link and link text
        let link = null;
        let linkText = '';
        
        if (decision.pdf_url) {
            link = decision.pdf_url;
            linkText = 'Bekijk originele PDF →';
        } else if (decision.link && decision.link.includes('iBabs')) {
            link = 'https://wassenaar.ibabs.eu/Public/';
            linkText = 'Zoek in iBabs Publieksportaal →';
        } else if (decision.link && decision.link.startsWith('http')) {
            link = decision.link;
            linkText = 'Bekijk document →';
        }
        
        return `
            <div class="result-item" data-bron="${decision.bron || ''}">
                <div class="result-header">
                    <div>
                        <div class="result-title">${escapeHtml(decision.naam || 'Naamloos besluit')}</div>
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
                        <strong class="result-besluit-label">Besluit:</strong>
                        <div class="result-besluit-tekst">
                            <span class="result-text-inhoud">${escapeHtml(previewPart)}</span>
                            ${fullPart ? `<span class="result-text-meer" id="meer-${idSuffix}" hidden>${escapeHtml(fullPart)}</span>` : ''}
                        </div>
                        ${isLong ? `
                            <button type="button" class="btn-uitklappen" data-id="meer-${idSuffix}" aria-expanded="false">
                                Toon volledige tekst
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
                ${link ? `
                    <a href="${link}" target="_blank" rel="noopener noreferrer" class="result-link">${linkText}</a>
                    ${decision.link && decision.link.includes('iBabs') ? `
                        <p class="result-hint"><small>💡 Tip: Zoek in iBabs op: "${escapeHtml(decision.naam)}"</small></p>
                    ` : ''}
                ` : ''}
            </div>
        `;
    }).join('');
}

function formatDate(dateStr) {
    if (!dateStr) return 'Onbekend';
    const date = new Date(dateStr);
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                    'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    
    // Clear thema selection
    document.querySelectorAll('.thema-child').forEach(c => c.classList.remove('active'));
    activeThema = null;
    
    applyFilters();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Uitklappen/inklappen besluittekst (delegatie op results container)
    document.getElementById('resultsList').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-uitklappen');
        if (!btn) return;
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const meerEl = document.getElementById(id);
        if (!meerEl) return;
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        meerEl.hidden = isExpanded;
        btn.setAttribute('aria-expanded', !isExpanded);
        btn.textContent = isExpanded ? 'Toon volledige tekst' : 'Verberg tekst';
    });
    
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    document.getElementById('searchBtn').addEventListener('click', applyFilters);
    document.getElementById('yearFilter').addEventListener('change', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFrom').addEventListener('change', applyFilters);
    document.getElementById('dateTo').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', (e) => {
        sortResults(e.target.value);
        displayResults();
    });
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
});
