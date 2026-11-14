"""@fileoverview Независимая проверка заранее объявленного плато по исходным JSONL-снимкам."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import statistics


def quantile(values, fraction):
    """Возвращает линейно интерполированный квантиль без сторонних библиотек."""
    ordered = sorted(values)
    position = (len(ordered) - 1) * fraction
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def slope(rows, metric):
    """Вычисляет наклон КиБ на одно завершённое пробуждение, не меняя окно."""
    xs = [row['processed'] for row in rows]
    ys = [row[metric] for row in rows]
    mean_x, mean_y = statistics.mean(xs), statistics.mean(ys)
    denominator = sum((value - mean_x) ** 2 for value in xs)
    if not denominator:
        raise ValueError('Наклон нельзя измерить без различных processed')
    return sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys)) / denominator


def evaluate(rows, plan, evidence):
    """Проверяет условия независимо; отсутствие улик никогда не считается успехом."""
    failures, missing, measurements = [], [], {}
    control = [row for row in rows if row.get('kind') == 'control_idle']
    expected = plan['workload']
    required = plan['control']
    pids = {row['pid'] for row in rows if 'kind' in row and 'pid' in row}
    if not pids or any('kind' in row and 'pid' not in row for row in rows):
        missing.append('Нет PID каждого приёмочного снимка')
    elif len(pids) != 1:
        failures.append('Основные партии выполнялись в разных процессах')
    for batch in range(1, expected['batches'] + 1):
        load = [row for row in rows if row.get('kind') == 'load' and row.get('batch') == batch]
        endpoint = expected['bots'] * expected['cyclesPerBotPerBatch'] * batch
        if not load or max(row.get('processed', -1) for row in load) != endpoint:
            missing.append(f'Нет подтверждённого конца партии {batch}')
    if len(control) < required['minimumSamples']:
        missing.append('Недостаточно контрольных снимков после прогрева')
    elif control[-1]['elapsedSeconds'] - control[0]['elapsedSeconds'] < required['minimumSeconds']:
        missing.append('Контрольное окно короче объявленного')
    elif max(b['elapsedSeconds'] - a['elapsedSeconds'] for a, b in zip(control, control[1:])) > required['maximumIntervalSeconds']:
        missing.append('Слишком редкие контрольные снимки')
    for metric in plan['memory']['metrics']:
        if not control or any(not isinstance(row.get(metric), (int, float)) or not math.isfinite(row[metric]) for row in control):
            missing.append('Нет полной контрольной метрики: ' + metric)
            continue
        values = [row[metric] for row in control]
        spread = max(values) - min(values)
        tolerance = max(plan['memory']['minimumToleranceKiB'], plan['memory']['controlNoiseMultiplier'] * (quantile(values, .95) - quantile(values, .05)))
        result = dict(controlRangeKiB=spread, toleranceKiB=tolerance, batches=[])
        measurements[metric] = result
        if spread > required['maximumRangeKiB']:
            missing.append('Нестабильный контроль: ' + metric)
        residuals, positive = [], 0
        per_batch = expected['bots'] * expected['cyclesPerBotPerBatch']
        for batch in range(1, expected['batches'] + 1):
            settled = [row for row in rows if row.get('kind') == 'batch_idle' and row.get('batch') == batch]
            load = [row for row in rows if row.get('kind') == 'load' and row.get('batch') == batch and row.get('processed', -1) >= (batch - .5) * per_batch]
            if len(settled) < plan['memory']['settledSamplesPerBatch'] or len(load) < plan['memory']['minimumLateSamplesPerBatch']:
                missing.append(f'Недостаточно поздних/остаточных снимков {metric}, партия {batch}')
                continue
            selected = settled[-plan['memory']['settledSamplesPerBatch']:]
            minimum_idle = max(plan['memory']['minimumSettlingSeconds'], plan['memory']['poolIdleMultiplier'] * evidence.get('poolIdleSeconds', 60))
            if any(row.get('settlingSeconds', -1) < minimum_idle for row in selected):
                missing.append(f'Слишком ранние остаточные снимки, партия {batch}')
            metric_rows = selected + load
            if any(not isinstance(row.get(metric), (int, float)) or not math.isfinite(row[metric]) for row in metric_rows):
                missing.append(f'Неполная метрика {metric}, партия {batch}')
                continue
            residual = statistics.median(row[metric] for row in selected)
            residuals.append(residual)
            projected = slope(load, metric) * per_batch
            width = max(1, len(load) // 10)
            edge_delta = statistics.median(row[metric] for row in load[-width:]) - statistics.median(row[metric] for row in load[:width])
            result['batches'].append(dict(batch=batch, residualKiB=residual, projectedGrowthKiB=projected, lateEdgeDeltaKiB=edge_delta))
            if projected > tolerance or edge_delta > tolerance:
                positive += 1
        if positive == expected['batches']:
            failures.append('Устойчивый положительный поздний наклон: ' + metric)
        elif positive:
            missing.append('Неподтверждённое плато в части партий: ' + metric)
        if len(residuals) == expected['batches'] and max(residuals) - min(residuals) > tolerance:
            failures.append('Накопление между одинаковыми партиями: ' + metric)
    for name, maximum in plan['functional'].items():
        if name not in evidence or not isinstance(evidence[name], (int, float)) or not math.isfinite(evidence[name]) or evidence[name] < 0:
            missing.append('Нет функциональной улики: ' + name)
        elif evidence[name] > maximum:
            failures.append('Нарушение функционального условия: ' + name)
    for name in plan['externalEvidenceRequired']:
        artifact = evidence.get(name)
        if not isinstance(artifact, dict) or not artifact.get('path') or not artifact.get('sha256'):
            missing.append('Нет независимого артефакта: ' + name)
            continue
        path = Path(artifact['path'])
        if not path.is_file():
            missing.append('Файл артефакта отсутствует: ' + name)
        elif hashlib.sha256(path.read_bytes()).hexdigest() != artifact['sha256'].lower():
            failures.append('Хеш артефакта не совпал: ' + name)
    if not evidence.get('currentCommit') or evidence.get('ciCommit') != evidence.get('currentCommit'):
        missing.append('CI не привязан к актуальному коммиту')
    for group in ('workload', 'constraints'):
        for name, value in plan[group].items():
            if evidence.get(name) != value:
                missing.append('Не подтверждены параметры: ' + name)
    resources = {}
    for name in ('tasks', 'pgConnectionsIncludingObserver', 'redisClients', 'liveActivationControls', 'preparedAiogramModels'):
        baseline = [row[name] for row in control if isinstance(row.get(name), (int, float))]
        residuals = []
        for batch in range(1, expected['batches'] + 1):
            settled = [row for row in rows if row.get('kind') == 'batch_idle' and row.get('batch') == batch]
            selected = settled[-plan['memory']['settledSamplesPerBatch']:]
            values = [row[name] for row in selected if isinstance(row.get(name), (int, float))]
            residuals.append(statistics.median(values) if len(values) == plan['memory']['settledSamplesPerBatch'] else None)
        resources[name] = dict(controlMedian=statistics.median(baseline) if baseline else None, batchResidualMedians=residuals)
        if not baseline or any(value is None for value in residuals):
            missing.append('Нет полного ряда живых ресурсов: ' + name)
        elif residuals[0] < residuals[1] < residuals[2] and residuals[2] > max(baseline):
            failures.append('Увеличиваются нижние значения живых ресурсов: ' + name)
    performance = plan['performance']
    cpu = evidence.get('cpuPerEventRatio')
    latency = evidence.get('p95LatencyRatio')
    latency_delta = evidence.get('p95LatencyDeltaSeconds')
    performance_values = (cpu, latency, latency_delta)
    if any(not isinstance(value, (int, float)) or not math.isfinite(value) for value in performance_values) or (cpu is not None and cpu <= 0) or (latency is not None and latency <= 0):
        missing.append('Нет одинакового A/B CPU и задержек')
    else:
        if cpu > performance['maximumCpuPerEventRatio']:
            failures.append('Регрессия CPU на событие')
        if latency > performance['maximumP95LatencyRatio'] and latency_delta > performance['absoluteLatencyAllowanceSeconds']:
            failures.append('Регрессия p95 задержки')
    status = 'fail' if failures else 'inconclusive' if missing else 'pass'
    return dict(status=status, failures=failures, missing=missing, memory=measurements, resources=resources)


def main():
    """Читает неизменяемые входные улики и выводит машинный вердикт без изменения стенда."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--plan', type=Path, default=Path('output/acceptance-plan.json'))
    parser.add_argument('--evidence', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    rows = [json.loads(line) for line in args.input.read_text(encoding='utf-8-sig').splitlines() if line.strip()]
    result = evaluate(rows, json.loads(args.plan.read_text(encoding='utf-8-sig')), json.loads(args.evidence.read_text(encoding='utf-8-sig')))
    rendered = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(rendered + '\n', encoding='utf-8')
    print(rendered)
    raise SystemExit(0 if result['status'] == 'pass' else 1)


if __name__ == '__main__':
    main()
