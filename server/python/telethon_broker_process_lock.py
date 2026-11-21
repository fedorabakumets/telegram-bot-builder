"""@fileoverview Исключительное владение процессом брокера на общей файловой системе."""

import os
from contextlib import contextmanager
from pathlib import Path


@contextmanager
def broker_process_lock(path):
    """Удерживает файловую блокировку до завершения всех соединений брокера."""
    lock_file = Path(path)
    descriptor = os.open(lock_file, os.O_CREAT | os.O_RDWR, 0o600)
    with os.fdopen(descriptor, "r+b") as handle:
        try:
            if os.name == "nt":
                import msvcrt
                if os.fstat(handle.fileno()).st_size == 0:
                    handle.write(b"0")
                    handle.flush()
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            raise RuntimeError("Другой процесс уже владеет блокировкой брокера") from None
        yield
