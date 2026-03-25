#!/usr/bin/env node
/**
 * Recover correct links for nulled data.js items by parsing
 * the fetched iBabs meeting pages.
 */

const fs = require('fs');
const path = require('path');

const DATA_JS = path.join(__dirname, '..', 'data.js');
const TOOLS_DIR = '/Users/dickbraam/.cursor/projects/Users-dickbraam-Library-CloudStorage-OneDrive-Persoonlijk-2-DICK-WERK-2026-beleidsbibliotheek/agent-tools';

const MEETING_PAGES = {
    '2025-12-17': 'f3d24db6-03a7-4153-935d-2e0fc09e0a4f.txt',
    '2025-12-16': 'a11a81db-09a2-4e68-9cd7-a71d5ff59ad8.txt',
    '2025-11-25': '4aa8e539-9528-473b-849d-5452f75357ff.txt',
    '2025-11-04': 'f3b57456-e0c1-4b34-a2f8-86d4855dd71a.txt',
    '2025-10-14': 'e3805c8f-c45a-4cd7-8a8e-ac6c86454da6.txt',
    '2025-09-22': '2f619415-e3a9-466f-8546-6928e34a778a.txt',
    '2025-09-23': '2f619415-e3a9-466f-8546-6928e34a778a.txt',
    '2025-07-08': '34eeb5c8-b503-4f32-9263-dd2732261865.txt',
    '2025-07-01': null,  // Jul 1 page content already inline
    '2025-06-03': '15cc0258-da0f-4c44-a5f4-89df4b3461dc.txt',
    '2025-04-01': '4fd5971f-5d82-48a2-843a-fdd70c397049.txt',
    '2025-03-04': '69b9bb1d-99ed-4477-9a91-e400bfef8de6.txt',
    '2025-01-28': null,  // Jan 28 page content already inline
};

const MEETING_GUIDS = {
    '2025-12-17': '4df79561-b943-43a1-a21d-da484727f1ad',
    '2025-12-16': 'a68138b4-d094-4124-8798-4b0d774c009b',
    '2025-11-25': '3e13ce7b-2972-4a14-9e63-5f8a03b8dde6',
    '2025-11-04': '1f7d2571-e7fb-4ddf-a989-ecfb5a3f92e8',
    '2025-10-14': '8f51ef1d-1b7a-4f0c-8343-4bf2f203930d',
    '2025-09-22': '1aa85158-78d3-4914-a5b9-ee0d1bf4fc31',
    '2025-09-23': '1aa85158-78d3-4914-a5b9-ee0d1bf4fc31',
    '2025-07-08': '756adab0-f3ef-4298-87db-32c3a693e4b3',
    '2025-07-01': 'b6c34c5e-766b-405a-acd6-6eba0262a671',
    '2025-06-03': '37e4fd08-333d-4616-9304-e15b9444f657',
    '2025-04-01': '271db830-fe76-477f-ac64-1d68e329da63',
    '2025-03-04': 'bf450551-9740-45fb-9e48-36978432ec61',
    '2025-01-28': '85393b37-a676-4ffb-a9f2-33b6f0d9b58b',
};

function extractDocLinks(pageContent) {
    const links = [];
    // Match Agenda/Document viewer URLs with their link text
    const re = /\[([^\]]+)\]\(https:\/\/wassenaar\.bestuurlijkeinformatie\.nl\/Agenda\/Document\/([a-f0-9-]+)\?documentId=([a-f0-9-]+)&(?:amp;)?agendaItemId=([a-f0-9-]+)\)/gi;
    let m;
    while ((m = re.exec(pageContent)) !== null) {
        links.push({
            text: m[1].trim(),
            meetingGuid: m[2],
            documentId: m[3],
            agendaItemId: m[4],
        });
    }
    return links;
}

