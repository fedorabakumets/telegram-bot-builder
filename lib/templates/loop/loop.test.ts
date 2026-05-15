/**
 * @fileoverview Тесты для шаблона узла loop
 * @module templates/loop/loop.test
 */

import { describe, it, expect } from 'vitest';
import {
  collectLoopEntries,
  generateLoopHandlers,
} from './loop.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsParallel,
  nodesWithLoop,
  nodesWithoutLoop,
  nodesWithNullAndMixed,
  makeNode,
} from './loop.fixture';
import { loopEntrySchema } from './loop.schema';

// ─── generateLoopHandlers() ──────────────────────────────────────────────────

describe('generateLoopHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateLoopHandlers([])).toBe('');
  });

  it('узлы без loop → пустая строка', () => {
    expect(generateLoopHandlers(nodesWithoutLoop)).toBe('');
  });

  it('генерирует async def handle_callback_', () => {
    const r = generateLoopHandlers(nodesWithLoop);
    expect(r).toContain('async def handle_callback_');
  });

  it('содержит @dp.callback_query', () => {
    const r = generateLoopHandlers(nodesWithLoop);
    expect(r).toContain('@dp.callback_query');
  });

  it('содержит set_user_var', () => {
    const r = generateLoopHandlers(nodesWithLoop);
    expect(r).toContain('set_user_var');
  });

  it('содержит asyncio.sleep (для delay)', () => {
    const r = generateLoopHandlers(nodesWithLoop);
    expect(r).toContain('asyncio.sleep');
  });

  it('содержит logging.warning (для лимита)', () => {
    const r = generateLoopHandlers(nodesWithLoop);
    expect(r).toContain('logging.warning');
  });

  it('содержит asyncio.gather (для parallel)', () => {
    const parallelNodes = [
      makeNode('loop_p', 'loop', {
        sourceVariable: 'tasks',
        itemVariable: 'task',
        indexVariable: 'idx',
        parallel: true,
        delaySeconds: 0,
        maxIterations: 0,
        autoTransitionTo: 'body_p',
        afterLoopTo: '',
      }),
      makeNode('body_p', 'message', { messageText: 'Задача' }),
    ];
    const r = generateLoopHandlers(parallelNodes);
    expect(r).toContain('asyncio.gather');
  });
});

// ─── loopEntrySchema ─────────────────────────────────────────────────────────

describe('loopEntrySchema', () => {
  it('принимает валидные параметры', () => {
    expect(loopEntrySchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('отклоняет без nodeId', () => {
    const { nodeId, ...rest } = validParamsSingle;
    expect(loopEntrySchema.safeParse(rest).success).toBe(false);
  });

  it('отклоняет без sourceVariable', () => {
    const { sourceVariable, ...rest } = validParamsSingle;
    expect(loopEntrySchema.safeParse(rest).success).toBe(false);
  });

  it('принимает с дефолтами (все поля заполнены)', () => {
    expect(loopEntrySchema.safeParse(validParamsParallel).success).toBe(true);
  });
});

// ─── collectLoopEntries() ────────────────────────────────────────────────────

describe('collectLoopEntries()', () => {
  it('собирает с правильными полями', () => {
    const entries = collectLoopEntries(nodesWithLoop);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('loop_1');
    expect(entries[0].sourceVariable).toBe('items');
    expect(entries[0].autoTransitionTo).toBe('msg_body');
  });

  it('пропускает null', () => {
    const entries = collectLoopEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('loop_1');
  });

  it('пропускает не-loop', () => {
    expect(collectLoopEntries(nodesWithoutLoop)).toHaveLength(0);
  });

  it('пустой вход', () => {
    expect(collectLoopEntries([])).toEqual([]);
  });

  it('пропускает без sourceVariable', () => {
    const nodes = [makeNode('loop_empty', 'loop', {})];
    const entries = collectLoopEntries(nodes);
    expect(entries).toHaveLength(0);
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateLoopHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateLoopHandlers(nodesWithLoop);
    expect(Date.now() - start).toBeLessThan(100);
  });
});
