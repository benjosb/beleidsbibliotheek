#!/usr/bin/env node
/**
 * Fix buggy shared links in data.js
 *
 * Problem: 34 items share one identical LoadAgendaItemDocument link
 *          (documentId 90987d08...), plus 12 duplicate pairs share links
 *          across different years/items.
 *
 * Fix: null out the wrong links so users are not misdirected.
 *      For duplicate pairs, keep the link on the NEWER item (higher date)
 *      and null the older one (which likely has an outdated link).
 */

const fs = require('fs');
const path = require('path');

const DATA_JS = path.join(__dirname, '..', 'data.js');

const content = fs.readFileSync(DATA_JS, 'utf-8');

// Parse ALL_DECISIONS_DATA
const arrMatch = content.match(/const ALL_DECISIONS_DATA\s*=\s*/);
const arrStart = content.indexOf('[', arrMatch.index);
let depth = 0, arrEnd = arrStart;
for (let i = arrStart; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') depth--;
    if (depth === 0) { arrEnd = i + 1; break; }
}
const data = JSON.parse(content.slice(arrStart, arrEnd));

// Preserve everything after ALL_DECISIONS_DATA
const afterArr = content.slice(arrEnd);
const headerEnd = arrMatch.index;
const header = content.slice(0, headerEnd);

const BUGGY_GUID = '90987d08';
let nulledBuggy = 0;
let nulledDupes = 0;

// 1. Null out the 34 items sharing the buggy link
data.forEach(d => {
    if (d.link && d.link.includes(BUGGY_GUID)) {
        d.link = null;
        nulledBuggy++;
    }
});

// 2. Find duplicate links and null the older one
const linkIndex = {};
data.forEach((d, i) => {
    if (d.link) {
        if (!linkIndex[d.link]) linkIndex[d.link] = [];
        linkIndex[d.link].push(i);
    }
});

Object.entries(linkIndex).forEach(([link, indices]) => {
    if (indices.length <= 1) return;
    // Sort by date descending, keep the first (newest), null the rest
    const sorted = indices.sort((a, b) => {
        const da = data[a].datum || '';
        const db = data[b].datum || '';
        return db.localeCompare(da);
    });
    for (let k = 1; k < sorted.length; k++) {
        data[sorted[k]].link = null;
        nulledDupes++;
    }
});

// Rebuild data.js
const newContent = header +
    'const ALL_DECISIONS_DATA = ' + JSON.stringify(data, null, 2) + ';' +
    afterArr;

fs.writeFileSync(DATA_JS, newContent, 'utf-8');

console.log(`Fixed data.js:`);
console.log(`  Nulled ${nulledBuggy} items with buggy shared link (${BUGGY_GUID})`);
console.log(`  Nulled ${nulledDupes} items with duplicate links (kept newest)`);
console.log(`  Total items: ${data.length}`);

// Verify: count items with links
const withLink = data.filter(d => d.link).length;
const withoutLink = data.filter(d => !d.link).length;
console.log(`  With link: ${withLink}, without link: ${withoutLink}`);
