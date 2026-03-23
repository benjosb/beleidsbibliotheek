"""
WIL Boardroom API — Gemeentesecretaris Finder v2
Simple strategy:
1. Go to www.{gemeente}.nl
2. Find secretaris name on bestuur/college page
3. Find a vacancy page, grab a personal email
4. Apply the email pattern to the secretaris name
"""

import re
import json
import time
import logging
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.5',
}

GENERIC_PREFIXES = [
    'info@', 'contact@', 'gemeente@', 'post@', 'communicatie@', 'webmaster@',
    'privacy@', 'klacht', 'bezwaar', 'wmo@', 'balie@', 'burgerzaken@',
    'werkenbij@', 'werkenvoor@', 'vacatures@', 'sollicit', 'hr@', 'personeels',
    'recruitment@', 'redactie@', 'pers@', 'media@', 'helpdesk@', 'support@',
    'beheer@', 'postbus@', 'secretariaat@', 'griffie@', 'bestuur@',
    'economie@', 'economisch@', 'ondernemer@', 'mkb@', 'bedrijv',
    'vergunning', 'woo@', 'sociaal', 'jeugd@', 'zorg@', 'sport@',
    'cultuur@', 'duurzaam', 'milieu@', 'groen@', 'verkeer@',
    'welkom@', 'receptie@', 'planning@', 'archief@', 'belasting',
    'financien@', 'inkoop@', 'aanbesteding', 'werken@', 'noreply',
    'no-reply', 'notificatie', 'systeem', 'admin@', 'test@',
    'bouwen@', 'wonen@', 'ruimte@', 'openbaar', 'publiek',
    'subsidie', 'handhaving', 'toezicht', 'bezwaar', 'klant',
    'onderwijs@', 'erfgoed@', 'parkeren@', 'evenement', 'afval@',
]

DUTCH_PREFIXES = {'van', 'de', 'den', 'der', 'het', "'t", 'te', 'ten', 'ter', 'op', 'in'}

NOT_NAMES = {
    'openingstijden', 'publieksbalie', 'stadhuis', 'gemeentehuis', 'gemeente',
    'college', 'bestuur', 'pagina', 'secretaris', 'directeur', 'organisatie',
    'contact', 'contactgegevens', 'contactformulier', 'contactpersoon',
    'telefoon', 'telefoonnummer', 'adres', 'website', 'email', 'formulier',
    'informatie', 'dienstverlening', 'burgerzaken', 'samenstelling',
    'wethouder', 'burgemeester', 'raadslid', 'griffier', 'fractievoorzitter',
    'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag',
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
    'portefeuille', 'taken', 'verantwoordelijk', 'nevenfuncties', 'coalitie',
    'bereikbaar', 'bereikbaarheid', 'beschikbaar', 'beschikbaarheid',
    'publicaties', 'besluiten', 'vergaderingen', 'documenten',
    'meer', 'lees', 'terug', 'volgende', 'vorige', 'download',
    'bekijk', 'overzicht', 'sluiten', 'zoeken', 'resultaten',
    'biografie', 'profiel', 'foto', 'portret',
    'partij', 'fractie', 'raad', 'commissie', 'agenda',
    'beleid', 'regeling', 'verordening', 'besluit',
}


def safe_get(url, timeout=15):
    try:
        time.sleep(0.5)
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True, verify=True)
        resp.raise_for_status()
        return resp
    except Exception as e:
        log.warning(f"GET {url} failed: {e}")
        return None


def is_plausible_name(name):
    parts = name.split()
    if len(parts) < 2:
        return False
    meaningful = [p for p in parts if p.lower() not in DUTCH_PREFIXES]
    if len(meaningful) < 2:
        return False
    for p in meaningful:
        low = p.lower()
        if low in NOT_NAMES:
            return False
        if any(len(stop) >= 5 and low.startswith(stop) for stop in NOT_NAMES):
            return False
        if len(p) < 2 or not p[0].isupper():
            return False
        if len(p) > 18:
            return False
    if len(meaningful) > 3:
        return False
    return len(name) <= 50


def is_personal_email(email):
    local = email.split('@')[0].lower()
    return not any(local.startswith(g.rstrip('@')) for g in GENERIC_PREFIXES)


# ─── STEP 1: Find the website ───

