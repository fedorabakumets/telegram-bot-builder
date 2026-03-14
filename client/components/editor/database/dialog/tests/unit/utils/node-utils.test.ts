/**
 * @fileoverview Тесты для утилит работы с узлами проекта
 * Проверяет функции сбора и обработки узлов
 * @module tests/unit/utils/node-utils.test
 */

/// <reference types="vitest/globals" />

import { collectNodesFromProjectData } from '../../../utils/node-utils';

describe('collectNodesFromProjectData', () => {
  it('должен возвращать пустой массив для null', () => {
    const result = collectNodesFromProjectData(null);
    expect(result).toEqual([]);
  });

  it('должен возвращать пустой массив для undefined', () => {
    const result = collectNodesFromProjectData(undefined as any);
    expect(result).toEqual([]);
  });

  it('должен возвращать пустой массив для пустого объекта', () => {
    const result = collectNodesFromProjectData({});
    expect(result).toEqual([]);
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

    expect(result.length).toBe(3);
    expect(result[0].node.id).toBe('node-1');
    expect(result[0].sheetId).toBe('sheet-1');
    expect(result[0].sheetName).toBe('Main');
    expect(result[2].sheetId).toBe('sheet-2');
    expect(result[2].sheetName).toBe('Secondary');
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
    expect(result).toEqual([]);
  });

  it('должен собирать узлы из nodes (старый формат)', () => {
    const projectData = {
      nodes: [
        { id: 'node-1', type: 'message' },
        { id: 'node-2', type: 'button' },
      ],
    };

    const result = collectNodesFromProjectData(projectData as any);

    expect(result.length).toBe(2);
    expect(result[0].node.id).toBe('node-1');
    expect(result[0].sheetId).toBe('current');
    expect(result[0].sheetName).toBe('Текущий лист');
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

    expect(result.length).toBe(1);
    expect(result[0].node.id).toBe('node-1');
    expect(result[0].sheetId).toBe('sheet-1');
  });

  it('должен обрабатывать пустой массив nodes', () => {
    const projectData = {
      nodes: [],
    };

    const result = collectNodesFromProjectData(projectData as any);
    expect(result).toEqual([]);
  });

  it('должен обрабатывать nodes если nodes не массив', () => {
    const projectData = {
      nodes: 'not-array',
    };

    const result = collectNodesFromProjectData(projectData as any);
    expect(result).toEqual([]);
  });

  it('должен обрабатывать sheets если sheets не массив', () => {
    const projectData = {
      sheets: 'not-array',
    };

    const result = collectNodesFromProjectData(projectData as any);
    expect(result).toEqual([]);
  });
});
