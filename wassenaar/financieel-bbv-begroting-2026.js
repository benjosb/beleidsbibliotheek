// Programmabegroting 2026 — baten/lasten/saldo per taakveld (hele euro's)
// Bron: wassenaar/analyse-begrotingen/FINANCIEEL_BBV_BELEIDSBIBLIOTHEEK.md §5 (afgeleid van taakveldoverzichten)
// Let op: clustering in de UI (bbv-taakveldtegels) wijkt soms af van enkele Iv3-regels; zie FINANCIEEL_UI_CLUSTER_NAAR_CODES.

const FINANCIEEL_BEGROTING_2026_HOOFDSTUK = [
    { baten: 68308980, lasten: -24432538, saldo: 43876442 },
    { baten: 105457, lasten: -4641332, saldo: -4535875 },
    { baten: 665654, lasten: -5305765, saldo: -4640111 },
    { baten: 2495944, lasten: -852599, saldo: 1643345 },
    { baten: 537527, lasten: -3447410, saldo: -2909883 },
    { baten: 1139182, lasten: -9515058, saldo: -8375876 },
    { baten: 9341113, lasten: -33479679, saldo: -24138566 },
    { baten: 10491248, lasten: -11509340, saldo: -1018092 },
    { baten: 2022547, lasten: -2266347, saldo: -243800 }
];

/** Per taakveldcode (Iv3) — exacte regels uit dossier §5 */
const FINANCIEEL_BEGROTING_2026_TAAKVELD = {
    '0.1': { baten: 2781, lasten: -2183291, saldo: -2180510 },
    '0.2': { baten: 727998, lasten: -1585966, saldo: -857968 },
    '0.3': { baten: 84910, lasten: -804758, saldo: -719848 },
    '0.4': { baten: 4217637, lasten: -18818697, saldo: -14601060 },
    '0.5': { baten: 877755, lasten: -164912, saldo: 712843 },
    '0.61': { baten: 10369790, lasten: -383885, saldo: 9985905 },
    '0.62': { baten: 3838146, lasten: -66888, saldo: 3771258 },
    '0.64': { baten: 475168, lasten: -113597, saldo: 361571 },
    '0.7': { baten: 47714795, lasten: 0, saldo: 47714795 },
    '0.8': { baten: 0, lasten: -310544, saldo: -310544 },
    '1.1': { baten: 0, lasten: -2776480, saldo: -2776480 },
    '1.2': { baten: 105457, lasten: -1864852, saldo: -1759395 },
    '2.1': { baten: 492198, lasten: -4881944, saldo: -4389746 },
    '2.2': { baten: 146187, lasten: -407155, saldo: -260968 },
    '2.3': { baten: 27269, lasten: -4481, saldo: 22788 },
    '2.5': { baten: 0, lasten: -12185, saldo: -12185 },
    '3.1': { baten: 0, lasten: -570464, saldo: -570464 },
    '3.3': { baten: 108446, lasten: -142302, saldo: -33856 },
    '3.4': { baten: 2387498, lasten: -139833, saldo: 2247665 },
    '4.1': { baten: 12236, lasten: -169794, saldo: -157558 },
    '4.2': { baten: 0, lasten: -1428313, saldo: -1428313 },
    '4.3': { baten: 525291, lasten: -1849303, saldo: -1324012 },
    '5.1': { baten: 149913, lasten: -784082, saldo: -634169 },
    '5.2': { baten: 583677, lasten: -1989166, saldo: -1405489 },
    '5.3': { baten: 60347, lasten: -542322, saldo: -481975 },
    '5.4': { baten: 4571, lasten: -531729, saldo: -527158 },
    '5.6': { baten: 137817, lasten: -859042, saldo: -721225 },
    '5.7': { baten: 202857, lasten: -4808717, saldo: -4605860 },
    '6.1': { baten: 1940608, lasten: -5671866, saldo: -3731258 },
    '6.21': { baten: 94940, lasten: -921160, saldo: -826220 },
    '6.22': { baten: 0, lasten: -1083875, saldo: -1083875 },
    '6.23': { baten: 0, lasten: -909709, saldo: -909709 },
    '6.3': { baten: 7138140, lasten: -10194995, saldo: -3056855 },
    '6.4': { baten: 0, lasten: -1076222, saldo: -1076222 },
    '6.5': { baten: 0, lasten: -853919, saldo: -853919 },
    '6.60': { baten: 17425, lasten: -973006, saldo: -955581 },
    '6.711': { baten: 150000, lasten: -2429246, saldo: -2279246 },
    '6.712': { baten: 0, lasten: -754845, saldo: -754845 },
    '6.713': { baten: 0, lasten: -280371, saldo: -280371 },
    '6.714': { baten: 0, lasten: 0, saldo: 0 },
    '6.751': { baten: 0, lasten: -711096, saldo: -711096 },
    '6.752': { baten: 0, lasten: -4104095, saldo: -4104095 },
    '6.753': { baten: 0, lasten: 100000, saldo: 100000 },
    '6.761': { baten: 0, lasten: -105096, saldo: -105096 },
    '6.762': { baten: 0, lasten: -1409935, saldo: -1409935 },
    '6.763': { baten: 0, lasten: -126087, saldo: -126087 },
    '6.791': { baten: 0, lasten: -178955, saldo: -178955 },
    '6.792': { baten: 0, lasten: -188658, saldo: -188658 },
    '6.821': { baten: 0, lasten: -236413, saldo: -236413 },
    '6.822': { baten: 0, lasten: -105072, saldo: -105072 },
    '6.91': { baten: 0, lasten: -642182, saldo: -642182 },
    '6.92': { baten: 0, lasten: -692876, saldo: -692876 },
    '7.1': { baten: 274689, lasten: -1792175, saldo: -1517486 },
    '7.2': { baten: 3105702, lasten: -2301272, saldo: 804430 },
    '7.3': { baten: 6539076, lasten: -5223686, saldo: 1315390 },
    '7.4': { baten: 515000, lasten: -1920410, saldo: -1405410 },
    '7.5': { baten: 56781, lasten: -271797, saldo: -215016 },
    '8.1': { baten: 13000, lasten: -1116357, saldo: -1103357 },
    '8.2': { baten: 0, lasten: 0, saldo: 0 },
    '8.3': { baten: 2009547, lasten: -1149990, saldo: 859557 }
};

