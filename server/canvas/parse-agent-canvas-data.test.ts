/** @fileoverview Проверяет снимки холста для синхронизации изменений агента. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { broadcastAgentCanvasUpdate } from './broadcastAgentCanvasUpdate';
import { canvasConnections, canvasRoomKey } from './canvasConnections';
import { parseAgentCanvasData } from './parse-agent-canvas-data';

describe('parseAgentCanvasData', () => {
  it('сохраняет все исходные поля и значения без нормализации', () => {
    const source = {
      version: 2, extraProject: { value: 'сохранить' },
      sheets: [{
        id: 'one', name: 'Лист', extraSheet: 7,
        nodes: [{ id: 'n1', type: 'message', position: { x: 1, y: 2, extraPosition: true }, data: { extraData: 'важно', buttons: [{ id: 'b', text: 'Кнопка', style: 'default' }] } }],
      }],
    };
    const result = parseAgentCanvasData(source);
    assert.ok(result);
    const json = JSON.parse(JSON.stringify(result.data));
    assert.deepEqual(json.extraProject, source.extraProject);
    assert.equal(json.sheets[0].extraSheet, 7);
    assert.equal(json.sheets[0].nodes[0].position.extraPosition, true);
    assert.equal(json.sheets[0].nodes[0].data.extraData, 'важно');
    assert.deepEqual(json, source);
    assert.equal('viewState' in source.sheets[0], false);
  });

  it('мигрирует старый формат и сохраняет дополнительные поля узлов', () => {
    const result = parseAgentCanvasData({
      extraProject: 'важно',
      nodes: [{ id: 'n1', type: 'message', position: { x: 0, y: 0 }, data: { extraData: 'сохранить', buttons: [{ id: 'b', text: 'Кнопка', style: 'default' }] } }],
    });
    assert.ok(result);
    const json = JSON.parse(JSON.stringify(result.data));
    assert.equal(json.extraProject, 'важно');
    assert.equal(json.sheets[0].nodes[0].data.extraData, 'сохранить');
    assert.equal(json.sheets[0].nodes[0].data.buttons[0].style, 'default');
    assert.equal(json.activeSheetId, json.sheets[0].id);
  });

  it('передаёт сохранённые данные даже если они не соответствуют схеме', () => {
    const snapshots: unknown[] = [{ sheets: [{ id: 5 }] }, { nodes: [{ id: 5 }] }, { arbitrary: true }, 'строка', null];
    for (const data of snapshots) assert.deepEqual(parseAgentCanvasData(data).data, data);
  });

  it('передаёт снимки в WebSocket без потери значений', () => {
    const source = { sheets: [{ id: 's', name: 'Лист', nodes: [{ id: 'n', type: 'message', position: { x: 0, y: 0 }, data: { buttons: [{ id: 'b', text: 'Кнопка', style: 'default' }] } }] }] };
    const snapshot = parseAgentCanvasData(source);
    assert.ok(snapshot);
    let wire = '';
    const socket = { readyState: WebSocket.OPEN, send: (value: string) => { wire = value; } } as unknown as WebSocket;
    const key = canvasRoomKey(987654);
    canvasConnections.set(key, new Set([socket]));
    try {
      broadcastAgentCanvasUpdate(987654, snapshot);
      assert.deepEqual(JSON.parse(wire).data, source);
      const unusual = { sheets: [{ id: 5 }], extra: 'сохранить' };
      broadcastAgentCanvasUpdate(987654, parseAgentCanvasData(unusual));
      assert.deepEqual(JSON.parse(wire).data, unusual);
    } finally {
      canvasConnections.delete(key);
    }
  });
});
