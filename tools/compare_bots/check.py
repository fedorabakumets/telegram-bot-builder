"""
@fileoverview Проверка цепочки сравнения ботов и списка json_push в calc.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

EXCLUDED_BOTS = {"Империя", "VIRON"}

EXPECTED_PUSH = [
    "ScoobyChange",
    "Capitalist",
    "24Crypto",
    "Shaxta",
    "BitMixer",
    "LiteBit",
    "Sanchez",
    "CryptoFlow",
    "Vortex",
    "CrazyBTC",
    "INFINITY",
    "Lucky",
    "Love",
    "CASPER",
    "BTC Monopoly",
]


def load_nodes() -> dict:
    """
    Загружает узлы листа sheet-bots.
    @returns словарь id → node
    """
    data = json.loads(PROJECT.read_text(encoding="utf-8"))
    sheet = next(s for s in data["sheets"] if s["id"] == "sheet-bots")
    return {n["id"]: n for n in sheet["nodes"]}


def walk_chain(nodes: dict) -> list[str]:
    """
    Обход autoTransitionTo от bot-setv-init.
    @param nodes - узлы проекта
    @returns список id узлов
    """
    path: list[str] = []
    cur = nodes["bot-setv-init"]["data"]["autoTransitionTo"]
    seen: set[str] = set()
    while cur and cur not in seen and cur in nodes:
        seen.add(cur)
        path.append(cur)
        data = nodes[cur].get("data", {})
        if not data.get("enableAutoTransition", True):
            break
        cur = data.get("autoTransitionTo", "")
    return path


def main() -> None:
    """Печатает цепочку, calc и пробелы."""
    nodes = load_nodes()
    chain = walk_chain(nodes)
    calc = nodes["bot-setv-calc"]
    pushes = [a for a in calc["data"]["assignments"] if a.get("mode") == "json_push"]

    print(f"init: {nodes['bot-setv-init']['data']['autoTransitionTo']}")
    print(f"chain length: {len(chain)}, ends: {chain[-1] if chain else '?'}")
    print(f"reaches calc: {'bot-setv-calc' in chain}")
    print(f"bots in calc: {len(pushes)}")
    names: list[str] = []
    for a in pushes:
        name_m = re.search(r'"name": "([^"]+)"', a["value"])
        marker_m = re.search(r'"marker": "([^"]+)"', a["value"])
        name = name_m.group(1) if name_m else "?"
        names.append(name)
        marker = marker_m.group(1) if marker_m else "?"
        tag = "OK" if marker == "\u2705" else "WARN" if marker == "\u26a0\ufe0f" else marker
        print(f"  [{tag}] {name}")

    print(f"\nexcluded: {', '.join(sorted(EXCLUDED_BOTS))}")
    missing_push = [b for b in EXPECTED_PUSH if b not in names]
    if missing_push:
        print("missing in calc:", ", ".join(missing_push))

    parse_in_chain = [x for x in chain if x.startswith("bot-setv-parse")]
    print(f"\nparse nodes in chain: {len(parse_in_chain)}")

    keys = [
        ("scooby", "bot-setv-parse-scooby"),
        ("crazy", "bot-setv-parse-crazy"),
        ("lucky", "bot-setv-parse-lucky"),
        ("love", "bot-setv-parse-love"),
        ("monopoly", "bot-setv-parse-monopoly"),
    ]
    print("\nkey transitions:")
    for label, nid in keys:
        if nid in nodes:
            print(f"  {label}: -> {nodes[nid]['data'].get('autoTransitionTo', '')}")


if __name__ == "__main__":
    main()