/**
 * UI-taakveldcode (tegel) → lijst Iv3-codes om op te tellen in FINANCIEEL_BEGROTING_2026_TAAKVELD.
 * 0.63 / 0.9 VpB: niet als aparte regel in §3 — niet meegenomen in cluster '0.6 - 0.9'.
 */
const FINANCIEEL_UI_CLUSTER_NAAR_CODES = {
    '0.6 - 0.9': ['0.61', '0.62', '0.64'],
    '0.8 - 0.10 - 0.11': ['0.8'],
    '6.2': ['6.21', '6.22', '6.23'],
    '6.3 - 6.5': ['6.3', '6.4', '6.5'],
    '6.60 - 6.91': ['6.60', '6.711', '6.712', '6.713', '6.714', '6.791', '6.91'],
    '6.7 - 6.9': ['6.751', '6.752', '6.753', '6.761', '6.762', '6.763', '6.792', '6.821', '6.822', '6.92']
};

function financieelSomRegels(codes) {
    const out = { baten: 0, lasten: 0, saldo: 0 };
    const missing = [];
    codes.forEach((c) => {
        const r = FINANCIEEL_BEGROTING_2026_TAAKVELD[c];
        if (!r) {
            missing.push(c);
            return;
        }
        out.baten += r.baten;
        out.lasten += r.lasten;
        out.saldo += r.saldo;
    });
    return { som: out, missing };
}

function getFinancieelGemeenteTotaal() {
    let baten = 0;
    let lasten = 0;
    for (let i = 0; i < FINANCIEEL_BEGROTING_2026_HOOFDSTUK.length; i++) {
        const t = FINANCIEEL_BEGROTING_2026_HOOFDSTUK[i];
        baten += t.baten;
        lasten += t.lasten;
    }
    return {
        baten,
        lasten,
        saldo: baten + lasten,
        lastenAbs: Math.abs(lasten)
    };
}

function getFinancieelHoofdstukTotaal(bbvIndex) {
    const h = FINANCIEEL_BEGROTING_2026_HOOFDSTUK[bbvIndex];
    if (!h) return null;
    const g = getFinancieelGemeenteTotaal();
    const pct = g.lastenAbs > 0 ? Math.round((Math.abs(h.lasten) / g.lastenAbs) * 1000) / 10 : null;
    return {
        baten: h.baten,
        lasten: h.lasten,
        saldo: h.saldo,
        aandeelLastenPct: pct
    };
}

/**
 * @param {number} bbvIndex 0..8
 * @param {string} subCode — code op de tegel (bv. '1.2' of '6.7 - 6.9')
 * @returns {{ baten: number, lasten: number, saldo: number, bronCodes: string[], cluster: boolean, missingInDataset: string[] } | null}
 */
function getFinancieelVoorUiTaakveld(bbvIndex, subCode) {
    if (subCode == null || subCode === '') return null;
    const cluster = FINANCIEEL_UI_CLUSTER_NAAR_CODES[subCode];
    if (cluster) {
        const { som, missing } = financieelSomRegels(cluster);
        return {
            baten: som.baten,
            lasten: som.lasten,
            saldo: som.saldo,
            bronCodes: cluster.slice(),
            cluster: true,
            missingInDataset: missing
        };
    }
    const een = FINANCIEEL_BEGROTING_2026_TAAKVELD[subCode];
    if (een) {
        return {
            baten: een.baten,
            lasten: een.lasten,
            saldo: een.saldo,
            bronCodes: [subCode],
            cluster: false,
            missingInDataset: []
        };
    }
    return null;
}
