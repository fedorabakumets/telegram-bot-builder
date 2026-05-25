"""
Генерирует tree.json и search.json для WikiNest из папки docs/.
Запуск: python tools/generate_tree_json.py
"""
import os
import json
import re
import subprocess

docs_dir = 'docs'
tree = []
search = {}
folder_meta = {}


def parse_frontmatter(text):
    """Парсит YAML frontmatter из markdown файла."""
    meta = {}
    body = text
    m = re.match(r'^---\r?\n([\s\S]*?)\r?\n---\r?\n?', text)
    if m:
        body = text[len(m.group(0)):]
        for line in m.group(1).splitlines():
            kv = re.match(r'^(\w[\w-]*):\s*(.*)$', line)
            if not kv:
                continue
            k, v = kv.group(1), kv.group(2).strip()
            if v.startswith('['):
                try:
                    meta[k] = json.loads(v.replace("'", '"'))
                except Exception:
                    meta[k] = [s.strip() for s in v[1:-1].split(',') if s.strip()]
            else:
                meta[k] = v.strip('"\'')
        if isinstance(meta.get('tags'), str):
            meta['tags'] = [s.strip() for s in meta['tags'].split(',') if s.strip()]
    return meta, body


for root, dirs, files in os.walk(docs_dir):
    dirs.sort()
    if '_meta.json' in files:
        meta_path = os.path.join(root, '_meta.json')
        with open(meta_path, encoding='utf-8') as fh:
            try:
                meta = json.load(fh)
                rel_dir = os.path.relpath(root, docs_dir).replace('\\', '/')
                folder_meta[rel_dir] = meta
            except Exception:
                pass

    for f in sorted(files):
        if not f.endswith('.md') or f.startswith('_'):
            continue
        full = os.path.join(root, f)
        rel = os.path.relpath(full, docs_dir).replace('\\', '/')
        path = rel[:-3]
        parts = path.split('/')

        with open(full, encoding='utf-8') as fh:
            raw_content = fh.read()

        fm_meta, body = parse_frontmatter(raw_content)
        tags = fm_meta.get('tags', [])
        author = fm_meta.get('author', '')

        title = parts[-1].replace('-', ' ').replace('_', ' ').capitalize()
        excerpt = ''
        title_found = False
        for line in body.splitlines():
            line = line.strip()
            if line.startswith('# ') and not title_found:
                title = line[2:].strip()
                title_found = True
            elif line and not line.startswith('#') and not excerpt:
                excerpt = line[:140]

        folder_titles = {}
        for i in range(len(parts) - 1):
            folder_path = '/'.join(parts[:i + 1])
            meta = folder_meta.get(folder_path, {})
            folder_titles[parts[i]] = meta.get(
                'title', parts[i].replace('-', ' ').replace('_', ' ').capitalize()
            )

        try:
            updated_at = subprocess.run(
                ['git', 'log', '-1', '--format=%cI', '--', full],
                capture_output=True, text=True
            ).stdout.strip() or None
        except Exception:
            updated_at = None

        tree.append({
            'path': path,
            'title': title,
            'excerpt': excerpt,
            'parts': parts,
            'folder_titles': folder_titles,
            'updated_at': updated_at,
            'tags': tags,
            'author': author
        })

        search[path] = raw_content

with open('tree.json', 'w', encoding='utf-8') as f:
    json.dump(tree, f, ensure_ascii=False, indent=2)
print(f'tree.json: {len(tree)} pages')

with open('search.json', 'w', encoding='utf-8') as f:
    json.dump(search, f, ensure_ascii=False)
print(f'search.json: {len(search)} entries')
