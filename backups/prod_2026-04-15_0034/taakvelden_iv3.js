// Iv3-taakvelden — verrijkt met beschrijvingen, niet-afbakening en trefwoorden-index
// Bron: Iv3-Informatievoorschrift 2025 v1.1, Ministerie van BZK / CBS (11 juli 2024)
// Aangevuld met Wassenaar-specifieke trefwoorden voor automatische mapping besluiten → taakveld
//
// Structuur per taakveld:
//   code          – Iv3-code (bijv. '0.1')
//   naam          – officiële naam
//   omschrijving  – wat er onder valt (samengevat uit het informatievoorschrift)
//   niet          – wat er NIET onder valt, en waar het wél hoort (afbakening)
//   keywords      – trefwoorden-index voor automatische mapping van besluiten/documenten

const BBV_TAAKVELDEN_IV3 = {
    0: [
        { code: '0.1', naam: 'Bestuur',
          omschrijving: 'Kosten bestuursorganen en facilitering: college van B&W, raad en raadscommissies, griffie, bestuurlijke samenwerking (regionaal, landelijk, internationaal), lokale rekenkamer, ombudsfunctie, accountantscontrole, leges bestuur- en commissieverslagen.',
          niet: 'Ambtelijke ondersteuning en beleidsadvisering B&W → 0.4 Overhead. Gemeentesecretaris → 0.4. Bijdrage aan verbonden partij → taakveld van de uitgevoerde taak.',
          keywords: ['college','raad','raadscommissie','griffie','burgemeester','wethouder','rekenkamer','ombudsfunctie','accountantscontrole','bestuurlijke samenwerking','democratie','raadsbesluit','raadsvergadering','commissievergadering','coalitie','coalitieakkoord','portefeuilleverdeling','locoschap','raadsinformatiebrief','bestuur']
        },
        { code: '0.2', naam: 'Burgerzaken',
          omschrijving: 'Bevolkingsregister en burgerlijke stand; rijbewijzen, paspoorten en reisdocumenten; straatnaamgeving en kadastrale informatie; burgerschap; Verklaringen Omtrent het Gedrag (VOG); verkiezingen en referenda; leges burgerzaken en kadastrale gegevens.',
          niet: '',
          keywords: ['burgerzaken','burgerlijke stand','bevolkingsregister','brp','rijbewijs','paspoort','reisdocument','vog','verkiezing','referendum','straatnaamgeving','kadastraal','leges burgerzaken','identiteitskaart','naturalisatie']
        },
        { code: '0.3', naam: 'Beheer overige gebouwen en gronden',
          omschrijving: 'Beheer, verhuur en instandhouding van gebouwen, gronden en landerijen die de gemeente (al of niet tijdelijk) in bezit heeft en niet in exploitatie neemt, en niet aan een specifiek beleidsveld zijn toe te delen.',
          niet: 'Onderwijshuisvesting → 4.2. Woningbouw → 8.3. Grondexploitatie → 8.2 of 3.2.',
          keywords: ['gemeentelijk vastgoed','gebouwenbeheer','gronden','landerijen','verhuur','panden','onroerend goed','de paauw','gemeentehuis']
        },
        { code: '0.4', naam: 'Overhead',
          omschrijving: 'Alle kosten van sturing en ondersteuning van medewerkers in het primaire proces: leidinggevenden (met personele verantwoordelijkheid), financiën/P&C/auditing, P&O/HRM/formatieadvies, inkoop/aanbesteding/contractmanagement, interne en externe communicatie (excl. klantcommunicatie specifieke taakvelden), juridische zaken (bedrijfsvoering), bestuurszaken (ambtelijke ondersteuning B&W), ICT/PIOFACH-systemen/kantoorautomatisering, facilitaire zaken/huisvesting/beveiliging, DIV, managementondersteuning/secretariaten, leges gemeentearchief. Volgt notitie Overhead 2023 commissie BBV.',
          niet: 'Griffie → 0.1. Historische archieven → 5.4. Klantcommunicatie specifieke taakvelden → primair taakveld. Projectleiders/coördinatoren (zonder personele verantwoordelijkheid) → primair taakveld. Afhandeling bezwaar-/beroepsschriften → primair taakveld. Sectorcontrollers/zwembaddirecteur → primair taakveld. ICT voor primaire processen → primair taakveld. Bijdrage verbonden partij → taakveld van de taak.',
          keywords: ['overhead','bedrijfsvoering','ict','automatisering','hrm','personeel','inkoop','aanbesteding','juridische zaken','facilitair','div','gemeentearchief','ambtelijke organisatie','formatie','cao','secretaris','woo','archief','archivaris','privacy','duivenvoorde','dvo','dienstverleningsovereenkomst','cup','werkgeversdienstverlening','zhc','piofach']
        },
        { code: '0.5', naam: 'Treasury',
          omschrijving: 'Treasuryfunctie: financiering, beleggingen, dividenden (incl. dividend nutsbedrijven), schenkingen en legaten. Alle reële rente (categorie 5.1) wordt hier geboekt en via categorie 7.4 toegerekend aan taakvelden.',
          niet: '',
          keywords: ['treasury','financiering','belegging','dividend','lening','rente','schenkingen','legaten','kasgeldlimiet','schatkistbankieren']
        },
        { code: '0.6 - 0.9', naam: 'Belastingen',
          omschrijving: 'Clustering van alle lokale belastingen: 0.61 OZB woningen (eigendomsbelasting, WOZ-waardering), 0.62 OZB niet-woningen (eigendom en gebruik), 0.63 Parkeerbelasting (heffing, leges parkeervergunning, boetes/wielklem), 0.64 Belastingen overig (hondenbelasting, precario, leges, retributie, baat-, reclame-, roerende zaakbelasting), 0.9 Vennootschapsbelasting (VpB over fiscale winst ondernemingsactiviteiten). Allen: heffing, invordering, bezwaar en beroep. Uitvoering door BSGR (Belastingsamenwerking Gouwe-Rijnland).',
          niet: 'Toeristenbelasting en forensenbelasting → 3.4. Kwijtscheldingen belastingen → 6.3. Rioolheffing → 7.2. Afvalstoffenheffing → 7.3. Begraafplaatsrechten → 7.5. Marktgeld → 3.3. Liggeld → 2.3. Ondernemersheffing (BIZ) → 3.3. Parkeerpolitie → 1.2.',
          keywords: ['ozb','onroerendezaakbelasting','woningen','woz','waardering','eigendomsbelasting','ozb niet-woningen','bedrijfspanden','ozb bedrijven','parkeerbelasting','parkeervergunning','wielklem','wegsleepregeling','parkeerboete','naheffingsaanslag','hondenbelasting','precariobelasting','baatbelasting','reclamebelasting','roerende zaakbelasting','heffing','belastingverordening','vennootschapsbelasting','vpb','fiscale winst','belasting','tarief','belastingverordeningen','legesverordening','retributieverordening','retributie','bsgr','belastingsamenwerking','gouwe-rijnland','belastingverordeningen begroting','aanslag','belastingaanslag','woz-waarde','woz-bezwaar'],
          type: 'Clustering',
          toelichting: 'Deze tegel is een clustering van de Iv3-taakvelden 0.61 (OZB woningen), 0.62 (OZB niet-woningen), 0.63 (Parkeerbelasting), 0.64 (Belastingen overig) en 0.9 (Vennootschapsbelasting). Rationale: gemeentelijke besluiten over belastingen worden vrijwel altijd als pakket vastgesteld (jaarlijkse belastingverordeningen). De individuele Iv3-codes blijven traceerbaar in de omschrijving. Gerelateerde heffingen in andere hoofdstukken: toeristenbelasting (3.4), rioolheffing (7.2), afvalstoffenheffing (7.3), kwijtschelding (6.3), begraafplaatsrechten (7.5), marktgeld/ondernemersheffing (3.3), liggeld (2.3).'
        },
        { code: '0.7', naam: 'Algemene uitkering en overige uitkeringen gemeentefonds',
          omschrijving: 'Uitkeringen uit het gemeentefonds: algemene uitkering, integratie-uitkeringen, decentralisatie-uitkeringen, artikel 12-uitkering.',
          niet: 'Specifieke uitkeringen → op het taakveld waarop de uitkering betrekking heeft.',
          keywords: ['algemene uitkering','gemeentefonds','integratie-uitkering','decentralisatie-uitkering','meicirculaire','septembercirculaire']
        },
        { code: '0.8 - 0.10 - 0.11', naam: 'Fin. beheer',
          omschrijving: 'Clustering van boekhoudkundige taakvelden: 0.8 Overige baten en lasten (stelposten, taakstellende bezuinigingen, begrotingsruimte, niet voorziene uitgaven, loonkosten bovenformatief personeel), 0.10 Mutaties reserves (toevoegingen/onttrekkingen aan reserves, uitsluitend categorie 7.1, resultaatsbestemming is balansboeking), 0.11 Resultaat van de rekening van baten en lasten (saldo alle taakvelden incl. reservemutaties).',
          niet: 'Mutaties voorzieningen → op het taakveld waarop de voorziening is getroffen.',
          keywords: ['stelpost','bezuiniging','begrotingsruimte','niet voorziene uitgaven','bovenformatief','reserve','mutatie reserves','bestemmingsreserve','algemene reserve','resultaatsbestemming','resultaat','saldo rekening','tekort','overschot','jaarresultaat','voorjaarsnota','najaarsnota','kadernota','begroting','jaarrekening','jaarstukken','financiële verordening','controleprotocol','burap','bestuursrapportage'],
          type: 'Clustering',
          toelichting: 'Deze tegel is een clustering van de Iv3-taakvelden 0.8 (Overige baten en lasten), 0.10 (Mutaties reserves) en 0.11 (Resultaat van de rekening van baten en lasten). Rationale: dit zijn boekhoudkundige taakvelden waar zelden een individueel beleidsbesluit aan raakt — ze komen aan de orde in de P&C-cyclus (begroting, jaarrekening, voor-/najaarsnota). De individuele Iv3-codes blijven traceerbaar in de omschrijving.'
        },
    ],
    1: [
        { code: '1.1', naam: 'Crisisbeheersing en brandweer',
          omschrijving: 'Alle reguliere brandweertaken en rampenbestrijding: brandbestrijding, preventieve maatregelen fysieke veiligheid, rampenbestrijding, leges vergunning brandveilig gebruik (niet-omgevingsvergunning).',
          niet: 'Opruiming explosieven bij grondexploitatie → 8.2. Rijksbijdrage explosieven via gemeentefonds → 0.7.',
          keywords: ['brandweer','brandbestrijding','crisisbeheersing','rampenbestrijding','veiligheidsregio','vrh','brandveiligheid','noodverordening','ramp','crisis']
        },
        { code: '1.2', naam: 'Openbare orde en veiligheid',
          omschrijving: 'Alle gemeentelijke taken openbare orde en veiligheid: toezicht/handhaving, BOA\'s, stadswachten, Wet Bibob, bestuurlijke aanpak georganiseerde criminaliteit, bureau Halt, preventie criminaliteit, APV, leges (aanwezigheidsvergunning, Drank & Horeca, evenementen, vuurwapenwet), beleid/toezicht/ruiming explosieven, veilige woon-/leefomgeving, gevonden voorwerpen, strandvonderij, ontruimde inboedels, antidiscriminatiebeleid, doodsschouw, dierenbescherming, radicalisering.',
          niet: 'Verkeersveiligheid → 2.1. Explosieven bij grondexploitatie → 8.2.',
          keywords: ['openbare orde','veiligheid','handhaving','boa','stadswacht','bibob','halt','criminaliteit','apv','algemene plaatselijke verordening','evenementenvergunning','horeca','drank','explosieven','antidiscriminatie','dierenbescherming','radicalisering','cameratoezicht','navo','politie','noodverordening','huize ivicke','integraal veiligheidsbeleid','exploitatievergunning','alcoholvergunning','paracommercieel','drank- en horecavergunning']
        },
    ],
    2: [
        { code: '2.1', naam: 'Verkeer en vervoer',
          omschrijving: 'Verkeer te land en droge infrastructuur: verkeersmaatregelen (borden, regelinstallaties, bewegwijzering, straatmeubilair, abri\'s, carillons), verkeersveiligheid (circulatieplannen, onderzoek, voorlichting), aanleg/reconstructie/onderhoud wegen/fietspaden/voetpaden/pleinen, inkomensoverdrachten waterschappen, civieltechnische kunstwerken (bruggen, duikers, tunnels, spoorwegovergangen), openbare verlichting, laadpalen, gladheidbestrijding, straatreiniging (zwerfvuil), reguleren openbare ruimte (omgevingsvergunningen inritten, kabels), leges (wegenverkeerswet, kabels/leidingen, telecom).',
          niet: 'Wegen in grondexploitatie → 8.2 of 3.2. Busstations → 2.5. Parkeervoorzieningen → 2.2. Toeristische fiets-/wandelpaden → 5.7. Aanleg CAI/breedband/glasvezel → 3.1.',
          keywords: ['verkeer','vervoer','weg','wegen','fietspad','voetpad','brug','tunnel','duiker','openbare verlichting','straatverlichting','laadpaal','gladheidbestrijding','straatreiniging','verkeersveiligheid','verkeersbord','verkeersregelinstallatie','wegonderhoud','verharding','reconstructie','rotonde','30 km','n44','wegencategoriseringsplan','burgerberaad verkeer','mobiliteitsvisie','storm','schouwweg','inrichtingsplan','kabels en leidingen','openbare ruimte','uitvoeringsprogramma openbare ruimte']
        },
        { code: '2.2', naam: 'Parkeren',
          omschrijving: 'Ontwikkeling en beheer parkeervoorzieningen: parkeerbeleid (zones, ontheffingen, vergunningen), inrichting/onderhoud open en gesloten parkeervoorzieningen, parkeermeters, fietsenstalling, algemene gehandicaptenparkeervoorzieningen.',
          niet: 'Parkeerbelasting (opbrengst) → 0.63. Parkeerpolitie/BOA\'s → 1.2. Parkeerhavens als onderdeel van wegen → 2.1. Persoonlijke gehandicaptenparkeerplaats (beschikking) → 6.60.',
          keywords: ['parkeren','parkeerbeleid','parkeerzone','parkeervergunning','parkeergarage','parkeerplaats','fietsenstalling','parkeervoorziening','p+r']
        },
        { code: '2.3', naam: 'Recreatieve havens',
          omschrijving: 'Havens recreatieve scheepvaart: jachthaven, passantenhaven, brug-/sluisgelden pleziervaart, haven-/liggelden pleziervaart, scheepvaartrechten pleziervaart, wal-/kadegelden pleziervaart.',
          niet: 'Ligplaatsgelden woonschepen → 8.3. Onderhoud ligplaatsen in doorgaande waterwegen → 2.4.',
          keywords: ['jachthaven','passantenhaven','pleziervaart','recreatieve haven','liggeld','scheepvaartrecht']
        },
        { code: '2.4', naam: 'Economische havens en waterwegen',
          omschrijving: 'Taken beroepsscheepvaart en infrastructuur: zee-/binnenhavens, doorgaande waterwegen (bebakening, baggeren, ijsbestrijding, oevers, walkanten), waterkering/afwatering/landaanwinning, exploitatiebijdragen, ligplaatsen bedrijfsvaartuigen, brug-/sluisgelden beroepsvaart.',
          niet: 'Vijvers/sloten/waterpartijen → 5.7. Straten havengebied → 2.1. Havenloodsen/pakhuizen → 3.2. Veerponten → 2.5. Waterkwaliteit → 7.2. Jachthavens → 2.3. Onderwijs schipperskinderen → 4.2/4.3. Maatschappelijk werk binnenschippers → 6.1.',
          keywords: ['haven','waterwegen','beroepsvaart','waterkering','afwatering','baggeren','scheepvaart','kadegelden']
        },
        { code: '2.5', naam: 'Openbaar vervoer',
          omschrijving: 'Openbaar vervoer en infrastructuur: bus, tram, metro, taxivervoer, veerdiensten/subsidies overzetveren, OV-voorzieningen/-informatievoorziening, busstations, metrostations, multimodale knooppunten, OV-experimenten, veergelden.',
          niet: 'Bus-/tramhaltes (straatmeubilair) → 2.1. Collectief vervoer voor personen die ondersteuning behoeven → 6.60.',
          keywords: ['openbaar vervoer','bushalte','tram','metro','taxi','veerdienst','busstation','ov-concessie','htmb','randstadrail','ov-chipkaart','buslijn']
        },
    ],
    3: [
        { code: '3.1', naam: 'Economische ontwikkeling',
          omschrijving: 'Algemeen beleid versterking economische bedrijvigheid: clusterontwikkeling/versterking sectoren, samenwerkingsprojecten onderzoeksinstellingen en bedrijven, lokale/regionale/internationale samenwerkingsverbanden, samenwerking bedrijfsleven en kennisinstellingen, stedelijke/wijkgerichte economische programma\'s, aanleg CAI/breedband/glasvezel.',
          niet: 'Ondersteuning/stimulering individuele bedrijven → 3.3. Acquisitie/accountmanagement → 3.3. Praktische uitvoering programma\'s → 3.2 of 3.4. Vergunningen/leges CAI/glasvezel → 2.1.',
          keywords: ['economische ontwikkeling','economische visie','werkgelegenheid','bedrijvigheid','innovatie','breedband','glasvezel','economische structuur','vestigingsklimaat','mrdh']
        },
        { code: '3.2', naam: 'Fysieke bedrijfsinfrastructuur',
          omschrijving: 'Fysieke condities bedrijvigheid: grondexploitatie bedrijventerreinen, ontwikkeling/onderhoud bedrijfslocaties/(her)ontwikkeling bedrijfspanden, herstructurering/verduurzaming bedrijfslocaties, investeringen winkelgebieden/-strips, werkzaamheden land-/tuinbouwgronden.',
          niet: 'Grondexploitatie niet-bedrijventerreinen → 8.2.',
          keywords: ['bedrijventerrein','bedrijfslocatie','herstructurering','winkelgebied','bedrijfspand','maaldrift','bedrijfsinfrastructuur']
        },
        { code: '3.3', naam: 'Bedrijvenloket en bedrijfsregelingen',
          omschrijving: 'Op bedrijven en ondernemers gerichte dienstverlening: bedrijvenloket/ondernemersloket, stimuleren startende ondernemers, aantrekken/faciliteren nieuwe bedrijven, financiële steunregelingen (incl. land-/tuinbouw/veeteelt/visserij), straathandel/markten/veemarkten, BIZ-bijdrage, marktgelden/staanplaatsgelden, leges (standplaats-, winkelsluitingswet, ventvergunningen), kosten/opbrengsten nutsbedrijven.',
          niet: 'Netwerken/samenwerkingsverbanden → 3.1. Acquisitie/promotionele activiteiten → 3.4. Dividend nutsbedrijven → 0.5 Treasury.',
          keywords: ['bedrijvenloket','ondernemersloket','startende ondernemers','biz','bedrijveninvesteringszone','markt','marktgeld','standplaats','straathandel','nutsbedrijven','ondernemersheffing']
        },
        { code: '3.4', naam: 'Economische promotie',
          omschrijving: 'Gemeente "op de kaart zetten": promotionele activiteiten (aantrekken bedrijvigheid/werkers), aantrekken instellingen, bovenlokale/landelijke/internationale relatienetwerken, promotie toerisme, beurzen/jaarmarkten/volksfeesten (Koningsdag, carnaval, kermis), toeristenbelasting, forensenbelasting, kermisgelden, vermakelijkhedenretributies.',
          niet: 'Lokale wijkactiviteiten/recreatieve voorzieningen → 5.7. Accountmanagement vestiging → 3.3. Kampeerterreinen/recreatieve voorzieningen → 5.7. Toeristische fietspaden/dierentuinen → 5.7.',
          keywords: ['economische promotie','toerisme','toeristenbelasting','forensenbelasting','kermis','jaarmarkt','volksfeest','koningsdag','promotie','beurzen','stichting wassenaar-voorschoten','acquisitie']
        },
    ],
    4: [
        { code: '4.1', naam: 'Openbaar basisonderwijs',
          omschrijving: 'Gemeentelijke taken openbaar basisonderwijs: bestuurskosten (als gemeente zelf bestuur is), primair openbaar basisonderwijs, bewegingsonderwijs (incl. schoolzwemmen), huur gymnastieklokaal, passend onderwijs.',
          niet: 'Onderwijshuisvesting → 4.2. Uitgaven bijzonder onderwijs → 4.3.',
          keywords: ['openbaar basisonderwijs','basisonderwijs','basisschool','primair onderwijs','schoolzwemmen','bewegingsonderwijs','passend onderwijs']
        },
        { code: '4.2', naam: 'Onderwijshuisvesting',
          omschrijving: 'Onderwijshuisvesting openbaar en bijzonder onderwijs: nieuwbouw, aanpassing/uitbreiding schoolgebouwen, verhuur (gymnastieklokaal), programma onderwijshuisvesting (IHP), vandalismebestrijding.',
          niet: 'Aanpassing/(buiten)onderhoud schoolgebouwen → schoolbesturen zelf.',
          keywords: ['onderwijshuisvesting','schoolgebouw','nieuwbouw school','ihp','integraal huisvestingsplan','den deylschool','kievietschool','sint baptistschool','sint jozefschool','voorbereidingskrediet','american school','gymnastieklokaal']
        },
        { code: '4.3', naam: 'Onderwijsbeleid en leerlingzaken',
          omschrijving: 'Lokaal onderwijsbeleid en leerlingzaken: onderwijsondersteuning (leerkrachten/directie), bestuurskosten openbaar middelbaar onderwijs, bijzonder onderwijs (excl. huisvesting), achterstandenbeleid, passend onderwijs (coördinatie), volwasseneducatie, peuteropvang, leerlingzorg/-begeleiding, leerlingenvervoer, leerplicht, voorkomen voortijdig schoolverlaten.',
          niet: 'Kinderopvang (toezicht kwaliteit) → 6.1. Facilitering openbaar basisonderwijs → 4.1.',
          keywords: ['onderwijsbeleid','leerlingzaken','leerplicht','leerlingenvervoer','achterstandenbeleid','volwasseneducatie','peuteropvang','vve','voor- en vroegschoolse educatie','oab','rmc','schooladvies','voortijdig schoolverlaten','lea','leerlingvervoer','bijzonder onderwijs','verordening leerlingenvervoer']
        },
    ],
    5: [
        { code: '5.1', naam: 'Sportbeleid en activering',
          omschrijving: 'Niet-fysieke maatregelen sport: stimuleren topsport en recreatieve sportbeoefening, ondersteunen sportorganisaties, sport in de buurt, combinatiefuncties. Brede SPUK: lokaal sportakkoord, leefomgeving.',
          niet: 'Sportvelden/-accommodaties → 5.2. Schoolsportdagen → 4.3.',
          keywords: ['sportbeleid','sportactivering','sportakkoord','topsport','amateursport','combinatiefunctie','sport in de buurt','sportvisie','brede spuk sport','sport','bewegen','beweegbeleid']
        },
        { code: '5.2', naam: 'Sportaccommodaties',
          omschrijving: 'Alle accommodaties sportbeoefening: sporthallen, zwembaden, schaatshallen, (groene/kunst-)velden, terreinen, opstallen, faciliteiten, technische voorzieningen, trapveldjes in de wijk.',
          niet: 'Gymlokalen/-velden bij schoolexploitatie → 4.2.',
          keywords: ['sportaccommodatie','sporthal','zwembad','sportveld','schaatshal','kunstgrasveld','trapveldje','sporthallen','sportcomplex']
        },
        { code: '5.3', naam: 'Cultuurpresentatie, cultuurproductie en cultuurparticipatie',
          omschrijving: 'Beeldende kunst, muziek, dans en toneel: podia, gezelschappen, accommodaties beeldende kunst, subsidies kunstenaars/projecten, kunstaankopen (incl. openbare ruimte), film/video, kunstzinnige vorming/cultuureducatie, culturele manifestaties/herdenkingen, overkoepelende kunstorganen.',
          niet: 'Jaarmarkten/volksfeesten → 3.4. Musea/oudheidkamers → 5.4. Onderhoud kunstwerken openbare ruimte → 5.7. Historische gebouwen/objecten → 5.5.',
          keywords: ['cultuur','cultuurpresentatie','cultuurproductie','cultuurparticipatie','theater','toneel','muziek','dans','beeldende kunst','kunstaankoop','cultuureducatie','herdenking','culturele manifestatie','warenar','cultuurhuis','podium','gezelschap','film']
        },
        { code: '5.4', naam: 'Musea',
          omschrijving: 'Verwerven, behouden, wetenschappelijk onderzoeken en presenteren van kunst en cultuur: musea, exposities, archeologie, heemkunde, historische archieven.',
          niet: 'Archieven reguliere werkzaamheden → 0.4. Historische gebouwen/beschermde stads-/dorpsgezichten → 5.5.',
          keywords: ['museum','musea','expositie','archeologie','heemkunde','historisch archief','collectie','oudheidkamer']
        },
        { code: '5.5', naam: 'Cultureel erfgoed',
          omschrijving: 'Conserveren en toegankelijk maken cultureel erfgoed: historische gebouwen, beschermde stads-/dorpsgezichten, objecten met historische waarde, subsidie/beheer/onderhoud/toezicht/handhaving erfgoed, digitaal zichtbaar maken cultuurhistorische waarden.',
          niet: '',
          keywords: ['cultureel erfgoed','monument','monumentenzorg','erfgoedverordening','beschermd gezicht','historisch gebouw','welstand','wce','klankbordgroep erfgoed','erfgoed','rijksmonument','gemeentelijk monument']
        },
        { code: '5.6', naam: 'Media',
          omschrijving: 'Fysieke en elektronische cultuurdragers: bibliotheken, artotheek, videotheek, lokale pers, lokale omroep, lokale informatievoorziening (bijv. ICT), overkoepelende organen.',
          niet: '',
          keywords: ['media','bibliotheek','lokale omroep','publieke omroep','persbericht','persconferentie','artotheek','aanwijzingsprocedure lokale omroep','mediabeleid']
        },
        { code: '5.7', naam: 'Openbaar groen en (openlucht) recreatie',
          omschrijving: 'Openbaar groen, natuur en recreatie: natuur-/landschapsbescherming, onderhoud bos/natuurgebieden, aanleg/onderhoud openbaar groen/parken/graslanden/gemeentetuin, kunstwerken openbare ruimte (onderhoud), niet-doorgaande waterwegen (vijvers/sloten/waterpartijen, taluds, betuining), speelvoorzieningen (speeltuinen/-plaatsen/-werktuigen), hertenkampen, kinderboerderijen, sportvliegvelden, visvijvers, kampeerterreinen, watertappunten, dierentuinen, plantentuinen, volkstuinen, recreatiestranden, toeristische fiets-/wandelpaden, boomplantdagen.',
          niet: 'Doorgaande grote watergangen (vaarten, kanalen) → 2.4.',
          keywords: ['openbaar groen','groenonderhoud','park','plantsoen','bos','natuur','landschap','speeltuin','speelplaats','kinderboerderij','hertenkamp','volkstuin','recreatie','strand','wandelpad','fietspad toeristisch','bomen','groenvoorziening','wassenaarse slag','noordrand','hollandse duinen','duin','nationaal park','groenbeleid','kapvergunning','bomenkap','kap']
        },
    ],
    6: [
        { code: '6.1', naam: 'Samenkracht en burgerparticipatie',
          omschrijving: 'Sociale basis: ondersteuning burgerinitiatieven/vrijwilligers/mantelzorg; sociaal/cultureel werk, AMW, wijkopbouw, jongerenwerk, schoolmaatschappelijk werk, straathoekwerk; preventie (eenzaamheid, GGZ, risicojongeren, vroegsignalering); buurt-/clubhuizen; collectief aanvullend vervoer (als algemene voorziening); toegankelijkheid (inclusie); kinderopvang (toezicht/handhaving kwaliteit, SMI-toeslag); Wet Inburgering; noodopvang vluchtelingen; vreemdelingenbeleid; lhbtqia+-beleid; leges kinderopvang. Brede SPUK: gezondheidsachterstanden, sociale basis, mantelzorg, eenzaamheid, welzijn op recept.',
          niet: 'Peuteropvang → 4.3. Inburgering oudkomers → 6.5. Kansrijke start → 7.1. Taken lokaal team (toegang/eerstelijns) → 6.21–6.23.',
          keywords: ['samenkracht','burgerparticipatie','participatie','vrijwilliger','mantelzorg','sociaal werk','cultureel werk','amw','wijkopbouw','jongerenwerk','preventie','eenzaamheid','buurtwerk','buurthuis','clubhuis','kinderopvang','inburgering','vluchtelingen','noodopvang','ontheemden','oekraïne','statushouder','lhbtqia','gro-up','welzijn','gala','gezond en actief leven','sociaal kernteam','buurtgericht','inclusie']
        },
        { code: '6.2', naam: 'Toegang eerste lijns',
          omschrijving: 'Cluster Iv3 6.21–6.23: Toegang- en eerstelijnsvoorzieningen Wmo, Jeugd en Integraal. Vrij toegankelijke hulp en geleiden naar maatwerkvoorzieningen via lokale teams, gemeentelijke loketten of CJG. Voorlichting, advisering, cliëntondersteuning, zorgcoördinatie, inloopfunctie GGZ, ondersteuning gedupeerde ouders toeslagenaffaire, vroegsignalering, aanpak Veilig Thuis/huiselijk geweld/kindermishandeling, POH-GGZ jeugd, verwijsindex risicojongeren, preventief justitieel kader (iJw-code 49).',
          niet: 'Basistakenpakket JGZ → 7.1. Beleidsmedewerkers/contractmanagers Wmo → 6.91, Jeugd → 6.92. Niet-vrij-toegankelijke maatwerkdienstverlening na doorverwijzing → 6.711–6.714 of 6.751–6.763.',
          keywords: ['toegang','eerstelijnsvoorziening','lokaal team','wijkteam','sociaal team','cjg','centrum jeugd en gezin','cliëntondersteuning','zorgcoördinatie','veilig thuis','huiselijk geweld','kindermishandeling','inloopfunctie ggz','vroegsignalering','toeslagenaffaire','poh-ggz','verwijsindex']
        },
        { code: '6.3 - 6.5', naam: 'Werk en inkomen',
          omschrijving: 'Cluster: 6.3 Inkomensregelingen (Participatiewet, loonkostensubsidies, IOAW, IOAZ, Bbz, schuldhulpverlening, armoedebeleid, bijzondere bijstand, kwijtschelding belastingen/heffingen), 6.4 WSW en beschut werk (beschut werken, bestaande Wsw-dienstbetrekkingen, arbeidsmatige dagbesteding), 6.5 Arbeidsparticipatie (re-integratie-instrumenten, Work First, proefplaatsing, scholing, EVC, stimuleringsmaatregelen, loonwaardebepaling, jobcoach, werkplekaanpassingen, Bbz startende ondernemers).',
          niet: '6.3: kwijtschelding staat hier, de belastingen zelf op 0.61–0.64/7.2/7.3. 6.4: dagbesteding Wmo → 6.713, dagbesteding beschermd wonen → 6.811. WSW-budget (integratie-uitkering) → 0.7. 6.5: volwasseneneducatie → 4.3, permanente loonkostensubsidie arbeidsbeperkten (inkomensdeel) → 6.3.',
          keywords: ['inkomensregeling','bijstand','participatiewet','ioaw','ioaz','bbz','schuldhulpverlening','schuldhulp','armoedebeleid','bijzondere bijstand','kwijtschelding','werkvoorziening','wsw','beschut werk','arbeidsparticipatie','re-integratie','work first','loonkostensubsidie','jobcoach','werkplekaanpassing','loonwaardebepaling','werk en inkomen','werkgelegenheid','werkloosheid','arbeidsmarkt','uitkering','werkbedrijf','sociale werkvoorziening','minimaregeling','minimabeleid']
        },
        { code: '6.60 - 6.91', naam: 'WMO',
          omschrijving: 'Cluster Wmo-maatwerkvoorzieningen: 6.60 Hulpmiddelen en diensten (rolstoel, vervoersdiensten/-voorzieningen, woonvoorzieningen, woningaanpassingen, gehandicaptenparkeerbeleid, overige hulpmiddelen), 6.711 Huishoudelijke hulp (incl. abonnementstarief eigen bijdragen), 6.712 Begeleiding/persoonlijke verzorging/kortdurend verblijf, 6.713 Dagbesteding, 6.714 Overige maatwerkarrangementen (incl. ggz intramuraal), 6.791 PGB Wmo, 6.811 Beschermd wonen (incl. Beschermd Thuis), 6.812 Maatschappelijke-/vrouwenopvang (incl. Wet verplichte GGZ, Wet zorg en dwang), 6.91 Coördinatie en beleid Wmo (beleidsmedewerker, contractmanager, backoffice/beschikkingen).',
          niet: 'Toegang/eerstelijn → 6.21–6.23. Arbeidsmatige dagbesteding → 6.4. Dagbesteding beschermd wonen → 6.811. Dagbesteding opvang → 6.812. Inloopfunctie GGZ → 6.21/6.23. PGB Wmo → 6.791. Indirecte (overhead)kosten → 0.4.',
          keywords: ['wmo','maatschappelijke ondersteuning','hulpmiddel','rolstoel','vervoersvoorziening','woningaanpassing','huishoudelijke hulp','begeleiding','dagbesteding','maatwerkarrangementen','pgb','persoonsgebonden budget','beschermd wonen','beschermd thuis','maatschappelijke opvang','vrouwenopvang','abonnementstarief','eigen bijdrage','maatwerkvoorziening','adviesraad sociaal domein','wmo-tarief','stichting mo','ouderenbeleid','ouderenhuisvesting','woonzorgvisie']
        },
        { code: '6.7 - 6.9', naam: 'Jeugd',
          omschrijving: 'Cluster Jeugdhulp: 6.751–6.753 Jeugdhulp ambulant (lokaal/regionaal/landelijk — iJw-codes 32/40/41/42/45/46/50/51/52/53/54), 6.761–6.763 Jeugdhulp met verblijf (lokaal/regionaal/landelijk — iJw-codes 37/38/43/44/50/55), 6.792 PGB Jeugd, 6.821 Jeugdbescherming (OTS, voogdij, Landelijk Expertiseteam — iJw-code 48), 6.822 Jeugdreclassering (iJw-code 47), 6.92 Coördinatie en beleid Jeugd (beleidsmedewerker, contractmanager, backoffice, RET\'s, BEN\'s, Jeugdbeschermingstafel, frictiekosten afbouw residentieel).',
          niet: 'Vrij toegankelijke hulp lokaal team → 6.22/6.23. Basistakenpakket JGZ → 7.1. PGB Wmo → 6.791. Jeugdhulp tijdens beschermingsmaatregel → 6.751–6.763. Preventief justitieel kader door GI → 6.22/6.23. Indirecte (overhead)kosten → 0.4.',
          keywords: ['jeugd','jeugdhulp','jeugdzorg','jeugdbescherming','jeugdreclassering','ondertoezichtstelling','ots','voogdij','pleegzorg','gezinsgericht','residentieel','ambulante jeugdhulp','sbjh','haaglanden','jeugdwet','gecertificeerde instelling','jeugdbeleid','verordening jeugdhulp','pgb jeugd','cliëntervaringsonderzoek']
        },
    ],
    7: [
        { code: '7.1', naam: 'Volksgezondheid',
          omschrijving: 'Bescherming volksgezondheid: monitoren gezondheidssituatie, preventieprogramma\'s, vroegtijdig signaleren stoornissen/gezondheidsbedreigende factoren, gezondheidsbevordering, bestrijding infectieziekten/vaccinaties, voorlichting/advies/begeleiding, prenatale voorlichting, bewaken gezondheidsaspecten bestuurlijke beslissingen, medisch milieukundige zorg, technische hygiëne, psychosociale hulp bij rampen, basistakenpakket JGZ (art. 5 Wpg), ambulance/ziekenvervoer. Brede SPUK: Kansrijke Start, Mentale Gezondheid, Overgewicht/obesitas, Valpreventie, Versterking GGD-kennisfunctie, Coördinatiekosten regionale aanpak preventie.',
          niet: 'Ondersteuning JGZ-uitvoerder na signalering (risico)situatie → 6.22/6.23.',
          keywords: ['volksgezondheid','ggd','gezondheid','preventie','infectieziekte','vaccinatie','jgz','jeugdgezondheidszorg','ambulance','ziekenvervoer','kansrijke start','mentale gezondheid','overgewicht','valpreventie','gezondheidsbevordering','wpg','regiovisie huiselijk geweld']
        },
        { code: '7.2', naam: 'Riolering',
          omschrijving: 'Afvalwater en waterhuishouding: opvang/verwerking afval-/hemelwater, inzameling/transport huishoudelijk-/bedrijfsafvalwater, voorkomen grondwaterproblemen, rioolwaterzuivering, bestrijding verontreiniging oppervlaktewater, rioolheffing (woningen en niet-woningen), leges rioolaansluiting, kosten heffing/invordering rioolheffing.',
          niet: 'Kwijtschelding rioolheffing → 6.3.',
          keywords: ['riolering','riool','rioolheffing','afvalwater','hemelwater','grondwater','rioolwaterzuivering','waterketen','waterzorgheffing','rioolaansluiting','waterhuishouding']
        },
        { code: '7.3', naam: 'Afval',
          omschrijving: 'Inzameling en verwerking bedrijfs- en huishoudelijk afval: afvalscheiding/recycling, vuilophaal/-afvoer, vuilstort/-verwerking, afvalstoffenheffing, reinigingsrechten, diftar, kosten heffing/invordering afvalstoffenheffing en reinigingsrechten.',
          niet: 'Zwerfvuil/veegdiensten → 2.1. Kwijtschelding afvalstoffenheffing/reinigingsrechten → 6.3.',
          keywords: ['afval','afvalinzameling','recycling','afvalscheiding','vuilophaal','afvalstoffenheffing','reinigingsrecht','diftar','milieustraat','gft','avalex','vuilverwerking','grofvuil','container']
        },
        { code: '7.4', naam: 'Milieubeheer',
          omschrijving: 'Gemeentelijke milieubescherming: bodembescherming/-sanering, luchtkwaliteit, geluidhinder, straling, verplaatsing milieuhinderlijke bedrijven, ongediertebestrijding (o.a. eikenprocessierups), RUD/Regionale Uitvoeringsdiensten, leges (omgevingsvergunning milieubelastende activiteit, bestrijding ongedierte, ontheffing route gevaarlijke stoffen, stookontheffing).',
          niet: 'Waterkwaliteit → 7.2. Milieueducatie → 4.3. Afvalscheiding → 7.3. Verduurzaming primair gerelateerd aan ander taakveld → dat taakveld (zonnepanelen zwembad → 5.2, subsidie woningverduurzaming → 8.3, driedubbel glas stadhuis → 0.4).',
          keywords: ['milieu','milieubeheer','bodem','bodemsanering','luchtkwaliteit','geluidhinder','straling','ongediertebestrijding','eikenprocessierups','rud','regionale uitvoeringsdienst','omgevingsdienst','odh','milieuvergunning','omgevingsvergunning milieu','duurzaamheid','energie','energiestrategie','klimaat','lokale energiestrategie','energietoeslag','subsidie milieu','milieubelastende activiteit','regionale energiestrategie']
        },
        { code: '7.5', naam: 'Begraafplaatsen en crematoria',
          omschrijving: 'Lijkbezorging: begraafplaatsen, crematoria, lijkschouw (vaststelling overlijden), begraaf(plaats)rechten/grafrechten, afkoopsommen grafrechten/grafonderhoud.',
          niet: 'Registratie overlijden → 0.2.',
          keywords: ['begraafplaats','crematorium','lijkbezorging','grafrecht','begraafplaatsrecht','uitvaart','lijkschouw']
        },
    ],
    8: [
        { code: '8.1', naam: 'Ruimte en leefomgeving',
          omschrijving: 'Ruimtelijke ordening en leefomgeving: structuurplannen/-visies, bestemmingsplannen, omgevingsvisie, gebiedsgerichte programma\'s, omgevingsplan, Digitaal Stelsel Omgevingswet, leges omgevingsvergunning buitenplanse omgevingsplanactiviteit, leges aanpassen bestemmingsplannen, leges leegstandsvergunning, faciliterend (passief) grondbeleid (kostenverhaal op private ontwikkelaars), BRO, BGT.',
          niet: 'Veiligheid leefomgeving → 1.2. Thematische programma\'s → op taakveld (actieplan geluid → 7.4, verkeerscirculatieplan → 2.1). Actief grondbeleid niet-bedrijventerreinen → 8.2. Actief grondbeleid bedrijventerreinen → 3.2.',
          keywords: ['ruimtelijke ordening','ruimte','leefomgeving','omgevingsvisie','omgevingsplan','omgevingswet','bestemmingsplan','beheersverordening','structuurvisie','structuurplan','digitaal stelsel','grondbeleid','faciliterend grondbeleid','basisregistratie ondergrond','bgt','leges omgevingsvergunning','gebiedsprogramma','startnotitie participatie','eerste proeve']
        },
        { code: '8.2', naam: 'Grondexploitatie (niet-bedrijventerreinen)',
          omschrijving: 'Gemeentelijke bouwgrondexploitatie (actief grondbeleid): voorbereidingskosten, grondverwerving, bouw-/woonrijp maken (kostensoortenlijst), toerekening bovenwijkse voorzieningen, financiering/rentetoerekening/administratie, verkoop bouwrijpe gronden, erfpacht, winst-/verliesneming, onschadelijk maken/verwijderen explosieven.',
          niet: 'Grondexploitatie bedrijventerreinen → 3.2. Explosieven buiten grondexploitatie → 1.2.',
          keywords: ['grondexploitatie','bouwgrond','grondverwerving','bouwrijp','woonrijp','erfpacht','grondpositie','bovenwijkse voorziening','valkenhorst','duindigt','voorkeursrecht']
        },
        { code: '8.3', naam: 'Wonen en bouwen',
          omschrijving: 'Gebiedsontwikkeling, woningvoorraad en huisvesting: leges omgevingsvergunning (bouw, rijksmonumenten, aanleg, welstand, brandveiligheid gebouwen, kap, ligplaatsen woonschepen, monumenten, opslag/gebruik openbare weg, reclame, sloop, staanplaatsen woonwagens, uitweg), leges huisvestingswet, bouwtoezicht, BAG, woningbouw/-verbetering/-renovatie, woonruimteverdeling, woningsplitsingsvergunning, woonvergunning, stedelijke vernieuwing, subsidie verduurzaming eigen woning, uitkoopregeling hoogspanning.',
          niet: 'Woningverbetering Wmo (bijv. woningaanpassing voor beperkingen) → 6.60.',
          keywords: ['wonen','bouwen','woningbouw','volkshuisvesting','woningverbetering','renovatie','stedelijke vernieuwing','bouwvergunning','omgevingsvergunning','bag','basisregistratie adressen','bouwtoezicht','woonruimteverdeling','woonbeleid','huisvestingsverordening','woonzorgvisie','ouderenbeleid','ouderenhuisvesting','nota woonbeleid','sloop','kap','kapvergunning','ligplaats woonschepen','woonwagens','woningsplitsing','verduurzaming woning','den deylschool herontwikkeling','vergunning bouw','aangevraagde omgevingsvergunning']
        },
    ],
};
