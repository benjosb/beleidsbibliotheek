// Schrijf-Wijzer — logica
(function () {
    'use strict';

    const knoppenEl = document.getElementById('swKnoppen');
    const samenvattingBlok = document.getElementById('swSamenvattingBlok');
    const samenvattingInhoud = document.getElementById('swSamenvattingInhoud');
    const legeStaat = document.getElementById('swLegeStaat');
    const kopieerBtn = document.getElementById('swKopieer');

    const geselecteerd = new Set();

    function escapeHtml(s) {
        if (!s) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function renderKnoppen() {
        knoppenEl.innerHTML = '';
        SCHRIJF_WIJZER_DOMEINEN.forEach(domein => {
            const kleur = SCHRIJF_WIJZER_KLEUREN[domein] || { accent: '#0060ac' };
            const isGeselecteerd = geselecteerd.has(domein);
            const knop = document.createElement('button');
            knop.type = 'button';
            knop.className = 'sw-knop' + (isGeselecteerd ? ' sw-geselecteerd' : '');
            knop.textContent = domein;
            knop.style.borderColor = isGeselecteerd ? kleur.accent : '';
            knop.style.background = isGeselecteerd ? kleur.accent : '';
            knop.style.color = isGeselecteerd ? '#fff' : kleur.accent;
            knop.addEventListener('click', () => toggleDomein(domein));
            knoppenEl.appendChild(knop);
        });
    }

    function toggleDomein(domein) {
        if (geselecteerd.has(domein)) {
            geselecteerd.delete(domein);
        } else {
            geselecteerd.add(domein);
        }
        renderKnoppen();
        renderSamenvatting();
    }

    function renderSamenvatting() {
        if (geselecteerd.size === 0) {
            samenvattingBlok.style.display = 'none';
            legeStaat.style.display = 'block';
            return;
        }
        legeStaat.style.display = 'none';
        samenvattingBlok.style.display = 'block';

        let html = '';
        geselecteerd.forEach(domein => {
            const kleur = SCHRIJF_WIJZER_KLEUREN[domein] || { accent: '#0060ac' };
            const items = SCHRIJF_WIJZER_SAMENVATTINGEN[domein] || [];
            html += `<div class="sw-domein-blok" style="border-left: 4px solid ${kleur.accent}">`;
            html += `<h3 class="sw-domein-titel" style="color:${kleur.accent}">${escapeHtml(domein)}</h3>`;
            items.forEach(item => {
                html += `<div class="sw-thema-item" style="border-left: 3px solid ${kleur.accent}">`;
                html += `<div class="sw-thema-naam">${escapeHtml(item.thema)}</div>`;
                html += `<p class="sw-thema-tekst">${escapeHtml(item.samenvatting)}</p>`;
                html += `</div>`;
            });
            html += '</div>';
        });
        samenvattingInhoud.innerHTML = html;
    }

    function kopieerNaarKlembord() {
        if (geselecteerd.size === 0) return;
        let tekst = '';
        geselecteerd.forEach(domein => {
            const items = SCHRIJF_WIJZER_SAMENVATTINGEN[domein] || [];
            tekst += `## ${domein}\n\n`;
            items.forEach(item => {
                tekst += `**${item.thema}**\n${item.samenvatting}\n\n`;
            });
            tekst += '\n';
        });
        navigator.clipboard.writeText(tekst).then(() => {
            kopieerBtn.textContent = '✓ Gekopieerd!';
            setTimeout(() => { kopieerBtn.innerHTML = '📋 Kopieer naar klembord'; }, 2000);
        }).catch(() => {
            kopieerBtn.textContent = 'Kopieer mislukt';
        });
    }

    kopieerBtn.addEventListener('click', kopieerNaarKlembord);

    renderKnoppen();
    renderSamenvatting();
})();
