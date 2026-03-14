/**
 * @fileoverview Тесты для утилит работы с узлами проекта
 * Проверяет функции сбора и обработки узлов
 * @module tests/unit/utils/node-utils.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { collectNodesFromProjectData } from '../../../utils/node-utils';

describe('node-utils', () => {
  describe('collectNodesFromProjectData', () => {
    it('должен возвращать пустой массив для null', () => {
      const result = collectNodesFromProjectData(null);
      assert.deepStrictEqual(result, []);
    });

    it('должен возвращать пустой массив для undefined', () => {
      const result = collectNodesFromProjectData(undefined as any);
      assert.deepStrictEqual(result, []);
    });

    it('должен возвращать пустой массив для пустого объекта', () => {
      const result = collectNodesFromProjectData({});
      assert.deepStrictEqual(result, []);
    });

    it('должен собирать узлы из sheets (новый формат)', () => {
      const projectData = {
        sheets: [
          {
            id: 'sheet-1',
            name: 'Main',
            nodes: [
              { id: 'node-1', type: 'message' },
              { id: 'node-2', type: 'button' },
            ],
          },
          {
            id: 'sheet-2',
            name: 'Secondary',
            nodes: [
              { id: 'node-3', type: 'keyword' },
            ],
          },
        ],
      };

      const result = collectNodesFromProjectData(projectData as any);

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].node.id, 'node-1');
      assert.strictEqual(result[0].sheetId, 'sheet-1');
      assert.strictEqual(result[0].sheetName, 'Main');
      assert.strictEqual(result[2].sheetId, 'sheet-2');
      assert.strictEqual(result[2].sheetName, 'Secondary');
    });

    it('должен обрабатывать sheets без nodes', () => {
      const projectData = {
        sheets: [
          {
            id: 'sheet-1',
            name: 'Empty',
          },
        ],
      };

      const result = collectNodesFromProjectData(projectData as any);
      assert.deepStrictEqual(result, []);
    });

    it('должен собирать узлы из nodes (старый формат)', () => {
      const projectData = {
        nodes: [
          { id: 'node-1', type: 'message' },
          { id: 'node-2', type: 'button' },
        ],
      };

      const result = collectNodesFromProjectData(projectData as any);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].node.id, 'node-1');
      assert.strictEqual(result[0].sheetId, 'current');
      assert.strictEqual(result[0].sheetName, 'Текущий лист');
    });

    it('должен отдавать приоритет sheets перед nodes', () => {
      const projectData = {
        sheets: [
          {
            id: 'sheet-1',
            name: 'From Sheets',
            nodes: [{ id: 'node-1', type: 'message' }],
          },
        ],
        nodes: [
          { id: 'node-2', type: 'button' },
        ],
      };

      const result = collectNodesFromProjectData(projectData as any);

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].node.id, 'node-1');
      assert.strictEqual(result[0].sheetName, 'From Sheets');
    });

    it('должен обрабатывать пустой массив nodes', () => {
      const projectData = {
        nodes: [],
      };

      const result = collectNodesFromProjectData(projectData as any);
      assert.deepStrictEqual(result, []);
    });

    it('должен обрабатывать nodes если nodes не массив', () => {
      const projectData = {
        nodes: 'not-array',
      };

      const result = collectNodesFromProjectData(projectData as any);
      assert.deepStrictEqual(result, []);
    });

    it('должен обрабатывать sheets если sheets не массив', () => {
      const projectData = {
        sheets: 'not-array',
      };

      const result = collectNodesFromProjectData(projectData as any);
      assert.deepStrictEqual(result, []);
    });
  });
});
