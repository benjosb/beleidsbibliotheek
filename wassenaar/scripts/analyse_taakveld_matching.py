#!/usr/bin/env python3
"""
Dry-run taakveld-mapping: matcht alle besluiten in data.js tegen de
654 keywords in taakvelden_iv3.js en rapporteert dekking, gaps en ruis.

Gebruik:
    python3 scripts/analyse_taakveld_matching.py

Output:
    docs/TAAKVELD_MATCHING_ANALYSE.md   (gedetailleerd rapport)
    stdout                              (samenvatting)
"""

import json
import os
import re
import subprocess
import sys
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WASSENAAR_DIR = os.path.dirname(SCRIPT_DIR)
DATA_JS = os.path.join(WASSENAAR_DIR, "data.js")
TAAKVELDEN_JS = os.path.join(WASSENAAR_DIR, "taakvelden_iv3.js")
OB_META = os.path.join(WASSENAAR_DIR, "data", "ob_metadata.json")
DOCS_DIR = os.path.join(WASSENAAR_DIR, "docs")
OUTPUT_MD = os.path.join(DOCS_DIR, "TAAKVELD_MATCHING_ANALYSE.md")


def load_decisions():
    """Laad ALL_DECISIONS_DATA uit data.js via Node.js."""
    script = f"""
    const fs = require('fs');
    let c = fs.readFileSync({json.dumps(DATA_JS)}, 'utf-8');
    c = c.replace(/if\\s*\\(typeof\\s+module[\\s\\S]*$/, '');
    c = c.replace(/^const /gm, 'globalThis.');
    eval(c);
    process.stdout.write(JSON.stringify(globalThis.ALL_DECISIONS_DATA));
    """
    result = subprocess.run(["node", "-e", script], capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        print("FOUT bij laden data.js:", result.stderr)
        sys.exit(1)
    return json.loads(result.stdout)


def load_taakvelden():
    """Laad BBV_TAAKVELDEN_IV3 uit taakvelden_iv3.js via Node.js."""
    script = f"""
    const fs = require('fs');
    let c = fs.readFileSync({json.dumps(TAAKVELDEN_JS)}, 'utf-8');
    c = c.replace(/^const /gm, 'globalThis.');
    eval(c);
    process.stdout.write(JSON.stringify(globalThis.BBV_TAAKVELDEN_IV3));
    """
    result = subprocess.run(["node", "-e", script], capture_output=True, text=True, timeout=10)
    if result.returncode != 0:
        print("FOUT bij laden taakvelden_iv3.js:", result.stderr)
        sys.exit(1)
    return json.loads(result.stdout)


def load_ob_metadata():
    """Laad OB metadata (subject, type, etc.) per identifier."""
    if not os.path.exists(OB_META):
        print(f"  OB metadata niet gevonden: {OB_META}")
        return {}
    with open(OB_META, "r", encoding="utf-8") as f:
        meta = json.load(f)
    return {r["identifier"]: r for r in meta}


def match_keywords(text, keywords):
    """Case-insensitive substring matching. Geeft lijst van matchende keywords terug."""
    text_lower = text.lower()
    return [kw for kw in keywords if kw.lower() in text_lower]


def main():
    os.makedirs(DOCS_DIR, exist_ok=True)

    print("=== Taakveld-matching analyse ===\n")

    print("1. Laden data...")
    decisions = load_decisions()
    print(f"   {len(decisions)} besluiten geladen")

    print("2. Laden taakvelden...")
    tv_raw = load_taakvelden()
    # Flatten: lijst van {code, naam, keywords, ...} per hoofdstuk
    taakvelden = []
    for hoofdstuk_idx, tvs in tv_raw.items():
        for tv in tvs:
            taakvelden.append({
                "code": tv["code"],
                "naam": tv["naam"],
                "keywords": tv.get("keywords", []),
                "hoofdstuk": int(hoofdstuk_idx),
                "type": tv.get("type", ""),
            })
    print(f"   {len(taakvelden)} taakvelden, {sum(len(t['keywords']) for t in taakvelden)} keywords")

    print("3. Laden OB metadata...")
    ob_meta = load_ob_metadata()
    print(f"   {len(ob_meta)} OB records")

    # Bouw PORTEFEUILLE_NAAR_BBV mapping
    port_naar_bbv = {
        'Bestuur & Veiligheid': 0,
        'Financiën, Economie & Sport': 3,
        'Ruimte, Duurzaamheid & Mobiliteit': 8,
        'Sociaal Domein, Wonen & Onderwijs': 6,
        'Cultuur & Welzijn': 5,
        'Bedrijfsvoering': 0,
    }

    print("4. Matching...\n")

    # Per besluit: welke taakvelden matchen?
    results = []
    for d in decisions:
        naam = d.get("naam", "")
        besluit = d.get("besluit", "")
        # OB metadata toevoegen als beschikbaar
        ob_extra = ""
        identifier = d.get("identifier", "")
        if identifier and identifier in ob_meta:
            m = ob_meta[identifier]
            ob_extra = " ".join(filter(None, [
                m.get("subject", ""),
                m.get("alternative", ""),
                m.get("source", ""),
            ]))

        full_text = f"{naam} {besluit} {ob_extra}"

        matched_tvs = []
        matched_kw_detail = {}
        for tv in taakvelden:
            hits = match_keywords(full_text, tv["keywords"])
            if hits:
                matched_tvs.append(tv["code"])
                matched_kw_detail[tv["code"]] = hits

        results.append({
            "naam": naam,
            "datum": d.get("datum", ""),
            "bron": d.get("bron", ""),
            "bron_systeem": d.get("bron_systeem", ""),
            "domein": d.get("domein", ""),
            "type_besluit": d.get("type_besluit", ""),
            "identifier": identifier,
            "bbv_hoofdstuk": port_naar_bbv.get(d.get("domein", ""), -1),
            "matched_taakvelden": matched_tvs,
            "matched_keywords": matched_kw_detail,
            "match_count": len(matched_tvs),
        })

    # ─── Analyse ───
    total = len(results)
    matched = [r for r in results if r["match_count"] > 0]
    unmatched = [r for r in results if r["match_count"] == 0]
    multi = [r for r in results if r["match_count"] >= 2]
    high = [r for r in results if r["match_count"] >= 5]

    print(f"   Totaal: {total}")
    print(f"   Gematcht (≥1 taakveld): {len(matched)} ({100*len(matched)/total:.1f}%)")
    print(f"   Ongematcht: {len(unmatched)} ({100*len(unmatched)/total:.1f}%)")
    print(f"   Multi-match (≥2): {len(multi)} ({100*len(multi)/total:.1f}%)")
    print(f"   Hoog-match (≥5): {len(high)} ({100*len(high)/total:.1f}%)")

    # Per bron_systeem
    for bs in ['iBabs', 'Officiële Bekendmakingen']:
        bs_items = [r for r in results if r["bron_systeem"] == bs]
        bs_matched = [r for r in bs_items if r["match_count"] > 0]
        print(f"\n   {bs}: {len(bs_matched)}/{len(bs_items)} gematcht ({100*len(bs_matched)/len(bs_items):.1f}%)")

    # Per bron (raad/college)
    for bron in ['raad', 'college']:
        b_items = [r for r in results if r["bron"] == bron]
        b_matched = [r for r in b_items if r["match_count"] > 0]
        print(f"   {bron}: {len(b_matched)}/{len(b_items)} gematcht ({100*len(b_matched)/len(b_items):.1f}%)")

    # Per taakveld: hits
    tv_hits = defaultdict(list)
    tv_kw_freq = defaultdict(lambda: defaultdict(int))
    for r in results:
        for tv_code in r["matched_taakvelden"]:
            tv_hits[tv_code].append(r)
            for kw in r["matched_keywords"].get(tv_code, []):
                tv_kw_freq[tv_code][kw] += 1

    # Per hoofdstuk: dekking
    hoofdstuk_namen = {0:'Bestuur en ondersteuning', 1:'Veiligheid', 2:'Verkeer, vervoer en waterstaat',
        3:'Economie', 4:'Onderwijs', 5:'Sport, cultuur en recreatie',
        6:'Sociaal domein', 7:'Volksgezondheid en milieu', 8:'VHROSV'}

    # ─── Markdown rapport ───
    md = []
    md.append("# Taakveld-mapping kwaliteitsanalyse\n")
    md.append(f"*Gegenereerd: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}*\n")

    md.append("## 1. Samenvatting\n")
    md.append(f"| Metriek | Waarde |")
    md.append(f"|---------|--------|")
    md.append(f"| Totaal besluiten | **{total:,}** |")
    md.append(f"| Gematcht (≥1 taakveld) | **{len(matched):,}** ({100*len(matched)/total:.1f}%) |")
    md.append(f"| Ongematcht | **{len(unmatched):,}** ({100*len(unmatched)/total:.1f}%) |")
    md.append(f"| Multi-match (≥2 taakvelden) | **{len(multi):,}** ({100*len(multi)/total:.1f}%) |")
    md.append(f"| Hoog-match (≥5 taakvelden) | **{len(high):,}** ({100*len(high)/total:.1f}%) |")
    md.append(f"| Taakvelden met keywords | **{len(taakvelden)}** |")
    md.append(f"| Totaal keywords | **{sum(len(t['keywords']) for t in taakvelden)}** |")
    md.append("")

    md.append("## 2. Dekking per bron\n")
    md.append("| Bron | Systeem | Totaal | Gematcht | % |")
    md.append("|------|---------|--------|----------|---|")
    for bron in ['raad', 'college']:
        for bs in ['iBabs', 'Officiële Bekendmakingen']:
            items = [r for r in results if r["bron"] == bron and r["bron_systeem"] == bs]
            if not items:
                continue
            m = sum(1 for r in items if r["match_count"] > 0)
            md.append(f"| {bron} | {bs} | {len(items):,} | {m:,} | {100*m/len(items):.1f}% |")
    md.append("")

    md.append("## 3. Dekking per taakveld\n")
    md.append("| Code | Naam | Hits | Top keywords (freq) | Voorbeeld titels |")
    md.append("|------|------|------|---------------------|-----------------|")
    for tv in sorted(taakvelden, key=lambda t: (t["hoofdstuk"], t["code"])):
        hits = tv_hits.get(tv["code"], [])
        kw_freq = tv_kw_freq.get(tv["code"], {})
        top_kw = sorted(kw_freq.items(), key=lambda x: -x[1])[:5]
        top_kw_str = ", ".join(f"{kw} ({c})" for kw, c in top_kw) or "—"
        examples = [h["naam"][:60] for h in hits[:3]]
        ex_str = " · ".join(examples) if examples else "—"
        type_mark = " [C]" if tv["type"] == "Clustering" else ""
        md.append(f"| {tv['code']}{type_mark} | {tv['naam']} | **{len(hits):,}** | {top_kw_str} | {ex_str} |")
    md.append("")

    md.append("## 4. Taakvelden met weinig hits (< 10)\n")
    md.append("| Code | Naam | Hits | Keywords (totaal) |")
    md.append("|------|------|------|-------------------|")
    for tv in sorted(taakvelden, key=lambda t: len(tv_hits.get(t["code"], []))):
        hits = tv_hits.get(tv["code"], [])
        if len(hits) >= 10:
            continue
        md.append(f"| {tv['code']} | {tv['naam']} | {len(hits)} | {len(tv['keywords'])} |")
    md.append("")

    md.append("## 5. Ongematcht: voorbeelden per type\n")
    unmatched_by_type = defaultdict(list)
    for r in unmatched:
        unmatched_by_type[r["type_besluit"]].append(r)

    md.append("| Type besluit | Aantal ongematcht | Voorbeeld |")
    md.append("|-------------|-------------------|-----------|")
    for tb, items in sorted(unmatched_by_type.items(), key=lambda x: -len(x[1])):
        ex = items[0]["naam"][:80]
        md.append(f"| {tb} | {len(items):,} | {ex} |")
    md.append("")

    md.append("## 6. Hoog-match (≥5 taakvelden): top voorbeelden\n")
    md.append("Dit zijn besluiten die op veel taakvelden matchen — potentieel ruis.\n")
    for r in sorted(high, key=lambda x: -x["match_count"])[:20]:
        tvs = ", ".join(r["matched_taakvelden"])
        md.append(f"- **{r['match_count']} taakvelden** — {r['naam'][:100]}")
        md.append(f"  - Codes: {tvs}")
        md.append(f"  - Bron: {r['bron']} ({r['bron_systeem']})")
    md.append("")

    md.append("## 7. Dekking per BBV-hoofdstuk\n")
    md.append("| # | Hoofdstuk | Besluiten | Gematcht | Taakveld-hits | % |")
    md.append("|---|-----------|-----------|----------|--------------|---|")
    for hi in range(9):
        h_items = [r for r in results if r["bbv_hoofdstuk"] == hi]
        h_matched = [r for r in h_items if r["match_count"] > 0]
        # Taakvelden in dit hoofdstuk
        h_tvs = [tv for tv in taakvelden if tv["hoofdstuk"] == hi]
        h_tv_hits = sum(len(tv_hits.get(tv["code"], [])) for tv in h_tvs)
        pct = f"{100*len(h_matched)/len(h_items):.1f}%" if h_items else "—"
        md.append(f"| {hi} | {hoofdstuk_namen.get(hi, '?')} | {len(h_items):,} | {len(h_matched):,} | {h_tv_hits:,} | {pct} |")
    md.append("")

    md.append("## 8. OB subject → taakveld mapping potentieel\n")
    md.append("De Officiële Bekendmakingen hebben een eigen subject-classificatie. ")
    md.append("Hieronder de kruistabel: welk OB-subject matcht op welke taakvelden?\n")
    ob_results = [r for r in results if r["bron_systeem"] == "Officiële Bekendmakingen"]
    ob_subject_tv = defaultdict(lambda: defaultdict(int))
    for r in ob_results:
        identifier = r.get("identifier", "")
        meta = ob_meta.get(identifier, {})
        subj = meta.get("subject", "(geen)")
        for tv_code in r["matched_taakvelden"]:
            ob_subject_tv[subj][tv_code] += 1

    md.append("| OB Subject | Meest matchende taakvelden |")
    md.append("|------------|---------------------------|")
    for subj, tv_counts in sorted(ob_subject_tv.items(), key=lambda x: -sum(x[1].values())):
        top = sorted(tv_counts.items(), key=lambda x: -x[1])[:5]
        top_str = ", ".join(f"{code} ({cnt})" for code, cnt in top)
        md.append(f"| {subj} | {top_str} |")
    md.append("")

    # Schrijf rapport
    report = "\n".join(md)
    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\n=== Rapport geschreven: {OUTPUT_MD} ===")


if __name__ == "__main__":
    main()
