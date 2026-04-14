/**
 * Disclaimer BeleidsWijzer — actieve akkoord-verklaring
 * Toont modal bij eerste bezoek per sessie. Gebruiker moet actief "Ik ga akkoord" klikken.
 * sessionStorage: niet opnieuw tonen bij navigatie binnen dezelfde sessie.
 * Bij herladen of nieuw tabblad: opnieuw tonen (nieuwe sessie).
 */
(function() {
    const STORAGE_KEY = 'beleidswijzer_disclaimer_accepted';
    const DISCLAIMER_HTML = `
        <div id="disclaimerOverlay" class="disclaimer-overlay" role="dialog" aria-modal="true" aria-labelledby="disclaimerTitel">
            <div class="disclaimer-modal">
                <h2 id="disclaimerTitel" class="disclaimer-titel">Over deze BeleidsBibliotheek</h2>
                <div class="disclaimer-tekst">
                    <p>De BeleidsBibliotheek is tot stand gekomen door zorgvuldige toepassing van AI op openbare bronnen: raads- en collegebesluiten via iBabs en Officiële Bekendmakingen. Er is zo veel mogelijk zorgvuldigheid toegepast.</p>
                    <p>Door het grote aantal bronbestanden is volledige handmatige controle echter niet mogelijk. Daarom zijn bij elk besluit verwijzingen naar de bron opgenomen. Raadpleeg bij twijfel altijd de officiële documenten via <a href="https://wassenaar.bestuurlijkeinformatie.nl" target="_blank" rel="noopener">wassenaar.bestuurlijkeinformatie.nl</a> of de gemeente.</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:1rem 0">
                    <p style="font-weight:700;margin-bottom:0.5rem">Drie uitgangspunten:</p>
                    <ol style="margin:0;padding-left:1.25rem;font-size:0.88rem;line-height:1.6">
                        <li><strong>Geen persoonsgegevens</strong> — er worden geen persoonsgegevens verzameld of opgeslagen. Alleen openbare bronnen.</li>
                        <li><strong>Menselijke controle</strong> — elke wijziging wordt beoordeeld door een redacteur voordat deze wordt gepubliceerd. Controleer altijd zelf de bron.</li>
                        <li><strong>Transparant</strong> — alle bronvermeldingen, het <a href="wijzigingen.html">wijzigingslogboek</a> en de werkwijze zijn openbaar.</li>
                    </ol>
                </div>
                <button type="button" id="disclaimerAkkoord" class="disclaimer-btn">Ik begrijp het en ga verder</button>
            </div>
        </div>
    `;

    const DISCLAIMER_CSS = `
        .disclaimer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .disclaimer-modal { background: #fff8f0; max-width: 480px; width: 100%; padding: 1.5rem; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); border: 2px solid #ea580c; max-height: calc(100vh - 2rem); display: flex; flex-direction: column; }
        .disclaimer-titel { font-size: 1.25rem; margin-bottom: 1rem; color: #7c2d12; flex-shrink: 0; }
        .disclaimer-tekst { font-size: 0.9rem; line-height: 1.6; color: #451a03; margin-bottom: 1.25rem; overflow-y: auto; flex: 1; min-height: 0; }
        .disclaimer-tekst a { color: #ea580c; }
        .disclaimer-tekst a:hover { text-decoration: underline; }
        .disclaimer-btn { background: #ea580c; color: #fff; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-size: 0.95rem; cursor: pointer; font-weight: 600; width: 100%; flex-shrink: 0; }
        .disclaimer-btn:hover { background: #c2410c; }
        @media (max-width: 480px) {
            .disclaimer-overlay { padding: 0.5rem; align-items: stretch; }
            .disclaimer-modal { padding: 0.75rem 0.85rem; border-radius: 8px; max-height: calc(100vh - 1rem); }
            .disclaimer-titel { font-size: 0.95rem; margin-bottom: 0.4rem; }
            .disclaimer-tekst { font-size: 0.78rem; line-height: 1.45; margin-bottom: 0.5rem; }
            .disclaimer-tekst p { margin: 0 0 0.35rem; }
            .disclaimer-tekst hr { margin: 0.5rem 0 !important; }
            .disclaimer-tekst ol { font-size: 0.75rem !important; line-height: 1.4 !important; padding-left: 1rem !important; }
            .disclaimer-tekst ol li { margin-bottom: 0.2rem; }
            .disclaimer-btn { font-size: 0.88rem; padding: 0.65rem 1rem; min-height: 44px; }
        }
    `;

    function init() {
        if (sessionStorage.getItem(STORAGE_KEY) === '1') return;

        const style = document.createElement('style');
        style.textContent = DISCLAIMER_CSS;
        document.head.appendChild(style);

        document.body.insertAdjacentHTML('afterbegin', DISCLAIMER_HTML);

        const overlay = document.getElementById('disclaimerOverlay');
        const btn = document.getElementById('disclaimerAkkoord');

        btn.addEventListener('click', function() {
            sessionStorage.setItem(STORAGE_KEY, '1');
            overlay.remove();
        });
    }

    function showDisclaimerFromLink() {
        var style = document.querySelector('style[data-disclaimer]');
        if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-disclaimer', '1');
            style.textContent = DISCLAIMER_CSS;
            document.head.appendChild(style);
        }
        var overlay = document.getElementById('disclaimerOverlay');
        if (overlay) return;
        document.body.insertAdjacentHTML('afterbegin', DISCLAIMER_HTML);
        overlay = document.getElementById('disclaimerOverlay');
        document.getElementById('disclaimerAkkoord').addEventListener('click', function() {
            overlay.remove();
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        var link = document.getElementById('disclaimerLink');
        if (link) link.addEventListener('click', showDisclaimerFromLink);

        var stempel = document.getElementById('stempelWatermark');
        if (stempel) {
            stempel.addEventListener('click', showDisclaimerFromLink);
            stempel.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDisclaimerFromLink(); }
            });
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
