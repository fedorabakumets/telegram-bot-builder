"""@fileoverview Запускает отдельную локальную диагностику Python и нативного аллокатора."""
import argparse
import contextlib
import ctypes
import gc
import json
import os
from pathlib import Path
import resource
import runpy
import sys
import time
import tracemalloc


class MallInfo(ctypes.Structure):
    """Описывает счётчики glibc mallinfo2, не обходя живые Python-объекты."""
    _fields_ = [(name, ctypes.c_size_t) for name in
                ('arena', 'ordblks', 'smblks', 'hblks', 'hblkhd', 'usmblks',
                 'fsmblks', 'uordblks', 'fordblks', 'keepcost')]


def memory():
    """Читает Linux RSS/PSS и различает занятые и свободные области glibc."""
    rows = dict(line.split(':', 1) for line in Path('/proc/self/smaps_rollup').read_text().splitlines()
                if ':' in line)
    result = {key: int(rows[name].split()[0]) for key, name in
              (('rssKiB', 'Rss'), ('pssKiB', 'Pss'), ('anonymousKiB', 'Anonymous'))}
    libc = ctypes.CDLL(None)
    if hasattr(libc, 'mallinfo2'):
        libc.mallinfo2.restype = MallInfo
        info = libc.mallinfo2()
        result['glibcBytes'] = {name: getattr(info, name) for name, _ in MallInfo._fields_}
    result['threads'] = len(list(Path('/proc/self/task').iterdir()))
    result['fds'] = len(list(Path('/proc/self/fd').iterdir()))
    if tracemalloc.is_tracing():
        result['pythonTracedBytes'], result['pythonTracedPeakBytes'] = tracemalloc.get_traced_memory()
    return result


def emit(frame):
    """Выводит диагностическую запись отдельно от кадров основного стенда."""
    print(json.dumps({'nativeProbe': frame}), flush=True)


def main():
    """Изолирует измерения без профиля, tracemalloc и Memray в разных процессах."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=('baseline', 'tracemalloc', 'memray'), default='baseline')
    parser.add_argument('--profile', required=True)
    parser.add_argument('--trace-depth', type=int, default=1)
    parser.add_argument('--collect-after', action='store_true')
    parser.add_argument('--trim-after', action='store_true')
    parser.add_argument('--profile-gc', action='store_true')
    parser.add_argument('target', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    target = args.target[1:] if args.target[:1] == ['--'] else args.target
    if not target:
        parser.error('Укажите путь локального стенда после --')
    if not sys.platform.startswith('linux'):
        parser.error('Счётчики нативного аллокатора предназначены только для Linux')
    profile = Path(args.profile).resolve()
    profile.parent.mkdir(parents=True, exist_ok=True)
    if profile.exists():
        parser.error('Профиль уже существует; используйте уникальное имя')
    tracker = contextlib.nullcontext()
    if args.mode == 'memray':
        import memray
        tracker = memray.Tracker(str(profile), native_traces=True, trace_python_allocators=True)
    if args.mode == 'tracemalloc':
        tracemalloc.start(args.trace_depth)
    initial = memory()
    cpu_started = resource.getrusage(resource.RUSAGE_SELF)
    started = time.monotonic()
    emit({'stage': 'before_target', 'mode': args.mode, **initial,
          'allocatorEnvironment': {key: os.environ.get(key) for key in
                                   ('PYTHONMALLOC', 'MALLOC_ARENA_MAX', 'MALLOC_TRIM_THRESHOLD_')}})
    exit_code = 0
    try:
        with tracker:
            sys.argv = target
            runpy.run_path(target[0], run_name='__main__')
            if args.profile_gc:
                collected = gc.collect()
                emit({'stage': 'inside_profile_after_gc', **memory(), 'collected': collected})
    except SystemExit as error:
        exit_code = error.code if isinstance(error.code, int) else int(error.code is not None)
        if exit_code:
            raise
    except BaseException:
        exit_code = 1
        raise
    finally:
        cpu_end = resource.getrusage(resource.RUSAGE_SELF)
        frame = {'stage': 'after_target', 'mode': args.mode, **memory(),
                 'wallSeconds': time.monotonic() - started,
                 'userCpuSeconds': cpu_end.ru_utime - cpu_started.ru_utime,
                 'systemCpuSeconds': cpu_end.ru_stime - cpu_started.ru_stime,
                 'exitCode': exit_code}
        emit(frame)
        if args.collect_after:
            collect_started = time.monotonic()
            collected = gc.collect()
            emit({'stage': 'diagnostic_after_gc', **memory(), 'collected': collected,
                  'pauseSeconds': time.monotonic() - collect_started})
        if args.trim_after:
            libc = ctypes.CDLL(None)
            libc.malloc_trim.argtypes = [ctypes.c_size_t]
            libc.malloc_trim.restype = ctypes.c_int
            trim_started = time.monotonic()
            result = libc.malloc_trim(0)
            emit({'stage': 'diagnostic_after_trim', **memory(), 'trimResult': result,
                  'pauseSeconds': time.monotonic() - trim_started})
        if args.mode == 'tracemalloc':
            # Само создание снимка выделяет память, поэтому выполняется после всех измерений.
            tracemalloc.take_snapshot().dump(str(profile))


if __name__ == '__main__':
    main()
