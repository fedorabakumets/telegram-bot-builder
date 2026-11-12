"""@fileoverview Ограничение времени жизни дерева обработчика средствами Windows Job Object."""

import ctypes
import os
from ctypes import wintypes


class _BasicLimits(ctypes.Structure):
    """Описывает базовые лимиты задания в соответствии с Windows SDK."""

    _fields_ = [("process_time", ctypes.c_longlong), ("job_time", ctypes.c_longlong),
                ("flags", wintypes.DWORD), ("minimum", ctypes.c_size_t),
                ("maximum", ctypes.c_size_t), ("active", wintypes.DWORD),
                ("affinity", ctypes.c_size_t), ("priority", wintypes.DWORD),
                ("scheduling", wintypes.DWORD)]


class _IoCounters(ctypes.Structure):
    """Сохраняет расположение шести счётчиков ввода-вывода Windows SDK."""

    _fields_ = [(name, ctypes.c_ulonglong) for name in
                ("reads", "writes", "other", "read_bytes", "write_bytes", "other_bytes")]


class _ExtendedLimits(ctypes.Structure):
    """Описывает расширенные лимиты, включая уничтожение процессов при закрытии."""

    _fields_ = [("basic", _BasicLimits), ("io", _IoCounters),
                ("process_memory", ctypes.c_size_t), ("job_memory", ctypes.c_size_t),
                ("peak_process", ctypes.c_size_t), ("peak_job", ctypes.c_size_t)]


def _kernel():
    """Настраивает типы дескрипторов без усечения адресов на 64-разрядной Windows."""
    api = ctypes.WinDLL("kernel32", use_last_error=True)
    api.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
    api.CreateJobObjectW.restype = wintypes.HANDLE
    api.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int,
                                            ctypes.c_void_p, wintypes.DWORD]
    api.SetInformationJobObject.restype = wintypes.BOOL
    api.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    api.OpenProcess.restype = wintypes.HANDLE
    api.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    api.AssignProcessToJobObject.restype = wintypes.BOOL
    api.IsProcessInJob.argtypes = [wintypes.HANDLE, wintypes.HANDLE,
                                   ctypes.POINTER(wintypes.BOOL)]
    api.IsProcessInJob.restype = wintypes.BOOL
    api.CloseHandle.argtypes = [wintypes.HANDLE]
    api.CloseHandle.restype = wintypes.BOOL
    return api


def add_process(handle, pid):
    """Прикрепляет интерпретатор, включая отдельный PID лаунчера виртуальной среды."""
    if handle is None:
        return
    api = _kernel()
    process = api.OpenProcess(0x0501, False, int(pid))
    if not process:
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        assigned = wintypes.BOOL()
        if not api.IsProcessInJob(process, handle, ctypes.byref(assigned)):
            raise ctypes.WinError(ctypes.get_last_error())
        if assigned.value:
            return
        if not api.AssignProcessToJobObject(handle, process):
            raise ctypes.WinError(ctypes.get_last_error())
    finally:
        api.CloseHandle(process)


def _existing_children(pid):
    """Находит уже созданный интерпретатор Windows-лаунчера до передачи конфигурации."""
    class Entry(ctypes.Structure):
        """Повторяет структуру PROCESSENTRY32W из Windows SDK."""
        _fields_ = [("size", wintypes.DWORD), ("usage", wintypes.DWORD),
                    ("pid", wintypes.DWORD), ("heap", ctypes.c_size_t),
                    ("module", wintypes.DWORD), ("threads", wintypes.DWORD),
                    ("parent", wintypes.DWORD), ("priority", wintypes.LONG),
                    ("flags", wintypes.DWORD), ("executable", wintypes.WCHAR * 260)]
    api = _kernel()
    api.CreateToolhelp32Snapshot.argtypes = [wintypes.DWORD, wintypes.DWORD]
    api.CreateToolhelp32Snapshot.restype = wintypes.HANDLE
    for name in ("Process32FirstW", "Process32NextW"):
        method = getattr(api, name)
        method.argtypes = [wintypes.HANDLE, ctypes.POINTER(Entry)]
        method.restype = wintypes.BOOL
    snapshot = api.CreateToolhelp32Snapshot(2, 0)
    if snapshot == ctypes.c_void_p(-1).value:
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        entry, result = Entry(), []
        entry.size = ctypes.sizeof(Entry)
        found = api.Process32FirstW(snapshot, ctypes.byref(entry))
        while found:
            if entry.parent == pid:
                result.append(entry.pid)
            found = api.Process32NextW(snapshot, ctypes.byref(entry))
        return result
    finally:
        api.CloseHandle(snapshot)


def attach_job(pid):
    """Создаёт не наследуемое задание; закрытие владельца завершает его процессы."""
    if os.name != "nt":
        return None
    api = _kernel()
    handle = api.CreateJobObjectW(None, None)
    if not handle:
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        limits = _ExtendedLimits()
        limits.basic.flags = 0x2000
        if not api.SetInformationJobObject(handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
            raise ctypes.WinError(ctypes.get_last_error())
        for child_pid in _existing_children(pid):
            add_process(handle, child_pid)
        add_process(handle, pid)
        return handle
    except BaseException:
        api.CloseHandle(handle)
        raise


def close_job(handle):
    """Закрывает единственный дескриптор и уничтожает оставшееся дерево задания."""
    if handle is not None:
        from process_job_wait import terminate_and_wait
        api = _kernel()
        terminate_and_wait(api, handle)
        if not api.CloseHandle(handle):
            raise ctypes.WinError(ctypes.get_last_error())
