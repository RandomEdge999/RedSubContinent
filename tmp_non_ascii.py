import pathlib, string, json
skip = {'.next','node_modules','.git','.swc'}
base = pathlib.Path('web')
non = []
for p in base.rglob('*'):
    if any(part in skip for part in p.parts):
        continue
    if p.is_file():
        try:
            data = p.read_text(encoding='utf-8')
        except Exception:
            continue
        for i,ch in enumerate(data):
            if ch not in string.printable + '\n\r\t\x0b\x0c':
                non.append((str(p), i, ch, ord(ch)))
                break
print(json.dumps(non, indent=2))