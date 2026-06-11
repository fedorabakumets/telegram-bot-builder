/**
 * @fileoverview Тесты для шаблона узла parallel_split
 * @module templates/parallel-split/parallel-split.test
 */

import { describe, it, expect } from 'vitest';
import {
  collectParallelSplitEntries,
  generateParallelSplit,
  generateParallelSplitHandlers,
} from './parallel-split.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  validParamsNoGuards,
  nodesWithParallelSplit,
  nodesWithMissingTarget,
  nodesWithoutParallelSplit,
  nodesWithNullAndMixed,
  makeNode,
} from './parallel-split.fixture';
import { parallelSplitEntrySchema } from './parallel-split.schema';

// ─── generateParallelSplit() ─────────────────────────────────────────────────

describe('generateParallelSplit()', () => {
  it('генерирует async def handle_callback_', () => {
    const r = generateParallelSplit(validParamsSingle);
    expect(r).toContain('async def handle_callback_split_2');
  });

  it('содержит @dp.callback_query с nodeId', () => {
    const r = generateParallelSplit(validParamsSingle);
    expect(r).toContain('@dp.callback_query(lambda c: c.data == "split_2")');
  });

  it('создаёт задачу-супервизор через create_task при awaitAll=false', () => {
    const r = generateParallelSplit(validParamsSingle);
    expect(r).toContain('asyncio.create_task(_run_all())');
    expect(r).not.toContain('await _run_all()');
  });

  it('ждёт супервизор при awaitAll=true', () => {
    const r = generateParallelSplit(validParamsMultiple);
    expect(r).toContain('await _run_all()');
    expect(r).not.toContain('asyncio.create_task(_run_all())');
  });

  it('содержит семафор с maxConcurrent', () => {
    const r = generateParallelSplit(validParamsMultiple);
    expect(r).toContain('asyncio.Semaphore(2)');
  });

  it('maxConcurrent=0 → большой семафор (без лимита)', () => {
    const r = generateParallelSplit(validParamsNoGuards);
    expect(r).toContain('asyncio.Semaphore(999)');
  });

  it('skipIfRunning=true → проверка _active_splits', () => {
    const r = generateParallelSplit(validParamsSingle);
    expect(r).toContain('_active_splits');
    expect(r).toContain('_split_key');
    expect(r).toContain('Уже выполняется');
  });

  it('skipIfRunning=false → нет проверки _active_splits', () => {
    const r = generateParallelSplit(validParamsNoGuards);
    expect(r).not.toContain('_split_key in _active_splits');
  });

  it('вызывает обработчики всех веток', () => {
    const r = generateParallelSplit(validParamsMultiple);
    expect(r).toContain('handle_callback_http_weather');
    expect(r).toContain('handle_callback_http_rates');
    expect(r).toContain('handle_callback_psql_stats');
  });

  it('передаёт фоллбек onErrorTarget в _run_branch', () => {
    const r = generateParallelSplit(validParamsMultiple);
    expect(r).toContain('handle_callback_setv_rates_failed');
  });

  it('пустые ветки → warning и return', () => {
    const r = generateParallelSplit(validParamsEmpty);
    expect(r).toContain('logging.warning');
    expect(r).not.toContain('asyncio.gather');
  });

  it('содержит gather с return_exceptions', () => {
    const r = generateParallelSplit(validParamsMultiple);
    expect(r).toContain('return_exceptions=True');
  });
});

// ─── parallelSplitEntrySchema ────────────────────────────────────────────────

describe('parallelSplitEntrySchema', () => {
  it('валидирует корректные параметры', () => {
    expect(() => parallelSplitEntrySchema.parse(validParamsMultiple)).not.toThrow();
  });

  it('отклоняет параметры без nodeId', () => {
    const { nodeId, ...rest } = validParamsSingle as any;
    expect(() => parallelSplitEntrySchema.parse(rest)).toThrow();
  });

  it('отклоняет нечисловой maxConcurrent', () => {
    expect(() => parallelSplitEntrySchema.parse({ ...validParamsSingle, maxConcurrent: '5' })).toThrow();
  });

  it('отклоняет ветку без target', () => {
    const bad = {
      ...validParamsSingle,
      branches: [{ id: 'b1', label: 'x' }],
    };
    expect(() => parallelSplitEntrySchema.parse(bad)).toThrow();
  });
});

