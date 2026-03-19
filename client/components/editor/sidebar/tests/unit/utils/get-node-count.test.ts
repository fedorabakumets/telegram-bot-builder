/**
 * @fileoverview Тесты для утилиты подсчёта узлов
 * @module tests/unit/utils/get-node-count.test
 */

/// <reference types="vitest/globals" />

import { getNodeCount } from '../../../handlers/get-node-count';
import { BotProject } from '@shared/schema';

describe('getNodeCount', () => {
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Старый формат данных', () => {
    it('должен возвращать 0 для пустого проекта', () => {
      const project = { name: 'Test', data: {} } as BotProject;
      const result = getNodeCount(project);
      expect(result).toBe(0);
    });

    it('должен возвращать 0 для проекта без data', () => {
      const project = { name: 'Test' } as BotProject;
      const result = getNodeCount(project);
      expect(result).toBe(0);
    });

    it('должен подсчитывать узлы в старом формате', () => {
      const project = {
        name: 'Test Project',
        data: {
          nodes: [
            { id: 'node1', type: 'message' },
            { id: 'node2', type: 'command' },
            { id: 'node3', type: 'start' }
          ]
        }
      } as BotProject;

      const result = getNodeCount(project);
      expect(result).toBe(3);
    });

    it('должен возвращать 0 если nodes не массив', () => {
      const project = {
        name: 'Test',
        data: { nodes: 'not-array' }
      } as BotProject;

      const result = getNodeCount(project);
      expect(result).toBe(0);
    });
  });

  describe('Новый формат данных (с листами)', () => {
    it('должен подсчитывать узлы across all sheets', () => {
      const project = {
        name: 'Multi-Sheet Project',
        data: {
          version: 2,
          sheets: [
            {
              name: 'Sheet 1',
              nodes: [
                { id: 'node1', type: 'message' },
                { id: 'node2', type: 'command' }
              ]
            },
            {
              name: 'Sheet 2',
              nodes: [
                { id: 'node3', type: 'start' }
              ]
            }
          ]
        }
      } as BotProject;

      const result = getNodeCount(project);
      expect(result).toBe(3);
    });

    it('должен обрабатывать листы без узлов', () => {
      const project = {
        name: 'Project',
        data: {
          version: 2,
          sheets: [
            { name: 'Sheet 1', nodes: [] },
            { name: 'Sheet 2', nodes: [{ id: 'node1', type: 'message' }] }
          ]
        }
      } as BotProject;

      const result = getNodeCount(project);
      expect(result).toBe(1);
    });

    it('должен обрабатывать листы без свойства nodes', () => {
      const project = {
        name: 'Project',
        data: {
          version: 2,
          sheets: [
            { name: 'Sheet 1' },
            { name: 'Sheet 2', nodes: [{ id: 'node1', type: 'message' }] }
          ]
        }
      } as BotProject;

      const result = getNodeCount(project);
      expect(result).toBe(1);
    });

    it('должен возвращать 0 для пустого массива sheets', () => {
      const project = {
        name: 'Project',
        data: {
          version: 2,
          sheets: []
        }
      } as BotProject;

      const result = getNodeCount(project);
      expect(result).toBe(0);
    });
  });

  describe('Обработка ошибок', () => {
    it('должен использовать fallback для некорректных данных', () => {
      const project = {
        name: 'Invalid Project',
        data: { invalid: 'structure' }
      } as BotProject;

      const result = getNodeCount(project);
      expect(result).toBe(0);
    });

    it('должен обрабатывать ошибки при подсчёте', () => {
      const project = {
        name: 'Error Project',
        data: null
      } as BotProject;

      const result = getNodeCount(project);
      expect(result).toBe(0);
    });
  });
});
