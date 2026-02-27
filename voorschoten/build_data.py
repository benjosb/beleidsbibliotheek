"""
Build Voorschoten data.js from OB raw data.
Maps decisions to policy domains based on type and title keywords.
"""
import json
from collections import Counter, defaultdict

THEMA_MAP = {
    'Bestuur & Veiligheid': {
        'types': ['verkiezingen'],
        'keywords': ['veiligheid', 'politie', 'handhaving', 'boa', 'bestuur', 'noodverordening',
                     'cameratoezicht', 'openbare orde', 'burgemeester', 'ondermijning',
                     'apv', 'evenementenvergunning', 'drank- en horecavergunning',
                     'exploitatievergunning', 'sluiting', 'bibob'],
    },
    'Economie & Dienstverlening': {
        'types': ['exploitatievergunning'],
        'keywords': ['economie', 'winkel', 'ondernemer', 'bedrijventerrein', 'horeca',
                     'markt', 'terras', 'standplaats', 'weekmarkt', 'koopzondag',
                     'dienstverlening', 'digitalisering', 'ict'],
    },
    'Wonen & Ruimtelijke Ordening': {
        'types': ['ruimtelijk plan of omgevingsdocument', 'omgevingsvergunning', 'omgevingsmelding'],
        'keywords': ['wonen', 'woning', 'huur', 'bouw', 'dakkapel', 'verbouw', 'sloop',
                     'bestemmingsplan', 'omgevingsplan', 'omgevingsvergunning', 'omgevingswet',
                     'grond', 'ruimtelijk', 'huisvest', 'huurwoning', 'koopwoning',
                     'starterswoning', 'seniorenwoning', 'transformatorhuisje',
                     'welstand', 'erfafscheiding', 'schutting', 'aanbouw', 'uitbouw',
                     'splitsen', 'appartementen', 'woningbouw'],
    },
    'Duurzaamheid, Groen & Klimaat': {
        'types': [],
        'keywords': ['duurzaam', 'energie', 'klimaat', 'warmte', 'zonnepan', 'laadpaal',
                     'groen', 'boom', 'kap', 'rooien', 'biodiversiteit', 'natuur',
                     'riolering', 'grondstof', 'afval', 'milieu', 'stikstof',
                     'wateroverlast', 'hittestress', 'circulair'],
    },
    'Verkeer & Bereikbaarheid': {
        'types': ['verkeersbesluit of -mededeling'],
        'keywords': ['verkeer', 'parkeer', 'snelheid', 'fiets', 'voetganger', 'zebra',
                     'rotonde', 'kruispunt', 'weg', 'straat', 'brug', 'openbaar vervoer',
                     'bus', 'halte', '30 km', 'drempel', 'verkeers'],
    },
    'Zorg, Welzijn & Samenleving': {
        'types': [],
        'keywords': ['zorg', 'wmo', 'jeugd', 'sociaal', 'welzijn', 'ouderen', 'mantelzorg',
                     'schuld', 'armoede', 'uitkering', 'participatie', 'inburgering',
                     'gezondheid', 'ggd', 'sport', 'zwembad', 'cultuur', 'bibliotheek',
                     'onderwijs', 'school', 'leerling', 'kinderopvang', 'subsidie',
                     'vrijwilliger', 'vereniging', 'speeltuinen', 'monument', 'erfgoed',
                     'begraafplaats'],
    },
    'Financiën & Organisatie': {
        'types': ['delegatie- of mandaatbesluit', 'gemeenschappelijke regeling'],
        'keywords': ['financ', 'belasting', 'ozb', 'rioolheffing', 'afvalstoffenheffing',
                     'leges', 'begroting', 'jaarrekening', 'kadernota', 'treasur',
                     'mandaat', 'volmacht', 'organisatie', 'personeel', 'cao',
                     'bezwaar', 'klacht', 'woo', 'privacy'],
    },
}

def classify(title, doc_type):
    title_lower = title.lower()
    doc_type_lower = doc_type.lower()

    for domein, rules in THEMA_MAP.items():
        for t in rules['types']:
            if t in doc_type_lower:
                return domein
        for kw in rules['keywords']:
            if kw in title_lower:
                return domein

    if 'verordening' in doc_type_lower or 'algemeen verbindend' in doc_type_lower:
        if any(kw in title_lower for kw in ['belasting', 'heffing', 'leges', 'tariev']):
            return 'Financiën & Organisatie'
        if any(kw in title_lower for kw in ['parkeer', 'verkeer']):
            return 'Verkeer & Bereikbaarheid'
        return 'Bestuur & Veiligheid'

    if 'beleidsregel' in doc_type_lower:
        return 'Bestuur & Veiligheid'

    return 'Bestuur & Veiligheid'

with open('voorschoten_ob_raw.json') as f:
    raw = json.load(f)

print(f'Raw records: {len(raw)}')

decisions = []
domain_counts = Counter()
sub_counts = defaultdict(Counter)

for r in raw:
    domein = classify(r['title'], r['type'])
    domain_counts[domein] += 1
    sub_counts[domein][r['type']] += 1

    identifier = r['identifier']
    link = ''
    pdf_url = ''
    if identifier.startswith('gmb-'):
        link = f'https://zoek.officielebekendmakingen.nl/{identifier}.html'
        year = identifier.split('-')[1]
        pdf_url = f'https://repository.overheid.nl/frbr/officielepublicaties/gmb/{year}/{identifier}/1/pdf/{identifier}.pdf'

    decisions.append({
        'naam': r['title'],
        'besluit': '',
        'datum': r['date'],
        'bron': 'college',
        'type_besluit': r['type'].title(),
        'domein': domein,
        'portefeuille': '',
        'link': link,
        'pdf_url': pdf_url,
        'bron_systeem': 'Officiële Bekendmakingen',
        'identifier': identifier,
    })

decisions.sort(key=lambda d: d['datum'], reverse=True)

print('\nDomain distribution:')
for d, c in domain_counts.most_common():
    print(f'  {c:4d} x {d}')

thema_boom = []
for domein in THEMA_MAP.keys():
    kinderen = []
    for sub_type, count in sub_counts[domein].most_common():
        kinderen.append({
            'naam': sub_type.title() if sub_type else 'Overig',
            'aantal': count,
            'raad': 0,
            'college': count,
        })
    thema_boom.append({
        'naam': domein,
        'kinderen': kinderen,
        'aantal': domain_counts[domein],
    })

# Write data.js
with open('data.js', 'w') as f:
    f.write('// Besluit-Wijzer Voorschoten — data.js\n')
    f.write('// Versie: 1.0.0\n')
    f.write(f'// Bron: Officiële Bekendmakingen 2022–2025 ({len(decisions)} publicaties)\n')
    f.write('// Coalitie: VVD, Voorschoten Lokaal, CDA\n')
    f.write(f'// Gegenereerd door build_data.py\n\n')
    f.write('const ALL_DECISIONS_DATA = ')
    json.dump(decisions, f, ensure_ascii=False, indent=2)
    f.write(';\n\n')
    f.write('const THEMA_BOOM_DATA = ')
    json.dump(thema_boom, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print(f'\ndata.js written: {len(decisions)} decisions, {len(thema_boom)} themes')
