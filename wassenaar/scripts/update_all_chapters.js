const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
let code = fs.readFileSync(appPath, 'utf8');

const excelData = require('./all_chapters_matching.json');

// ── TV code mapping: Excel tv → BBV taakveld code ──
const TV_MAP = {
    '0.1': '0.1', '0.2': '0.2', '0.3': '0.3', '0.4': '0.4', '0.5': '0.5',
    '0.6': '0.64', '0.61 en 0.62': '0.61', '0.64': '0.64',
    '1.1': '1.1', '1.2': '1.2',
    '2.1': '2.1', '2.2': '2.2', '2.4': '2.4', '2.5': '2.5',
    '3.1': '3.1', '3.2': '3.2', '3.3': '3.3', '3.4': '3.4',
    '4.1': '4.1', '4.2': '4.2', '4.3': '4.3',
    '5.1': '5.1', '5.2': '5.2', '5.3': '5.3', '5.3 Economie?': '5.3',
    '5.4': '5.4', '5.5': '5.5', '5.6': '5.6', '5.7': '5.7',
    '6.1': '6.1', '6.2': '6.2',
    '6.3': '6.3 - 6.5', '6.4': '6.3 - 6.5', '6.5': '6.3 - 6.5',
    '6.6-6.9': '6.60 - 6.91', '6.7-6.9 jeugd': '6.7 - 6.9',
    '7.1': '7.1', '7.2': '7.2', '7.3': '7.3', '7.4': '7.4', '7.5': '7.5',
};

function mapType(excelType) {
    if (!excelType) return 'Besluit';
    if (excelType.includes('Strategisch beleidsplan')) return 'Visie/Strategie';
    if (excelType.includes('Verordening')) return 'Verordening';
    if (excelType.includes('Beleidsnota') || excelType.includes('Beleidsplan')) return 'Beleidsnota';
    if (excelType.includes('Operationeel')) return 'Besluit';
    if (excelType.includes('Gemeenschappelijke Regeling')) return 'GR';
    if (excelType.includes('Rekenkameronderzoek')) return 'Rekenkameronderzoek';
    if (excelType.includes('Beheerplan')) return 'Beheerplan';
    return 'Besluit';
}

function escJS(s) {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\u2018\u2019]/g, "\\'").replace(/[\u201C\u201D]/g, '\\"');
}

function formatItem(item) {
    let parts = [`naam: '${escJS(item.naam)}'`];
    if (item.datum) parts.push(`datum: '${item.datum}'`);
    if (item.link) parts.push(`link: '${escJS(item.link)}'`);
    parts.push(`type: '${escJS(item.type || 'Besluit')}'`);
    if (item.toelichting) parts.push(`toelichting: '${escJS(item.toelichting)}'`);
    return `        { ${parts.join(', ')} }`;
}

// ── Strategic items per chapter (stay on moedertegel) ──
// Only broad visie/strategie documents
const STRATEGIC_ITEMS = {
    0: [
        'Begroting 2026',
        'Kadernota 2026',
        'Voorjaarsnota 2025',
        'Najaarsnota 2025',
        'Jaarstukken 2024',
    ],
    1: [
        'Integraal Veiligheidsbeleid 2024–2027',
        'Beleidsplan aanpak ondermijnende criminaliteit 2025–2028',
    ],
    2: [
        'Wegencategoriseringsplan Wassenaar',
        'Beheervisie Openbare Ruimte',
    ],
    3: [
        'Economische Visie Wassenaar 2025',
        'Visie voor De Wassenaarse Slag',
    ],
    4: [
        'Herijking IHP onderwijs 2024–2039',
        'Lokale Educatieve Agenda (LEA) 2026–2037',
    ],
    5: [
        'Sportvisie Wassenaar 2025',
        'Visie voor De Wassenaarse Slag',
    ],
    6: [
        'Beleidsplan Sociaal Domein Wassenaar',
        'Beleidsnota Ouderenbeleid 2025',
        'Beleidsnota schuldhulpverlening 2025–2028',
        'Startnotitie Lokale Woonzorgvisie',
    ],
    7: [
        'Nota bodembeheer 2023',
        'Integraal Waterketenplan 2024–2028 (Leidse regio)',
        'Beleidsregels Milieuzonering Richtafstanden 2024',
    ],
};

