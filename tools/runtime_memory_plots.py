"""@fileoverview Строит исследовательские графики памяти из JSONL без изменения исходных измерений."""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import re
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

MIB = 1024 * 1024
DEFAULT_TRANSPORT = [
    ('HTTP/IP', 'output/transport-http-ip-linux-1000.jsonl'),
    ('TLS: новый SSLContext', 'output/transport-tls-fresh-linux-1000-v2.jsonl'),
    ('TLS: общий SSLContext', 'output/transport-tls-shared-linux-1000.jsonl'),
    ('TLS: MALLOC_ARENA_MAX=2', 'output/transport-tls-arena2-linux-1000.jsonl'),
]
DEFAULT_FULL = [
    ('Windows до исправления', 'output/full-probe-windows-100-before.jsonl'),
    ('Windows после исправления', 'output/full-probe-windows-100-after.jsonl'),
    ('Linux после исправления', 'output/full-probe-linux-100-after.jsonl'),
]


def read_artifact(label, filename):
    """Читает JSON-объекты и отдельно сохраняет количество строк stderr/traceback."""
    path = Path(filename)
    rows, non_json = [], 0
    for line in path.read_text(encoding='utf-8-sig').splitlines():
        try:
            value = json.loads(line)
        except (ValueError, TypeError):
            non_json += bool(line.strip())
            continue
        if isinstance(value, dict):
            rows.append(value)
    return {'label': label, 'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'rows': rows, 'nonJsonLines': non_json}


def draw_transport(artifacts, directory):
    """Разделяет штатные точки нагрузки и диагностическую принудительную сборку мусора."""
    figure, axes = plt.subplots(2, 2, figsize=(13, 8), constrained_layout=True)
    fields = [('rss', 'RSS, МиБ'), ('anonymous', 'Anonymous, МиБ'),
              ('executorThreads', 'Потоки executor, шт.'), ('scheduled', 'Записи таймеров, шт. (включая отменённые)')]
    for index, artifact in enumerate(artifacts):
        color = f'C{index}'
        natural = [row for row in artifact['rows'] if row.get('phase') in ('baseline', 'running', 'idle_natural')]
        diagnostic = [row for row in artifact['rows'] if row.get('phase') == 'diagnostic_gc']
        for axis, (field, title) in zip(axes.flat, fields):
            divisor = MIB if field in ('rss', 'anonymous') else 1
            points = [row for row in natural if row.get(field) is not None]
            axis.plot([row['cycles'] for row in points], [row[field] / divisor for row in points],
                      label=artifact['label'], color=color, linewidth=2)
            for row in diagnostic:
                if row.get(field) is not None:
                    axis.scatter(row['cycles'], row[field] / divisor, marker='x', s=65, color=color, zorder=5)
            axis.set(title=title, xlabel='Завершённые активации')
            axis.grid(alpha=.2)
    axes[0, 0].legend(fontsize=9, loc='lower right')
    figure.suptitle('Локальный Linux: transport-only, 1000 активаций\nНастоящие HTTP/TLS и Redis; × — отдельный диагностический GC', fontsize=14)
    save_figure(figure, directory / 'transport-memory')


def idle_rows(artifact):
    """Выбирает штатные settled-точки: исходную активацию и выгрузки после циклов."""
    result = []
    for row in artifact['rows']:
        stage = row.get('stage', '')
        if stage == 'four_permanent':
            result.append((0, row))
        elif re.fullmatch(r'idle_\d+', stage):
            result.append((int(stage.split('_')[-1]), row))
        elif row.get('kind') == 'batch_idle' and isinstance(row.get('sent'), int):
            result.append((row['sent'], row))
    return result


def draw_full(artifacts, directory):
    """Не смешивает Windows/Linux и выносит принудительный GC в отдельную панель."""
    figure, axes = plt.subplots(2, 2, figsize=(13, 8), constrained_layout=True)
    for index, artifact in enumerate(artifacts):
        color = f'C{index}'
        points = idle_rows(artifact)
        linux = 'Linux' in artifact['label']
        axis = axes[1, 0] if linux else axes[0, 0]
        axis.plot([x for x, row in points], [row['rssKiB'] / 1024 for x, row in points],
                  marker='o', color=color, label=artifact['label'])
        axes[0, 1].plot([x for x, row in points], [row.get('liveActivationControls', float('nan')) for x, row in points],
                        marker='o', color=color, label=artifact['label'])
    for axis, title in ((axes[0, 0], 'Windows: RSS после выгрузки временных ботов'),
                        (axes[1, 0], 'Linux: RSS после выгрузки временных ботов')):
        axis.set(title=title, ylabel='МиБ', xlabel='Циклы (два временных бота в цикле)')
        axis.grid(alpha=.2)
        axis.legend(fontsize=9)
    axes[0, 1].set(title='Живые контрольные объекты до диагностического GC',
                   ylabel='Шт., включая четыре постоянных', xlabel='Циклы')
    axes[0, 1].grid(alpha=.2)
    axes[0, 1].legend(fontsize=8)
    stages = [('Последняя idle-точка', None), ('Все остановлены', 'all_stopped'),
              ('Отдельный GC', 'diagnostic_gc_after_all_stopped')]
    for stage_index, (label, stage) in enumerate(stages):
        values = []
        for artifact in artifacts:
            selected = [row for row in artifact['rows'] if row.get('stage') == stage] if stage else [row for _, row in idle_rows(artifact)]
            values.append(selected[-1]['rssKiB'] / 1024 if selected else float('nan'))
        axes[1, 1].bar([index + (stage_index - 1) * .25 for index in range(len(artifacts))], values, width=.24, label=label)
    axes[1, 1].set(title='RSS: штатный результат и отдельная диагностика', ylabel='МиБ')
    axes[1, 1].set_xticks(range(len(artifacts)), [item['label'].replace(' ', '\n', 1) for item in artifacts], fontsize=8)
    axes[1, 1].legend(fontsize=8)
    figure.suptitle('Полный локальный runtime: 4 постоянных + 2 временных, 100 циклов\nНастоящие PostgreSQL и Redis; Telegram HTTP подменён. Это исследование, не приёмка плато', fontsize=13)
    save_figure(figure, directory / 'full-runtime-memory')


def save_figure(figure, stem):
    """Сохраняет самостоятельные растровый и векторный артефакты."""
    figure.savefig(stem.with_suffix('.png'), dpi=170)
    figure.savefig(stem.with_suffix('.svg'))
    plt.close(figure)


def draw_long_runs(artifacts, directory):
    """Подключает будущие многоэтапные raw-прогоны без подмены нагрузки settled-точками."""
    candidates = [item for item in artifacts if any('processed' in row for row in item['rows'])]
    if not candidates:
        return
    figure, axes = plt.subplots(2, 2, figsize=(13, 8), constrained_layout=True)
    for index, artifact in enumerate(candidates):
        rows = [row for row in artifact['rows'] if 'processed' in row and not str(row.get('stage', '')).startswith('diagnostic_gc')]
        color = f'C{index}'
        for axis, field, title in ((axes[0, 0], 'rssKiB', 'RSS'), (axes[0, 1], 'anonymousKiB', 'Anonymous')):
            points = [row for row in rows if row.get(field) is not None]
            axis.plot([row['processed'] for row in points], [row[field] / 1024 for row in points], color=color, label=artifact['label'])
            settled = [row for row in points if row.get('kind') in ('batch_idle', 'control_idle')]
            axis.scatter([row['processed'] for row in settled], [row[field] / 1024 for row in settled], color=color, marker='o', s=35)
            axis.set(title=title + ', МиБ', xlabel='Обработанные пробуждения')
        axes[1, 0].plot([row['processed'] for row in rows], [row.get('liveActivationControls', float('nan')) for row in rows], color=color, label=artifact['label'])
        axes[1, 1].plot([row['processed'] for row in rows], [row.get('pgConnectionsIncludingObserver', float('nan')) for row in rows], color=color, label=artifact['label'])
    axes[1, 0].set(title='Живые контрольные объекты', xlabel='Обработанные пробуждения', ylabel='Шт.')
    axes[1, 1].set(title='Соединения PostgreSQL, включая observer', xlabel='Обработанные пробуждения', ylabel='Шт.')
    for axis in axes.flat:
        axis.grid(alpha=.2)
        axis.legend(fontsize=8)
    figure.suptitle('Многоэтапное исследование полного runtime: линия — нагрузка, ● — idle-снимки\nДиагностический GC исключён; приёмочный вывод по этим графикам автоматически не делается', fontsize=13)
    save_figure(figure, directory / 'full-runtime-long-runs')


def main():
    """Формирует графики, хеши входов и ограничения интерпретации рядом с изображениями."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='output/plots')
    parser.add_argument('--transport', action='append', help='Подпись=путь к JSONL, повторяемый параметр')
    parser.add_argument('--full', action='append', help='Подпись=путь к JSONL, повторяемый параметр')
    options = parser.parse_args()
    directory = Path(options.output)
    directory.mkdir(parents=True, exist_ok=True)
    transport = [read_artifact(*pair) for pair in ([item.split('=', 1) for item in options.transport] if options.transport else DEFAULT_TRANSPORT)]
    full = [read_artifact(*pair) for pair in ([item.split('=', 1) for item in options.full] if options.full else DEFAULT_FULL)]
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'axes.spines.top': False, 'axes.spines.right': False})
    draw_transport(transport, directory)
    draw_full(full, directory)
    draw_long_runs(full, directory)
    inputs = [{**{key: value for key, value in item.items() if key != 'rows'},
               'metadata': [{key: row[key] for key in ('platform', 'python', 'cycles', 'batches', 'warmupCycles', 'permanentBots', 'temporaryBots', 'generatedSha256', 'libraries', 'realBytecodeCache') if key in row}
                            for row in item['rows'] if 'platform' in row]}
              for item in transport + full]
    manifest = {'command': [sys.executable, *sys.argv], 'python': platform.python_version(), 'matplotlib': matplotlib.__version__,
                'inputs': inputs, 'scope': 'Локальные исследовательские прогоны; не production и не приёмка плато',
                'sourceInvocation': 'Исторические команды измерений отсутствуют в части raw JSONL; не восстановлены предположением'}
    (directory / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = ['# Графики исследования памяти', '',
             'Это локальные диагностические прогоны. Они не подтверждают плато production или приёмку 150000 пробуждений.', '',
             'Transport: настоящий локальный HTTP/TLS + Redis. Full runtime: настоящий PostgreSQL/Redis, Telegram HTTP подменён.',
             'Крестики transport и отдельные столбцы full runtime обозначают принудительный диагностический GC; он не включён в штатную кривую.',
             'Windows и Linux показаны отдельно. Разные процессы/версии Python не являются строгим A/B одного фактора.',
             'Исходный Windows-before содержит traceback и не прошёл финальное утверждение освобождения активаций; частичные измерения сохранены честно.',
             '', '## Воспроизведение графиков', '', '```text', 'python tools/runtime_memory_plots.py --output output/plots', '```', '',
             'Точные интерпретатор, версия matplotlib, аргументы и SHA256 входов: manifest.json.', '', '## Входные артефакты', '']
    lines += [f"- `{item['path']}` — SHA256 `{item['sha256']}`; не-JSON строк: {item['nonJsonLines']}." for item in inputs]
    lines += ['', '## Transport: последняя штатная idle-точка', '',
              '| Режим | RSS, МиБ | PSS, МиБ | Anonymous, МиБ | Executor threads |',
              '| --- | ---: | ---: | ---: | ---: |']
    for item in transport:
        rows = [row for row in item['rows'] if row.get('phase') == 'idle_natural']
        if rows:
            row = rows[-1]
            lines.append(f"| {item['label']} | {row['rss']/MIB:.2f} | {row['pss']/MIB:.2f} | {row['anonymous']/MIB:.2f} | {row['executorThreads']} |")
    (directory / 'README.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(directory), 'inputs': len(inputs), 'figures': 2}))


if __name__ == '__main__':
    main()
