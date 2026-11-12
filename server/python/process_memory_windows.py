"""@fileoverview Чтение рабочего набора произвольного дочернего процесса Windows."""


def pid_rss_kb(pid):
    """Возвращает working set в КиБ либо None, сохраняя private bytes отдельно."""
    import ctypes
    from ctypes import wintypes

    class Counters(ctypes.Structure):
        """Поля PROCESS_MEMORY_COUNTERS Windows для получения рабочего набора."""

        _fields_ = [("cb", wintypes.DWORD), ("faults", wintypes.DWORD)] + [
            (name, ctypes.c_size_t) for name in
            ("peak_rss", "rss", "peak_pool", "pool", "peak_nonpaged", "nonpaged",
             "pagefile", "peak_pagefile")]

    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    psapi = ctypes.WinDLL("psapi", use_last_error=True)
    psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD]
    psapi.GetProcessMemoryInfo.restype = wintypes.BOOL
    handle = kernel.OpenProcess(0x410, False, pid)
    if not handle:
        return None
    try:
        counters = Counters()
        counters.cb = ctypes.sizeof(counters)
        if not psapi.GetProcessMemoryInfo(handle, ctypes.byref(counters), counters.cb):
            return None
        return counters.rss // 1024
    finally:
        kernel.CloseHandle(handle)
