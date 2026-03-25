#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_JS = path.join(__dirname, '..', 'data.js');

const MANUAL_FIXES = {
  'Regiovisie Aanpak Huiselijk Geweld Haaglanden voor de periode 2026': {
    date: '2025-12-16',
    documentId: 'c349b273-ff0c-4199-a92e-638f051c7953',
    agendaItemId: '994549eb-e2ff-48d7-abb8-c9acd3d9d4d7',
  },
  'Zienswijze ontwerpbegroting 2026 Omgevingsdienst Haaglanden': {
    date: '2025-07-08',
    documentId: '62fce322-a3c8-4bbb-a814-58bb222fb5e6',
    agendaItemId: '49e2db46-f254-43fc-a249-fca43f3ee87f',
  },
  'Zienswijze ontwerpbegroting 2026-2029 Veiligheidsregio Haaglanden': {
    date: '2025-07-08',
    documentId: 'a5eabc13-9e6c-499e-949c-8579ab727448',
    agendaItemId: '710a9825-3db3-4b2f-9960-246737760f5a',
  },
  'Zienswijze ontwerpbegroting 2026 GR GGD Veilig Thuis Haaglanden': {
    date: '2025-07-08',
    documentId: 'aa13784c-edc4-47f2-b213-2cc830e14e3e',
    agendaItemId: '89e8aec0-0e8c-4ce4-b1a9-1bd0f3c82844',
  },
  'Zienswijze ontwerpbegroting 2026 GR SbJH': {
    date: '2025-07-08',
    documentId: 'ddb024e5-ec02-45b7-a096-836734688b1d',
    agendaItemId: '82626e1c-2301-4c9f-b7c2-847adc7325aa',
  },
  'Zienswijze ontwerpbegroting 2026 Belastingsamenwerking Gouwe-Rijnland': {
    date: '2025-07-08',
    documentId: '1391a826-125e-442a-ae5d-b37bc58a396e',
    agendaItemId: 'e0998122-076a-4878-8f19-e8fcbcce2ae9',
  },
  'Zienswijze op de ontwerpbeleidsnota reserves, voorzieningen en fondsen': {
    date: '2025-07-08',
    documentId: '3e1f0e4d-0d89-4e15-9666-32079c6196f8',
    agendaItemId: 'caff6731-d4cb-4a0c-8409-115c72a618e1',
  },
  'Zienswijze ontwerpbegroting 2026 Regionaal Reinigingsbedrijf Avalex': {
    date: '2025-07-08',
    documentId: 'a2457667-b255-4fd6-b041-6facfa3c433b',
    agendaItemId: 'f3dacf57-d8a2-43e8-91a8-0fcf0c69d96e',
  },
  'Kadernota': {
    date: '2025-07-01',
    documentId: 'd240e703-1043-49fe-80ca-2da36f006186',
    agendaItemId: '7f9347ff-fc91-49fe-983e-04bb13ba2512',
  },
  'Toestemming vaststelling Gemeenschappelijke Regeling Veiligheidsregio Haaglanden 2025': {
    date: '2025-03-04',
    documentId: 'f4436d68-a5e2-4274-99d9-db996f70b408',
    agendaItemId: 'eee928f8-6974-4636-a3b1-bd4706f4a441',
  },
  'Visie De Wassenaarse Slag': {
    date: '2025-03-04',
    documentId: 'dd8137f8-18b8-4beb-9c2c-2da7f42a6bd1',
    agendaItemId: '6038eaee-e37d-4d6d-a760-a222db95d7a6',
  },
  'Beleidsnota Ouderenbeleid 2025': {
    date: '2025-01-28',
    documentId: '79a101d9-552b-49cc-9d34-31f6923cc1a9',
    agendaItemId: '6ac84012-a995-46de-b19f-d58cb5aa952a',
  },
};

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

let fixed = 0;
data.forEach((d) => {
  if (d.link !== null) return;
  if (d.bron !== 'raad') return;

  for (const [name, fix] of Object.entries(MANUAL_FIXES)) {
    if (d.datum === fix.date && d.naam && d.naam.startsWith(name.slice(0, 20))) {
      d.link = `https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/${fix.documentId}?agendaItemId=${fix.agendaItemId}`;
      console.log(`  FIXED [${d.datum}] ${d.naam.slice(0, 65)}`);
      fixed++;
      break;
    }
  }
});

const newContent = header +
  'const ALL_DECISIONS_DATA = ' + JSON.stringify(data, null, 2) + ';' +
  afterArr;
fs.writeFileSync(DATA_JS, newContent, 'utf-8');

const remaining = data.filter(d => !d.link && d.bron === 'raad');
console.log(`\nFixed: ${fixed} links`);
console.log(`Remaining null-link raad items: ${remaining.length}`);
remaining.forEach(d => console.log(`  [${d.datum}] ${(d.naam||'').slice(0, 65)}`));
