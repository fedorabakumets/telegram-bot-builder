/** @fileoverview Проверяет снимки холста для синхронизации изменений агента. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseAgentCanvasData } from './parse-agent-canvas-data';

describe('parseAgentCanvasData', () => {
  it('сохраняет дополнительные поля проекта, листа и узла при нормализации', () => {
    const source = {
      version: 2, extraProject: { value: 'сохранить' },
      sheets: [{
        id: 'one', name: 'Лист', extraSheet: 7,
        nodes: [{ id: 'n1', type: 'message', position: { x: 1, y: 2, extraPosition: true }, data: { extraData: 'важно' } }],
      }],
    };
    const result = parseAgentCanvasData(source);
    assert.ok(result);
    const json = JSON.parse(JSON.stringify(result));
    assert.deepEqual(json.extraProject, source.extraProject);
    assert.equal(json.sheets[0].extraSheet, 7);
    assert.equal(json.sheets[0].nodes[0].position.extraPosition, true);
    assert.equal(json.sheets[0].nodes[0].data.extraData, 'важно');
    assert.equal(json.sheets[0].viewState.zoom, 100);
    assert.equal('viewState' in source.sheets[0], false);
  });

  it('мигрирует старый формат и сохраняет дополнительные поля узлов', () => {
    const result = parseAgentCanvasData({
      extraProject: 'важно',
      nodes: [{ id: 'n1', type: 'message', position: { x: 0, y: 0 }, data: { extraData: 'сохранить' } }],
    });
    assert.ok(result);
    const json = JSON.parse(JSON.stringify(result));
    assert.equal(json.extraProject, 'важно');
    assert.equal(json.sheets[0].nodes[0].data.extraData, 'сохранить');
    assert.equal(json.activeSheetId, json.sheets[0].id);
  });

  it('отклоняет некорректные снимки', () => {
    assert.equal(parseAgentCanvasData({ sheets: [{ id: 5 }] }), null);
    assert.equal(parseAgentCanvasData(null), null);
  });
});
