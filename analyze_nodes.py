"""Анализ узлов без связей в шаблоне."""
import json

with open("__________data_split.json", "r", encoding="utf-8") as f:
    d = json.load(f)

all_nodes = {}
node_sheet = {}
for sheet in d["sheets"]:
    for node in sheet["nodes"]:
        all_nodes[node["id"]] = node
        node_sheet[node["id"]] = sheet["name"]

outgoing = {nid: set() for nid in all_nodes}
incoming = {nid: set() for nid in all_nodes}

for nid, node in all_nodes.items():
    data = node["data"]

    kid = data.get("keyboardNodeId")
    if kid and kid in all_nodes:
        outgoing[nid].add(kid)
        incoming[kid].add(nid)

    ato = data.get("autoTransitionTo")
    if ato and ato in all_nodes:
        outgoing[nid].add(ato)
        incoming[ato].add(nid)

    for btn in data.get("buttons", []):
        t = btn.get("target")
        if t and t in all_nodes:
            outgoing[nid].add(t)
            incoming[t].add(nid)

isolated   = [nid for nid in all_nodes if not outgoing[nid] and not incoming[nid]]
no_in      = [nid for nid in all_nodes if not incoming[nid] and outgoing[nid]]
no_out     = [nid for nid in all_nodes if not outgoing[nid] and incoming[nid]]

print(f"Всего узлов: {len(all_nodes)}")

print(f"\n=== Полностью изолированные ({len(isolated)}) ===")
for nid in isolated:
    n = all_nodes[nid]
    print(f"  [{n['type']:20}] {nid[:55]}  | лист: {node_sheet[nid]}")

print(f"\n=== Нет входящих — корневые ({len(no_in)}) ===")
for nid in no_in:
    n = all_nodes[nid]
    print(f"  [{n['type']:20}] {nid[:55]}  | лист: {node_sheet[nid]}")

print(f"\n=== Нет исходящих — тупики ({len(no_out)}) ===")
for nid in no_out:
    n = all_nodes[nid]
    print(f"  [{n['type']:20}] {nid[:55]}  | лист: {node_sheet[nid]}")
