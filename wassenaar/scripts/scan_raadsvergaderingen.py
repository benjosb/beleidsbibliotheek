"""Stap 1: Scan alle raadsvergaderingen uit iBabs kalender (2022-2026)."""
import requests, re, time, json, os

BASE = "https://wassenaar.bestuurlijkeinformatie.nl"
OUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "raadsvergaderingen.json")

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 BeleidsWijzer/1.0"

vergaderingen = []
seen = set()

for jaar in [2022, 2023, 2024, 2025, 2026]:
    for maand in range(1, 13):
        if jaar == 2026 and maand > 2:
            break
        url = f"{BASE}/Calendar?year={jaar}&month={maand}"
        print(f"{jaar}-{maand:02d}...", end=" ", flush=True)

        try:
            resp = session.get(url, timeout=20)
            html = resp.text

            guids = re.findall(r'/Agenda/Index/([a-f0-9-]+)', html)

            for guid in guids:
                if guid in seen:
                    continue

                idx = html.find(guid)
                chunk = html[idx:idx+500]
                if "Raadsvergadering" in chunk:
                    seen.add(guid)

                    datum_match = re.search(
                        r'(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(\d{4})',
                        chunk, re.IGNORECASE
                    )
                    maand_map = {
                        'januari':1,'februari':2,'maart':3,'april':4,'mei':5,'juni':6,
                        'juli':7,'augustus':8,'september':9,'oktober':10,'november':11,'december':12
                    }

                    if datum_match:
                        d = int(datum_match.group(1))
                        m = maand_map[datum_match.group(2).lower()]
                        j = int(datum_match.group(3))
                        datum = f"{j}-{m:02d}-{d:02d}"
                    else:
                        datum = f"{jaar}-{maand:02d}-01"

                    vergaderingen.append({
                        "guid": guid,
                        "datum": datum,
                        "jaar": jaar,
                    })

        except Exception as e:
            print(f"FOUT: {e}")
            continue

        time.sleep(0.5)
        r = len([v for v in vergaderingen if v["jaar"] == jaar])
        print(f"(raad tot nu toe in {jaar}: {r})")

vergaderingen.sort(key=lambda v: v["datum"])

with open(OUT, "w") as f:
    json.dump(vergaderingen, f, indent=2)

print(f"\nTotaal: {len(vergaderingen)} raadsvergaderingen")
print(f"Opgeslagen in: {OUT}")
for v in vergaderingen:
    print(f"  {v['datum']}  {v['guid'][:8]}...")