def find_website(gemeente):
    """Returns (url, html, email_domain).
    email_domain is the bare gemeente name (e.g. 'maastricht.nl'),
    even if the site is at gemeentemaastricht.nl."""
    naam = gemeente.lower().strip().replace(' ', '-')
    naam_no_hyphen = naam.replace('-', '')
    candidates = [
        f"https://www.{naam}.nl",
        f"https://www.gemeente{naam_no_hyphen}.nl",
    ]
    if naam != naam_no_hyphen:
        candidates.append(f"https://www.{naam_no_hyphen}.nl")

    email_domain = f"{naam}.nl"

    for url in candidates:
        log.info(f"Trying: {url}")
        resp = safe_get(url)
        if resp and resp.status_code == 200:
            log.info(f"Found website: {resp.url}")
            return resp.url, resp.text, email_domain
    return None, None, None


# ─── STEP 2: Find secretaris name ───

_STOP_AFTER_NAME = (
    r'(?!Contact|Telefoon|Bereik|Informatie|Openingstijd|Publicat|Nevenfunct'
    r'|Portefeuille|Biografie|Profiel|Foto|Formulier|Lees|Meer|Bekijk|Download'
    r'|Overzicht|Zoek|Document|Vergader|Agenda|Beleid|Regeling|Verordening'
    r'|Besluit|Partij|Fractie|Raad|Commissie|Samenstelling)'
)

SECRETARIS_RE = re.compile(
    r'(?:gemeentesecretaris|algemeen\s+directeur|secretaris/algemeen\s+directeur'
    r'|gemeentesecretaris/algemeen\s+directeur)[:\s,/\-–—]*'
    r'(?:(?:mw\.|dhr\.|mr\.|dr\.|ir\.|prof\.|ing\.)\s*)*'
    r'([A-Z][a-zéëïöüàè]+(?:\s+(?:van\s+(?:de|den|der)|de|den|der|het|\'t|te|ten|ter))*'
    r'\s+' + _STOP_AFTER_NAME + r'[A-Z][a-zéëïöüàè]+'
    r'(?:\s+' + _STOP_AFTER_NAME + r'[A-Z][a-zéëïöüàè]+)?)',
    re.IGNORECASE
)

SEARCH_PATTERNS = [
    '/zoeken?trefwoord=gemeentesecretaris',
    '/zoeken?searchtext=gemeentesecretaris',
    '/zoeken?q=gemeentesecretaris',
    '/search?q=gemeentesecretaris',
    '/zoekresultaten?query=gemeentesecretaris',
]

BESTUUR_PATHS = [
    '/bestuur/college',
    '/bestuur-en-organisatie/college-van-burgemeester-en-wethouders',
    '/college-van-burgemeester-en-wethouders',
    '/college',
    '/bestuur',
    '/bestuur-en-organisatie',
    '/over-de-gemeente/bestuur/college',
    '/gemeentebestuur/college',
    '/het-college',
    '/organisatie/bestuur',
]


def scan_homepage_links(base_url, homepage_html, keywords):
    """Find links on the homepage matching keywords. Returns list of full URLs."""
    soup = BeautifulSoup(homepage_html, 'lxml')
    found = []
    for a in soup.find_all('a', href=True):
        text = a.get_text(strip=True).lower()
        href = a['href'].lower()
        if any(kw in text or kw in href for kw in keywords):
            full = urljoin(base_url, a['href'])
            if full not in found:
                found.append(full)
    return found


