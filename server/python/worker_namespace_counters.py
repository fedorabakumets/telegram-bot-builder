"""@fileoverview Ограниченный слабый учёт основных пространств имён активаций ботов."""
import weakref

LIMIT = 4096
KEY = "_worker_namespace_probe"
_references = weakref.WeakSet()
_dropped = 0


class Probe:
    """Не содержит ссылок на модуль, бота или пользовательские данные."""
    def __init__(self):
        """Помечает пространство имён как действующее до завершения очистки."""
        self.unloaded = False


def register(module):
    """Добавляет маяк до выполнения сценария; реестр хранит только слабую ссылку."""
    global _dropped
    # WeakSet удаляет умершие маяки сам: регистрация не обходит все живые активации.
    if len(_references) >= LIMIT:
        _references.pop()
        _dropped += 1
    probe = Probe()
    vars(module)[KEY] = probe
    _references.add(probe)


def unloaded(module):
    """Помечает только собственный маяк после освобождения ресурсов сценария."""
    if module is not None:
        probe = vars(module).get(KEY)
        if isinstance(probe, Probe):
            probe.unloaded = True


def snapshot():
    """Возвращает нижнюю границу живых namespace без принудительного запуска GC."""
    alive = unloaded_count = 0
    for probe in _references:
        alive += 1
        unloaded_count += int(probe.unloaded)
    return {"namespaceScope": "main_globals_weak_probe", "mainNamespacesTrackedAlive": alive,
            "mainNamespacesUnloadedAlive": unloaded_count, "namespaceTrackingLimit": LIMIT,
            "namespaceTrackingTruncated": _dropped > 0, "namespaceTrackingDropped": _dropped}
