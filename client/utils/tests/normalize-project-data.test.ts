/**
 * @fileoverview Тесты для утилиты нормализации данных проекта
 * @module client/utils/tests/normalize-project-data.test
 */

import { describe, it, expect } from 'vitest';
import { normalizeProjectData } from '../normalize-project-data';
import type { BotDataWithSheets } from '@shared/schema';

// ---------------------------------------------------------------------------
// Фикстуры
// ---------------------------------------------------------------------------

/** Минимальный проект с одним узлом */
function makeProject(nodeData: Record<string, any> = {}): BotDataWithSheets {
  return {
    version: 2,
    activeSheetId: 'sheet_1',
    sheets: [
      {
        id: 'sheet_1',
        name: 'Лист 1',
        nodes: [
          {
            id: 'node_1',
            type: 'message',
            position: { x: 0, y: 0 },
            data: { ...nodeData } as any,
          },
        ],
        connections: [],
        viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
      },
    ],
  };
}

function makeInputProject(nodeData: Record<string, any> = {}): BotDataWithSheets {
  return {
    version: 2,
    activeSheetId: 'sheet_1',
    sheets: [
      {
        id: 'sheet_1',
        name: 'Лист 1',
        nodes: [
          {
            id: 'node_1',
            type: 'input',
            position: { x: 0, y: 0 },
            data: { ...nodeData } as any,
          },
        ],
        connections: [],
        viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Базовая нормализация
// ---------------------------------------------------------------------------

describe('normalizeProjectData — базовые поля', () => {
  it('добавляет enableConditionalMessages если отсутствует', () => {
    const result = normalizeProjectData(makeProject());
    expect(result.sheets[0].nodes[0].data.enableConditionalMessages).toBe(false);
  });

  it('не перезаписывает enableConditionalMessages если уже задан', () => {
    const result = normalizeProjectData(makeProject({ enableConditionalMessages: true }));
    expect(result.sheets[0].nodes[0].data.enableConditionalMessages).toBe(true);
  });

  it('добавляет пустой массив conditionalMessages если отсутствует', () => {
    const result = normalizeProjectData(makeProject());
    expect(result.sheets[0].nodes[0].data.conditionalMessages).toEqual([]);
  });

  it('добавляет collectUserInput если отсутствует', () => {
    const result = normalizeProjectData(makeProject());
    expect(result.sheets[0].nodes[0].data.collectUserInput).toBe(false);
  });

  it('добавляет enableTextInput если отсутствует', () => {
    const result = normalizeProjectData(makeProject());
    expect(result.sheets[0].nodes[0].data.enableTextInput).toBe(false);
  });

  it('добавляет пустые переменные ввода', () => {
    const result = normalizeProjectData(makeProject());
    const data = result.sheets[0].nodes[0].data;
    expect(data.inputVariable).toBe('');
    expect(data.photoInputVariable).toBe('');
    expect(data.videoInputVariable).toBe('');
    expect(data.audioInputVariable).toBe('');
    expect(data.documentInputVariable).toBe('');
  });
});

describe('normalizeProjectData — input node defaults', () => {
  it('добавляет дефолты для новой ноды сохранения ответа', () => {
    const result = normalizeProjectData(makeInputProject());
    const data = result.sheets[0].nodes[0].data;
    expect(data.inputType).toBe('any');
    expect(data.inputVariable).toBe('');
    expect(data.inputTargetNodeId).toBe('');
    expect(data.appendVariable).toBe(false);
    expect(data.saveToDatabase).toBe(false);
    expect(data.inputPrompt).toBe('Введите ответ');
    expect(data.inputRequired).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Нормализация кнопок
// ---------------------------------------------------------------------------

describe('normalizeProjectData — нормализация кнопок', () => {
  it('конвертирует buttonType "complete" в action', () => {
    const result = normalizeProjectData(makeProject({
      buttons: [{ id: 'b1', text: 'OK', buttonType: 'complete' }]
    }));
    const btn = result.sheets[0].nodes[0].data.buttons[0];
    expect(btn.action).toBe('complete');
    expect(btn.buttonType).toBeUndefined();
  });

  it('конвертирует buttonType "option" в action "selection"', () => {
    const result = normalizeProjectData(makeProject({
      buttons: [{ id: 'b1', text: 'Вариант', buttonType: 'option' }]
    }));
    const btn = result.sheets[0].nodes[0].data.buttons[0];
    expect(btn.action).toBe('selection');
  });

  it('добавляет skipDataCollection и hideAfterClick по умолчанию', () => {
    const result = normalizeProjectData(makeProject({
      buttons: [{ id: 'b1', text: 'OK', action: 'goto' }]
    }));
    const btn = result.sheets[0].nodes[0].data.buttons[0];
    expect(btn.skipDataCollection).toBe(false);
    expect(btn.hideAfterClick).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Удаление connections из листов
// ---------------------------------------------------------------------------

describe('normalizeProjectData — удаление connections', () => {
  it('удаляет поле connections из листа', () => {
    const result = normalizeProjectData(makeProject());
    expect((result.sheets[0] as any).connections).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Несколько листов
// ---------------------------------------------------------------------------

describe('normalizeProjectData — несколько листов', () => {
  it('нормализует все листы', () => {
    const project: BotDataWithSheets = {
      version: 2,
      activeSheetId: 'sheet_1',
      sheets: [
        {
          id: 'sheet_1',
          name: 'Лист 1',
          nodes: [{ id: 'n1', type: 'message', position: { x: 0, y: 0 }, data: {} as any }],
          connections: [],
          viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
        },
        {
          id: 'sheet_2',
          name: 'Лист 2',
          nodes: [{ id: 'n2', type: 'message', position: { x: 0, y: 0 }, data: {} as any }],
          connections: [],
          viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
        },
      ],
    };
    const result = normalizeProjectData(project);
    expect(result.sheets).toHaveLength(2);
    result.sheets.forEach(sheet => {
      expect((sheet as any).connections).toBeUndefined();
      sheet.nodes.forEach(node => {
        expect(node.data.enableConditionalMessages).toBe(false);
      });
    });
  });
});