def find_secretaris(base_url, homepage_html):
    """Try search, then homepage links, then hardcoded paths."""
    # Strategy A: site search
    for pattern in SEARCH_PATTERNS:
        url = urljoin(base_url, pattern)
        resp = safe_get(url)
        if not resp or 'secretaris' not in resp.text.lower():
            continue
        soup = BeautifulSoup(resp.text, 'lxml')
        text = soup.get_text(' ', strip=True)
        m = SECRETARIS_RE.search(text)
        if m and is_plausible_name(m.group(1)):
            log.info(f"Found via search: {m.group(1)}")
            return m.group(1).strip(), url, 'zoekfunctie'

    # Strategy B: scan homepage for bestuur/organisatie links, follow them
    bestuur_links = scan_homepage_links(base_url, homepage_html,
        ['bestuur', 'college', 'organisatie', 'b-en-w', 'burgemeester'])
    for link in bestuur_links:
        resp = safe_get(link)
        if not resp:
            continue
        soup = BeautifulSoup(resp.text, 'lxml')
        text = soup.get_text(' ', strip=True)
        m = SECRETARIS_RE.search(text)
        if m and is_plausible_name(m.group(1)):
            log.info(f"Found via homepage link: {m.group(1)}")
            return m.group(1).strip(), link, 'bestuurspagina (homepage link)'

        # One level deeper: follow sub-links on the bestuur page
        for a in soup.find_all('a', href=True):
            a_text = a.get_text(strip=True).lower()
            a_href = a['href'].lower()
            if any(kw in a_text or kw in a_href for kw in ['secretaris', 'directeur', 'organisatie', 'ambtelijk']):
                sub_url = urljoin(link, a['href'])
                sub_resp = safe_get(sub_url)
                if not sub_resp:
                    continue
                sub_text = BeautifulSoup(sub_resp.text, 'lxml').get_text(' ', strip=True)
                m2 = SECRETARIS_RE.search(sub_text)
                if m2 and is_plausible_name(m2.group(1)):
                    log.info(f"Found via sub-link: {m2.group(1)}")
                    return m2.group(1).strip(), sub_url, 'bestuurspagina (sub-link)'

    # Strategy C: hardcoded fallback paths
    for path in BESTUUR_PATHS:
        url = urljoin(base_url, path)
        if url in bestuur_links:
            continue
        resp = safe_get(url)
        if not resp:
            continue
        soup = BeautifulSoup(resp.text, 'lxml')
        text = soup.get_text(' ', strip=True)
        m = SECRETARIS_RE.search(text)
        if m and is_plausible_name(m.group(1)):
            log.info(f"Found via hardcoded path: {m.group(1)}")
            return m.group(1).strip(), url, 'bestuurspagina'

    return None, None, None


# ─── STEP 3: Find email convention via vacatures + raadsinformatie ───

