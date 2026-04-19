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
 */
var FINANCIEEL_MEERJAREN_LASTEN_ABS = {
    '4.2': { 2023: 1111641, 2024: 1328393, 2025: 1411640, 2026: 1428313 }
};

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
