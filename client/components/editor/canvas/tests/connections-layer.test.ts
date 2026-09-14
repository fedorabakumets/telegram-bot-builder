import { describe, expect, it } from 'vitest';
import {
  collectConnections,
  getRenderableConnections,
  isConnectionRenderable,
  type Connection,
} from '../canvas-node/connections-layer';

function makeNodeSizes(ids: string[]) {
  return new Map(ids.map(id => [id, { width: 320, height: 120 }]));
}

describe('ConnectionsLayer helpers', () => {
  it('keeps already measured connections visible when a new trigger connection is not ready yet', () => {
    const connections: Connection[] = [
      { fromId: 'trigger-ready', toId: 'message-ready', type: 'trigger-next' },
      { fromId: 'trigger-new', toId: 'message-ready', type: 'trigger-next' },
    ];

    const nodeSizes = makeNodeSizes(['trigger-ready', 'message-ready']);

    expect(getRenderableConnections(connections, nodeSizes)).toEqual([
      { fromId: 'trigger-ready', toId: 'message-ready', type: 'trigger-next' },
    ]);
  });

  it('renders button-goto even before button port offset is measured', () => {
    const connections: Connection[] = [
      { fromId: 'message-1', toId: 'message-2', type: 'auto-transition' },
      { fromId: 'message-1', toId: 'message-3', type: 'button-goto', buttonId: 'btn-1' },
    ];

    const nodeSizes = makeNodeSizes(['message-1', 'message-2', 'message-3']);

    expect(getRenderableConnections(connections, nodeSizes)).toEqual(connections);

    expect(
      isConnectionRenderable(
        { fromId: 'message-1', toId: 'message-3', type: 'button-goto', buttonId: 'btn-1' },
        nodeSizes,
      )
    ).toBe(true);
  });

  it('рисует pay → после оплаты от клавиатуры по autoTransitionTo счёта', () => {
    const nodes = [
      {
        id: 'inv-1',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          keyboardNodeId: 'kb-1',
          autoTransitionTo: 'msg-after',
          enableAutoTransition: true,
        },
      },
      {
        id: 'kb-1',
        type: 'keyboard',
        position: { x: 0, y: 100 },
        data: {
          keyboardType: 'inline',
          buttons: [{ id: 'pay-btn', text: 'Оплатить ⭐', action: 'pay' }],
        },
      },
      {
        id: 'msg-after',
        type: 'message',
        position: { x: 400, y: 0 },
        data: { messageText: 'Спасибо' },
      },
    ] as any[];

    const connections = collectConnections(nodes);
    expect(connections).toContainEqual({
      fromId: 'kb-1',
      toId: 'msg-after',
      type: 'button-goto',
      label: 'Оплатить ⭐',
      buttonId: 'pay-btn',
    });
    expect(connections.some((c) => c.fromId === 'inv-1' && c.type === 'auto-transition')).toBe(false);
  });

  it('рисует pay-стрелку и без enableAutoTransition, если есть autoTransitionTo', () => {
    const nodes = [
      {
        id: 'inv-1',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          keyboardNodeId: 'kb-1',
          autoTransitionTo: 'msg-after',
        },
      },
      {
        id: 'kb-1',
        type: 'keyboard',
        position: { x: 0, y: 100 },
        data: {
          keyboardType: 'inline',
          buttons: [{ id: 'pay-btn', text: 'Оплатить', action: 'pay' }],
        },
      },
      {
        id: 'msg-after',
        type: 'message',
        position: { x: 400, y: 0 },
        data: { messageText: 'ok' },
      },
    ] as any[];

    const connections = collectConnections(nodes);
    expect(connections.some((c) => c.fromId === 'kb-1' && c.toId === 'msg-after' && c.buttonId === 'pay-btn')).toBe(true);
  });
});