def find_email_convention(base_url, homepage_html, email_domain):
    """
    Strategy order:
    1. raadsinformatie.nl — raadsstukken hebben vaak steller + email
    2. Vacature pages — personal emails in job postings
    """
    gemeente_naam = email_domain.replace('.nl', '').replace('.', '')

    email_pattern = re.compile(
        r'[A-Za-z][A-Za-z0-9_.+-]+@' + re.escape(email_domain),
        re.IGNORECASE
    )

    # Strategy A: raadsinformatie.nl
    raadsinfo_url = f"https://{gemeente_naam}.raadsinformatie.nl"
    log.info(f"Trying raadsinformatie: {raadsinfo_url}")
    resp = safe_get(raadsinfo_url)
    if resp and resp.status_code == 200:
        emails = find_personal_emails(resp.text, email_pattern)
        if emails:
            convention = detect_convention(emails[0])
            log.info(f"Email found on raadsinformatie homepage: {emails[0]} -> {convention}")
            return convention, emails, raadsinfo_url

        soup = BeautifulSoup(resp.text, 'lxml')
        for a in soup.find_all('a', href=True):
            href = a['href']
            text_l = a.get_text(strip=True).lower()
            href_l = href.lower()
            if any(kw in text_l or kw in href_l for kw in
                   ['document', 'vergadering', 'agenda', 'besluit', 'raadsvoorstel', 'memo']):
                doc_url = urljoin(raadsinfo_url, href)
                if urlparse(doc_url).netloc != urlparse(raadsinfo_url).netloc:
                    continue
                log.info(f"Opening raadsinformatie page: {doc_url}")
                doc_resp = safe_get(doc_url)
                if not doc_resp:
                    continue
                emails = find_personal_emails(doc_resp.text, email_pattern)
                if emails:
                    convention = detect_convention(emails[0])
                    log.info(f"Email found on raadsinformatie: {emails[0]} -> {convention}")
                    return convention, emails, doc_url

    # Strategy B: economie/ondernemerspagina's (beleidsmedewerkers zijn bereikbaar)
    econ_links = scan_homepage_links(base_url, homepage_html,
        ['ondernemer', 'economie', 'bedrijv', 'vestig', 'bedrijfscontact'])
    econ_guesses = [
        urljoin(base_url, '/economische-visie'),
        urljoin(base_url, '/ondernemers'),
        urljoin(base_url, '/ondernemers-en-organisaties'),
        urljoin(base_url, '/bedrijfscontactfunctionaris'),
        urljoin(base_url, '/economie'),
        urljoin(base_url, '/ondernemen'),
    ]
    econ_urls = list(dict.fromkeys(econ_links + econ_guesses))

    for econ_url in econ_urls:
        log.info(f"Trying economie page: {econ_url}")
        resp = safe_get(econ_url)
        if not resp or resp.status_code != 200:
            continue
        emails = find_personal_emails(resp.text, email_pattern)
        if emails:
            convention = detect_convention(emails[0])
            log.info(f"Email found on economie page: {emails[0]} -> {convention}")
            return convention, emails, econ_url

        soup = BeautifulSoup(resp.text, 'lxml')
        for a in soup.find_all('a', href=True):
            href_l = a['href'].lower()
            text_l = a.get_text(strip=True).lower()
            if any(kw in text_l or kw in href_l for kw in
                   ['visie', 'contact', 'bedrijfscontact', 'mkb', 'economisch', 'vestiging']):
                sub_url = urljoin(econ_url, a['href'])
                if urlparse(sub_url).netloc != urlparse(base_url).netloc:
                    continue
                log.info(f"Opening economie sub-page: {sub_url}")
                sub_resp = safe_get(sub_url)
                if not sub_resp:
                    continue
                emails = find_personal_emails(sub_resp.text, email_pattern)
                if emails:
                    convention = detect_convention(emails[0])
                    log.info(f"Email found on economie sub-page: {emails[0]} -> {convention}")
                    return convention, emails, sub_url

    # Strategy C: vacatures
    vacature_urls = []
    hp_links = scan_homepage_links(base_url, homepage_html,
        ['vacatur', 'werken-bij', 'werken bij', 'werkenbij', 'carriere', 'banen'])
    vacature_urls.extend(hp_links)
    vacature_urls.extend([
        urljoin(base_url, '/vacatures'),
        urljoin(base_url, '/werken-bij'),
        urljoin(base_url, '/werken-bij-de-gemeente'),
        f"https://www.werkenbij{gemeente_naam}.nl",
        f"https://werkenbij.{email_domain}",
        f"https://www.werkenvoor{gemeente_naam}.nl",
    ])
    vacature_urls = list(dict.fromkeys(vacature_urls))

    for vac_url in vacature_urls:
        log.info(f"Trying vacatures: {vac_url}")
        resp = safe_get(vac_url)
        if not resp or resp.status_code != 200:
            continue

        emails = find_personal_emails(resp.text, email_pattern)
        if emails:
            convention = detect_convention(emails[0])
            log.info(f"Email found on overview: {emails[0]} -> {convention}")
            return convention, emails, vac_url

        soup = BeautifulSoup(resp.text, 'lxml')
        for a in soup.find_all('a', href=True):
            href = a['href']
            text = a.get_text(strip=True).lower()
            if len(text) < 5:
                continue
            if any(kw in text or kw in href.lower() for kw in ['vacature', 'functie', 'sollicit', 'medewerker', 'adviseur', 'beleids', 'jurist', 'projectleider']):
                detail_url = urljoin(vac_url, href)
                if urlparse(detail_url).netloc not in [urlparse(base_url).netloc, urlparse(vac_url).netloc]:
                    continue
                log.info(f"Opening vacancy: {detail_url}")
                detail_resp = safe_get(detail_url)
                if not detail_resp:
                    continue
                emails = find_personal_emails(detail_resp.text, email_pattern)
                if emails:
                    convention = detect_convention(emails[0])
                    log.info(f"Email found in vacancy: {emails[0]} -> {convention}")
                    return convention, emails, detail_url

    return None, [], None


def find_personal_emails(html, pattern):
    soup = BeautifulSoup(html, 'lxml')
    text = soup.get_text(' ', strip=True)
    for a in soup.find_all('a', href=True):
        if a['href'].startswith('mailto:'):
            text += ' ' + a['href'].replace('mailto:', '')
    all_emails = list(set(pattern.findall(text)))
    return [e for e in all_emails if is_personal_email(e)]


def detect_convention(email):
    """Detect pattern from a single example email like Diana.Peute@maastricht.nl"""
    local = email.split('@')[0]
    parts = local.split('.')

    if '.' not in local and len(local) > 2:
        if len(local) <= 12 and local[1:].isalpha() and local[1:][0].isupper():
            return 'VAchternaam'
        if len(local) <= 12 and local[0].islower() and local[1:].islower():
            return 'VAchternaam'
        return 'voornaamachternaam'

    if len(parts) == 2 and len(parts[0]) > 1 and len(parts[1]) > 1:
        return 'Voornaam.Achternaam'
    if len(parts) == 2 and len(parts[0]) == 1:
        return 'V.Achternaam'
    if len(parts) == 3 and len(parts[0]) > 1:
        return 'Voornaam.Tussenvoegsel.Achternaam'
    return 'Voornaam.Achternaam'


