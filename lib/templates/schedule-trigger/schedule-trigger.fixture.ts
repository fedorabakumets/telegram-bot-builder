/**
 * @fileoverview Тестовые данные для шаблона schedule_trigger
 * @module templates/schedule-trigger/schedule-trigger.fixture
 */

import type { ScheduleTriggerTemplateParams } from './schedule-trigger.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

/** Создаёт мок-узел для тестов */
function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (ScheduleTriggerTemplateParams) ─────────────────

/** Пустой массив триггеров */
export const validParamsEmpty: ScheduleTriggerTemplateParams = {
  entries: [],
};

/** Один interval-триггер */
export const validParamsSingle: ScheduleTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'schedule-fetch-rates',
      safeName: 'schedule_fetch_rates',
      targetNodeId: 'code-fetch',
      targetNodeType: 'message',
      rules: [{ mode: 'interval', intervalMinutes: 5 }],
      timezone: 'Europe/Moscow',
      runOnStart: false,
      enabled: true,
      maxConcurrent: 1,
    },
  ],
};

/** Несколько триггеров с разными режимами */
export const validParamsMultiple: ScheduleTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'schedule-interval',
      safeName: 'schedule_interval',
      targetNodeId: 'node-a',
      targetNodeType: 'message',
      rules: [{ mode: 'interval', intervalMinutes: 10 }],
      timezone: 'Europe/Moscow',
      runOnStart: true,
      enabled: true,
      maxConcurrent: 1,
    },
    {
      nodeId: 'schedule-weekday',
      safeName: 'schedule_weekday',
      targetNodeId: 'node-b',
      targetNodeType: 'http_request',
      rules: [{ mode: 'weekday', days: ['mon', 'wed', 'fri'], hour: 9, minute: 0 }],
      timezone: 'Asia/Tokyo',
      runOnStart: false,
      enabled: true,
      maxConcurrent: 2,
    },
    {
      nodeId: 'schedule-cron',
      safeName: 'schedule_cron',
      targetNodeId: 'node-c',
      targetNodeType: 'message',
      rules: [{ mode: 'cron', cronExpression: '*/5 9-18 * * 1-5' }],
      timezone: 'UTC',
      runOnStart: false,
      enabled: true,
      maxConcurrent: 1,
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectScheduleTriggerEntries ─────

/** Один schedule_trigger узел с целевым узлом */
export const nodesWithTrigger: Node[] = [
  makeNode('sched-1', 'schedule_trigger', {
    autoTransitionTo: 'msg-target',
    rules: [{ mode: 'interval', intervalMinutes: 5 }],
    timezone: 'Europe/Moscow',
    runOnStart: false,
    enabled: true,
    maxConcurrent: 1,
  }),
  makeNode('msg-target', 'message', { messageText: 'Привет!' }),
];

/** Узлы без schedule_trigger — должны быть пропущены */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** schedule_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('sched-bad', 'schedule_trigger', {
    autoTransitionTo: '',
    rules: [{ mode: 'interval', intervalMinutes: 5 }],
  }),
];
