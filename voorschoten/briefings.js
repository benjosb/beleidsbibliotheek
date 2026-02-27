// Briefing HTML data — Voorschoten versie 1.0.0
// Per domein een beknopte beleidsbriefing op basis van het coalitieakkoord 2022-2026
// en openbare informatie van de gemeentewebsite.

const BRIEFING_HTML_DATA = {

'Bestuur & Veiligheid': `<header>
<h1>Beleidsbriefing Bestuur &amp; Veiligheid</h1>
<p class="subtitle">Gemeente Voorschoten</p>
<p class="meta">Portefeuille: Burgemeester Nadine Stemerdink &middot; Versie 1.0.0</p>
</header>

<h2>Samenvatting</h2>
<p>Burgemeester Stemerdink is verantwoordelijk voor openbare orde en veiligheid, handhaving, bestuurlijke en juridische zaken, communicatie, evenementen en dienstverlening. De coalitie (VVD, Voorschoten Lokaal, CDA) zet in op bestuurlijke zelfstandigheid met intensieve regionale samenwerking in de Leidse regio.</p>

<h2>Veiligheid</h2>
<p>Voorschoten werkt samen met het gebiedsgebonden politieteam aan de aanpak van ondermijning, preventie van jeugdcriminaliteit en high impact crimes. Buurtpreventie-initiatieven worden gestimuleerd. Er komt meer zichtbare handhaving, ook in de avonduren.</p>

<h2>Inwonerparticipatie</h2>
<p>De gemeente zet in op nieuwe vormen van participatie, waaronder het uitdaagrecht (right to challenge). Participatieprojecten zijn duidelijk, transparant en eindig. Het uiteindelijke besluit is met oog voor het algemeen belang.</p>

<h2>Bestuurlijke zelfstandigheid</h2>
<p>De coalitie is een warm voorstander van bestuurlijke zelfstandigheid. Op gebieden als zorg, klimaat, afval en verkeer wordt intensief samengewerkt in de Leidse regio. Goede dienstverlening heeft prioriteit.</p>`,

'Economie & Dienstverlening': `<header>
<h1>Beleidsbriefing Economie &amp; Dienstverlening</h1>
<p class="subtitle">Gemeente Voorschoten</p>
<p class="meta">Portefeuille: Wethouder Pieter Varekamp &middot; Versie 1.0.0</p>
</header>

<h2>Samenvatting</h2>
<p>Wethouder Varekamp is verantwoordelijk voor economie, vestigingsklimaat, centrum en winkelcentra, toerisme, werk en inkomen, regiozaken en internationalisering. Voorschoten streeft naar een bruisend en aantrekkelijk centrum.</p>

<h2>Florerende economie</h2>
<p>De economische functie van het centrum wordt versterkt door meer diversiteit in het winkelaanbod. De weekmarkt wordt gepromoot. Samenwerking met het Centrummanagement wordt gecontinueerd.</p>

<h2>Dienstverlening</h2>
<p>De dienstverlening wordt verbeterd: digitaal als het kan, persoonlijk als het moet. Vergunningaanvragen worden sneller afgehandeld. De cultuur is meedenken en oplossingen zoeken.</p>`,

'Wonen & Ruimtelijke Ordening': `<header>
<h1>Beleidsbriefing Wonen &amp; Ruimtelijke Ordening</h1>
<p class="subtitle">Gemeente Voorschoten</p>
<p class="meta">Portefeuille: Wethouder Hans van der Elst &middot; Versie 1.0.0</p>
</header>

<h2>Samenvatting</h2>
<p>Wethouder Van der Elst is verantwoordelijk voor volkshuisvesting, woningbouw, omgevingswet, grondzaken en financiën. De coalitie zet in op meer betaalbare woningen: 30% sociaal, 25% middenhuur of sociale koop.</p>

<h2>Woningbouw</h2>
<p>Specifieke doelgroepen zijn jongeren/starters, jonge gezinnen en senioren. Levensloopbestendig bouwen krijgt extra aandacht. Woningbouwprojecten (Segaar/Arsenaal, Leidseweg-Noord) worden voortvarend opgepakt. Doorstroming wordt bevorderd door te bouwen voor senioren.</p>

<h2>Omgevingswet</h2>
<p>De invoering van de Omgevingswet biedt kansen voor eenvoudigere en snellere vergunningverlening. Het omgevingsplan wordt in samenspraak met inwoners en ondernemers opgesteld.</p>`,

'Duurzaamheid, Groen & Klimaat': `<header>
<h1>Beleidsbriefing Duurzaamheid, Groen &amp; Klimaat</h1>
<p class="subtitle">Gemeente Voorschoten</p>
<p class="meta">Portefeuille: Wethouder Hubert Schokker &middot; Versie 1.0.0</p>
</header>

<h2>Samenvatting</h2>
<p>Wethouder Schokker is verantwoordelijk voor duurzaamheid, milieu, energie, beheer openbare ruimte en groen, riolering en grondstoffen. De coalitie werkt aan klimaatadaptatie en stimuleert de energietransitie.</p>

<h2>Energie en klimaat</h2>
<p>Duurzaam bouwen is de standaard. Rioleringen worden wijkgericht up-to-date gebracht. De energietransitie wordt gefaciliteerd door isolatiemaatregelen, zonnepanelen en wijkgerichte warmteoplossingen.</p>

<h2>Groen en biodiversiteit</h2>
<p>Het groene karakter van Voorschoten wordt behouden en versterkt. Bij het kappen van bomen geldt: kap één, plant twee terug. De biodiversiteit wordt beschermd.</p>

<h2>Grondstoffen</h2>
<p>Het grondstoffenplan wordt geactualiseerd met als doel minder restafval. De coalitie kiest voor bronscheiding en onderzoekt nascheiding. Zwerfafval wordt aangepakt met bewonersinitiatieven.</p>`,

'Verkeer & Bereikbaarheid': `<header>
<h1>Beleidsbriefing Verkeer &amp; Bereikbaarheid</h1>
<p class="subtitle">Gemeente Voorschoten</p>
<p class="meta">Portefeuille: Wethouder Hubert Schokker &middot; Versie 1.0.0</p>
</header>

<h2>Samenvatting</h2>
<p>Verkeersveiligheid heeft hoge prioriteit, met name rond scholen en in woonwijken. De coalitie streeft naar 30 km/u-zones in alle woonwijken.</p>

<h2>Bereikbaarheid</h2>
<p>De bereikbaarheid per fiets en openbaar vervoer wordt verbeterd. De coalitie zet zich in voor behoud van goede busverbindingen. Parkeerbeleid wordt geëvalueerd.</p>

<h2>Beheerplannen</h2>
<p>Beheerplannen voor wegen, groen, riolering en openbare verlichting worden geactualiseerd. Bij groot onderhoud worden verbeteringen voor verkeersveiligheid en leefbaarheid meegenomen.</p>`,

'Zorg, Welzijn & Samenleving': `<header>
<h1>Beleidsbriefing Zorg, Welzijn &amp; Samenleving</h1>
<p class="subtitle">Gemeente Voorschoten</p>
<p class="meta">Portefeuille: Wethouder Hubert Schokker &middot; Versie 1.0.0</p>
</header>

<h2>Samenvatting</h2>
<p>Wethouder Schokker is verantwoordelijk voor Wmo, jeugdzorg, welzijn, sport, gezondheidszorg, inwonersparticipatie en vrijwilligersbeleid. De coalitie stuurt op kostenbeheersing zonder kwaliteitsverlies.</p>

<h2>Zorg en welzijn</h2>
<p>Preventie staat voorop. Er wordt geïnvesteerd in vroegsignalering en een wijkgerichte aanpak. Het Sociaal Team Voorschoten speelt een centrale rol. Eenzaamheid onder ouderen wordt aangepakt.</p>

<h2>Voorschoten verenigd</h2>
<p>Voorschoten kent een rijk verenigingsleven. De coalitie investeert in vrijwilligers en de sociale infrastructuur. De bibliotheek blijft behouden. Cultuureducatie voor jongeren wordt gestimuleerd. Onderwijs en onderwijshuisvesting krijgen extra aandacht.</p>

<h2>Sport</h2>
<p>Sport en bewegen wordt gestimuleerd voor alle leeftijdsgroepen. Het zwembad wordt behouden. Sportverenigingen worden ondersteund.</p>`,

'Financiën & Organisatie': `<header>
<h1>Beleidsbriefing Financiën &amp; Organisatie</h1>
<p class="subtitle">Gemeente Voorschoten</p>
<p class="meta">Portefeuille: Wethouder Hans van der Elst &middot; Versie 1.0.0</p>
</header>

<h2>Samenvatting</h2>
<p>Wethouder Van der Elst is verantwoordelijk voor financiën, subsidiebeleid, kunst en cultuur, onderwijs en onderwijshuisvesting. Voorschoten is financieel beter op orde dan vier jaar geleden.</p>

<h2>Financieel beleid</h2>
<p>Nieuw beleid wordt gerealiseerd door het schrappen van oud beleid of door efficiëntere inzet van middelen. Grote investeringen zijn geen vanzelfsprekendheid. Er wordt actief financiële ruimte gezocht, bijvoorbeeld door het afstoten van vastgoed.</p>

<h2>Begrotingsdiscipline</h2>
<p>Uitgangspunt is een structureel sluitende begroting. De OZB wordt niet meer dan trendmatig verhoogd. De stijgende kosten in jeugdzorg en Wmo hebben aandacht.</p>`,

};
