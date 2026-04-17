/* BBV hoofdstukken + taakvelden (Iv3) — gedeelde bron voor bbv-3d.html en bbv-lijst.html */
(function (global) {
  'use strict';
  global.BBV_HOOFDSTUKKEN_DATA = [
  { code: 0, naam: 'Bestuur en ondersteuning', kort: 'Bestuur',
    color: 0x1e3a5f, hex: '#1e3a5f',
    ondertitel: 'Gemeentebestuur, burgerzaken, financiën, belastingen en overhead',
    intro: `Dit is het eerste hoofdstuk van de BBV-structuur (Iv3): het draaipunt waar democratisch bestuur, financiële sturing en ondersteunende bedrijfsvoering samenkomen. College van burgemeester en wethouders, gemeenteraad, raadscommissies en griffie vormen het zichtbare bestuur; rekenkamer, ombudsfunctie en accountantscontrole geven toetsing en verantwoording richting burgers en toezichthouders.

Hier vallen ook de klassieke burgerzaken: basisregistratie personen, reisdocumenten, verkiezingen en referenda. Gemeentelijk vastgoed dat niet aan een specifiek beleidsveld is toe te wijzen — zoals het gemeentehuis of overige panden — hoort onder 0.3, terwijl onderwijs- en woningbouw elders in de BBV thuishoren.

Financieel vormt dit hoofdstuk de ruggengraat: treasury en liquiditeiten, uitkeringen uit het gemeentefonds, en de boekhoudkundige afsluiting (baten en lasten, reserves). De meeste lokale belastingen worden in Wassenaar uitgevoerd via BSGR (Belastingsamenwerking Gouwe-Rijnland); in de BeleidsBibliotheek zijn de Iv3-codes 0.61 t/m 0.64 en 0.9 daarom als één cluster weergegeven — raadsbesluiten over belastingverordeningen zijn vrijwel altijd één samenhangend pakket.

De P&C-cyclus (kadernota, begroting, voor- en najaarsnota, jaarrekening, financiële verordening, controleprotocol, bestuursrapportages) raakt meerdere taakvelden in dit hoofdstuk; Overhead (0.4) volgt de notitie Overhead 2023 van de BBV-commissie Iv3.`,
    pos: [0, 2.6, 0],
    taakvelden: [
      {
        code: '0.1', naam: 'Bestuur',
        omschrijving: 'Kosten bestuursorganen en facilitering: college van B&W, raad en raadscommissies, griffie, bestuurlijke samenwerking (regionaal, landelijk, internationaal), lokale rekenkamer, ombudsfunctie, accountantscontrole, leges bestuur- en commissieverslagen.',
        niet: 'Ambtelijke ondersteuning en beleidsadvisering B&W → 0.4 Overhead. Gemeentesecretaris → 0.4. Bijdrage aan verbonden partij → taakveld van de uitgevoerde taak.',
      },
      {
        code: '0.2', naam: 'Burgerzaken',
        omschrijving: 'Bevolkingsregister en burgerlijke stand; rijbewijzen, paspoorten en reisdocumenten; straatnaamgeving en kadastrale informatie; burgerschap; Verklaringen Omtrent het Gedrag (VOG); verkiezingen en referenda; leges burgerzaken en kadastrale gegevens.',
        niet: '',
      },
      {
        code: '0.3', naam: 'Beheer overige gebouwen en gronden',
        omschrijving: 'Beheer, verhuur en instandhouding van gebouwen, gronden en landerijen die de gemeente (al of niet tijdelijk) in bezit heeft en niet in exploitatie neemt, en niet aan een specifiek beleidsveld zijn toe te delen.',
        niet: 'Onderwijshuisvesting → 4.2. Woningbouw → 8.3. Grondexploitatie → 8.2 of 3.2.',
      },
      {
        code: '0.4', naam: 'Overhead',
        omschrijving: 'Alle kosten van sturing en ondersteuning van medewerkers in het primaire proces: leidinggevenden (met personele verantwoordelijkheid), financiën/P&C/auditing, P&O/HRM/formatieadvies, inkoop/aanbesteding/contractmanagement, interne en externe communicatie (excl. klantcommunicatie specifieke taakvelden), juridische zaken (bedrijfsvoering), bestuurszaken (ambtelijke ondersteuning B&W), ICT/PIOFACH-systemen/kantoorautomatisering, facilitaire zaken/huisvesting/beveiliging, DIV, managementondersteuning/secretariaten, leges gemeentearchief. Volgt notitie Overhead 2023 commissie BBV.',
        niet: 'Griffie → 0.1. Historische archieven → 5.4. Klantcommunicatie specifieke taakvelden → primair taakveld. Projectleiders/coördinatoren (zonder personele verantwoordelijkheid) → primair taakveld. Afhandeling bezwaar-/beroepsschriften → primair taakveld. Sectorcontrollers/zwembaddirecteur → primair taakveld. ICT voor primaire processen → primair taakveld. Bijdrage verbonden partij → taakveld van de taak.',
      },
      {
        code: '0.5', naam: 'Treasury',
        omschrijving: 'Treasuryfunctie: financiering, beleggingen, dividenden (incl. dividend nutsbedrijven), schenkingen en legaten. Alle reële rente (categorie 5.1) wordt hier geboekt en via categorie 7.4 toegerekend aan taakvelden.',
        niet: '',
      },
      {
        code: '0.6 – 0.9', naam: 'Belastingen',
        omschrijving: 'Clustering van alle lokale belastingen: 0.61 OZB woningen (eigendomsbelasting, WOZ-waardering), 0.62 OZB niet-woningen (eigendom en gebruik), 0.63 Parkeerbelasting (heffing, leges parkeervergunning, boetes/wielklem), 0.64 Belastingen overig (hondenbelasting, precario, leges, retributie, baat-, reclame-, roerende zaakbelasting), 0.9 Vennootschapsbelasting (VpB over fiscale winst ondernemingsactiviteiten). Allen: heffing, invordering, bezwaar en beroep. Uitvoering door BSGR (Belastingsamenwerking Gouwe-Rijnland).',
        niet: 'Toeristenbelasting en forensenbelasting → 3.4. Kwijtscheldingen belastingen → 6.3. Rioolheffing → 7.2. Afvalstoffenheffing → 7.3. Begraafplaatsrechten → 7.5. Marktgeld → 3.3. Liggeld → 2.3. Ondernemersheffing (BIZ) → 3.3. Parkeerpolitie → 1.2.',
        toelichting: 'Deze tegel is een clustering van de Iv3-taakvelden 0.61 (OZB woningen), 0.62 (OZB niet-woningen), 0.63 (Parkeerbelasting), 0.64 (Belastingen overig) en 0.9 (Vennootschapsbelasting). Rationale: gemeentelijke besluiten over belastingen worden vrijwel altijd als pakket vastgesteld (jaarlijkse belastingverordeningen). De individuele Iv3-codes blijven traceerbaar in de omschrijving. Gerelateerde heffingen in andere hoofdstukken: toeristenbelasting (3.4), rioolheffing (7.2), afvalstoffenheffing (7.3), kwijtschelding (6.3), begraafplaatsrechten (7.5), marktgeld/ondernemersheffing (3.3), liggeld (2.3).',
      },
      {
        code: '0.7', naam: 'Algemene uitkering en overige uitkeringen gemeentefonds',
        omschrijving: 'Uitkeringen uit het gemeentefonds: algemene uitkering, integratie-uitkeringen, decentralisatie-uitkeringen, artikel 12-uitkering.',
        niet: 'Specifieke uitkeringen → op het taakveld waarop de uitkering betrekking heeft.',
      },
      {
        code: '0.8 – 0.10 – 0.11', naam: 'Fin. beheer',
        omschrijving: 'Clustering van boekhoudkundige taakvelden: 0.8 Overige baten en lasten (stelposten, taakstellende bezuinigingen, begrotingsruimte, niet voorziene uitgaven, loonkosten bovenformatief personeel), 0.10 Mutaties reserves (toevoegingen/onttrekkingen aan reserves, uitsluitend categorie 7.1, resultaatsbestemming is balansboeking), 0.11 Resultaat van de rekening van baten en lasten (saldo alle taakvelden incl. reservemutaties).',
        niet: 'Mutaties voorzieningen → op het taakveld waarop de voorziening is getroffen.',
        toelichting: 'Deze tegel is een clustering van de Iv3-taakvelden 0.8 (Overige baten en lasten), 0.10 (Mutaties reserves) en 0.11 (Resultaat van de rekening van baten en lasten). Rationale: dit zijn boekhoudkundige taakvelden waar zelden een individueel beleidsbesluit aan raakt — ze komen aan de orde in de P&C-cyclus (begroting, jaarrekening, voor-/najaarsnota). De individuele Iv3-codes blijven traceerbaar in de omschrijving.',
      },
    ]
  },
  { code: 1, naam: 'Veiligheid', kort: 'Veiligheid',
    color: 0xb71c1c, hex: '#b71c1c',
    ondertitel: 'Openbare orde, brandweer en crisisbeheersing',
    intro: `Dit hoofdstuk vat fysieke en bestuurlijke veiligheid samen: brandbestrijding en rampenbestrijding enerzijds, openbare orde, handhaving en preventie anderzijds — met de gemeente als lokale regisseur.

In de regio werkt Wassenaar via de Veiligheidsregio Haaglanden (VRH) samen met partners aan crisisbeheersing, brandweer en geneeskundige hulp (GHOR). Lokaal bepaalt de gemeente prioriteiten: APV, Bibob, horeca- en evenementenvergunningen, integraal veiligheidsbeleid, en soms acute bestuurlijke besluiten (zoals noodverordeningen bij grote events).

De BBV splitst dit in twee taakvelden: 1.1 voor crisisbeheersing en brandweer, 1.2 voor de brede taak openbare orde en veiligheid — met Iv3-grenzen naar verkeer (2.1), grondexploitatie (8.2) en parkeerheffing (0.63) versus parkeerbeleid (2.2).`,
    pos: [-1.8, 1.2, 1.8],
    taakvelden: [
      {
        code: '1.1', naam: 'Crisisbeheersing en brandweer',
        omschrijving: 'Alle reguliere brandweertaken en rampenbestrijding: brandbestrijding, preventieve maatregelen fysieke veiligheid, rampenbestrijding, leges vergunning brandveilig gebruik (niet-omgevingsvergunning).',
        niet: 'Opruiming explosieven bij grondexploitatie → 8.2. Rijksbijdrage explosieven via gemeentefonds → 0.7.',
      },
      {
        code: '1.2', naam: 'Openbare orde en veiligheid',
        omschrijving: 'Alle gemeentelijke taken openbare orde en veiligheid: toezicht/handhaving, BOA\'s, stadswachten, Wet Bibob, bestuurlijke aanpak georganiseerde criminaliteit, bureau Halt, preventie criminaliteit, APV, leges (aanwezigheidsvergunning, Drank & Horeca, evenementen, vuurwapenwet), beleid/toezicht/ruiming explosieven, veilige woon-/leefomgeving, gevonden voorwerpen, strandvonderij, ontruimde inboedels, antidiscriminatiebeleid, doodsschouw, dierenbescherming, radicalisering.',
        niet: 'Verkeersveiligheid → 2.1. Explosieven bij grondexploitatie → 8.2.',
      },
    ]
  },
  { code: 2, naam: 'Verkeer, vervoer en waterstaat', kort: 'Verkeer',
    color: 0x00695c, hex: '#00695c',
    ondertitel: 'Wegen, verkeer, parkeren en openbaar vervoer',
    intro: `Hier ligt wat inwoners merken aan “ruimte om te bewegen”: wegennet, verkeersveiligheid, fiets- en voetpaden, parkeervoorzieningen, havens en openbaar vervoer. De gemeente is vaak beheerder én vergunningverlener.

Voor Wassenaar speelt dit samen met ambities rond duurzame mobiliteit, kwaliteit openbare ruimte en afstemming met waterschappen en OV-partners in de regio. In Iv3 horen parkeerbeleid (2.2) en parkeerbelasting als opbrengst (0.63) bewust bij verschillende taakvelden.

Het onderscheid tussen recreatieve havens (2.3), economische waterwegen (2.4) en niet-doorgaande sloten in het groen (5.7) helpt besluiten en begroting consequent te houden.`,
    pos: [1.8, 1.2, 1.8],
    taakvelden: [
      {
        code: '2.1', naam: 'Verkeer en vervoer',
        omschrijving: 'Verkeer te land en droge infrastructuur: verkeersmaatregelen (borden, regelinstallaties, bewegwijzering, straatmeubilair, abri\'s, carillons), verkeersveiligheid (circulatieplannen, onderzoek, voorlichting), aanleg/reconstructie/onderhoud wegen/fietspaden/voetpaden/pleinen, inkomensoverdrachten waterschappen, civieltechnische kunstwerken (bruggen, duikers, tunnels, spoorwegovergangen), openbare verlichting, laadpalen, gladheidbestrijding, straatreiniging (zwerfvuil), reguleren openbare ruimte (omgevingsvergunningen inritten, kabels), leges (wegenverkeerswet, kabels/leidingen, telecom).',
        niet: 'Wegen in grondexploitatie → 8.2 of 3.2. Busstations → 2.5. Parkeervoorzieningen → 2.2. Toeristische fiets-/wandelpaden → 5.7. Aanleg CAI/breedband/glasvezel → 3.1.',
      },
      {
        code: '2.2', naam: 'Parkeren',
        omschrijving: 'Ontwikkeling en beheer parkeervoorzieningen: parkeerbeleid (zones, ontheffingen, vergunningen), inrichting/onderhoud open en gesloten parkeervoorzieningen, parkeermeters, fietsenstalling, algemene gehandicaptenparkeervoorzieningen.',
        niet: 'Parkeerbelasting (opbrengst) → 0.63. Parkeerpolitie/BOA\'s → 1.2. Parkeerhavens als onderdeel van wegen → 2.1. Persoonlijke gehandicaptenparkeerplaats (beschikking) → 6.60.',
      },
      {
        code: '2.3', naam: 'Recreatieve havens',
        omschrijving: 'Havens recreatieve scheepvaart: jachthaven, passantenhaven, brug-/sluisgelden pleziervaart, haven-/liggelden pleziervaart, scheepvaartrechten pleziervaart, wal-/kadegelden pleziervaart.',
        niet: 'Ligplaatsgelden woonschepen → 8.3. Onderhoud ligplaatsen in doorgaande waterwegen → 2.4.',
      },
      {
        code: '2.4', naam: 'Economische havens en waterwegen',
        omschrijving: 'Taken beroepsscheepvaart en infrastructuur: zee-/binnenhavens, doorgaande waterwegen (bebakening, baggeren, ijsbestrijding, oevers, walkanten), waterkering/afwatering/landaanwinning, exploitatiebijdragen, ligplaatsen bedrijfsvaartuigen, brug-/sluisgelden beroepsvaart.',
        niet: 'Vijvers/sloten/waterpartijen → 5.7. Straten havengebied → 2.1. Havenloodsen/pakhuizen → 3.2. Veerponten → 2.5. Waterkwaliteit → 7.2. Jachthavens → 2.3. Onderwijs schipperskinderen → 4.2/4.3. Maatschappelijk werk binnenschippers → 6.1.',
      },
      {
        code: '2.5', naam: 'Openbaar vervoer',
        omschrijving: 'Openbaar vervoer en infrastructuur: bus, tram, metro, taxivervoer, veerdiensten/subsidies overzetveren, OV-voorzieningen/-informatievoorziening, busstations, metrostations, multimodale knooppunten, OV-experimenten, veergelden.',
        niet: 'Bus-/tramhaltes (straatmeubilair) → 2.1. Collectief vervoer voor personen die ondersteuning behoeven → 6.60.',
      },
    ]
  },
  { code: 3, naam: 'Economie', kort: 'Economie',
    color: 0x6a1b9a, hex: '#6a1b9a',
    ondertitel: 'Economische ontwikkeling, promotie en bedrijventerreinen',
    intro: `Economie in BBV-termen is ruimer dan alleen het bedrijvenloket: vestigingsklimaat, fysieke bedrijfsmilieus, promotie en toerisme, en regionale samenwerking horen bij elkaar — maar Iv3 splitst ze voor traceerbare begroting.

Wassenaar positioneert zich met o.a. economische visie en samenwerking in de regio (MRDH) en toeristische samenwerking (zoals Stichting Wassenaar-Voorschoten). Subsidies, BIZ, markten en bedrijventerreinen vallen in verschillende taakvelden zodat raadsstukken niet “versnipperd” lijken maar wel herleidbaar blijven.

Let op de Iv3-afbakening: glasvezel aanleg versus beleid, dividend nutsbedrijven (0.5), en volksfeesten (3.4) versus wijk-/sportrecreatie (5.7).`,
    pos: [-1.8, 1.2, -1.8],
    taakvelden: [
      {
        code: '3.1', naam: 'Economische ontwikkeling',
        omschrijving: 'Algemeen beleid versterking economische bedrijvigheid: clusterontwikkeling/versterking sectoren, samenwerkingsprojecten onderzoeksinstellingen en bedrijven, lokale/regionale/internationale samenwerkingsverbanden, samenwerking bedrijfsleven en kennisinstellingen, stedelijke/wijkgerichte economische programma\'s, aanleg CAI/breedband/glasvezel.',
        niet: 'Ondersteuning/stimulering individuele bedrijven → 3.3. Acquisitie/accountmanagement → 3.3. Praktische uitvoering programma\'s → 3.2 of 3.4. Vergunningen/leges CAI/glasvezel → 2.1.',
      },
      {
        code: '3.2', naam: 'Fysieke bedrijfsinfrastructuur',
        omschrijving: 'Fysieke condities bedrijvigheid: grondexploitatie bedrijventerreinen, ontwikkeling/onderhoud bedrijfslocaties/(her)ontwikkeling bedrijfspanden, herstructurering/verduurzaming bedrijfslocaties, investeringen winkelgebieden/-strips, werkzaamheden land-/tuinbouwgronden.',
        niet: 'Grondexploitatie niet-bedrijventerreinen → 8.2.',
      },
      {
        code: '3.3', naam: 'Bedrijvenloket en bedrijfsregelingen',
        omschrijving: 'Op bedrijven en ondernemers gerichte dienstverlening: bedrijvenloket/ondernemersloket, stimuleren startende ondernemers, aantrekken/faciliteren nieuwe bedrijven, financiële steunregelingen (incl. land-/tuinbouw/veeteelt/visserij), straathandel/markten/veemarkten, BIZ-bijdrage, marktgelden/staanplaatsgelden, leges (standplaats-, winkelsluitingswet, ventvergunningen), kosten/opbrengsten nutsbedrijven.',
        niet: 'Netwerken/samenwerkingsverbanden → 3.1. Acquisitie/promotionele activiteiten → 3.4. Dividend nutsbedrijven → 0.5 Treasury.',
      },
      {
        code: '3.4', naam: 'Economische promotie',
        omschrijving: 'Gemeente "op de kaart zetten": promotionele activiteiten (aantrekken bedrijvigheid/werkers), aantrekken instellingen, bovenlokale/landelijke/internationale relatienetwerken, promotie toerisme, beurzen/jaarmarkten/volksfeesten (Koningsdag, carnaval, kermis), toeristenbelasting, forensenbelasting, kermisgelden, vermakelijkhedenretributies.',
        niet: 'Lokale wijkactiviteiten/recreatieve voorzieningen → 5.7. Accountmanagement vestiging → 3.3. Kampeerterreinen/recreatieve voorzieningen → 5.7. Toeristische fietspaden/dierentuinen → 5.7.',
      },
    ]
  },
  { code: 4, naam: 'Onderwijs', kort: 'Onderwijs',
    color: 0xe65100, hex: '#e65100',
    ondertitel: 'Basisonderwijs, huisvesting en leerlingenbeleid',
    intro: `De gemeente speelt een centrale rol in het onderwijs: van het beschikbaar stellen van schoolgebouwen en het besturen van openbaar onderwijs, tot het handhaven van de leerplicht en het voorkomen van voortijdig schoolverlaten. In Wassenaar zijn diverse basis- en middelbare scholen, en werkt de gemeente samen met omliggende gemeenten in de regio om onderwijs en jeugdhulp op elkaar af te stemmen. De Lokale Educatieve Agenda (LEA) 2026–2037 vormt het strategisch kader. Het Integraal Huisvestingsplan (IHP) stuurt de grote investeringen in schoolgebouwen aan.

In deze BBV-weergave volgen de drie taakvelden de Iv3-indeling: openbaar basisonderwijs (4.1), huisvesting (4.2) en beleid/leerlingzaken (4.3) — met scherpe “niet”-afbakening naar kinderopvang (6.1) en schoolgyms bij de school (4.2).`,
    pos: [1.8, 1.2, -1.8],
    taakvelden: [
      { code: '4.1', naam: 'Openbaar basisonderwijs',
        omschrijving: 'Gemeentelijke taken openbaar basisonderwijs: bestuurskosten (als gemeente zelf bestuur is), primair openbaar basisonderwijs, bewegingsonderwijs (incl. schoolzwemmen), huur gymnastieklokaal, passend onderwijs.',
        niet: 'Onderwijshuisvesting → 4.2. Uitgaven bijzonder onderwijs → 4.3.' },
      { code: '4.2', naam: 'Onderwijshuisvesting',
        omschrijving: 'Onderwijshuisvesting openbaar en bijzonder onderwijs: nieuwbouw, aanpassing/uitbreiding schoolgebouwen, verhuur gymnastieklokaal, programma onderwijshuisvesting (IHP), vandalismebestrijding.',
        niet: 'Aanpassing/buitenonderhoud schoolgebouwen → schoolbesturen zelf.' },
      { code: '4.3', naam: 'Onderwijsbeleid en leerlingzaken',
        omschrijving: 'Lokaal onderwijsbeleid en leerlingzaken: onderwijsondersteuning, bestuurskosten openbaar middelbaar onderwijs, bijzonder onderwijs (excl. huisvesting), achterstandenbeleid, passend onderwijs (coördinatie), volwasseneducatie, peuteropvang, leerlingzorg, leerlingenvervoer, leerplicht, voorkomen voortijdig schoolverlaten.',
        niet: 'Kinderopvang (toezicht kwaliteit) → 6.1. Facilitering openbaar basisonderwijs → 4.1.' },
    ]
  },
  { code: 5, naam: 'Sport, cultuur en recreatie', kort: 'Sport & Cultuur',
    color: 0x2e7d32, hex: '#2e7d32',
    ondertitel: 'Sport, cultuur, erfgoed en recreatie',
    intro: `Sport, cultuur en recreatie vormen samen het hoofdstuk waar inwoners ontmoeten, bewegen en cultuur beleven — van zwembad en voetbalveld tot museum, erfgoed en het groen in de straat.

Wassenaar combineert ambities rond sport (sportakkoord, accommodaties), cultuurhuis en erfgoed, met het beheer van parken, natuur en speelplekken. Iv3 trekt scherpe lijnen: jaarmarkten en volksfeesten vallen onder 3.4, musea en historische archieven onder 5.4, reguliere archiefdienst bedrijfsvoering onder 0.4.

De zeven taakvelden volgen de officiële Iv3-namen — inclusief “Cultuurpresentatie, cultuurproductie en cultuurparticipatie” (5.3) — zodat documenten uit de BeleidsBibliotheek 1-op-1 te mappen blijven.`,
    pos: [-1.8, -1.2, 1.8],
    taakvelden: [
      {
        code: '5.1', naam: 'Sportbeleid en activering',
        omschrijving: 'Niet-fysieke maatregelen sport: stimuleren topsport en recreatieve sportbeoefening, ondersteunen sportorganisaties, sport in de buurt, combinatiefuncties. Brede SPUK: lokaal sportakkoord, leefomgeving.',
        niet: 'Sportvelden/-accommodaties → 5.2. Schoolsportdagen → 4.3.',
      },
      {
        code: '5.2', naam: 'Sportaccommodaties',
        omschrijving: 'Alle accommodaties sportbeoefening: sporthallen, zwembaden, schaatshallen, (groene/kunst-)velden, terreinen, opstallen, faciliteiten, technische voorzieningen, trapveldjes in de wijk.',
        niet: 'Gymlokalen/-velden bij schoolexploitatie → 4.2.',
      },
      {
        code: '5.3', naam: 'Cultuurpresentatie, cultuurproductie en cultuurparticipatie',
        omschrijving: 'Beeldende kunst, muziek, dans en toneel: podia, gezelschappen, accommodaties beeldende kunst, subsidies kunstenaars/projecten, kunstaankopen (incl. openbare ruimte), film/video, kunstzinnige vorming/cultuureducatie, culturele manifestaties/herdenkingen, overkoepelende kunstorganen.',
        niet: 'Jaarmarkten/volksfeesten → 3.4. Musea/oudheidkamers → 5.4. Onderhoud kunstwerken openbare ruimte → 5.7. Historische gebouwen/objecten → 5.5.',
      },
      {
        code: '5.4', naam: 'Musea',
        omschrijving: 'Verwerven, behouden, wetenschappelijk onderzoeken en presenteren van kunst en cultuur: musea, exposities, archeologie, heemkunde, historische archieven.',
        niet: 'Archieven reguliere werkzaamheden → 0.4. Historische gebouwen/beschermde stads-/dorpsgezichten → 5.5.',
      },
      {
        code: '5.5', naam: 'Cultureel erfgoed',
        omschrijving: 'Conserveren en toegankelijk maken cultureel erfgoed: historische gebouwen, beschermde stads-/dorpsgezichten, objecten met historische waarde, subsidie/beheer/onderhoud/toezicht/handhaving erfgoed, digitaal zichtbaar maken cultuurhistorische waarden.',
        niet: '',
      },
      {
        code: '5.6', naam: 'Media',
        omschrijving: 'Fysieke en elektronische cultuurdragers: bibliotheken, artotheek, videotheek, lokale pers, lokale omroep, lokale informatievoorziening (bijv. ICT), overkoepelende organen.',
        niet: '',
      },
      {
        code: '5.7', naam: 'Openbaar groen en (openlucht) recreatie',
        omschrijving: 'Openbaar groen, natuur en recreatie: natuur-/landschapsbescherming, onderhoud bos/natuurgebieden, aanleg/onderhoud openbaar groen/parken/graslanden/gemeentetuin, kunstwerken openbare ruimte (onderhoud), niet-doorgaande waterwegen (vijvers/sloten/waterpartijen, taluds, betuining), speelvoorzieningen (speeltuinen/-plaatsen/-werktuigen), hertenkampen, kinderboerderijen, sportvliegvelden, visvijvers, kampeerterreinen, watertappunten, dierentuinen, plantentuinen, volkstuinen, recreatiestranden, toeristische fiets-/wandelpaden, boomplantdagen.',
        niet: 'Doorgaande grote watergangen (vaarten, kanalen) → 2.4.',
      },
    ]
  },
  { code: 6, naam: 'Sociaal domein', kort: 'Sociaal',
    color: 0xad1457, hex: '#ad1457',
    ondertitel: 'Wmo, jeugdhulp, participatie en schuldhulpverlening',
    intro: `Het sociaal domein bundelt participatie, armoede- en schuldhulp, Wmo, jeugdhulp en steeds meer preventieve ketens via lokale teams en samenwerking met huisarts en GGZ.

In Wassenaar spelen regionale uitvoering (bijv. jeugdhulp Haaglanden) en landelijke kaders (Jeugdwet, Wmo, Participatiewet) een grote rol. De BeleidsBibliotheek gebruikt dezelfde clusters als de verrijkte Iv3-tegels: eerste lijn (6.2), werk & inkomen (6.3–6.5), Wmo (6.60–6.91) en jeugd (6.7–6.9) — zodat raadsstukken niet gefragmenteerd voorkomen maar wel herleidbaar blijven.

Let op de “niet”-afbakening naar volksgezondheid (7.1), onderwijs (4.3) en overhead (0.4) — die staat per taakveld.`,
    pos: [1.8, -1.2, 1.8],
    taakvelden: [
      {
        code: '6.1', naam: 'Samenkracht en burgerparticipatie',
        omschrijving: 'Sociale basis: ondersteuning burgerinitiatieven/vrijwilligers/mantelzorg; sociaal/cultureel werk, AMW, wijkopbouw, jongerenwerk, schoolmaatschappelijk werk, straathoekwerk; preventie (eenzaamheid, GGZ, risicojongeren, vroegsignalering); buurt-/clubhuizen; collectief aanvullend vervoer (als algemene voorziening); toegankelijkheid (inclusie); kinderopvang (toezicht/handhaving kwaliteit, SMI-toeslag); Wet Inburgering; noodopvang vluchtelingen; vreemdelingenbeleid; lhbtqia+-beleid; leges kinderopvang. Brede SPUK: gezondheidsachterstanden, sociale basis, mantelzorg, eenzaamheid, welzijn op recept.',
        niet: 'Peuteropvang → 4.3. Inburgering oudkomers → 6.5. Kansrijke start → 7.1. Taken lokaal team (toegang/eerstelijns) → 6.21–6.23.',
      },
      {
        code: '6.2', naam: 'Toegang eerste lijns',
        omschrijving: 'Cluster Iv3 6.21–6.23: Toegang- en eerstelijnsvoorzieningen Wmo, Jeugd en Integraal. Vrij toegankelijke hulp en doorverwijzing naar maatwerkvoorzieningen via lokale teams, gemeentelijke loketten of CJG. Voorlichting, advisering, cliëntondersteuning, zorgcoördinatie, inloopfunctie GGZ, ondersteuning gedupeerde ouders toeslagenaffaire, vroegsignalering, aanpak Veilig Thuis/huiselijk geweld/kindermishandeling, POH-GGZ jeugd, verwijsindex risicojongeren, preventief justitieel kader (iJw-code 49).',
        niet: 'Basistakenpakket JGZ → 7.1. Beleidsmedewerkers/contractmanagers Wmo → 6.91, Jeugd → 6.92. Niet-vrij-toegankelijke maatwerkdienstverlening na doorverwijzing → 6.711–6.714 of 6.751–6.763.',
      },
      {
        code: '6.3 – 6.5', naam: 'Werk en inkomen',
        omschrijving: 'Cluster: 6.3 Inkomensregelingen (Participatiewet, loonkostensubsidies, IOAW, IOAZ, Bbz, schuldhulpverlening, armoedebeleid, bijzondere bijstand, kwijtschelding belastingen/heffingen), 6.4 WSW en beschut werk (beschut werken, bestaande Wsw-dienstbetrekkingen, arbeidsmatige dagbesteding), 6.5 Arbeidsparticipatie (re-integratie-instrumenten, Work First, proefplaatsing, scholing, EVC, stimuleringsmaatregelen, loonwaardebepaling, jobcoach, werkplekaanpassingen, Bbz startende ondernemers).',
        niet: '6.3: kwijtschelding staat hier, de belastingen zelf op 0.61–0.64/7.2/7.3. 6.4: dagbesteding Wmo → 6.713, dagbesteding beschermd wonen → 6.811. WSW-budget (integratie-uitkering) → 0.7. 6.5: volwasseneneducatie → 4.3, permanente loonkostensubsidie arbeidsbeperkten (inkomensdeel) → 6.3.',
      },
      {
        code: '6.60 – 6.91', naam: 'WMO',
        omschrijving: 'Cluster Wmo-maatwerkvoorzieningen: 6.60 Hulpmiddelen en diensten (rolstoel, vervoersdiensten/-voorzieningen, woonvoorzieningen, woningaanpassingen, gehandicaptenparkeerbeleid, overige hulpmiddelen), 6.711 Huishoudelijke hulp (incl. abonnementstarief eigen bijdragen), 6.712 Begeleiding/persoonlijke verzorging/kortdurend verblijf, 6.713 Dagbesteding, 6.714 Overige maatwerkarrangementen (incl. ggz intramuraal), 6.791 PGB Wmo, 6.811 Beschermd wonen (incl. Beschermd Thuis), 6.812 Maatschappelijke-/vrouwenopvang (incl. Wet verplichte GGZ, Wet zorg en dwang), 6.91 Coördinatie en beleid Wmo (beleidsmedewerker, contractmanager, backoffice/beschikkingen).',
        niet: 'Toegang/eerstelijn → 6.21–6.23. Arbeidsmatige dagbesteding → 6.4. Dagbesteding beschermd wonen → 6.811. Dagbesteding opvang → 6.812. Inloopfunctie GGZ → 6.21/6.23. PGB Wmo → 6.791. Indirecte (overhead)kosten → 0.4.',
      },
      {
        code: '6.7 – 6.9', naam: 'Jeugd',
        omschrijving: 'Cluster Jeugdhulp: 6.751–6.753 Jeugdhulp ambulant (lokaal/regionaal/landelijk — iJw-codes 32/40/41/42/45/46/50/51/52/53/54), 6.761–6.763 Jeugdhulp met verblijf (lokaal/regionaal/landelijk — iJw-codes 37/38/43/44/50/55), 6.792 PGB Jeugd, 6.821 Jeugdbescherming (OTS, voogdij, Landelijk Expertiseteam — iJw-code 48), 6.822 Jeugdreclassering (iJw-code 47), 6.92 Coördinatie en beleid Jeugd (beleidsmedewerker, contractmanager, backoffice, RET\'s, BEN\'s, Jeugdbeschermingstafel, frictiekosten afbouw residentieel).',
        niet: 'Vrij toegankelijke hulp lokaal team → 6.22/6.23. Basistakenpakket JGZ → 7.1. PGB Wmo → 6.791. Jeugdhulp tijdens beschermingsmaatregel → 6.751–6.763. Preventief justitieel kader door GI → 6.22/6.23. Indirecte (overhead)kosten → 0.4.',
      },
    ]
  },
  { code: 7, naam: 'Volksgezondheid en milieu', kort: 'Gezondheid',
    color: 0x33691e, hex: '#33691e',
    ondertitel: 'GGD, riolering, afval en milieubeheer',
    intro: `Leefkwaliteit in “fysiek milieu”: van GGD en volksgezondheid tot riolering, afvalketen, milieubeleid en lijkbezorging. Dit zijn vaak uitvoeringsintensieve taken met regionale partners en heffingen/leges.

Wassenaar werkt voor onderdelen met o.a. GGD en Veilig Thuis Haaglanden (gemeenschappelijke regelingen), Avalex (afval), en omgevingsdiensten. Riool- en afvalheffing hebben eigen taakvelden; kwijtschelding hoort bij 6.3.

Brede SPUK-thema’s (kansrijke start, mentale gezondheid, enz.) raken soms 7.1 en soms 6.x — de Iv3-“niet”-regels helpen documenten te routeren.`,
    pos: [-1.8, -1.2, -1.8],
    taakvelden: [
      {
        code: '7.1', naam: 'Volksgezondheid',
        omschrijving: 'Bescherming volksgezondheid: monitoren gezondheidssituatie, preventieprogramma\'s, vroegtijdig signaleren stoornissen/gezondheidsbedreigende factoren, gezondheidsbevordering, bestrijding infectieziekten/vaccinaties, voorlichting/advies/begeleiding, prenatale voorlichting, bewaken gezondheidsaspecten bestuurlijke beslissingen, medisch milieukundige zorg, technische hygiëne, psychosociale hulp bij rampen, basistakenpakket JGZ (art. 5 Wpg), ambulance/ziekenvervoer. Brede SPUK: Kansrijke Start, Mentale Gezondheid, Overgewicht/obesitas, Valpreventie, Versterking GGD-kennisfunctie, Coördinatiekosten regionale aanpak preventie.',
        niet: 'Ondersteuning JGZ-uitvoerder na signalering (risico)situatie → 6.22/6.23.',
      },
      {
        code: '7.2', naam: 'Riolering',
        omschrijving: 'Afvalwater en waterhuishouding: opvang/verwerking afval-/hemelwater, inzameling/transport huishoudelijk-/bedrijfsafvalwater, voorkomen grondwaterproblemen, rioolwaterzuivering, bestrijding verontreiniging oppervlaktewater, rioolheffing (woningen en niet-woningen), leges rioolaansluiting, kosten heffing/invordering rioolheffing.',
        niet: 'Kwijtschelding rioolheffing → 6.3.',
      },
      {
        code: '7.3', naam: 'Afval',
        omschrijving: 'Inzameling en verwerking bedrijfs- en huishoudelijk afval: afvalscheiding/recycling, vuilophaal/-afvoer, vuilstort/-verwerking, afvalstoffenheffing, reinigingsrechten, diftar, kosten heffing/invordering afvalstoffenheffing en reinigingsrechten.',
        niet: 'Zwerfvuil/veegdiensten → 2.1. Kwijtschelding afvalstoffenheffing/reinigingsrechten → 6.3.',
      },
      {
        code: '7.4', naam: 'Milieubeheer',
        omschrijving: 'Gemeentelijke milieubescherming: bodembescherming/-sanering, luchtkwaliteit, geluidhinder, straling, verplaatsing milieuhinderlijke bedrijven, ongediertebestrijding (o.a. eikenprocessierups), RUD/Regionale Uitvoeringsdiensten, leges (omgevingsvergunning milieubelastende activiteit, bestrijding ongedierte, ontheffing route gevaarlijke stoffen, stookontheffing).',
        niet: 'Waterkwaliteit → 7.2. Milieueducatie → 4.3. Afvalscheiding → 7.3. Verduurzaming primair gerelateerd aan ander taakveld → dat taakveld (zonnepanelen zwembad → 5.2, subsidie woningverduurzaming → 8.3, driedubbel glas stadhuis → 0.4).',
      },
      {
        code: '7.5', naam: 'Begraafplaatsen en crematoria',
        omschrijving: 'Lijkbezorging: begraafplaatsen, crematoria, lijkschouw (vaststelling overlijden), begraaf(plaats)rechten/grafrechten, afkoopsommen grafrechten/grafonderhoud.',
        niet: 'Registratie overlijden → 0.2.',
      },
    ]
  },
  { code: 8, naam: 'Volkshuisvesting, leefomgeving en stedelijke vernieuwing', kort: 'Wonen',
    color: 0x283593, hex: '#283593',
    ondertitel: 'Woningbouw, ruimtelijke ordening en stedelijke vernieuwing',
    intro: `Ruimtelijke ordening, grondexploitatie voor wonen en de volkshuisvestingstaak zitten hier logisch achter elkaar: van visie en omgevingsplan tot bouwrijp maken, woningbouw en dagelijkse vergunningen.

Ontwikkelingsvraagstukken (zoals herontwikkeling scholen, woningbouwlocaties en grondposities) belanden typisch op 8.2 of 8.3, terwijl bedrijventerreinen bij 3.2 horen. Leges voor omgevingsvergunning en huisvestingswet vallen hier; specifieke milieueffecten van vergunningen naar 7.4 waar passend.

De BBV-ordening helpt P&C en dossier-overzicht: beleid blijft traceerbaar per fase van ruimte → grond → woning.`,
    pos: [1.8, -1.2, -1.8],
    taakvelden: [
      {
        code: '8.1', naam: 'Ruimte en leefomgeving',
        omschrijving: 'Ruimtelijke ordening en leefomgeving: structuurplannen/-visies, bestemmingsplannen, omgevingsvisie, gebiedsgerichte programma\'s, omgevingsplan, Digitaal Stelsel Omgevingswet, leges omgevingsvergunning buitenplanse omgevingsplanactiviteit, leges aanpassen bestemmingsplannen, leges leegstandsvergunning, faciliterend (passief) grondbeleid (kostenverhaal op private ontwikkelaars), BRO, BGT.',
        niet: 'Veiligheid leefomgeving → 1.2. Thematische programma\'s → op taakveld (actieplan geluid → 7.4, verkeerscirculatieplan → 2.1). Actief grondbeleid niet-bedrijventerreinen → 8.2. Actief grondbeleid bedrijventerreinen → 3.2.',
      },
      {
        code: '8.2', naam: 'Grondexploitatie (niet-bedrijventerreinen)',
        omschrijving: 'Gemeentelijke bouwgrondexploitatie (actief grondbeleid): voorbereidingskosten, grondverwerving, bouw-/woonrijp maken (kostensoortenlijst), toerekening bovenwijkse voorzieningen, financiering/rentetoerekening/administratie, verkoop bouwrijpe gronden, erfpacht, winst-/verliesneming, onschadelijk maken/verwijderen explosieven.',
        niet: 'Grondexploitatie bedrijventerreinen → 3.2. Explosieven buiten grondexploitatie → 1.2.',
      },
      {
        code: '8.3', naam: 'Wonen en bouwen',
        omschrijving: 'Gebiedsontwikkeling, woningvoorraad en huisvesting: leges omgevingsvergunning (bouw, rijksmonumenten, aanleg, welstand, brandveiligheid gebouwen, kap, ligplaatsen woonschepen, monumenten, opslag/gebruik openbare weg, reclame, sloop, staanplaatsen woonwagens, uitweg), leges huisvestingswet, bouwtoezicht, BAG, woningbouw/-verbetering/-renovatie, woonruimteverdeling, woningsplitsingsvergunning, woonvergunning, stedelijke vernieuwing, subsidie verduurzaming eigen woning, uitkoopregeling hoogspanning.',
        niet: 'Woningverbetering Wmo (bijv. woningaanpassing voor beperkingen) → 6.60.',
      },
    ]
  },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