// ─── collectParallelSplitEntries() ───────────────────────────────────────────

describe('collectParallelSplitEntries()', () => {
  it('собирает split-ноды с ветками', () => {
    const entries = collectParallelSplitEntries(nodesWithParallelSplit);
    expect(entries).toHaveLength(1);
    expect(entries[0].branches).toHaveLength(2);
  });

  it('отбрасывает ветки с несуществующими целями', () => {
    const entries = collectParallelSplitEntries(nodesWithMissingTarget);
    expect(entries[0].branches).toHaveLength(1);
    expect(entries[0].branches[0].target).toBe('msg_1');
  });

  it('возвращает пустой массив без split-нод', () => {
    expect(collectParallelSplitEntries(nodesWithoutParallelSplit)).toHaveLength(0);
  });

  it('игнорирует null-узлы', () => {
    const entries = collectParallelSplitEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
  });

  it('распознаёт onErrorTarget с существующей нодой', () => {
    const entries = collectParallelSplitEntries(nodesWithParallelSplit);
    const withFallback = entries[0].branches.find(b => b.id === 'br_2');
    expect(withFallback?.onErrorTargetExists).toBe(true);
    expect(withFallback?.onErrorTargetSafe).toBe('msg_err');
  });

  it('skipIfRunning по умолчанию true', () => {
    const entries = collectParallelSplitEntries([
      makeNode('s1', 'parallel_split', { parallelBranches: [] }),
    ]);
    expect(entries[0].skipIfRunning).toBe(true);
  });

  it('maxConcurrent по умолчанию 5', () => {
    const entries = collectParallelSplitEntries([
      makeNode('s1', 'parallel_split', { parallelBranches: [] }),
    ]);
    expect(entries[0].maxConcurrent).toBe(5);
  });
});

// ─── generateParallelSplitHandlers() ─────────────────────────────────────────

describe('generateParallelSplitHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateParallelSplitHandlers([])).toBe('');
  });

  it('узлы без split → пустая строка', () => {
    expect(generateParallelSplitHandlers(nodesWithoutParallelSplit)).toBe('');
  });

  it('добавляет реестр _active_splits один раз', () => {
    const nodes = [
      ...nodesWithParallelSplit,
      makeNode('split_2', 'parallel_split', {
        parallelBranches: [{ id: 'b1', label: '', target: 'msg_1' }],
      }),
    ];
    const r = generateParallelSplitHandlers(nodes);
    const matches = r.match(/_active_splits: set = set\(\)/g) || [];
    expect(matches).toHaveLength(1);
  });

  it('генерирует обработчики для всех split-нод', () => {
    const nodes = [
      ...nodesWithParallelSplit,
      makeNode('split_2', 'parallel_split', {
        parallelBranches: [{ id: 'b1', label: '', target: 'msg_1' }],
      }),
    ];
    const r = generateParallelSplitHandlers(nodes);
    expect(r).toContain('handle_callback_split_1');
    expect(r).toContain('handle_callback_split_2');
  });

  it('экранирует спецсимволы в ID узла', () => {
    const nodes = [
      makeNode('split-with-dash', 'parallel_split', {
        parallelBranches: [{ id: 'b1', label: '', target: 'msg-1' }],
      }),
      makeNode('msg-1', 'message', { messageText: 'x' }),
    ];
    const r = generateParallelSplitHandlers(nodes);
    expect(r).toContain('handle_callback_split_with_dash');
    expect(r).toContain('handle_callback_msg_1');
  });
});