# ─── STEP 4: Generate email ───

def derive_email(name, convention, domain):
    domain = domain.replace('www.', '')
    parts = name.split()
    voornaam = parts[0]
    tussenvoegsels = []
    achternaam_parts = []
    for p in parts[1:]:
        if p.lower() in DUTCH_PREFIXES:
            tussenvoegsels.append(p)
        else:
            achternaam_parts.append(p)
    achternaam = achternaam_parts[-1] if achternaam_parts else parts[-1]
    tv = ''.join(t.lower() for t in tussenvoegsels)

    candidates = []
    if convention == 'VAchternaam':
        candidates.append(f"{voornaam[0].lower()}{tv}{achternaam.lower()}@{domain}")
        if tussenvoegsels:
            candidates.append(f"{voornaam[0].lower()}{achternaam.lower()}@{domain}")
        candidates.append(f"{voornaam[0]}.{tv}{achternaam}@{domain}" if tv else f"{voornaam[0]}.{achternaam}@{domain}")
    elif convention == 'Voornaam.Achternaam':
        if tussenvoegsels:
            candidates.append(f"{voornaam}.{tv}{achternaam}@{domain}")
            candidates.append(f"{voornaam}.{'.'.join(t.lower() for t in tussenvoegsels)}.{achternaam}@{domain}")
        candidates.append(f"{voornaam}.{achternaam}@{domain}")
    elif convention == 'V.Achternaam':
        candidates.append(f"{voornaam[0]}.{achternaam}@{domain}")
        if tussenvoegsels:
            candidates.append(f"{voornaam[0]}.{tv}{achternaam}@{domain}")
    elif convention == 'Voornaam.Tussenvoegsel.Achternaam':
        if tussenvoegsels:
            candidates.append(f"{voornaam}.{'.'.join(t.lower() for t in tussenvoegsels)}.{achternaam}@{domain}")
        candidates.append(f"{voornaam}.{achternaam}@{domain}")
    elif convention == 'voornaamachternaam':
        candidates.append(f"{voornaam.lower()}{tv}{achternaam.lower()}@{domain}")
        if tussenvoegsels:
            candidates.append(f"{voornaam.lower()}{achternaam.lower()}@{domain}")
        candidates.append(f"{voornaam[0].lower()}{tv}{achternaam.lower()}@{domain}")
    else:
        if tussenvoegsels:
            candidates.append(f"{voornaam}.{tv}{achternaam}@{domain}")
            candidates.append(f"{voornaam}.{tv}.{achternaam}@{domain}")
            candidates.append(f"{voornaam[0]}.{tv}{achternaam}@{domain}")
        candidates.append(f"{voornaam}.{achternaam}@{domain}")
        candidates.append(f"{voornaam[0]}.{achternaam}@{domain}")
        candidates.append(f"{voornaam[0].lower()}{achternaam.lower()}@{domain}")

    return list(dict.fromkeys(candidates))


# ─── MAIN PIPELINE ───

def _derive_email_domain_from_url(url):
    """Extract email domain (e.g. gemeentegroningen.nl) from website URL."""
    parsed = urlparse(url)
    netloc = parsed.netloc or url
    if netloc.startswith('www.'):
        netloc = netloc[4:]
    return netloc if netloc else None


