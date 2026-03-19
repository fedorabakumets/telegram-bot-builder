/**
 * @fileoverview Тесты для утилиты получения информации о листах
 * @module tests/unit/utils/get-sheets-info.test
 */

/// <reference types="vitest/globals" />

import { getSheetsInfo } from '../../../handlers/get-sheets-info';
import { BotProject } from '@shared/schema';

describe('getSheetsInfo', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  describe('Старый формат данных', () => {
    it('должен возвращать один лист по умолчанию', () => {
      const project = {
        name: 'Old Format Project',
        data: {
          nodes: [{ id: 'node1', type: 'message' }]
        }
      } as BotProject;

      const result = getSheetsInfo(project);
      expect(result).toEqual({ count: 1, names: ['Лист 1'] });
    });

    it('должен возвращать пустой результат для проекта без data', () => {
      const project = { name: 'Test' } as BotProject;
      const result = getSheetsInfo(project);
      expect(result).toEqual({ count: 0, names: [] });
    });

    it('должен возвращать пустой результат для пустого data', () => {
      const project = { name: 'Test', data: {} } as BotProject;
      const result = getSheetsInfo(project);
      expect(result).toEqual({ count: 0, names: [] });
    });
  });

  describe('Новый формат данных (с листами)', () => {
    it('должен возвращать информацию о всех листах', () => {
      const project = {
        name: 'Multi-Sheet Project',
        data: {
          version: 2,
          sheets: [
            { name: 'Main', nodes: [] },
            { name: 'Settings', nodes: [] },
            { name: 'Commands', nodes: [] }
          ]
        }
      } as BotProject;

      const result = getSheetsInfo(project);
      expect(result.count).toBe(3);
      expect(result.names).toEqual(['Main', 'Settings', 'Commands']);
    });

    it('должен обрабатывать листы без названия', () => {
      const project = {
        name: 'Project',
        data: {
          version: 2,
          sheets: [
            { name: 'Main', nodes: [] },
            { nodes: [] }, // Без названия
            { name: 'Commands', nodes: [] }
          ]
        }
      } as BotProject;

      const result = getSheetsInfo(project);
      expect(result.count).toBe(3);
      expect(result.names).toContain('Лист без названия');
    });

    it('должен возвращать 0 листов для пустого массива sheets', () => {
      const project = {
        name: 'Empty Project',
        data: {
          version: 2,
          sheets: []
        }
      } as BotProject;

      const result = getSheetsInfo(project);
      expect(result.count).toBe(0);
      expect(result.names).toEqual([]);
    });

    it('должен обрабатывать sheets как пустой массив', () => {
      const project = {
        name: 'Project',
        data: {
          version: 2,
          sheets: []
        }
      } as BotProject;

      const result = getSheetsInfo(project);
      expect(result).toEqual({ count: 0, names: [] });
    });
  });

  describe('Обработка ошибок', () => {
    it('должен возвращать пустой результат при ошибке', () => {
      const project = {
        name: 'Invalid Project',
        data: { invalid: 'structure' }
      } as BotProject;

      const result = getSheetsInfo(project);
      expect(result).toEqual({ count: 0, names: [] });
    });

    it('должен обрабатывать null data', () => {
      const project = {
        name: 'Null Data Project',
        data: null
      } as BotProject;

      const result = getSheetsInfo(project);
      expect(result).toEqual({ count: 0, names: [] });
    });
  });
});