// ── Non-strategic items: assign to taakvelden ──
const MOVED_ITEMS_TV = {
    0: {
        '0.4': [
            'Begroting 2025 (geamendeerd)',
            'Kadernota 2025',
            'Najaarsnota 2024',
            'Voorjaarsnota 2024',
            'Jaarstukken 2023',
            'Actualisatie financiële verordening 2025',
            'Controleprotocol incl. normen- en toetsingskader 2025',
            'Nota reserves en voorzieningen',
            'Nota waardering en afschrijving vaste activa',
        ],
    },
    1: {
        '1.2': [
            'Algemene Plaatselijke Verordening (APV) 2024',
            'Regiovisie Aanpak Huiselijk Geweld Haaglanden 2026',
            'Bekrachtiging Noodverordening NAVO-top 2025',
        ],
    },
    2: {
        '2.1': ['Zienswijze concept-ontwerp Mobiliteitsvisie MRDH'],
    },
    3: {
        '3.4': ['Zienswijze Visie Economisch Vestigingsklimaat MRDH', 'Nota Internationals in Wassenaar'],
        '3.3': ['Verordening BIZ Maaldrift 2026–2030'],
    },
    4: {
        '4.3': ['Verordening leerlingenvervoer 2025', 'Beleidsplan voor- en vroegschoolse educatie 2024–2027'],
        '4.1': ['Jaarrekening 2024 Stichting Openbaar Primair Onderwijs'],
    },
    5: {
        '5.5': ['Erfgoedverordening Wassenaar (technische aanpassing)'],
    },
    6: {
        '6.7 - 6.9': ['Verordening Jeugdhulp 2025', 'Nieuw inkoopkader jeugdhulp GR SbJH'],
        '6.60 - 6.91': ['Achtste wijziging Verordening Wmo'],
        '6.3 - 6.5': ['Re-integratie- en participatieverordening 2023', 'Beleidsplan re-integratie en participatie'],
        '6.1': ['Verordening Adviesraad Sociaal Domein 2025', 'Regiovisie Aanpak Huiselijk Geweld 2026'],
    },
    7: {
        '7.3': ['Afvalstoffenverordening Wassenaar 2024', 'Verkenning reductie restafval', 'Motie reductie restafval en kostenbesparing afvalstoffenheffing'],
    },
};

// ── Step 1: Parse existing BELEIDSNOTA_PER_HOOFDSTUK_BBV items ──
function extractBlock(code, startPattern) {
    const m = code.match(startPattern);
    if (!m) throw new Error('Pattern not found: ' + startPattern);
    const s = m.index;
    let depth = 0, e = s;
    for (let i = s; i < code.length; i++) {
        if (code[i] === '{') depth++;
        if (code[i] === '}') { depth--; if (depth === 0) { e = i; break; } }
    }
    return { start: s, end: e + 1, content: code.substring(s, e + 1) };
}