function normalize(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findBestMatch(itemName, docLinks) {
    const normName = normalize(itemName);
    
    // Try exact substring match first
    for (const doc of docLinks) {
        const normDoc = normalize(doc.text);
        if (normDoc.includes(normName) || normName.includes(normDoc)) {
            return doc;
        }
    }
    
    // Try fuzzy match: find docs that share significant words
    const nameWords = normName.match(/.{4,}/g) || [];
    let bestDoc = null;
    let bestScore = 0;
    
    for (const doc of docLinks) {
        const normDoc = normalize(doc.text);
        let score = 0;
        for (const w of nameWords) {
            if (normDoc.includes(w)) score++;
        }
        // Also check if doc text contains the raadsbesluit/raadsvoorstel variant
        if (normDoc.includes('raadsbesluit') && normName.includes('raadsbesluit')) score += 2;
        if (normDoc.includes('raadsvoorstel') && normName.includes('raadsvoorstel')) score += 2;
        if (score > bestScore) {
            bestScore = score;
            bestDoc = doc;
        }
    }
    
    if (bestScore >= 2) return bestDoc;
    return null;
}

function main() {
    // Parse data.js
    const content = fs.readFileSync(DATA_JS, 'utf-8');
    const arrMatch = content.match(/const ALL_DECISIONS_DATA\s*=\s*/);
    const arrStart = content.indexOf('[', arrMatch.index);
    let depth = 0, arrEnd = arrStart;
    for (let i = arrStart; i < content.length; i++) {
        if (content[i] === '[') depth++;
        if (content[i] === ']') depth--;
        if (depth === 0) { arrEnd = i + 1; break; }
    }
    const data = JSON.parse(content.slice(arrStart, arrEnd));
    const afterArr = content.slice(arrEnd);
    const header = content.slice(0, arrMatch.index);

    // Load meeting pages and extract doc links
    const allDocLinks = {};
    for (const [date, file] of Object.entries(MEETING_PAGES)) {
        if (!file) {
            console.log(`  ${date}: skipped (no file, handle manually)`);
            continue;
        }
        const fpath = path.join(TOOLS_DIR, file);
        if (!fs.existsSync(fpath)) {
            console.log(`  File not found: ${fpath}`);
            continue;
        }
        const pageContent = fs.readFileSync(fpath, 'utf-8');
        allDocLinks[date] = extractDocLinks(pageContent);
        console.log(`  ${date}: ${allDocLinks[date].length} document links found`);
    }

    // Find items that had buggy links (now null) and try to recover
    let recovered = 0;
    let notFound = 0;
    
    data.forEach((d, i) => {
        if (d.link !== null) return;
        if (d.bron !== 'raad') return;
        
        const date = d.datum;
        const docLinks = allDocLinks[date];
        if (!docLinks) return;
        
        const match = findBestMatch(d.naam, docLinks);
        if (match) {
            const meetingGuid = MEETING_GUIDS[date];
            d.link = `https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/${match.documentId}?agendaItemId=${match.agendaItemId}`;
            recovered++;
            console.log(`  RECOVERED [${date}] ${d.naam.slice(0, 55)}`);
            console.log(`    → ${match.text.slice(0, 60)}`);
        }
    });
    
    // Rebuild data.js
    const newContent = header +
        'const ALL_DECISIONS_DATA = ' + JSON.stringify(data, null, 2) + ';' +
        afterArr;
    fs.writeFileSync(DATA_JS, newContent, 'utf-8');
    
    console.log(`\nRecovered: ${recovered} links`);
    
    // Show remaining null-link raad items from dates we have pages for
    const coveredDates = new Set(Object.keys(MEETING_PAGES));
    const stillMissing = data.filter(d => !d.link && d.bron === 'raad' && coveredDates.has(d.datum));
    if (stillMissing.length) {
        console.log(`\nStill missing (from covered meetings):`);
        stillMissing.forEach(d => console.log(`  [${d.datum}] ${d.naam.slice(0, 60)}`));
    }
}

main();
