// Besluit-wijzer Gemeente X — data.js · v0.1 · Iv3-generieke template (geen gemeente-data)
// Vul met: python3 gemeente-x/scripts/taakveld_clustering.py --target gemeente-x
// (na het koppelen van een gemeente als bron)

const ALL_DECISIONS_DATA = [];

const THEMA_BOOM_DATA = [
  {"naam": "0 Bestuur en ondersteuning", "code": "0", "kinderen": [
    {"naam": "0.1 Bestuur", "code": "0.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.2 Burgerzaken", "code": "0.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.3 Beheer overige gebouwen en gronden", "code": "0.3", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.4 Overhead", "code": "0.4", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.5 Treasury", "code": "0.5", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.61 OZB woningen", "code": "0.61", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.62 OZB niet-woningen", "code": "0.62", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.63 Parkeerbelasting", "code": "0.63", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.64 Belastingen overig", "code": "0.64", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.7 Algemene uitkeringen en overige uitkeringen gemeentefonds", "code": "0.7", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.8 Overige baten en lasten", "code": "0.8", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.9 Vennootschapsbelasting (VpB)", "code": "0.9", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.10 Mutaties reserves", "code": "0.10", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "0.11 Resultaat van de rekening van baten en lasten", "code": "0.11", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0},
  {"naam": "1 Veiligheid", "code": "1", "kinderen": [
    {"naam": "1.1 Crisisbeheersing en brandweer", "code": "1.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "1.2 Openbare orde en veiligheid", "code": "1.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0},
  {"naam": "2 Verkeer, vervoer en waterstaat", "code": "2", "kinderen": [
    {"naam": "2.1 Verkeer en vervoer", "code": "2.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "2.2 Parkeren", "code": "2.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "2.3 Recreatieve havens", "code": "2.3", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "2.4 Economische havens en waterwegen", "code": "2.4", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "2.5 Openbaar vervoer", "code": "2.5", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0},
  {"naam": "3 Economie", "code": "3", "kinderen": [
    {"naam": "3.1 Economische ontwikkeling", "code": "3.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "3.2 Fysieke bedrijfsinfrastructuur", "code": "3.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "3.3 Bedrijvenloket en bedrijfsregelingen", "code": "3.3", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "3.4 Economische promotie", "code": "3.4", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0},
  {"naam": "4 Onderwijs", "code": "4", "kinderen": [
    {"naam": "4.1 Openbaar basisonderwijs", "code": "4.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "4.2 Onderwijshuisvesting", "code": "4.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "4.3 Onderwijsbeleid en leerlingzaken", "code": "4.3", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0},
  {"naam": "5 Sport, cultuur en recreatie", "code": "5", "kinderen": [
    {"naam": "5.1 Sportbeleid en activering", "code": "5.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "5.2 Sportaccommodaties", "code": "5.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "5.3 Cultuurpresentatie, cultuurproductie en cultuurparticipatie", "code": "5.3", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "5.4 Musea", "code": "5.4", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "5.5 Cultureel erfgoed", "code": "5.5", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "5.6 Media", "code": "5.6", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "5.7 Openbaar groen en (openlucht) recreatie", "code": "5.7", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0},
  {"naam": "6 Sociaal domein", "code": "6", "kinderen": [
    {"naam": "6.1 Samenkracht en burgerparticipatie", "code": "6.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "6.2 Toegang en eerstelijnsvoorzieningen", "code": "6.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "6.3 Inkomensregelingen", "code": "6.3", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "6.4 WSW en beschut werk", "code": "6.4", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "6.5 Arbeidsparticipatie", "code": "6.5", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "6.6 Maatwerkvoorzieningen (WMO)", "code": "6.6", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "6.71 Maatwerkdienstverlening 18+", "code": "6.71", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "6.72 Maatwerkdienstverlening 18-", "code": "6.72", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0},
  {"naam": "7 Volksgezondheid en milieu", "code": "7", "kinderen": [
    {"naam": "7.1 Volksgezondheid", "code": "7.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "7.2 Riolering", "code": "7.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "7.3 Afval", "code": "7.3", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "7.4 Milieubeheer", "code": "7.4", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "7.5 Begraafplaatsen en crematoria", "code": "7.5", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0},
  {"naam": "8 Volkshuisvesting, leefomgeving en stedelijke vernieuwing", "code": "8", "kinderen": [
    {"naam": "8.1 Ruimte en leefomgeving", "code": "8.1", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "8.2 Grondexploitatie (niet-bedrijventerreinen)", "code": "8.2", "aantal": 0, "raad": 0, "college": 0, "kinderen": []},
    {"naam": "8.3 Wonen en bouwen", "code": "8.3", "aantal": 0, "raad": 0, "college": 0, "kinderen": []}
  ], "aantal": 0}
];

const TAAKVELD_BOOM_DATA = THEMA_BOOM_DATA;