function extractArrayInObj(code, objStart, key) {
    const keyStr = typeof key === 'number' ? key + ':' : "'" + key + "':";
    const re = new RegExp('(^|\\n)\\s*' + keyStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\[', 'g');
    const relative = code.substring(objStart);
    const m = re.exec(relative);
    if (!m) return null;
    const arrStart = objStart + m.index + m[0].length - 1;
    let depth = 0, arrEnd = arrStart;
    for (let i = arrStart; i < code.length; i++) {
        if (code[i] === '[') depth++;
        if (code[i] === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
    }
    return { start: arrStart, end: arrEnd + 1, content: code.substring(arrStart, arrEnd + 1) };
}

const hoofdstukBlock = extractBlock(code, /const BELEIDSNOTA_PER_HOOFDSTUK_BBV\s*=\s*\{/);
const taakveldBlock = extractBlock(code, /const BELEIDSNOTA_PER_TAAKVELD\s*=\s*\{/);

// ── Step 2: Parse existing items from BELEIDSNOTA_PER_HOOFDSTUK_BBV ──
function parseItems(blockContent) {
    const items = [];
    const re = /\{\s*naam:\s*'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = re.exec(blockContent)) !== null) {
        const itemStart = m.index;
        let depth = 0, itemEnd = itemStart;
        for (let i = itemStart; i < blockContent.length; i++) {
            if (blockContent[i] === '{') depth++;
            if (blockContent[i] === '}') { depth--; if (depth === 0) { itemEnd = i; break; } }
        }
        const itemStr = blockContent.substring(itemStart, itemEnd + 1);
        const naam = m[1].replace(/\\'/g, "'");
        const datumM = itemStr.match(/datum:\s*'([^']*)'/);
        const linkM = itemStr.match(/link:\s*'((?:[^'\\]|\\.)*)'/);
        const typeM = itemStr.match(/type:\s*'((?:[^'\\]|\\.)*)'/);
        const toelM = itemStr.match(/toelichting:\s*'((?:[^'\\]|\\.)*)'/);
        items.push({
            naam,
            datum: datumM ? datumM[1] : null,
            link: linkM ? linkM[1].replace(/\\'/g, "'") : null,
            type: typeM ? typeM[1].replace(/\\'/g, "'") : null,
            toelichting: toelM ? toelM[1].replace(/\\'/g, "'") : null,
            raw: itemStr
        });
    }
    return items;
}

// Parse existing items for each chapter
const existingItems = {};
for (let ch = 0; ch <= 7; ch++) {
    const arr = extractArrayInObj(hoofdstukBlock.content, 0, ch);
    if (arr) {
        existingItems[ch] = parseItems(arr.content);
        console.log(`Chapter ${ch}: ${existingItems[ch].length} existing items`);
    }
}

// ── Step 3: Build new BELEIDSNOTA_PER_HOOFDSTUK_BBV (strategic only) ──
const newHoofdstukItems = {};
for (let ch = 0; ch <= 7; ch++) {
    const items = existingItems[ch] || [];
    const stratNames = STRATEGIC_ITEMS[ch] || [];
    newHoofdstukItems[ch] = items.filter(item => 
        stratNames.some(s => item.naam.includes(s) || s.includes(item.naam))
    );
    console.log(`Chapter ${ch}: ${newHoofdstukItems[ch].length} strategic items remain on moedertegel`);
}

// ── Step 4: Build new BELEIDSNOTA_PER_TAAKVELD ──
// Start with items moved from hoofdstuk level
const newTaakveldItems = {};

// Add moved items (existing items reassigned to taakvelden)
for (let ch = 0; ch <= 7; ch++) {
    const moveMap = MOVED_ITEMS_TV[ch] || {};
    const items = existingItems[ch] || [];
    for (const [tv, names] of Object.entries(moveMap)) {
        if (!newTaakveldItems[tv]) newTaakveldItems[tv] = [];
        names.forEach(name => {
            const found = items.find(item => item.naam.includes(name) || name.includes(item.naam));
            if (found) {
                newTaakveldItems[tv].push(found);
            } else {
                console.warn(`  Warning: could not find "${name}" in chapter ${ch} items`);
            }
        });
    }
}

// Add Excel items
for (let ch = 0; ch <= 7; ch++) {
    const excelItems = excelData[ch] || [];
    excelItems.forEach(item => {
        const tvCode = TV_MAP[item.tv];
        if (!tvCode) {
            console.warn(`  No mapping for tv "${item.tv}" (item: ${item.naam})`);
            return;
        }
        if (!newTaakveldItems[tvCode]) newTaakveldItems[tvCode] = [];
        const cleanNaam = item.naam
            .replace(/\s*\(1\. Strategisch beleidsplan \/ Visie\)$/, '')
            .replace(/\s*\(2\. Verordening\)$/, '')
            .replace(/\s*\(2\. Beleidsnota\/ Beleidsplan\)$/, '')
            .replace(/\s*\(4\. Operationeel Beslisdocument\)$/, '')
            .replace(/\s*\(Gemeenschappelijke Regeling\)$/, '')
            .replace(/\s*\(Rekenkameronderzoek\)$/, '')
            .replace(/\s*\(Beheerplan\/ uitvoeringsplan\)$/, '')
            .trim();
        
        const existing = newTaakveldItems[tvCode].find(e => 
            e.naam === cleanNaam || 
            e.naam.includes(cleanNaam.substring(0, 30)) || 
            cleanNaam.includes(e.naam.substring(0, 30))
        );
        if (existing) return;
        
        newTaakveldItems[tvCode].push({
            naam: cleanNaam,
            datum: item.datum || null,
            link: item.link || null,
            type: mapType(item.type || item.juridisch),
            toelichting: null
        });
    });
}

// ── Step 5: Preserve existing taakveld items (8.1, 8.3, 0.4 existing etc.) ──
const existingTVBlock = extractBlock(code, /const BELEIDSNOTA_PER_TAAKVELD\s*=\s*\{/);
const existingTVContent = existingTVBlock.content;

// Parse existing TV keys
const existingTVKeys = [...existingTVContent.matchAll(/'([^']+)':\s*\[/g)].map(m => m[1]);

// For TV keys that already exist (8.1, 8.3, etc.), keep them if we're not overwriting
const keepTVs = ['8.1', '8.3'];
const existingTVItems = {};
keepTVs.forEach(tv => {
    const arr = extractArrayInObj(existingTVContent, 0, tv);
    if (arr) {
        existingTVItems[tv] = parseItems(arr.content);
    }
});

// For 0.4: merge existing with new
const existing04 = (() => {
    const arr = extractArrayInObj(existingTVContent, 0, '0.4');
    if (arr) return parseItems(arr.content);
    return [];
})();
if (newTaakveldItems['0.4']) {
    const merged = [...existing04];
    newTaakveldItems['0.4'].forEach(item => {
        if (!merged.some(e => e.naam.includes(item.naam.substring(0, 20)) || item.naam.includes(e.naam.substring(0, 20)))) {
            merged.push(item);
        }
    });
    newTaakveldItems['0.4'] = merged;
} else {
    newTaakveldItems['0.4'] = existing04;
}

// Keep existing clustering info for 6.x keys
const clusteringKeys = ['6.811', '6.60 - 6.91', '6.2', '6.7 - 6.9', '6.3 - 6.5'];
clusteringKeys.forEach(tv => {
    const arr = extractArrayInObj(existingTVContent, 0, tv);
    if (arr) {
        const existItems = parseItems(arr.content);
        if (newTaakveldItems[tv]) {
            const clusterItem = existItems.find(e => e.type === 'Clustering');
            if (clusterItem) {
                const hasCluster = newTaakveldItems[tv].some(e => e.type === 'Clustering');
                if (!hasCluster) {
                    newTaakveldItems[tv].unshift(clusterItem);
                }
            }
            existItems.forEach(item => {
                if (item.type !== 'Clustering' && !newTaakveldItems[tv].some(e => 
                    e.naam.includes(item.naam.substring(0, 20)) || item.naam.includes(e.naam.substring(0, 20))
                )) {
                    newTaakveldItems[tv].push(item);
                }
            });
        } else {
            newTaakveldItems[tv] = existItems;
        }
    }
});

// ── Step 6: Generate new code blocks ──

// Sort taakveld keys
const allTVKeys = [...new Set([...Object.keys(newTaakveldItems), ...keepTVs])].sort((a, b) => {
    const na = parseFloat(a.split(' ')[0]);
    const nb = parseFloat(b.split(' ')[0]);
    return na - nb;
});

let tvCode = 'const BELEIDSNOTA_PER_TAAKVELD = {\n';
allTVKeys.forEach((tv, idx) => {
    if (keepTVs.includes(tv) && existingTVItems[tv]) {
        tvCode += `    '${tv}': [\n`;
        existingTVItems[tv].forEach((item, i) => {
            tvCode += formatItem(item);
            if (i < existingTVItems[tv].length - 1) tvCode += ',';
            tvCode += '\n';
        });
        tvCode += '    ]';
    } else if (newTaakveldItems[tv]) {
        const items = newTaakveldItems[tv];
        tvCode += `    '${tv}': [\n`;
        items.forEach((item, i) => {
            if (item.type === 'Clustering') {
                let parts = [`naam: '${escJS(item.naam)}'`, `type: 'Clustering'`];
                if (item.toelichting) parts.push(`toelichting: '${escJS(item.toelichting)}'`);
                tvCode += `        { ${parts.join(', ')} }`;
            } else {
                tvCode += formatItem(item);
            }
            if (i < items.length - 1) tvCode += ',';
            tvCode += '\n';
        });
        tvCode += '    ]';
    }
    if (idx < allTVKeys.length - 1) tvCode += ',';
    tvCode += '\n';
});
tvCode += '};\n';

// Generate new BELEIDSNOTA_PER_HOOFDSTUK_BBV
let hoofdCode = 'const BELEIDSNOTA_PER_HOOFDSTUK_BBV = {\n';
for (let ch = 0; ch <= 8; ch++) {
    if (ch === 8) {
        // Keep chapter 8 as-is (already done)
        const arr = extractArrayInObj(hoofdstukBlock.content, 0, 8);
        if (arr) {
            const items = parseItems(arr.content);
            hoofdCode += `    8: [\n`;
            items.forEach((item, i) => {
                hoofdCode += formatItem(item);
                if (i < items.length - 1) hoofdCode += ',';
                hoofdCode += '\n';
            });
            hoofdCode += '    ]\n';
        }
    } else {
        const items = newHoofdstukItems[ch] || [];
        hoofdCode += `    ${ch}: [\n`;
        items.forEach((item, i) => {
            hoofdCode += formatItem(item);
            if (i < items.length - 1) hoofdCode += ',';
            hoofdCode += '\n';
        });
        hoofdCode += '    ]';
        hoofdCode += ',\n';
    }
}
hoofdCode += '};\n';

// ── Step 7: Replace in code ──
const newCode = code.substring(0, taakveldBlock.start) 
    + tvCode 
    + '\n'
    + hoofdCode
    + code.substring(hoofdstukBlock.end + 1);

// ── Step 8: Write ──
fs.writeFileSync(appPath, newCode, 'utf8');
console.log('\n✓ app.js updated successfully');

// Print summary
console.log('\n=== SUMMARY ===');
for (let ch = 0; ch <= 7; ch++) {
    const strat = (newHoofdstukItems[ch] || []).length;
    console.log(`Chapter ${ch}: ${strat} strategic items on moedertegel`);
}
console.log('');
allTVKeys.forEach(tv => {
    const count = keepTVs.includes(tv) && existingTVItems[tv] 
        ? existingTVItems[tv].length 
        : (newTaakveldItems[tv] || []).length;
    console.log(`  TV ${tv}: ${count} items`);
});
