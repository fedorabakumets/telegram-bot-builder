/**
 * @fileoverview Тесты миграции legacy source-link для `forward_message`.
 *
 * Проверяет, что старая связь `message/media -> forward_message`,
 * сохранённая как `autoTransitionTo`, преобразуется в привязку источника
 * сообщения без автоматического запуска узла пересылки.
 */

import { describe, expect, it } from 'vitest';
import { migrateForwardMessageSourceLinks } from '../canvas/utils/migrate-forward-message-source-links';

describe('migrateForwardMessageSourceLinks', () => {
  it('превращает legacy autoTransition message -> forward_message в source-link', () => {
    const migrated = migrateForwardMessageSourceLinks([
      {
        id: 'msg_1',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          enableAutoTransition: true,
          autoTransitionTo: 'fwd_1',
          messageText: 'Привет',
        },
      } as any,
      {
        id: 'fwd_1',
        type: 'forward_message',
        position: { x: 500, y: 0 },
        data: {
          sourceMessageIdSource: 'current_message',
          sourceMessageNodeId: '',
        },
      } as any,
    ]);

    const sourceNode = migrated.find((node) => node.id === 'msg_1');
    const forwardNode = migrated.find((node) => node.id === 'fwd_1');

    expect(sourceNode?.data.enableAutoTransition).toBe(false);
    expect(sourceNode?.data.autoTransitionTo).toBe('');
    expect(forwardNode?.data.sourceMessageNodeId).toBe('msg_1');
    expect(forwardNode?.data.sourceMessageIdSource).toBe('current_message');
  });

  it('не трогает обычный автопереход в не-forward узел', () => {
    const migrated = migrateForwardMessageSourceLinks([
      {
        id: 'msg_1',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          enableAutoTransition: true,
          autoTransitionTo: 'msg_2',
          messageText: 'Шаг 1',
        },
      } as any,
      {
        id: 'msg_2',
        type: 'message',
        position: { x: 500, y: 0 },
        data: {
          messageText: 'Шаг 2',
        },
      } as any,
    ]);

    const sourceNode = migrated.find((node) => node.id === 'msg_1');

    expect(sourceNode?.data.enableAutoTransition).toBe(true);
    expect(sourceNode?.data.autoTransitionTo).toBe('msg_2');
  });
});
