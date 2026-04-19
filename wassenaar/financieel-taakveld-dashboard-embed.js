/**
 * Ingebed in index.html — BBV-dossier, rechterkolom bij gekozen taakveld.
 * Zelfde informatie als bi-taakveld-dashboard.html (KPI, lijn, donut), compact.
 */
function renderBbvTaakveldBegrotingEmbed(rootEl, bbvIndex, subCode) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    var JAAR = typeof FINANCIEEL_DASHBOARD_BEGROTING_JAAR !== 'undefined' ? FINANCIEEL_DASHBOARD_BEGROTING_JAAR : 2026;
    var ns = 'http://www.w3.org/2000/svg';

    function el(name, attrs) {
        var e = document.createElementNS(ns, name);
        if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
    }

    function fmtM(n) {
        if (n === 0) return '€\u00a00';
        var m = Math.abs(n) / 1e6;
        var s = m.toFixed(2).replace('.', ',');
        return (n < 0 ? '−' : '') + '€\u00a0' + s + 'M';
    }

    function fmtKDelta(n) {
        var a = Math.round(Math.abs(n));
        return (n >= 0 ? '+' : '−') + '€\u00a0' + a.toLocaleString('nl-NL') + 'k';
    }

    if (typeof getFinancieelVoorUiTaakveld !== 'function') {
        rootEl.innerHTML = '<p class="bbv-embed-geen-data">Financiële data niet geladen.</p>';
        return;
    }

    var regel = getFinancieelVoorUiTaakveld(bbvIndex, subCode);
    if (!regel) {
        rootEl.innerHTML = '<p class="bbv-embed-geen-data">Geen begrotingsregel voor deze tegel in de dataset.</p>';
        return;
    }

    var L = regel.lasten;
    var B = regel.baten;
    var S = regel.saldo;
    var gemAbs = typeof FINANCIEEL_GEMEENTE_LASTEN_ABS_JAAR !== 'undefined' && FINANCIEEL_GEMEENTE_LASTEN_ABS_JAAR[JAAR]
        ? FINANCIEEL_GEMEENTE_LASTEN_ABS_JAAR[JAAR]
        : (typeof getFinancieelGemeenteTotaal === 'function' ? Math.abs(getFinancieelGemeenteTotaal().lasten) : 0);
    var pctGem = gemAbs > 0 ? (Math.abs(L) / gemAbs) * 100 : 0;

    var prog = typeof financieelProgrammaVoorIv3 === 'function'
        ? financieelProgrammaVoorIv3(regel.cluster ? (regel.bronCodes && regel.bronCodes[0] ? regel.bronCodes[0] : subCode) : subCode)
        : 'P2';

    var wrap = document.createElement('div');
    wrap.className = 'bbv-embed-root';

    var pills = document.createElement('div');
    pills.className = 'bbv-embed-pills';
    pills.setAttribute('role', 'group');
    ['P1', 'P2', 'P3', 'P4', 'P5'].forEach(function (p) {
        var b = document.createElement('span');
        b.className = 'bbv-embed-pill bbv-embed-pill--' + p.toLowerCase() + (p === prog ? ' bbv-embed-pill--actief' : '');
        b.textContent = p;
        b.title = p;
        pills.appendChild(b);
    });
    wrap.appendChild(pills);

    if (regel.cluster) {
        var cl = document.createElement('p');
        cl.className = 'bbv-embed-cluster-noot';
        cl.textContent = 'Clustering: som van Iv3 ' + regel.bronCodes.join(', ') + '. Meerjarengrafiek volgt zodra per code beschikbaar.';
        wrap.appendChild(cl);
    }

    var kpi = document.createElement('div');
    kpi.className = 'bbv-embed-kpi';
    function kpiCard(label, val, cls, note) {
        var d = document.createElement('div');
        d.className = 'bbv-embed-kpi-card';
        d.innerHTML = '<div class="bbv-embed-kpi-label">' + label + ' ' + JAAR + '</div>' +
            '<div class="bbv-embed-kpi-val ' + cls + '">' + val + '</div>' +
            (note ? '<div class="bbv-embed-kpi-note">' + note + '</div>' : '');
        return d;
    }
    kpi.appendChild(kpiCard('Lasten', fmtM(L), 'bbv-embed-lasten', 'geraamd'));
    kpi.appendChild(kpiCard('Baten', fmtM(B), 'bbv-embed-baten', 'geraamd'));
    var saldoCls = S < 0 ? 'bbv-embed-saldo-neg' : (S > 0 ? 'bbv-embed-saldo-pos' : '');
    var saldoNote = S < 0 ? 'nadelig' : (S > 0 ? 'gunstig' : 'break-even');
    kpi.appendChild(kpiCard('Saldo', fmtM(S), saldoCls, saldoNote));
    kpi.appendChild(kpiCard('Aandeel begroting', pctGem.toFixed(1).replace('.', ',') + '%', 'bbv-embed-aandeel', 'van totale lasten'));
    wrap.appendChild(kpi);

    var viz = document.createElement('div');
    viz.className = 'bbv-embed-viz';

    var meer = !regel.cluster && typeof FINANCIEEL_MEERJAREN_LASTEN_ABS !== 'undefined'
        ? FINANCIEEL_MEERJAREN_LASTEN_ABS[subCode]
        : null;
    var jaren = meer ? Object.keys(meer).map(Number).sort(function (a, b) { return a - b; }) : [];

    var linePanel = document.createElement('div');
    linePanel.className = 'bbv-embed-viz-panel';
    linePanel.innerHTML = '<h4 class="bbv-embed-viz-titel">Ontwikkeling lasten</h4>';
    var lineHost = document.createElement('div');
    linePanel.appendChild(lineHost);

    if (meer && jaren.length >= 2) {
        var stats = document.createElement('div');
        stats.className = 'bbv-embed-line-stats';
        var firstL = meer[jaren[0]];
        var lastL = meer[jaren[jaren.length - 1]];
        var groeiPct = ((lastL - firstL) / firstL) * 100;
        var groeiAbs = lastL - firstL;
        stats.innerHTML = '<span>Groei: ' + (groeiPct >= 0 ? '+' : '') + groeiPct.toFixed(1).replace('.', ',') + '%</span>' +
            '<span>Bedrag: ' + fmtKDelta(groeiAbs) + '</span>';
        linePanel.insertBefore(stats, lineHost);

        var W = 400, H = 160, padL = 44, padR = 10, padT = 10, padB = 30;
        var chartW = W - padL - padR;
        var chartH = H - padT - padB;
        var vals = jaren.map(function (j) { return meer[j]; });
        var vmin = Math.min.apply(null, vals);
        var vmax = Math.max.apply(null, vals);
        var vpad = (vmax - vmin) * 0.15 || vmax * 0.05;
        var y0 = vmin - vpad;
        var y1 = vmax + vpad;
        function xScale(i) {
            return padL + (i / (jaren.length - 1)) * chartW;
        }
        function yScale(v) {
            return padT + chartH - ((v - y0) / (y1 - y0)) * chartH;
        }
        var pathD = jaren.map(function (j, i) {
            return (i === 0 ? 'M' : 'L') + xScale(i) + ' ' + yScale(meer[j]);
        }).join(' ');
        var areaD = pathD + ' L' + xScale(jaren.length - 1) + ' ' + (padT + chartH) + ' L' + padL + ' ' + (padT + chartH) + ' Z';
        var svg = el('svg', { class: 'bbv-embed-line-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
        var defs = el('defs', {});
        var grad = el('linearGradient', { id: 'bbvEmbedGrad', x1: '0', y1: '0', x2: '0', y2: '1' });
        grad.appendChild(el('stop', { offset: '0%', 'stop-color': '#fecaca', 'stop-opacity': '0.85' }));
        grad.appendChild(el('stop', { offset: '100%', 'stop-color': '#fecaca', 'stop-opacity': '0.06' }));
        defs.appendChild(grad);
        svg.appendChild(defs);
        svg.appendChild(el('path', { d: areaD, fill: 'url(#bbvEmbedGrad)', stroke: 'none' }));
        svg.appendChild(el('path', { d: pathD, fill: 'none', stroke: '#dc2626', 'stroke-width': '2', 'stroke-linecap': 'round' }));
        jaren.forEach(function (j, i) {
            svg.appendChild(el('circle', { cx: xScale(i), cy: yScale(meer[j]), r: '4', fill: '#fff', stroke: '#dc2626', 'stroke-width': '2' }));
        });
        jaren.forEach(function (j, i) {
            var tx = el('text', { x: xScale(i), y: H - 8, fill: '#5c6570', 'font-size': '10', 'font-weight': '600', 'text-anchor': 'middle' });
            tx.textContent = String(j);
            svg.appendChild(tx);
        });
        lineHost.appendChild(svg);
        linePanel.querySelector('.bbv-embed-viz-titel').textContent = 'Ontwikkeling lasten ' + jaren[0] + '–' + jaren[jaren.length - 1];
    } else {
        lineHost.innerHTML = '<p class="bbv-embed-placeholder">Voor deze grafiek ontbreken de meerjarengegevens.</p>';
    }
    viz.appendChild(linePanel);

    var donutPanel = document.createElement('div');
    donutPanel.className = 'bbv-embed-viz-panel';
    donutPanel.innerHTML = '<h4 class="bbv-embed-viz-titel">Aandeel in totale begroting (lasten)</h4>';
    var donutHost = document.createElement('div');
    donutHost.className = 'bbv-embed-donut-host';
    var size = 160;
    var cx = size / 2, cy = size / 2, r = size * 0.36;
    var deel = Math.abs(L);
    function piePath(sR, eR) {
        var x1 = cx + r * Math.cos(sR);
        var y1 = cy + r * Math.sin(sR);
        var x2 = cx + r * Math.cos(eR);
        var y2 = cy + r * Math.sin(eR);
        var large = (eR - sR) > Math.PI ? 1 : 0;
        return ['M', cx, cy, 'L', x1, y1, 'A', r, r, 0, large, 1, x2, y2, 'Z'].join(' ');
    }
    var start = -Math.PI / 2;
    var frac = deel / gemAbs;
    var end = start + frac * 2 * Math.PI;
    var dsvg = el('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size, role: 'img' });
    dsvg.appendChild(el('path', { d: piePath(start, end), fill: '#16a34a', stroke: '#fff', 'stroke-width': '2' }));
    dsvg.appendChild(el('path', { d: piePath(end, start + 2 * Math.PI), fill: '#e8ecf2', stroke: '#fff', 'stroke-width': '2' }));
    dsvg.appendChild(el('circle', { cx: cx, cy: cy, r: r * 0.55, fill: '#fff' }));
    var t1 = el('text', { x: cx, y: cy - 1, 'text-anchor': 'middle', fill: '#2563eb', 'font-size': '17', 'font-weight': '800' });
    t1.textContent = pctGem.toFixed(1).replace('.', ',') + '%';
    dsvg.appendChild(t1);
    var t2 = el('text', { x: cx, y: cy + 13, 'text-anchor': 'middle', fill: '#5c6570', 'font-size': '10', 'font-weight': '700' });
    t2.textContent = subCode.length > 14 ? subCode.substring(0, 12) + '…' : subCode;
    dsvg.appendChild(t2);
    donutHost.appendChild(dsvg);
    donutPanel.appendChild(donutHost);
    viz.appendChild(donutPanel);

    wrap.appendChild(viz);

    var voet = document.createElement('p');
    voet.className = 'bbv-embed-voet';
    voet.innerHTML = 'Programmabegroting ' + JAAR + '. <strong>Verantwoorden</strong> (realisatie): jaarstukken — niet in deze grafiek.';
    wrap.appendChild(voet);

    rootEl.appendChild(wrap);
}
