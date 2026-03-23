#!/usr/bin/env python3
"""
Extraheert het overdrachtsdossier Word-document naar computerleesbare formaten:
- Markdown (kapstok voor Beleidsbibliotheek)
- JSON (gestructureerde metadata + inhoudsopgave)
- Inventaris van afbeeldingen
"""

import json
import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph

# Paden
BASE = Path(__file__).resolve().parent.parent
DOCX_PATH = BASE / "overdracht voor check.docx"
OUTPUT_DIR = BASE / "overdracht_extract"
MEDIA_DIR = BASE / "docx_extract" / "word" / "media"


def iter_block_items(parent):
    """Yield paragraphs en tabellen in documentvolgorde."""
    if hasattr(parent, "element") and hasattr(parent.element, "body"):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        parent_elm = parent
    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def get_paragraph_style_level(para: Paragraph) -> int:
    """Bepaal heading-level (1-6) of 0 voor gewone paragraaf."""
    if not para.style or not para.style.name:
        return 0
    name = para.style.name.lower()
    if name.startswith("heading"):
        match = re.search(r"heading\s*(\d)", name, re.I)
        return int(match.group(1)) if match else 0
    if "titel" in name or name == "title":
        return 1
    return 0


def get_heading_level_by_content(text: str) -> int:
    """Bepaal heading-level (1-4) op basis van inhoudspatroon. 0 = geen heading."""
    text = text.strip()
    if not text:
        return 0
    # Hoofdstuk: "1. ", "10. ", "11. " (cijfer + punt + spatie)
    if re.match(r"^\d{1,2}\.\s+", text):
        return 1
    # Sectie: "1.1 ", "2.3 ", "10.11 " (twee niveaus)
    if re.match(r"^\d{1,2}\.\d{1,2}\s+", text) and not re.match(r"^\d{1,2}\.\d{1,2}\.\d", text):
        return 2
    # Subsectie: "1.1.1 ", "3.1.2. " (drie of vier niveaus)
    if re.match(r"^\d{1,2}\.\d{1,2}\.\d", text):
        return 3
    # Standalone sectietitels: Voorwoord, Inleiding, Deel I, Bijlage 1, etc.
    standalone = (
        "inhoud", "voorwoord", "inleiding", "leeswijzer",
        "deel i", "deel ii", "deel iii",
        "stand van zaken", "aanvullend",
        "bijlage 1:", "bijlage 2:",
        "veranderende rol van de gemeente",
        "regionale samenwerking en landelijke ontwikkelingen",
        "koersvast besturen en realistisch uitvoeren",
    )
    if text.lower() in standalone or any(text.lower().startswith(s) for s in standalone):
        return 1
    return 0


def extract_images_from_paragraph(para: Paragraph) -> list[str]:
    """Haal afbeeldingsreferenties uit een paragraaf."""
    images = []
    for run in para.runs:
        for drawing in run._element.iter():
            if "drawing" in drawing.tag.lower() or "blip" in drawing.tag.lower():
                # Zoek embed-ref
                for elem in drawing.iter():
                    if "embed" in elem.tag.lower():
                        rId = elem.get(qn("r:embed"))
                        if rId:
                            images.append(rId)
    return images


def build_rels_map(rels_path: Path) -> dict[str, str]:
    """Bouw mapping rId -> bestandsnaam uit document.xml.rels."""
    rels = {}
    if not rels_path.exists():
        return rels
    tree = ET.parse(rels_path)
    root = tree.getroot()
    ns = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
    for rel in root.findall(".//r:Relationship", ns):
        rid = rel.get("Id")
        target = rel.get("Target", "")
        rel_type = rel.get("Type", "")
        if rid and "image" in rel_type.lower():
            rels[rid] = target
    return rels


