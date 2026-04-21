// Metadata voor bi-taakveld-dashboard.html — programma P1–P5, gemeentelasten per jaar, meerjaren (uitbreidbaar)
// Programma-mapping: FINANCIEEL_BBV_BELEIDSBIBLIOTHEEK.md §2 (Wassenaar programmarekening)

var FINANCIEEL_DASHBOARD_BEGROTING_JAAR = 2026;

/** Som der gemeentelijke lasten (begroting), hele euro's — dossier §3 */
var FINANCIEEL_GEMEENTE_LASTEN_ABS_JAAR = {
    2023: 79455000,
    2024: 88320000,
    2025: 93246000,
    2026: 95520000
};

/**
 * Meerjaren: absolute lasten per kalenderjaar (positief getal = bedrag lasten).
 * Uitbreiden: per Iv3-code object { 2023: n, 2024: n, ... } toevoegen (extractie uit Cuatro-PDF's / jaarstukken).
 * Ontbreekt een code: dashboard toont wél KPI 2026, lijngrafiek = "nog geen meerjaren".
 *
 * FINANCIEEL_MEERJAREN_FICTIEF: jaartallen die geïnterpoleerd zijn (tussen twee bekende jaren) en als
 * grijs punt worden getoond — zie financieelBouwMeerjarenVoorLijn().
 */
var FINANCIEEL_MEERJAREN_LASTEN_ABS = {
    // 0.2: realisatie uit jaarrekening/jaarstukken-staat (CSV); 2026 = begroting KPI (raming).
    '0.2': {
        2020: 2379079,
        2022: 1061018,
        2024: 1597849,
        2026: 1585966
    },
    '4.2': {
        2020: 789958,
        2023: 1111641,
        2024: 1328393,
        2025: 1411640,
        2026: 1428313
    }
};

/**
 * Waarde ontbreekt in FINANCIEEL_MEERJAREN_LASTEN_ABS: lijngrafiek vult lineair tussen buurjaren (grijs).
 * 0.2: gaten 2021 / 2023 / 2025 tussen gerealiseerde jaren; 2026 is wél begroting (niet fictief).
 */
var FINANCIEEL_MEERJAREN_FICTIEF = {
    '0.2': { 2021: true, 2023: true, 2025: true },
    '4.2': { 2021: true }
};

/**
 * Bouwt jaren + lastenMap voor de lijn; vult ontbrekende fictieve jaren lineair tussen dichtstbijzijnde meetjaren.
 * @returns {{ jaren: number[], lastenMap: Object.<number,number>, fictiefMap: Object.<number, boolean> } | null}
 */
function financieelBouwMeerjarenVoorLijn(code) {
    if (!code || typeof FINANCIEEL_MEERJAREN_LASTEN_ABS === 'undefined') return null;
    var raw = FINANCIEEL_MEERJAREN_LASTEN_ABS[code];
    if (!raw) return null;
    var fictiefCfg =
        typeof FINANCIEEL_MEERJAREN_FICTIEF !== 'undefined' && FINANCIEEL_MEERJAREN_FICTIEF[code]
            ? FINANCIEEL_MEERJAREN_FICTIEF[code]
            : {};
    var meer = {};
    var k;
    for (k in raw) {
        if (Object.prototype.hasOwnProperty.call(raw, k)) meer[k] = raw[k];
    }
    var ontbrekend = [];
    for (k in fictiefCfg) {
        if (Object.prototype.hasOwnProperty.call(fictiefCfg, k) && fictiefCfg[k] && (meer[k] === undefined || meer[k] === null)) {
            ontbrekend.push(parseInt(k, 10));
        }
    }
    ontbrekend.sort(function (a, b) { return a - b; });
    function realJarenZonderFictief() {
        return Object.keys(meer)
            .map(Number)
            .filter(function (j) { return !fictiefCfg[String(j)]; })
            .sort(function (a, b) { return a - b; });
    }
    var iter = 0;
    while (ontbrekend.length && iter < 20) {
        iter += 1;
        var reals = realJarenZonderFictief();
        var filled = 0;
        for (var oi = 0; oi < ontbrekend.length; oi++) {
            var y = ontbrekend[oi];
            if (meer[y] != null) continue;
            var prevY = null;
            var nextY = null;
            for (var ri = 0; ri < reals.length; ri++) {
                var ry = reals[ri];
                if (ry < y && (prevY === null || ry > prevY)) prevY = ry;
                if (ry > y && (nextY === null || ry < nextY)) nextY = ry;
            }
            if (prevY != null && nextY != null) {
                var v0 = meer[prevY];
                var v1 = meer[nextY];
                meer[y] = Math.round(v0 + ((v1 - v0) * (y - prevY)) / (nextY - prevY));
                filled += 1;
            }
        }
        if (!filled) break;
        ontbrekend = ontbrekend.filter(function (y) { return meer[y] == null; });
    }
    var jaren = Object.keys(meer)
        .map(Number)
        .filter(function (j) { return meer[j] != null; })
        .sort(function (a, b) { return a - b; });
    var fictiefMap = {};
    for (var fi = 0; fi < jaren.length; fi++) {
        var jj = jaren[fi];
        if (fictiefCfg[String(jj)]) fictiefMap[jj] = true;
    }
    var lastenMap = {};
    for (var li = 0; li < jaren.length; li++) {
        var jk = jaren[li];
        lastenMap[jk] = meer[jk];
    }
    return { jaren: jaren, lastenMap: lastenMap, fictiefMap: fictiefMap };
}

/**
 * Groei % / bedrag op basis van eerste en laatste niet-fictieve meetpunt (anders alle punten).
 */
function financieelGroeiStatistieken(jaren, lastenMap, fictiefMap) {
    fictiefMap = fictiefMap || {};
    var nietFict = jaren.filter(function (j) { return !fictiefMap[j]; });
    var gebruik = nietFict.length >= 2 ? nietFict : jaren;
    var firstL = lastenMap[gebruik[0]];
    var lastL = lastenMap[gebruik[gebruik.length - 1]];
    var groeiPct = firstL ? ((lastL - firstL) / firstL) * 100 : 0;
    var groeiAbs = lastL - firstL;
    return { firstL: firstL, lastL: lastL, groeiPct: groeiPct, groeiAbs: groeiAbs, opBasisVan: nietFict.length >= 2 ? 'zonder-fictief' : 'alle-punten' };
}

function financieelProgrammaVoorIv3(code) {
    if (!code) return 'P2';
    var p4 = { '4.2': 1, '5.5': 1, '7.5': 1, '8.1': 1, '8.2': 1, '8.3': 1 };
    if (p4[code]) return 'P4';
    if (code === '1.1' || code === '1.2') return 'P1';
    var p5 = { '2.1': 1, '2.2': 1, '2.3': 1, '2.5': 1, '3.1': 1, '3.3': 1, '3.4': 1, '5.7': 1, '7.2': 1, '7.3': 1, '7.4': 1 };
    if (p5[code]) return 'P5';
    if (code.indexOf('0.') === 0) return 'P3';
    return 'P2';
}
