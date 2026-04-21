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
 * AUTO-GEGENEREERD door analyse-begrotingen/scripts/build_meerjaren_lasten_js.py
 *   Bron 2020-2025: data/taakveld-lasten-staat-2020-2025.csv (realisatie; 2021 leeg)
 *   Bron 2026:      financieel-bbv-begroting-2026.js (begroting)
 *   "0" in CSV is overgeslagen (placeholder); jaren tussen min/max zonder data
 *   staan in FINANCIEEL_MEERJAREN_FICTIEF en worden grijs/lineair geinterpoleerd.
 *
 * Handmatige aanpassingen blijven NIET behouden bij regenereren — corrigeer in CSV.
 */
var FINANCIEEL_MEERJAREN_LASTEN_ABS = {
    '0.1': { 2020: 9500823, 2022: 3186294, 2023: 2397568, 2024: 2580157, 2026: 2183291 },
    '0.2': { 2020: 2379079, 2022: 1061018, 2024: 1597849, 2026: 1585966 },
    '0.3': { 2020: 857308, 2022: 717945, 2024: 537758, 2026: 804758 },
    '0.4': { 2020: 1007660, 2024: 17929390, 2026: 18818697 },
    '0.5': { 2020: 15706, 2022: 16090, 2026: 164912 },
    '0.8': { 2020: 278990, 2022: 91697, 2026: 310544 },
    '0.61': { 2020: 283842, 2022: 316969, 2026: 383885 },
    '0.62': { 2020: 60483, 2022: 63620, 2026: 66888 },
    '0.64': { 2022: 94022, 2026: 113597 },
    '1.1': { 2022: 4085443, 2023: 5074636, 2024: 1537133, 2025: 10164, 2026: 2776480 },
    '1.2': { 2023: 1553291, 2024: 2797393, 2025: 7691, 2026: 1864852 },
    '2.1': { 2020: 3848536, 2022: 4437956, 2023: 5155835, 2024: 4968631, 2025: 2689, 2026: 4881944 },
    '2.2': { 2020: 402231, 2022: 329118, 2023: 539307, 2024: 473855, 2026: 407155 },
    '2.3': { 2022: 9, 2023: 8, 2024: 10, 2026: 4481 },
    '3.1': { 2020: 382723, 2022: 403770, 2024: 556520, 2026: 570464 },
    '3.3': { 2020: 95326, 2022: 179994, 2023: 173513, 2024: 4529546, 2026: 142302 },
    '3.4': { 2020: 164983, 2022: 106119, 2023: 138161, 2024: 2204192, 2025: 4145, 2026: 139833 },
    '4.1': { 2020: 55036, 2024: 626877, 2025: 48488, 2026: 169794 },
    '4.2': { 2020: 1353156, 2022: 94299, 2023: 421523, 2024: 1381508, 2026: 1428313 },
    '4.3': { 2020: 1507956, 2024: 1866682, 2026: 1849303 },
    '5.1': { 2020: 588050, 2024: 652232, 2026: 784082 },
    '5.2': { 2020: 1251727, 2024: 2170226, 2026: 1989166 },
    '5.3': { 2020: 408455, 2025: 4451, 2026: 542322 },
    '5.4': { 2020: 12051, 2026: 531729 },
    '5.6': { 2020: 303891, 2024: 894458, 2025: 27483, 2026: 859042 },
    '5.7': { 2020: 705048, 2022: 470554, 2023: 4987881, 2024: 4757107, 2026: 4808717 },
    '6.1': { 2020: 1639235, 2024: 1122735, 2025: 3739, 2026: 5671866 },
    '6.3': { 2020: 641366, 2024: 4702602, 2026: 10194995 },
    '6.4': { 2020: 11309336, 2024: 2266041, 2025: 17927, 2026: 1076222 },
    '6.5': { 2020: 1044664, 2024: 9538023, 2026: 853919 },
    '6.21': { 2025: 3435, 2026: 921160 },
    '6.22': { 2025: 2108, 2026: 1083875 },
    '6.23': { 2025: 46780, 2026: 909709 },
    '6.711': { 2025: 27, 2026: 2429246 },
    '6.712': { 2025: 2689, 2026: 754845 },
    '6.751': { 2025: 1111, 2026: 711096 },
    '6.791': { 2025: 9, 2026: 178955 },
    '7.1': { 2020: 4737699, 2024: 269361, 2026: 1792175 },
    '7.2': { 2020: 1837989, 2023: 1941344, 2024: 143265, 2026: 2301272 },
    '7.3': { 2023: 4363709, 2024: 125347, 2026: 5223686 },
    '7.4': { 2023: 1598391, 2024: 1743806, 2026: 1920410 },
    '7.5': { 2023: 1510442, 2024: 484972, 2026: 271797 },
    '8.1': { 2020: 908618, 2022: 1207258, 2023: 125142, 2024: 160839, 2026: 1116357 },
    '8.2': { 2020: 165937, 2022: 8962, 2023: 1976908, 2024: 1947900, 2025: 7378 },
    '8.3': { 2020: 8660551, 2022: 1970074, 2023: 36226, 2024: 36576, 2026: 1149990 }
};

/**
 * Jaren die NIET als meting in de CSV stonden maar wel binnen de meetreeks van de
 * code vallen — lijngrafiek interpoleert lineair en kleurt het punt grijs.
 */
var FINANCIEEL_MEERJAREN_FICTIEF = {
    '0.1': { 2021: true, 2025: true },
    '0.2': { 2021: true, 2023: true, 2025: true },
    '0.3': { 2021: true, 2023: true, 2025: true },
    '0.4': { 2021: true, 2022: true, 2023: true, 2025: true },
    '0.5': { 2021: true, 2023: true, 2024: true, 2025: true },
    '0.8': { 2021: true, 2023: true, 2024: true, 2025: true },
    '0.61': { 2021: true, 2023: true, 2024: true, 2025: true },
    '0.62': { 2021: true, 2023: true, 2024: true, 2025: true },
    '0.64': { 2023: true, 2024: true, 2025: true },
    '2.1': { 2021: true },
    '2.2': { 2021: true, 2025: true },
    '2.3': { 2025: true },
    '3.1': { 2021: true, 2023: true, 2025: true },
    '3.3': { 2021: true, 2025: true },
    '3.4': { 2021: true },
    '4.1': { 2021: true, 2022: true, 2023: true },
    '4.2': { 2021: true, 2025: true },
    '4.3': { 2021: true, 2022: true, 2023: true, 2025: true },
    '5.1': { 2021: true, 2022: true, 2023: true, 2025: true },
    '5.2': { 2021: true, 2022: true, 2023: true, 2025: true },
    '5.3': { 2021: true, 2022: true, 2023: true, 2024: true },
    '5.4': { 2021: true, 2022: true, 2023: true, 2024: true, 2025: true },
    '5.6': { 2021: true, 2022: true, 2023: true },
    '5.7': { 2021: true, 2025: true },
    '6.1': { 2021: true, 2022: true, 2023: true },
    '6.3': { 2021: true, 2022: true, 2023: true, 2025: true },
    '6.4': { 2021: true, 2022: true, 2023: true },
    '6.5': { 2021: true, 2022: true, 2023: true, 2025: true },
    '7.1': { 2021: true, 2022: true, 2023: true, 2025: true },
    '7.2': { 2021: true, 2022: true, 2025: true },
    '7.3': { 2025: true },
    '7.4': { 2025: true },
    '7.5': { 2025: true },
    '8.1': { 2021: true, 2025: true },
    '8.2': { 2021: true },
    '8.3': { 2021: true, 2025: true }
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