def extract_tables(doc: Document) -> list[dict]:
    """Extraheer tabellen als lijst van rijen."""
    tables_out = []
    for i, table in enumerate(doc.tables):
        rows = []
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            rows.append(cells)
        tables_out.append({"index": i + 1, "rows": rows})
    return tables_out


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    (OUTPUT_DIR / "media").mkdir(exist_ok=True)

    doc = Document(DOCX_PATH)
    rels_path = BASE / "docx_extract" / "word" / "_rels" / "document.xml.rels"
    rels = build_rels_map(rels_path)

    # Kopieer media naar output
    media_list = []
    if MEDIA_DIR.exists():
        for f in sorted(MEDIA_DIR.iterdir()):
            if f.suffix.lower() in (".jpeg", ".jpg", ".png", ".gif", ".tiff", ".svg"):
                dest = OUTPUT_DIR / "media" / f.name
                if not dest.exists() or dest.stat().st_size != f.stat().st_size:
                    shutil.copy2(f, dest)
                media_list.append({
                    "bestand": f.name,
                    "grootte_kb": round(f.stat().st_size / 1024, 1),
                })

    # Structuur: hoofdstukken, secties, paragrafen, tabellen — in documentvolgorde
    structure = []
    md_lines = []
    table_counter = 0

    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            para = block
            text = para.text.strip()
            if not text:
                continue

            level = get_paragraph_style_level(para)
            if level == 0:
                level = get_heading_level_by_content(text)

            if level >= 1:
                hashes = "#" * level
                md_lines.append(f"\n{hashes} {text}\n")
                structure.append({"type": "heading", "level": level, "tekst": text})
            else:
                md_lines.append(f"{text}\n\n")
                structure.append({"type": "paragraaf", "tekst": text})

        elif isinstance(block, Table):
            table_counter += 1
            rows = [[cell.text.strip() for cell in row.cells] for row in block.rows]
            md_lines.append(f"\n\n### Tabel {table_counter}\n\n")
            for row in rows:
                escaped = [c.replace("|", "\\|") for c in row]
                md_lines.append("| " + " | ".join(escaped) + " |\n")
            md_lines.append("\n")
            structure.append({"type": "tabel", "index": table_counter, "rijen": len(rows)})

    # Schrijf Markdown
    md_content = "".join(md_lines).strip()
    md_path = OUTPUT_DIR / "overdracht_raadsverkiezingen_2026.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Overdrachtsdossier raadsverkiezingen 2026 — Gemeente Wassenaar\n\n")
        f.write("**Versie:** 4.1 | **Datum:** 18 maart 2026\n\n")
        f.write("---\n\n")
        f.write("*Computerleesbare extractie voor Beleidsbibliotheek. Bron: overdracht voor check.docx*\n\n")
        f.write("---\n\n")
        f.write(md_content)

    def clean_titel(t: str) -> str:
        """Verwijder paginanummers en overbodige tabs uit TOC-titels."""
        t = re.sub(r"\t\d+$", "", t)  # "Voorwoord\t6" → "Voorwoord"
        t = t.replace("\t", " ")        # "1.1\tWaar staan we?" → "1.1 Waar staan we?"
        t = re.sub(r"  +", " ", t)     # dubbele spaties → enkele
        return t.strip()

    # JSON kapstok: inhoudsopgave + metadata (gededupliceerd op titel)
    toc = []
    seen = set()
    for item in structure:
        if item["type"] == "heading":
            titel = clean_titel(item["tekst"])
            key = (item["level"], titel)
            if key not in seen:
                seen.add(key)
                toc.append({"level": item["level"], "titel": titel})

    n_tabellen = sum(1 for s in structure if s.get("type") == "tabel")
    kapstok = {
        "bron": "overdracht voor check.docx",
        "titel": "Overdrachtsdossier raadsverkiezingen 2026",
        "gemeente": "Wassenaar",
        "versie": "4.1",
        "datum": "2026-03-18",
        "inhoudsopgave": toc,
        "aantal_tabellen": n_tabellen,
        "aantal_afbeeldingen": len(media_list),
        "afbeeldingen": media_list,
    }

    json_path = OUTPUT_DIR / "overdracht_kapstok.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(kapstok, f, indent=2, ensure_ascii=False)

    # Rapport
    print("=" * 60)
    print("EXTRACTIE OVERDRACHTSDOSSIER — RAPPORT")
    print("=" * 60)
    print(f"\n✓ Tekst: {len(structure)} elementen (headings + paragrafen + tabellen)")
    print(f"✓ Tabellen: {n_tabellen}")
    print(f"✓ Afbeeldingen: {len(media_list)} (gekopieerd naar {OUTPUT_DIR}/media/)")
    print(f"\nOutput:")
    print(f"  - {md_path}")
    print(f"  - {json_path}")
    print(f"  - {OUTPUT_DIR}/media/ ({len(media_list)} bestanden)")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