def search_gemeente(gemeente, manual=None):
    manual = manual or {}
    result = {
        'gemeente': gemeente,
        'status': 'started',
        'steps': [],
        'website': None,
        'bestuur_url': None,
        'secretaris_naam': None,
        'email_convention': None,
        'email_candidates': [],
        'found_emails': [],
        'vacature_url': None,
        'error': None,
        'stuck_at': None,
        'prompt': None,
        'prompt_field': None,
    }

    # Step 1: Website
    result['steps'].append({'step': 1, 'action': f'Zoek www.{gemeente.lower().replace(" ","-")}.nl'})
    if manual.get('website'):
        website_url = manual['website'].strip()
        if not website_url.startswith(('http://', 'https://')):
            website_url = 'https://' + website_url
        resp = safe_get(website_url)
        if resp and resp.status_code == 200:
            website_url = resp.url
            homepage_html = resp.text
            email_domain = _derive_email_domain_from_url(website_url) or f"{gemeente.lower().replace(' ', '-')}.nl"
        else:
            result['steps'][-1]['status'] = 'mislukt'
            result['status'] = 'mislukt'
            result['error'] = f'Handmatige URL niet bereikbaar: {website_url}'
            result['stuck_at'] = 'step1'
            result['prompt'] = 'URL van de gemeente niet bereikbaar. Controleer en vul opnieuw in (bijv. www.gemeenteX.nl):'
            result['prompt_field'] = 'website'
            return result
    else:
        website_url, homepage_html, email_domain = find_website(gemeente)
        if not website_url:
            result['steps'][-1]['status'] = 'mislukt'
            result['status'] = 'mislukt'
            result['error'] = f'Website voor {gemeente} niet gevonden'
            result['stuck_at'] = 'step1'
            result['prompt'] = 'URL van de gemeente niet gevonden. Vul handmatig in (bijv. www.gemeenteX.nl):'
            result['prompt_field'] = 'website'
            return result
    result['website'] = website_url
    result['steps'][-1]['status'] = 'gevonden'
    result['steps'][-1]['url'] = website_url

    base_url = f"{urlparse(website_url).scheme}://{urlparse(website_url).netloc}"

    # Step 2: Secretaris
    result['steps'].append({'step': 2, 'action': 'Gemeentesecretaris zoeken'})
    if manual.get('secretaris_naam'):
        naam = manual['secretaris_naam'].strip()
        bestuur_url = manual.get('bestuur_url', '').strip() or website_url
        methode = 'handmatig'
    elif manual.get('bestuur_url'):
        bestuur_url = manual['bestuur_url'].strip()
        if not bestuur_url.startswith(('http://', 'https://')):
            bestuur_url = urljoin(base_url, bestuur_url)
        resp = safe_get(bestuur_url)
        if resp:
            soup = BeautifulSoup(resp.text, 'lxml')
            text = soup.get_text(' ', strip=True)
            m = SECRETARIS_RE.search(text)
            naam = m.group(1).strip() if m and is_plausible_name(m.group(1)) else None
        else:
            naam = None
        methode = 'handmatige college-URL'
    else:
        naam, bestuur_url, methode = find_secretaris(base_url, homepage_html)

    if naam:
        result['secretaris_naam'] = naam
        result['bestuur_url'] = bestuur_url
        result['steps'][-1]['status'] = f'gevonden via {methode}'
        result['steps'][-1]['naam'] = naam
        result['steps'][-1]['url'] = bestuur_url
    else:
        result['steps'][-1]['status'] = 'niet gevonden'
        result['stuck_at'] = 'step2'
        result['prompt'] = 'Naam gemeentesecretaris niet gevonden. Vul handmatig in (bijv. Jan Jansen) of geef de URL van de collegepagina:'
        result['prompt_field'] = 'secretaris_naam'
        result['status'] = 'deels gevonden'
        result['error'] = 'Gemeentesecretaris niet gevonden'
        return result

    # Step 3: Email convention
    result['steps'].append({'step': 3, 'action': f'Emailconventie zoeken via vacatures (@{email_domain})'})
    if manual.get('email_convention'):
        convention = manual['email_convention'].strip()
        emails = []
        vac_url = None
    else:
        convention, emails, vac_url = find_email_convention(base_url, homepage_html, email_domain)
    result['found_emails'] = emails
    result['vacature_url'] = vac_url
    if convention:
        result['email_convention'] = convention
        result['steps'][-1]['status'] = f'gevonden: {convention}' if not manual.get('email_convention') else f'handmatig: {convention}'
        result['steps'][-1]['voorbeeld'] = emails[0] if emails else ''
        result['steps'][-1]['url'] = vac_url
    else:
        result['steps'][-1]['status'] = 'geen persoonlijk email gevonden'
        result['stuck_at'] = 'step3'
        result['prompt'] = 'Emailconventie niet gevonden. Kies of vul in: Voornaam.Achternaam | V.Achternaam | voornaamachternaam | VAchternaam'
        result['prompt_field'] = 'email_convention'
        result['status'] = 'deels gevonden'
        result['error'] = 'Emailconventie niet gevonden'
        return result

    # Step 4: Generate email
    candidates = derive_email(naam, convention, email_domain)
    result['email_candidates'] = candidates
    result['status'] = 'gevonden'
    result['steps'].append({
        'step': 4,
        'action': 'Email gegenereerd',
        'status': f'{convention} toegepast op {naam}',
        'candidates': candidates,
    })
    return result


if __name__ == '__main__':
    import sys
    gemeente = sys.argv[1] if len(sys.argv) > 1 else 'Maastricht'
    result = search_gemeente(gemeente)
    print(json.dumps(result, indent=2, ensure_ascii=False))
