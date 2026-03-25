#!/usr/bin/env node
const fs = require('fs');

const DATA_JS = __dirname + '/../data.js';
const BACKUP = __dirname + '/../data.js.bak';

let content = fs.readFileSync(DATA_JS, 'utf-8');
const header = content.split('\n').slice(0, 2).join('\n');
content = content.replace(/if\s*\(typeof\s+module[\s\S]*$/, '');
content = content.replace(/^const /gm, 'globalThis.');
eval(content);
const data = globalThis.ALL_DECISIONS_DATA;

console.log(`Geladen: ${data.length} items`);

const PROCEDUREEL = new Set([
    'schorsing','hamerstukken','sluiting','opening','rondvraag',
    'mededelingen','einde vergadering','1 schorsing','11 rondvraag'
]);

const FRAGMENT_EXACT = new Set([
    'besluit:','raad','raad:','lta','directieteam','communicatie',
    'stand van zaken','raad: voorbereiding','(ter kennisname)',
    '2. burgemeester:','planning zomerreces','begroting inleiding',
    'bestuur en middelen','"'
]);

function classifyItem(d) {
    if (d.bron_systeem !== 'iBabs') return null;
    const n = d.naam.trim();
    const nl = n.toLowerCase();
    const b = (d.besluit || '').trim();

    if (PROCEDUREEL.has(nl)) return 'procedureel';

    if (nl.includes('uitnodigingenlijst') || nl.includes('afwezigheidsoverzicht'))
        return 'huishoudelijk';
    if (nl.startsWith('besluitenlijst')) return 'huishoudelijk';
    if (nl === 'ingekomen stukken' || nl.startsWith('ingekomen stukken'))
        return 'huishoudelijk';

    if (FRAGMENT_EXACT.has(nl)) return 'fragment';

    if (nl === 'regionale samenwerking' &&
        b.toLowerCase().includes('kennis van de annotaties'))
        return 'regio-kennisname';

    if (n.length < 20) {
        if (n.match(/;$/) || n.match(/^\(.*\)$/) || n === '"')
            return 'fragment';
        if (['vast te stellen.','vast te stellen;','in te trekken.',
             'april.','en 2024.','en 2025','en Jeugdwet',
             '500 naar 2024.','000 voor 2026.','en 3-5-2022)',
             'en 199a','en daarmee','tot 1 april 2028',
             '(bijlage 2);','december 2025','januari 2022',
             '00 uur.','30 uur.'].includes(n))
            return 'fragment';
    }

    return null;
}

const stats = { procedureel: 0, huishoudelijk: 0, fragment: 0, 'regio-kennisname': 0, duplicaat: 0, repaired: 0 };
const removeIdx = new Set();
const repairLog = [];

data.forEach((d, i) => {
    const cat = classifyItem(d);
    if (!cat) return;

    if (cat === 'fragment') {
        const b = (d.besluit || '').trim();
        if (b.length > 30 && b !== d.naam.trim() && !b.match(/^(vast te stellen[.;]?|in te trekken\.)$/i)) {
            const newNaam = b.replace(/\n/g, ' ').substring(0, 150).replace(/\s+$/, '');
            repairLog.push({ idx: i, oldNaam: d.naam, newNaam, besluit: b.substring(0, 200) });
            d.naam = newNaam;
            stats.repaired++;
            return;
        }
    }

    removeIdx.add(i);
    stats[cat] = (stats[cat] || 0) + 1;
});

const seen = {};
data.forEach((d, i) => {
    if (removeIdx.has(i)) return;
    const key = d.naam + '|' + d.datum;
    if (seen[key] !== undefined) {
        removeIdx.add(i);
        stats.duplicaat++;
    }
    seen[key] = i;
});

const cleaned = data.filter((_, i) => !removeIdx.has(i));

console.log(`\n=== OPSCHONING ===`);
console.log(`Verwijderd:`);
console.log(`  Procedureel (Schorsing, Hamerstukken, etc.): ${stats.procedureel}`);
console.log(`  Huishoudelijk (Besluitenlijst, Uitnodigingen): ${stats.huishoudelijk}`);
console.log(`  Fragmenten (onherstelbaar): ${stats.fragment}`);
console.log(`  Regionale samenwerking (kennisname-only): ${stats['regio-kennisname']}`);
console.log(`  Duplicaten (naam+datum): ${stats.duplicaat}`);
console.log(`  TOTAAL VERWIJDERD: ${removeIdx.size}`);
console.log(`\nGerepareerd (naam hersteld uit besluit-tekst): ${stats.repaired}`);
console.log(`\nResultaat: ${data.length} → ${cleaned.length} items`);

if (repairLog.length) {
    console.log(`\n=== REPARATIES ===`);
    repairLog.forEach(r => {
        console.log(`  "${r.oldNaam}" → "${r.newNaam}"`);
    });
}

fs.copyFileSync(DATA_JS, BACKUP);
console.log(`\nBackup: ${BACKUP}`);

const rawContent = fs.readFileSync(BACKUP, 'utf-8');
const themaMatch = rawContent.match(/const THEMA_BOOM_DATA\s*=\s*\[[\s\S]*?\n\];/);
const exportMatch = rawContent.match(/\/\/ Export[\s\S]*$/);

const out = header + '\n\nconst ALL_DECISIONS_DATA = ' +
    JSON.stringify(cleaned, null, 2) + ';\n' +
    (themaMatch ? '\n' + themaMatch[0] + '\n' : '') +
    (exportMatch ? '\n' + exportMatch[0] : '');
fs.writeFileSync(DATA_JS, out, 'utf-8');
console.log(`Geschreven: ${DATA_JS} (${cleaned.length} items)`);
if (themaMatch) console.log('THEMA_BOOM_DATA behouden.');
if (exportMatch) console.log('module.exports behouden.');
