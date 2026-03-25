#!/usr/bin/env node
/**
 * Verify all beleidsnota links in app.js and beleidsnotas.js
 * Checks that each URL returns a valid response (200 OK) and
 * reports any broken or suspicious links.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const APP_JS = path.join(__dirname, '..', 'app.js');

function extractBeleidsnota(content) {
    const results = [];

    // Extract BELEIDSNOTA_PER_HOOFDSTUK_BBV
    const hoofdMatch = content.match(/const BELEIDSNOTA_PER_HOOFDSTUK_BBV\s*=\s*\{/);
    if (hoofdMatch) {
        const start = hoofdMatch.index + hoofdMatch[0].length - 1;
        let depth = 0, end = start;
        for (let i = start; i < content.length; i++) {
            if (content[i] === '{') depth++;
            if (content[i] === '}') depth--;
            if (depth === 0) { end = i + 1; break; }
        }
        const obj = eval('(' + content.slice(start, end) + ')');
        Object.entries(obj).forEach(([key, items]) => {
            items.forEach(item => {
                results.push({ source: `HOOFD[${key}]`, naam: item.naam, link: item.link, datum: item.datum });
            });
        });
    }

    // Extract BELEIDSNOTA_PER_TAAKVELD
    const tvMatch = content.match(/const BELEIDSNOTA_PER_TAAKVELD\s*=\s*\{/);
    if (tvMatch) {
        const start = tvMatch.index + tvMatch[0].length - 1;
        let depth = 0, end = start;
        for (let i = start; i < content.length; i++) {
            if (content[i] === '{') depth++;
            if (content[i] === '}') depth--;
            if (depth === 0) { end = i + 1; break; }
        }
        const obj = eval('(' + content.slice(start, end) + ')');
        Object.entries(obj).forEach(([key, items]) => {
            items.forEach(item => {
                results.push({ source: `TAAKVELD[${key}]`, naam: item.naam, link: item.link, datum: item.datum });
            });
        });
    }

    return results;
}

function checkUrl(url) {
    return new Promise((resolve) => {
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, { timeout: 10000 }, (res) => {
            resolve({ status: res.statusCode, headers: res.headers });
            res.resume();
        });
        req.on('error', (err) => resolve({ status: 0, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    });
}

async function main() {
    const content = fs.readFileSync(APP_JS, 'utf-8');
    const items = extractBeleidsnota(content);

    console.log(`Found ${items.length} beleidsnota entries`);
    console.log('');

    let ok = 0, broken = 0, noLink = 0;

    for (const item of items) {
        const prefix = `[${item.source}] ${(item.naam || '').slice(0, 55)}`;

        if (!item.link) {
            noLink++;
            console.log(`  ⬜ ${prefix} — no link (intentional)`);
            continue;
        }

        try {
            const result = await checkUrl(item.link);
            if (result.status >= 200 && result.status < 400) {
                ok++;
                console.log(`  ✅ ${prefix} — ${result.status}`);
            } else {
                broken++;
                console.log(`  ❌ ${prefix} — ${result.status} ${result.error || ''}`);
                console.log(`     Link: ${item.link}`);
            }
        } catch (e) {
            broken++;
            console.log(`  ❌ ${prefix} — ERROR: ${e.message}`);
        }

        // Rate limit: 500ms between requests
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('');
    console.log('=== SUMMARY ===');
    console.log(`  OK:      ${ok}`);
    console.log(`  Broken:  ${broken}`);
    console.log(`  No link: ${noLink}`);
    console.log(`  Total:   ${items.length}`);
}

main().catch(console.error);
