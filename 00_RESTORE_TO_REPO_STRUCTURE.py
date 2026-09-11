# DualisCapax: Restore Flat Files to Repository Hierarchy
import os, json, shutil

with open('00_MASTER_FLAT_MAPPING.json') as f:
    mapping = json.load(f)

for flat_name, meta in mapping.items():
    if not os.path.exists(flat_name):
        continue
    target_path = meta['original_repo_path']
    os.makedirs(os.path.dirname(target_path) if os.path.dirname(target_path) else '.', exist_ok=True)
    shutil.copy2(flat_name, target_path)
    print(f'Restored {flat_name} -> {target_path}')

print('All files successfully unpacked into target repository structure!')
