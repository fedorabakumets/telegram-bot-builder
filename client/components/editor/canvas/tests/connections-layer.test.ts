import { describe, expect, it } from 'vitest';
import { getRenderableConnections, isConnectionRenderable, type Connection } from '../canvas-node/connections-layer';

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

  it('does not render button-goto until its button anchor is measured, but leaves other lines intact', () => {
    const connections: Connection[] = [
      { fromId: 'message-1', toId: 'message-2', type: 'auto-transition' },
      { fromId: 'message-1', toId: 'message-3', type: 'button-goto', buttonId: 'btn-1' },
    ];

    const nodeSizes = makeNodeSizes(['message-1', 'message-2', 'message-3']);

    expect(getRenderableConnections(connections, nodeSizes)).toEqual([
      { fromId: 'message-1', toId: 'message-2', type: 'auto-transition' },
    ]);

    expect(
      isConnectionRenderable(
        { fromId: 'message-1', toId: 'message-3', type: 'button-goto', buttonId: 'btn-1' },
        nodeSizes,
        new Map([['btn-1', { x: 10, y: 20 }]])
      )
    ).toBe(true);
  });
});
