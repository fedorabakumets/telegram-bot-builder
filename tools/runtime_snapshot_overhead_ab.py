"""@fileoverview Отдельный диагностический A/B периодических снимков полного стенда."""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import sys
import time


class SnapshotWrapper(ast.NodeTransformer):
    """Меняет только локальное имя сборщика, сохраняя окончательные проверки ресурсов."""
    def __init__(self):
        """Подсчитывает заменённые функции для защиты от изменения структуры стенда."""
        self.replaced = 0

    def visit_AsyncFunctionDef(self, node):
        """Добавляет явный переключатель периодических снимков без изменения их тела."""
        if node.name != "snapshot":
            return self.generic_visit(node)
        self.replaced += 1
        node.name = "_overhead_original_snapshot"
        wrapper = ast.parse('''
async def snapshot(stage, settling_seconds=None):
    # Итоговые снимки сохраняют проверку соединений даже в варианте off.
    if _overhead_mode == "off" and not stage.startswith(("all_stopped", "diagnostic_gc")):
        _overhead_stats["skipped"] += 1
        return
    started = time.perf_counter()
    cpu = time.process_time()
    try:
        return await _overhead_original_snapshot(stage, settling_seconds)
    finally:
        _overhead_stats["collected"] += 1
        _overhead_stats["collectorWallSeconds"] += time.perf_counter() - started
        _overhead_stats["collectorCpuSeconds"] += time.process_time() - cpu
''').body[0]
        return [node, wrapper]


def main():
    """Исполняет неизменный исходник стенда с контролируемой заменой только snapshot."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", required=True, choices=("off", "on"))
    parser.add_argument("--harness", default="tools/runtime_full_resources_probe.py")
    parser.add_argument("--frozen-source", help="Зафиксированная копия исходника без изменения его ROOT")
    args, forwarded = parser.parse_known_args()
    harness = Path(args.harness).resolve()
    source_path = Path(args.frozen_source).resolve() if args.frozen_source else harness
    original = source_path.read_bytes()
    original_hash = hashlib.sha256(original).hexdigest()
    tree = ast.parse(original, filename=str(harness))
    transformer = SnapshotWrapper()
    tree = transformer.visit(tree)
    if transformer.replaced != 1:
        raise RuntimeError("Ожидалась ровно одна известная функция snapshot")
    ast.fix_missing_locations(tree)
    transformed_hash = hashlib.sha256(ast.dump(tree).encode()).hexdigest()
    stats = {"collected": 0, "skipped": 0, "collectorWallSeconds": 0, "collectorCpuSeconds": 0}
    namespace = {"__name__": "__main__", "__file__": str(harness),
                 "_overhead_mode": args.mode, "_overhead_stats": stats}
    sys.path.insert(0, str(harness.parent))
    sys.argv = [str(harness), *forwarded]
    started = time.perf_counter()
    cpu = time.process_time()
    passed = False
    try:
        exec(compile(tree, str(harness), "exec"), namespace)
        passed = True
    finally:
        print(json.dumps({"snapshotOverheadAB": {
            "mode": args.mode, "passed": passed, **stats,
            "wallSeconds": time.perf_counter() - started,
            "cpuSeconds": time.process_time() - cpu,
            "harnessSha256": original_hash, "transformedAstSha256": transformed_hash,
            "sourceUnchanged": source_path.read_bytes() == original,
            "scope": "periodic_snapshot_collectors_only_final_sql_delivery_and_cleanup_gates_preserved",
        }}), flush=True)


if __name__ == "__main__":
    main()
