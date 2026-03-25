const fs = require('fs');
const path = require('path');
const APP_JS = path.join(__dirname, '..', 'app.js');

let content = fs.readFileSync(APP_JS, 'utf-8');

const marker = 'const BELEIDSNOTA_PER_HOOFDSTUK_BBV = {';
const startIdx = content.indexOf(marker);
if (startIdx < 0) { console.error('Marker not found!'); process.exit(1); }

const chapter8Start = content.indexOf('\n    8: [', startIdx);
if (chapter8Start < 0) { console.error('Chapter 8 not found!'); process.exit(1); }

const newChapters07 = `const BELEIDSNOTA_PER_HOOFDSTUK_BBV = {
    0: [
        { naam: 'Begroting 2026', datum: '2025-11-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/964a41c4-2602-4196-8835-c90bb6564133?agendaItemId=c49a5b6e-0050-4064-8850-39b5d7cc1b78', type: 'Begroting' },
        { naam: 'Kadernota 2026', datum: '2025-07-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/d240e703-1043-49fe-80ca-2da36f006186?agendaItemId=7f9347ff-fc91-49fe-983e-04bb13ba2512', type: 'Kadernota' },
        { naam: 'Voorjaarsnota 2025', datum: '2025-07-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/ce5b3644-d267-4fd7-a1c2-12084df980ed?agendaItemId=f8054240-3405-4e87-8e13-c80bde3af166', type: 'P&C' },
        { naam: 'Najaarsnota 2025', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/b0c65dcd-d44c-4e1a-8fda-9276ca0da9a7?agendaItemId=ed3af2b5-d8fc-4650-930c-46682ebc8401', type: 'P&C' },
        { naam: 'Jaarstukken 2024', datum: '2025-07-08', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/7424ae6a-15b2-4e56-b1bc-12a38e77266d?agendaItemId=82626e1c-2301-4c9f-b7c2-847adc7325aa', type: 'Jaarrekening' },
        { naam: 'Begroting 2025 (geamendeerd)', datum: '2024-11-05', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/4dcff663-4bfe-4863-8847-32553ab2bf6d?agendaItemId=e7d129d0-b72a-48ed-bb1a-51e096615adb', type: 'Begroting' },
        { naam: 'Kadernota 2025', datum: '2024-06-24', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/08674c76-c557-49b1-8c64-e7a3c57f2d6c?agendaItemId=a6b329d3-b33a-4c83-8ca0-a7a9f6f66da6', type: 'Kadernota' },
        { naam: 'Najaarsnota 2024', datum: '2024-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/1f88a1fb-3d63-494d-8871-d2670027ac1a?agendaItemId=bd85b42a-bb0d-4023-9559-af27396ca800', type: 'P&C' },
        { naam: 'Voorjaarsnota 2024', datum: '2024-07-02', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/10404874-6210-4fd0-ade1-88b116a52464?agendaItemId=0dbd0d81-e5f8-401b-91b7-3ab9d97e457d', type: 'P&C' },
        { naam: 'Jaarstukken 2023', datum: '2024-07-02', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/ad8e4d4e-dab1-43f3-bfab-499591e1562b?agendaItemId=09c9fc1a-65a6-4822-b393-93fde00c5d07', type: 'Jaarrekening' },
        { naam: 'Subsidiebeleid en ASV gemeente Wassenaar 2025', datum: '2024-11-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/eb29a294-7f08-44d2-aab8-e917f88a4c3a?agendaItemId=87e9e940-6bcc-48e7-9c58-40f9e8eba921', type: 'Beleidsnota' },
        { naam: 'Actualisatie financi\u00eble verordening 2025', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/f771bed8-2066-4bd2-95c3-06287cc72379?agendaItemId=ee1e7028-db90-4250-bc31-f94f8a4459d5', type: 'Verordening' },
        { naam: 'Controleprotocol incl. normen- en toetsingskader 2025', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/4d82bb56-1f5a-404a-9b78-d3f4d8f4c4a2?agendaItemId=18294431-0fb6-4de6-9fea-729545258d24', type: 'Protocol' },
        { naam: 'Nota reserves en voorzieningen', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/f7633982-4464-480a-9ba7-676611fe5ec0?agendaItemId=732e6baa-be53-4253-a275-14c28c298d59', type: 'Nota' },
        { naam: 'Nota waardering en afschrijving vaste activa', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/29c19054-bead-476e-ac4e-04e7704bbb15?agendaItemId=94a299db-4d50-46a0-b571-8e25b4b47176', type: 'Nota' },
    ],
    1: [
        { naam: 'Integraal Veiligheidsbeleid 2024\u20132027', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/df32a5b8-1b14-4a96-b325-bd3af644cc9f?documentId=d55bb8d1-54e5-473f-8302-33434af5914c&agendaItemId=77e257f7-68bb-42a3-92ae-8a2628d2a666', type: 'Beleidsnota' },
        { naam: 'Beleidsplan aanpak ondermijnende criminaliteit 2025\u20132028', datum: '2024-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/f72b7f00-4963-4817-bf9a-269c85b21ecd?agendaItemId=471de35e-33ab-41a0-9911-6fdcaa82d461', type: 'Beleidsplan' },
        { naam: 'Algemene Plaatselijke Verordening (APV) 2024', datum: '2024-10-15', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/49583aaa-9cee-4104-8ca3-5a012adba2f0?agendaItemId=d63bc6bd-fcdc-4b97-a105-ce320d18c782', type: 'Verordening' },
        { naam: 'Regiovisie Aanpak Huiselijk Geweld Haaglanden 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/c349b273-ff0c-4199-a92e-638f051c7953?agendaItemId=994549eb-e2ff-48d7-abb8-c9acd3d9d4d7', type: 'Regiovisie' },
        { naam: 'Bekrachtiging Noodverordening NAVO-top 2025', datum: '2025-06-03', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/554b128e-d10b-4b2c-bace-e2fd2a405e6b?agendaItemId=6ef51e08-d21a-4a49-974e-cad22b0ab0af', type: 'Verordening' },
    ],
    2: [
        { naam: 'Wegencategoriseringsplan Wassenaar', datum: '2025-12-17', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/3a10e3a7-42a0-4d1d-b2d5-4665bcb18442?agendaItemId=fecb037d-9434-46c1-8d7c-d88b5082b02a', type: 'Beleidsplan', toelichting: 'Raad 17 dec 2025; invoering nieuwe snelheidsregimes o.a. per 27 feb 2026.' },
        { naam: 'Zienswijze concept-ontwerp Mobiliteitsvisie MRDH', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/72097dba-46b1-46ba-8d2f-d9b3d967ac32?agendaItemId=6d3352c2-e61b-4816-b1cf-d5d95f80698b', type: 'Zienswijze' },
        { naam: 'Beheervisie Openbare Ruimte', datum: '2023-09-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/eacc1bd6-189f-47ee-bbb6-412c644c903e?agendaItemId=67f7fcd0-4f59-4473-98a9-b4c38f703d0a', type: 'Beleidsnota' },
    ],
    3: [
        { naam: 'Economische Visie Wassenaar 2025', datum: '2025-09-22', link: 'https://www.wassenaar.nl/economische-visie-wassenaar', type: 'Beleidsnota' },
        { naam: 'Visie voor De Wassenaarse Slag', datum: '2025-03-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=ae1f505f-1c39-4f65-af01-7ef35f1d053a&agendaItemId=6038eaee-e37d-4d6d-a760-a222db95d7a6', type: 'Beleidsnota', toelichting: 'Raad 4 mrt 2025 (geamendeerd).' },
        { naam: 'Zienswijze Visie Economisch Vestigingsklimaat MRDH', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/050aaa0d-3c92-444e-8f8f-31690817632f?agendaItemId=56b75768-2727-41dc-96c2-c2b05c47f7b8', type: 'Zienswijze' },
        { naam: 'Nota Internationals in Wassenaar', datum: '2024-10-15', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/63d57462-b5b2-4b7d-87e7-c39175e246cf?agendaItemId=bc938db7-cafb-45ce-8274-9407c09693c6', type: 'Nota', toelichting: 'Raad 15 okt 2024 (geamendeerd).' },
        { naam: 'Verordening BIZ Maaldrift 2026\u20132030', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/5416554c-41d9-4d46-8ccf-29cdf24ed70c?agendaItemId=84b3c7ff-39de-461d-892e-250f7e17c400', type: 'Verordening' },
    ],
    4: [
        { naam: 'Herijking IHP onderwijs 2024\u20132039', datum: '2025-04-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/e6f1b8eb-5947-4c6f-aacd-ecec379ebf19?agendaItemId=126c9ef7-1bf2-4c4b-b4fc-237d2a77a14a', type: 'Beleidsnota' },
        { naam: 'Lokale Educatieve Agenda (LEA) 2026\u20132037', datum: '2026-01-16', link: 'https://centraalplus.nl/2026/01/17/lokale-educatieve-agenda-van-wassenaar-ondertekend-een-horizon-waarmee-we-aan-de-slag-kunnen/', type: 'Samenwerkingsdocument', toelichting: 'Ondertekend 16 jan 2026 (18 partijen). Link = nieuwsbericht Centraal+.' },
        { naam: 'Verordening leerlingenvervoer 2025', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=eec09f18-31bb-4477-9559-7a73cad358ee&agendaItemId=8d2e9fc6-907b-4a74-abd4-76997db3eb28', type: 'Verordening' },
        { naam: 'Beleidsplan voor- en vroegschoolse educatie 2024\u20132027', datum: '2023-10-24', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/c8c0f21e-dd33-456b-a182-22934d896f06?agendaItemId=c5b55bf1-d57c-4230-80a4-42822bfd36f4', type: 'Beleidsplan' },
        { naam: 'Jaarrekening 2024 Stichting Openbaar Primair Onderwijs', datum: '2025-10-14', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/9b27a575-85e2-4683-8660-5c095a078221?agendaItemId=c91c7ca5-469e-43ec-ac05-51dc2bd28ba5', type: 'Jaarrekening' },
    ],
    5: [
        { naam: 'Sportvisie Wassenaar 2025', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/agenda/document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=6db01b2d-15c8-4801-a2e2-521606bb81c4&agendaItemId=fea9db3b-6a30-47e4-8337-629eaeca711b', type: 'Beleidsnota' },
        { naam: 'Erfgoedverordening Wassenaar (technische aanpassing)', datum: '2023-12-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/8fd0aab1-1373-4620-8893-b0c19136eaed?agendaItemId=ad73767c-b5a2-4c1d-ae8d-9b5c12993e5b', type: 'Verordening' },
        { naam: 'Visie voor De Wassenaarse Slag', datum: '2025-03-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/bf450551-9740-45fb-9e48-36978432ec61?documentId=ae1f505f-1c39-4f65-af01-7ef35f1d053a&agendaItemId=6038eaee-e37d-4d6d-a760-a222db95d7a6', type: 'Beleidsnota', toelichting: 'Strand en recreatie \u2014 ook onder BBV 3.' },
    ],
    6: [
        { naam: 'Beleidsplan Sociaal Domein Wassenaar', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/3f581f85-72e6-4a72-8160-022faeec7fbd?agendaItemId=84887548-5c4b-4211-a5fd-1bd690ee2fe5', type: 'Beleidsplan', toelichting: 'Raad 4 jun 2024 (geamendeerd).' },
        { naam: 'Beleidsnota Ouderenbeleid 2025', datum: '2025-01-28', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/85393b37-a676-4ffb-a9f2-33b6f0d9b58b?documentId=79a101d9-552b-49cc-9d34-31f6923cc1a9&agendaItemId=6ac84012-a995-46de-b19f-d58cb5aa952a', type: 'Beleidsnota' },
        { naam: 'Beleidsnota schuldhulpverlening 2025\u20132028', datum: '2025-04-01', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/271db830-fe76-477f-ac64-1d68e329da63?documentId=8992182e-7fc7-4bdf-9874-f3ca5df4a8b1&agendaItemId=f537e129-28d2-4cea-8f4c-128ca0037086', type: 'Beleidsnota' },
        { naam: 'Startnotitie Lokale Woonzorgvisie', datum: '2025-09-22', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/1aa85158-78d3-4914-a5b9-ee0d1bf4fc31?documentId=847d0caa-b04b-493e-9d14-d72c9d85b640&agendaItemId=a71419b7-25db-4a02-800f-99707a0dd53b', type: 'Startnotitie' },
        { naam: 'Verordening Jeugdhulp 2025', datum: '2025-11-25', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/041d458f-7873-4b2a-9db1-88a41773cf24?agendaItemId=fa3bbe2f-569c-4bf4-b213-a5893d4c89d8', type: 'Verordening' },
        { naam: 'Nieuw inkoopkader jeugdhulp GR SbJH', datum: '2025-06-03', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/d4914c7b-9e25-4b06-be74-d1b345a9aa48?agendaItemId=95316a18-f7b8-483a-a252-3d491f042373', type: 'Kader' },
        { naam: 'Achtste wijziging Verordening Wmo', datum: '2024-03-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/5757b8bf-5b63-47cc-a65d-cda4fed90a7a?agendaItemId=b3b6af7b-1019-47db-b91d-662d185ff049', type: 'Verordening' },
        { naam: 'Re-integratie- en participatieverordening 2023', datum: '2023-12-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/9637b51a-17ae-4509-b272-3a32bcd9009c?agendaItemId=0df627bf-b311-47ad-85a9-dcfd8085792c', type: 'Verordening', toelichting: 'Raad 19 dec 2023 (geamendeerd).' },
        { naam: 'Beleidsplan re-integratie en participatie', datum: '2023-09-19', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/6b69e949-b9d7-4138-85b6-0b428d282738?agendaItemId=851d5e9e-f1fa-41b9-94dc-229cc6bc48a6', type: 'Beleidsplan' },
        { naam: 'Verordening Adviesraad Sociaal Domein 2025', datum: '2025-06-03', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/9543cef6-fcdf-4e83-b61d-4c23d4b82945?agendaItemId=36195d79-8757-4165-9b23-bcb9944b5d19', type: 'Verordening' },
        { naam: 'Regiovisie Aanpak Huiselijk Geweld 2026', datum: '2025-12-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/c349b273-ff0c-4199-a92e-638f051c7953?agendaItemId=994549eb-e2ff-48d7-abb8-c9acd3d9d4d7', type: 'Regiovisie', toelichting: 'Ook relevant voor BBV 1.' },
    ],
    7: [
        { naam: 'Afvalstoffenverordening Wassenaar 2024', datum: '2024-03-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/800fc254-3771-44fd-8f0b-7ff404fefe78?agendaItemId=be7acf0a-cac9-4d53-8982-083973ca88a8', type: 'Verordening' },
        { naam: 'Nota bodembeheer 2023', datum: '2024-06-04', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/22221fe9-4cb2-407d-8a18-f61036d8bd84?agendaItemId=e88332bc-f459-4f74-9ca4-08f6dd490a6e', type: 'Nota' },
        { naam: 'Integraal Waterketenplan 2024\u20132028 (Leidse regio)', datum: '2024-03-26', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/fa0ec318-96ec-452f-b614-22ee6e393c73?agendaItemId=8ada5b45-3a51-4648-8e25-bd092cbe6c5c', type: 'Beleidsnota' },
        { naam: 'Beleidsregels Milieuzonering Richtafstanden 2024', datum: '2024-09-16', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Document/LoadAgendaItemDocument/bfa224c5-fa50-4bb5-a8d6-5fa7824fe588?agendaItemId=eb7a24cf-8c2b-411b-a7d9-ba80d8293dc6', type: 'Beleidsregels' },
        { naam: 'Verkenning reductie restafval', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Reports/Document/13e0eeae-ce9a-454d-8530-b43864972f79?documentId=3d92ea1b-1a04-4bf3-9bb2-07c976603c43', type: 'Notitie' },
        { naam: 'Motie reductie restafval en kostenbesparing afvalstoffenheffing', link: 'https://wassenaar.bestuurlijkeinformatie.nl/Agenda/Document/3e13ce7b-2972-4a14-9e63-5f8a03b8dde6?documentId=76cff862-0962-4859-85f7-a911708e963f&agendaItemId=a6645f92-6dff-4ca2-80b5-b396b0864d70', type: 'Motie' },
    ],`;

const newContent = content.slice(0, startIdx) + newChapters07 + content.slice(chapter8Start);
fs.writeFileSync(APP_JS, newContent, 'utf-8');

console.log('Done! Replaced chapters 0-7 in BELEIDSNOTA_PER_HOOFDSTUK_BBV');
console.log('  BBV 0: 15 items (was 0)');
console.log('  BBV 1: 5 items (was 1)');
console.log('  BBV 2: 3 items (was 1)');
console.log('  BBV 3: 5 items (was 2)');
console.log('  BBV 4: 5 items (was 2)');
console.log('  BBV 5: 3 items (was 1)');
console.log('  BBV 6: 11 items (was 3)');
console.log('  BBV 7: 6 items (was 2)');
console.log('  BBV 8: unchanged (~30 items)');
console.log('  TOTAAL: 83 items (was ~12)');
