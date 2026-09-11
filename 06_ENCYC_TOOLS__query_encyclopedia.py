#!/usr/bin/env python3
"""
DualisCapax: Master Encyclopedia Sub-Millisecond Search Engine
Searches structured JSON databases and markdown specifications across all encyclopedia sectors.
"""
import json
import os
import sys

def load_json_data(base_dir):
    boards_file = os.path.join(base_dir, "ontario_education", "ontario_school_boards_registry.json")
    disease_file = os.path.join(base_dir, "medical_biophysical", "master_1000_disease_index.json")
    
    boards, diseases = [], []
    if os.path.exists(boards_file):
        with open(boards_file, 'r', encoding='utf-8') as f:
            boards = json.load(f)
    if os.path.exists(disease_file):
        with open(disease_file, 'r', encoding='utf-8') as f:
            diseases = json.load(f)
    return boards, diseases

def search(query):
    query_lower = query.lower()
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    boards, diseases = load_json_data(base_dir)
    results = []
    
    # 1. Search School Boards JSON
    for b in boards:
        match_str = f"{b.get('code','')} {b.get('name','')} {b.get('acronym','')} {b.get('system','')} {b.get('headquarters','')} {b.get('jurisdiction','')} {b.get('director','')} {b.get('chair','')} {b.get('focus','')}".lower()
        if query_lower in match_str:
            results.append({"type": "School Board", "source": "ontario_education/ontario_school_boards_registry.json", "data": b})
            
    # 2. Search Medical Diseases JSON
    for d in diseases:
        indications = ' '.join(d.get('sample_indications', []))
        match_str = f"{d.get('volume_id','')} {d.get('title','')} {indications}".lower()
        if query_lower in match_str:
            results.append({"type": "Disease Volume / Monograph", "source": "medical_biophysical/master_1000_disease_index.json", "data": d})

    # 3. Search Markdown Specifications across All Sectors
    sectors = ["ai_systems_internal", "governance_and_protocols", "simulation_receipts", "ontario_education", "medical_biophysical"]
    for sec in sectors:
        sec_path = os.path.join(base_dir, sec)
        if not os.path.exists(sec_path):
            continue
        for f in sorted(os.listdir(sec_path)):
            if f.endswith('.md'):
                f_path = os.path.join(sec_path, f)
                rel_path = f"{sec}/{f}"
                with open(f_path, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                
                if query_lower in content.lower():
                    # Extract matching paragraphs
                    paragraphs = content.split('\n\n')
                    matches = []
                    for p in paragraphs:
                        if query_lower in p.lower():
                            matches.append(p.strip())
                            if len(matches) >= 2:
                                break
                    snippet = "\n\n---\n\n".join(matches[:2])
                    results.append({
                        "type": "Encyclopedia Specification",
                        "source": rel_path,
                        "data": {
                            "document": f,
                            "sector": sec,
                            "snippet": snippet[:1000] + ("..." if len(snippet) > 1000 else "")
                        }
                    })
            
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python query_encyclopedia.py '<search_term>'")
        sys.exit(1)
    q = " ".join(sys.argv[1:])
    matches = search(q)
    print(f"Found {len(matches)} matches for '{q}':\n")
    for m in matches:
        print(f"[{m['type']}] -> {m['source']}")
        print(json.dumps(m['data'], indent=2))
        print("=" * 70)
