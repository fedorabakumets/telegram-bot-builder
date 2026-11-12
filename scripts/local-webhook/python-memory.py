"""@fileoverview Изолированное измерение загрузки и выгрузки тестовых ботов настоящим воркером.

Не обращается к Telegram, БД или production. Запускает один дочерний процесс.
Измерения относятся к синтетическому состоянию и не предсказывают память рабочих ботов.
"""

import asyncio
import gc
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import weakref

ROOT = Path(__file__).resolve().parents[2]
WORKER_DIR = ROOT / "server" / "python"


def snapshot(label, **extra):
    """Измеряет текущий рабочий набор Windows или RSS Linux в КиБ."""
    from worker_memory import process_rss_kb
    return {"stage": label, "rss_kib": process_rss_kb(), **extra}


async def exercise_worker():
    """Загружает и штатно останавливает три синтетических бота в трёх циклах."""
    import worker
    import bot_env_overlay
    import lazy_aiogram

    results = [snapshot("worker_imported")]
    started = time.perf_counter()
    lazy_enabled = lazy_aiogram.enable()
    results.append(snapshot("aiogram_warm", lazy_enabled=lazy_enabled,
                            elapsed_ms=round((time.perf_counter() - started) * 1000)))
    bot_env_overlay.install()
    # Протокол вывода отключён только внутри тестового процесса, результаты выводятся отдельно.
    worker.emit_log = lambda *args, **kwargs: None
    worker.emit_system = lambda *args, **kwargs: None
    manager = worker.BotWorker()
    with tempfile.TemporaryDirectory(prefix="tbb-memory-") as temporary:
        folders = []
        for token_id in range(1, 4):
            folder = Path(temporary) / str(token_id)
            folder.mkdir()
            shutil.copyfile(Path(__file__).parent / "fixtures" / "memory-bot.py", folder / "bot.py")
            folders.append(folder)
        for cycle in range(1, 4):
            started = time.perf_counter()
            for token_id, folder in enumerate(folders, 1):
                await manager._start_bot({"token_id": token_id, "token": "local-only",
                                          "bot_file": str(folder / "bot.py"), "env": {}})
            # Фикстура не выполняет сетевой ввод-вывод до перехода в ожидающее состояние.
            await asyncio.sleep(0.1)
            assert len(manager.bots) == 3
            assert all(context.status == "running" for context in manager.bots.values())
            references = [weakref.ref(context.module) for context in manager.bots.values()]
            results.append(snapshot(f"cycle_{cycle}_loaded", bots=len(manager.bots),
                                    elapsed_ms=round((time.perf_counter() - started) * 1000)))
            for token_id in range(1, 4):
                await manager._stop_bot({"token_id": token_id})
            await asyncio.sleep(0)
            gc.collect()
            collected = all(reference() is None for reference in references)
            assert not manager.bots and collected, "Контексты или модули остались достижимыми"
            results.append(snapshot(f"cycle_{cycle}_stopped_gc", bots=0, modules_collected=collected,
                                    retained_aiogram="aiogram" in sys.modules))
    return results


def run_child():
    """Измеряет настоящий цикл BotWorker в отдельном чистом интерпретаторе."""
    sys.path.insert(0, str(WORKER_DIR))
    initial = snapshot("python_initial")
    results = asyncio.run(exercise_worker())
    print(json.dumps({"platform": sys.platform, "measure": "RSS/working set, KiB",
                      "synthetic": True, "snapshots": [initial, *results]}))


def main():
    """Запускает единственного ребёнка без секретов окружения и проверяет его завершение."""
    if "--child" in sys.argv:
        run_child()
        return
    # Сохраняем только системные переменные, необходимые для запуска Python в Windows/Linux.
    allowed = ("SYSTEMROOT", "WINDIR", "PATH", "TEMP", "TMP", "TMPDIR", "COMSPEC")
    environment = {key: os.environ[key] for key in allowed if key in os.environ}
    environment.update(PYTHONIOENCODING="utf-8", PYTHONUTF8="1", BOT_CODE_CACHE="true")
    with tempfile.TemporaryDirectory(prefix="tbb-memory-parent-") as directory:
        completed = subprocess.run([sys.executable, str(Path(__file__).resolve()), "--child"],
                                   cwd=directory, env=environment, capture_output=True,
                                   text=True, encoding="utf-8", timeout=90)
    if completed.returncode:
        raise RuntimeError(completed.stderr + completed.stdout)
    result = json.loads(completed.stdout)
    result["child_exit_code"] = completed.returncode
    result["child_process_terminated"] = True
    result["note"] = "После завершения процесс отсутствует; кэш ОС не измеряется."
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
