"""@fileoverview Изолированные стадии прогрева моделей без сети и настоящих токенов."""
import gc
import json
import sys
import tracemalloc
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server" / "python"))


def run(traced=False):
    """Возвращает счётчики до импорта и после воспроизводимого прогрева моделей."""
    from worker_memory import process_rss_kb
    if traced:
        tracemalloc.start(1)
    stages = []
    models = []

    def snapshot(label):
        """Снимает RSS и число реально собранных моделей без порогов по платформе."""
        gc.collect()
        stages.append({"stage": label, "rssKiB": process_rss_kb(),
                       "models": len(models),
                       "built": sum(bool(cls.__pydantic_complete__) for cls in models),
                       "tracedBytes": tracemalloc.get_traced_memory()[0] if traced else None})

    snapshot("beforeImport")
    from lazy_aiogram import enable
    if not enable():
        raise RuntimeError("Не удалось включить ленивый импорт aiogram")
    import aiogram.methods as methods
    import aiogram.types as types
    from pydantic import BaseModel
    models = list(dict.fromkeys(cls for module in (types, methods)
                               for name in module.__all__
                               if isinstance(cls := getattr(module, name, None), type)
                               and issubclass(cls, BaseModel)))
    snapshot("lazyImport")
    common = ("User", "Chat", "Message", "Update", "CallbackQuery", "InlineKeyboardButton",
              "InlineKeyboardMarkup", "KeyboardButton", "ReplyKeyboardMarkup", "BotCommand",
              "SendMessage", "EditMessageText", "SetMyCommands", "GetUpdates")
    for name in common:
        cls = getattr(types, name, None) or getattr(methods, name)
        cls.model_rebuild()
    snapshot("common14")
    for cls in models:
        cls.model_rebuild()
    snapshot("allModels")
    assert stages[-1]["built"] == len(models)
    assert stages[1]["built"] <= stages[2]["built"] <= stages[3]["built"]
    return {"tracing": traced, "stages": stages}


if __name__ == "__main__":
    print(json.dumps(run("--traced" in sys.argv)))
