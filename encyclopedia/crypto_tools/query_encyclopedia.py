#!/usr/bin/env python3
import json
import os
import sys

def load_data():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    boards_file = os.path.join(base, "ontario_education", "ontario_school_boards_registry.json")
    disease_file = os.path.join(base, "medical_biophysical", "master_1000_disease_index.json")
    
    with open(boards_file, 'r', encoding='utf-8') as f:
        boards = json.load(f)
    with open(disease_file, 'r', encoding='utf-8') as f:
        diseases = json.load(f)
    return boards, diseases

def search(query):
    query = query.lower()
    boards, diseases = load_data()
    results = []
    
    # Search School Boards
    for b in boards:
        match_str = f"{b['code']} {b['name']} {b['acronym']} {b['system']} {b['headquarters']} {b['jurisdiction']} {b['director']} {b['chair']} {b['focus']}".lower()
        if query in match_str:
            results.append({"type": "School Board", "data": b})
            
    # Search Diseases
    for d in diseases:
        match_str = f"{d['volume_id']} {d['title']} {' '.join(d['sample_indications'])}".lower()
        if query in match_str:
            results.append({"type": "Disease Volume / Monograph", "data": d})
            
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python query_encyclopedia.py '<search_term>'")
        sys.exit(1)
    q = " ".join(sys.argv[1:])
    matches = search(q)
    print(f"Found {len(matches)} matches for '{q}':\n")
    for m in matches:
        print(f"[{m['type']}]")
        print(json.dumps(m['data'], indent=2))
        print("-" * 60)
