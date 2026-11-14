"""@fileoverview Сводит локальные профили, отделяя живые выделения от свободного glibc heap."""
import argparse
from collections import defaultdict
import json
from pathlib import Path
import tracemalloc


def frames(path):
    """Читает только JSON-кадры, не сохраняя текстовые журналы сценария."""
    result = []
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        try:
            value = json.loads(line)
            if isinstance(value, dict):
                result.append(value)
        except json.JSONDecodeError:
            continue
    return result


def native_top(path):
    """Группирует оставшиеся живые выделения Memray по стеку Python; это не оценка утечки."""
    import memray
    grouped = defaultdict(int)
    native = defaultdict(int)
    reader = memray.FileReader(str(path))
    total = 0
    for record in reader.get_leaked_allocation_records():
        total += record.size
        stack = record.stack_trace()
        frame = next((frame for frame in stack if 'telegram-bot-builder' in frame[1]),
                     stack[0] if stack else ('native', 'unknown', 0))
        grouped[str(frame)] += record.size
        native_frames = record.native_stack_trace()
        native_frame = next((frame for frame in native_frames
                             if any(name in str(frame).lower() for name in ('ssl', 'x509', 'crypto', 'pydantic', 'pymalloc'))),
                            native_frames[0] if native_frames else ('unknown',))
        native[str(native_frame)] += record.size
    return {'trackedLiveBytesAtEnd': total, 'topLiveStacks': sorted(grouped.items(), key=lambda pair: -pair[1])[:20],
            'topNativeLiveStacks': sorted(native.items(), key=lambda pair: -pair[1])[:20],
            'symbolizedSslCryptoLiveBytes': sum(size for stack, size in native.items()
                                                if any(name in stack.lower() for name in ('ssl', 'x509', 'crypto'))),
            'caveat': 'Живые выделения включают библиотеки и общие кеши; это не доказательство утечки.'}


def main():
    """Создаёт компактный машинно читаемый отчёт нескольких свежих процессов."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('logs', nargs='+')
    parser.add_argument('--memray')
    parser.add_argument('--tracemalloc')
    args = parser.parse_args()
    report = {'runs': []}
    for path in args.logs:
        entries = frames(path)
        report['runs'].append({'file': str(path),
                               'native': [entry['nativeProbe'] for entry in entries if 'nativeProbe' in entry],
                               'runtime': [entry for entry in entries if entry.get('stage') in
                                           ('baseline', 'all_stopped', 'diagnostic_gc_after_all_stopped')],
                               'lastRuntime': next((entry for entry in reversed(entries) if entry.get('stage')), None)})
    if args.memray:
        report['memray'] = native_top(args.memray)
    if args.tracemalloc:
        snapshot = tracemalloc.Snapshot.load(args.tracemalloc)
        report['tracemallocTop'] = [str(entry) for entry in snapshot.statistics('traceback')[:20]]
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
