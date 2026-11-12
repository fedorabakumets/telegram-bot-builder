"""@fileoverview Подтверждение остановки всех процессов Windows-задания перед освобождением lease."""

import ctypes
import time
from ctypes import wintypes


class _Accounting(ctypes.Structure):
    """Повторяет счётчики JOB_OBJECT_BASIC_ACCOUNTING_INFORMATION из Windows SDK."""

    _fields_ = [("user", ctypes.c_longlong), ("kernel", ctypes.c_longlong),
                ("period_user", ctypes.c_longlong), ("period_kernel", ctypes.c_longlong),
                ("faults", wintypes.DWORD), ("total", wintypes.DWORD),
                ("active", wintypes.DWORD), ("terminated", wintypes.DWORD)]


def terminate_and_wait(api, handle, timeout=3):
    """Завершает задание и отказывает, если ОС не подтвердила отсутствие процессов."""
    api.TerminateJobObject.argtypes = [wintypes.HANDLE, wintypes.UINT]
    api.TerminateJobObject.restype = wintypes.BOOL
    api.QueryInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int,
                                               ctypes.c_void_p, wintypes.DWORD,
                                               ctypes.c_void_p]
    api.QueryInformationJobObject.restype = wintypes.BOOL
    if not api.TerminateJobObject(handle, 70):
        raise ctypes.WinError(ctypes.get_last_error())
    deadline = time.monotonic() + timeout
    while True:
        stats = _Accounting()
        if not api.QueryInformationJobObject(handle, 1, ctypes.byref(stats),
                                             ctypes.sizeof(stats), None):
            raise ctypes.WinError(ctypes.get_last_error())
        if stats.active == 0:
            return
        if time.monotonic() >= deadline:
            raise RuntimeError("Windows не подтвердила завершение дерева обработчика")
        time.sleep(0.01)
