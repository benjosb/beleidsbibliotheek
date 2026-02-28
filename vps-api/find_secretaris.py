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
]

DUTCH_PREFIXES = {'van', 'de', 'den', 'der', 'het', "'t", 'te', 'ten', 'ter', 'op', 'in'}

NOT_NAMES = {
    'openingstijden', 'publieksbalie', 'stadhuis', 'gemeentehuis', 'gemeente',
    'college', 'bestuur', 'pagina', 'secretaris', 'directeur', 'organisatie',
    'contact', 'telefoon', 'adres', 'website', 'email', 'formulier',
    'informatie', 'dienstverlening', 'burgerzaken', 'samenstelling',
    'wethouder', 'burgemeester', 'raadslid', 'griffier', 'fractievoorzitter',
    'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag',
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
    'portefeuille', 'taken', 'verantwoordelijk', 'nevenfuncties', 'coalitie',
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
        if p.lower() in NOT_NAMES:
            return False
        if len(p) < 2 or not p[0].isupper():
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

SECRETARIS_RE = re.compile(
    r'(?:gemeentesecretaris|algemeen\s+directeur|secretaris/algemeen\s+directeur'
    r'|gemeentesecretaris/algemeen\s+directeur)[:\s,/\-–—]*'
    r'(?:(?:mw\.|dhr\.|mr\.|dr\.|ir\.|prof\.|ing\.)\s*)*'
    r'([A-Z][a-zéëïöüàè]+(?:\s+(?:van\s+(?:de|den|der)|de|den|der|het|\'t|te|ten|ter))*'
    r'\s+[A-Z][a-zéëïöüàè]+(?:\s+[A-Z][a-zéëïöüàè]+)?)',
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


# ─── STEP 3: Find email convention via vacatures ───

def find_email_convention(base_url, homepage_html, email_domain):
    """
    Go to vacature pages, open the first real vacancy,
    find a personal email like Voornaam.Achternaam@gemeente.nl
    """
    gemeente_naam = email_domain.replace('.nl', '').replace('.', '')

    # Build vacature URL list: homepage links first, then guesses
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

    email_pattern = re.compile(
        r'[A-Za-z][A-Za-z0-9_.+-]+@' + re.escape(email_domain),
        re.IGNORECASE
    )

    for vac_url in vacature_urls:
        log.info(f"Trying vacatures: {vac_url}")
        resp = safe_get(vac_url)
        if not resp or resp.status_code != 200:
            continue

        # First check the vacature overview page itself for emails
        emails = find_personal_emails(resp.text, email_pattern)
        if emails:
            convention = detect_convention(emails[0])
            log.info(f"Email found on overview: {emails[0]} -> {convention}")
            return convention, emails, vac_url

        # Open the first vacancy link
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
    if len(parts) == 2 and len(parts[0]) > 1 and len(parts[1]) > 1:
        return 'Voornaam.Achternaam'
    if len(parts) == 2 and len(parts[0]) == 1:
        return 'V.Achternaam'
    if len(parts) == 3 and len(parts[0]) > 1:
        return 'Voornaam.Tussenvoegsel.Achternaam'
    if '.' not in local and len(local) > 3:
        return 'voornaamachternaam'
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

    candidates = []
    if convention == 'Voornaam.Achternaam':
        if tussenvoegsels:
            candidates.append(f"{voornaam}.{''.join(t.lower() for t in tussenvoegsels)}{achternaam}@{domain}")
            candidates.append(f"{voornaam}.{'.'.join(t.lower() for t in tussenvoegsels)}.{achternaam}@{domain}")
        candidates.append(f"{voornaam}.{achternaam}@{domain}")
    elif convention == 'V.Achternaam':
        candidates.append(f"{voornaam[0]}.{achternaam}@{domain}")
        if tussenvoegsels:
            candidates.append(f"{voornaam[0]}.{''.join(t.lower() for t in tussenvoegsels)}{achternaam}@{domain}")
    elif convention == 'Voornaam.Tussenvoegsel.Achternaam':
        if tussenvoegsels:
            candidates.append(f"{voornaam}.{'.'.join(t.lower() for t in tussenvoegsels)}.{achternaam}@{domain}")
        candidates.append(f"{voornaam}.{achternaam}@{domain}")
    else:
        tv = ''.join(t.lower() for t in tussenvoegsels)
        if tussenvoegsels:
            candidates.append(f"{voornaam}.{tv}{achternaam}@{domain}")
            candidates.append(f"{voornaam}.{tv}.{achternaam}@{domain}")
            candidates.append(f"{voornaam[0]}.{tv}{achternaam}@{domain}")
            candidates.append(f"{voornaam[0]}.{tv}.{achternaam}@{domain}")
        candidates.append(f"{voornaam}.{achternaam}@{domain}")
        candidates.append(f"{voornaam[0]}.{achternaam}@{domain}")

    return list(dict.fromkeys(candidates))


# ─── MAIN PIPELINE ───

def search_gemeente(gemeente):
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
    }

    # Step 1: Website
    result['steps'].append({'step': 1, 'action': f'Zoek www.{gemeente.lower().replace(" ","-")}.nl'})
    website_url, homepage_html, email_domain = find_website(gemeente)
    if not website_url:
        result['steps'][-1]['status'] = 'mislukt'
        result['status'] = 'mislukt'
        result['error'] = f'Website voor {gemeente} niet gevonden'
        return result
    result['website'] = website_url
    result['steps'][-1]['status'] = 'gevonden'
    result['steps'][-1]['url'] = website_url

    base_url = f"{urlparse(website_url).scheme}://{urlparse(website_url).netloc}"

    # Step 2: Secretaris
    result['steps'].append({'step': 2, 'action': 'Gemeentesecretaris zoeken'})
    naam, bestuur_url, methode = find_secretaris(base_url, homepage_html)
    if naam:
        result['secretaris_naam'] = naam
        result['bestuur_url'] = bestuur_url
        result['steps'][-1]['status'] = f'gevonden via {methode}'
        result['steps'][-1]['naam'] = naam
        result['steps'][-1]['url'] = bestuur_url
    else:
        result['steps'][-1]['status'] = 'niet gevonden'

    # Step 3: Email convention via vacatures
    result['steps'].append({'step': 3, 'action': f'Emailconventie zoeken via vacatures (@{email_domain})'})
    convention, emails, vac_url = find_email_convention(base_url, homepage_html, email_domain)
    result['found_emails'] = emails
    result['vacature_url'] = vac_url
    if convention:
        result['email_convention'] = convention
        result['steps'][-1]['status'] = f'gevonden: {convention}'
        result['steps'][-1]['voorbeeld'] = emails[0] if emails else ''
        result['steps'][-1]['url'] = vac_url
    else:
        result['steps'][-1]['status'] = 'geen persoonlijk email gevonden'

    # Step 4: Generate email
    if naam:
        candidates = derive_email(naam, convention, email_domain)
        result['email_candidates'] = candidates
        result['status'] = 'gevonden'
        result['steps'].append({
            'step': 4,
            'action': 'Email gegenereerd',
            'status': f'{convention or "standaard"} toegepast op {naam}',
            'candidates': candidates,
        })
    else:
        result['status'] = 'deels gevonden' if website_url else 'mislukt'

    return result


if __name__ == '__main__':
    import sys
    gemeente = sys.argv[1] if len(sys.argv) > 1 else 'Maastricht'
    result = search_gemeente(gemeente)
    print(json.dumps(result, indent=2, ensure_ascii=False))
