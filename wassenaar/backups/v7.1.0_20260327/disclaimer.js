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
        .disclaimer-modal { background: #fff; max-width: 480px; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        .disclaimer-titel { font-size: 1.25rem; margin-bottom: 1rem; color: #1d1d1b; }
        .disclaimer-tekst { font-size: 0.9rem; line-height: 1.6; color: #333; margin-bottom: 1.25rem; }
        .disclaimer-tekst a { color: #0060ac; }
        .disclaimer-tekst a:hover { text-decoration: underline; }
        .disclaimer-btn { background: #0060ac; color: #fff; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; font-size: 0.95rem; cursor: pointer; }
        .disclaimer-btn:hover { background: #004d8c; }
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
