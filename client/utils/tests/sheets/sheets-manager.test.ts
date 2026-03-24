/**
 * @fileoverview Тесты для модуля управления листами SheetsManager
 * @module client/utils/tests/sheets/sheets-manager.test
 */

import { describe, it, expect } from 'vitest';
import { SheetsManager } from '../../sheets/sheets-manager';
import type { BotData, BotDataWithSheets } from '@shared/schema';

// ---------------------------------------------------------------------------
// Фикстуры
// ---------------------------------------------------------------------------

/** Минимальные данные бота в старом формате */
function makeLegacyData(withNodes = false): BotData {
  if (!withNodes) {
    return { nodes: [], connections: [] };
  }
  return {
    nodes: [
      {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {} as any,
      },
    ],
    connections: [],
  };
}

/** Минимальные данные бота в новом формате с одним листом */
function makeProjectData(): BotDataWithSheets {
  const sheet = SheetsManager.createSheet('Лист 1');
  return {
    sheets: [sheet],
    activeSheetId: sheet.id,
    version: 2,
  };
}

// ---------------------------------------------------------------------------
// migrateLegacyData
// ---------------------------------------------------------------------------

describe('SheetsManager.migrateLegacyData', () => {
  it('создаёт стартовый узел если узлов нет', () => {
    const result = SheetsManager.migrateLegacyData(makeLegacyData(false));
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].nodes).toHaveLength(1);
    expect(result.sheets[0].nodes[0].id).toBe('start');
  });

  it('сохраняет существующие узлы', () => {
    const result = SheetsManager.migrateLegacyData(makeLegacyData(true));
    expect(result.sheets[0].nodes).toHaveLength(1);
    expect(result.sheets[0].nodes[0].id).toBe('node_1');
  });

  it('возвращает версию 2', () => {
    const result = SheetsManager.migrateLegacyData(makeLegacyData());
    expect(result.version).toBe(2);
  });

  it('устанавливает activeSheetId', () => {
    const result = SheetsManager.migrateLegacyData(makeLegacyData());
    expect(result.activeSheetId).toBe(result.sheets[0].id);
  });
});

// ---------------------------------------------------------------------------
// isNewFormat
// ---------------------------------------------------------------------------

describe('SheetsManager.isNewFormat', () => {
  it('возвращает true для нового формата', () => {
    const data = makeProjectData();
    expect(SheetsManager.isNewFormat(data)).toBe(true);
  });

  it('возвращает false для старого формата', () => {
    expect(SheetsManager.isNewFormat(makeLegacyData())).toBe(false);
  });

  it('возвращает false для null', () => {
    expect(SheetsManager.isNewFormat(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createSheet
// ---------------------------------------------------------------------------

describe('SheetsManager.createSheet', () => {
  it('создаёт лист с заданным именем', () => {
    const sheet = SheetsManager.createSheet('Тест');
    expect(sheet.name).toBe('Тест');
  });

  it('создаёт стартовый узел если узлы не переданы', () => {
    const sheet = SheetsManager.createSheet('Тест');
    expect(sheet.nodes).toHaveLength(1);
    expect(sheet.nodes[0].id).toBe('start');
  });

  it('использует переданные узлы', () => {
    const nodes = [{ id: 'n1', type: 'message' as const, position: { x: 0, y: 0 }, data: {} as any }];
    const sheet = SheetsManager.createSheet('Тест', nodes);
    expect(sheet.nodes).toHaveLength(1);
    expect(sheet.nodes[0].id).toBe('n1');
  });

  it('генерирует уникальный id', () => {
    const a = SheetsManager.createSheet('A');
    const b = SheetsManager.createSheet('B');
    expect(a.id).not.toBe(b.id);
  });
});

// ---------------------------------------------------------------------------
// addSheet / deleteSheet / renameSheet
// ---------------------------------------------------------------------------

describe('SheetsManager.addSheet', () => {
  it('добавляет лист и делает его активным', () => {
    const data = makeProjectData();
    const updated = SheetsManager.addSheet(data, 'Новый');
    expect(updated.sheets).toHaveLength(2);
    expect(updated.activeSheetId).toBe(updated.sheets[1].id);
  });
});

describe('SheetsManager.deleteSheet', () => {
  it('удаляет лист', () => {
    const data = SheetsManager.addSheet(makeProjectData(), 'Второй');
    const sheetToDelete = data.sheets[1].id;
    const updated = SheetsManager.deleteSheet(data, sheetToDelete);
    expect(updated.sheets).toHaveLength(1);
  });

  it('выбрасывает ошибку при удалении последнего листа', () => {
    const data = makeProjectData();
    expect(() => SheetsManager.deleteSheet(data, data.sheets[0].id)).toThrow();
  });

  it('переключает активный лист при удалении активного', () => {
    const data = SheetsManager.addSheet(makeProjectData(), 'Второй');
    const activeId = data.activeSheetId!;
    const updated = SheetsManager.deleteSheet(data, activeId);
    expect(updated.activeSheetId).not.toBe(activeId);
  });
});

describe('SheetsManager.renameSheet', () => {
  it('переименовывает лист', () => {
    const data = makeProjectData();
    const updated = SheetsManager.renameSheet(data, data.sheets[0].id, 'Новое имя');
    expect(updated.sheets[0].name).toBe('Новое имя');
  });
});

// ---------------------------------------------------------------------------
// duplicateSheet / duplicateSheetInProject
// ---------------------------------------------------------------------------

describe('SheetsManager.duplicateSheet', () => {
  it('создаёт копию с суффиксом "(копия)"', () => {
    const sheet = SheetsManager.createSheet('Оригинал');
    const copy = SheetsManager.duplicateSheet(sheet);
    expect(copy.name).toBe('Оригинал (копия)');
  });

  it('генерирует новый id для листа', () => {
    const sheet = SheetsManager.createSheet('Оригинал');
    const copy = SheetsManager.duplicateSheet(sheet);
    expect(copy.id).not.toBe(sheet.id);
  });

  it('генерирует новые id для узлов', () => {
    const sheet = SheetsManager.createSheet('Оригинал');
    const copy = SheetsManager.duplicateSheet(sheet);
    expect(copy.nodes[0].id).not.toBe(sheet.nodes[0].id);
  });

  it('переназначает keyboardNodeId на новый id при дублировании листа', () => {
    const sheet = SheetsManager.createSheet('Оригинал', [
      {
        id: 'message_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: { keyboardNodeId: 'keyboard_1' } as any,
      },
      {
        id: 'keyboard_1',
        type: 'keyboard' as const,
        position: { x: 300, y: 100 },
        data: {} as any,
      },
    ]);

    const copy = SheetsManager.duplicateSheet(sheet);
    const duplicatedMessage = copy.nodes.find(node => node.type === 'message');
    const duplicatedKeyboard = copy.nodes.find(node => node.type === 'keyboard');
    const duplicatedMessageData = duplicatedMessage?.data as any;

    expect(duplicatedMessageData.keyboardNodeId).toBe(duplicatedKeyboard?.id);
  });
});

describe('SheetsManager.duplicateSheetInProject', () => {
  it('добавляет дубликат и делает его активным', () => {
    const data = makeProjectData();
    const updated = SheetsManager.duplicateSheetInProject(data, data.sheets[0].id);
    expect(updated.sheets).toHaveLength(2);
    expect(updated.activeSheetId).toBe(updated.sheets[1].id);
  });

  it('выбрасывает ошибку если лист не найден', () => {
    const data = makeProjectData();
    expect(() => SheetsManager.duplicateSheetInProject(data, 'несуществующий')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// setActiveSheet / getActiveSheet
// ---------------------------------------------------------------------------

describe('SheetsManager.setActiveSheet', () => {
  it('устанавливает активный лист', () => {
    const data = SheetsManager.addSheet(makeProjectData(), 'Второй');
    const secondId = data.sheets[1].id;
    const updated = SheetsManager.setActiveSheet(data, secondId);
    expect(updated.activeSheetId).toBe(secondId);
  });

  it('выбрасывает ошибку если лист не найден', () => {
    const data = makeProjectData();
    expect(() => SheetsManager.setActiveSheet(data, 'нет')).toThrow();
  });
});

describe('SheetsManager.getActiveSheet', () => {
  it('возвращает активный лист', () => {
    const data = makeProjectData();
    const active = SheetsManager.getActiveSheet(data);
    expect(active?.id).toBe(data.activeSheetId);
  });

  it('возвращает первый лист если activeSheetId не задан', () => {
    const data = { ...makeProjectData(), activeSheetId: undefined };
    const active = SheetsManager.getActiveSheet(data);
    expect(active?.id).toBe(data.sheets[0].id);
  });
});

// ---------------------------------------------------------------------------
// validateData
// ---------------------------------------------------------------------------

describe('SheetsManager.validateData', () => {
  it('возвращает пустой массив для корректных данных', () => {
    const data = makeProjectData();
    expect(SheetsManager.validateData(data)).toHaveLength(0);
  });

  it('возвращает ошибку если нет листов', () => {
    const data = { ...makeProjectData(), sheets: [] };
    const errors = SheetsManager.validateData(data);
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// toLegacyFormat
// ---------------------------------------------------------------------------

describe('SheetsManager.toLegacyFormat', () => {
  it('конвертирует в старый формат', () => {
    const data = makeProjectData();
    const legacy = SheetsManager.toLegacyFormat(data);
    expect(Array.isArray(legacy.nodes)).toBe(true);
    expect(Array.isArray(legacy.connections)).toBe(true);
  });

  it('возвращает пустые массивы если нет листов', () => {
    const data = { sheets: [], activeSheetId: undefined, version: 2 as const };
    const legacy = SheetsManager.toLegacyFormat(data);
    expect(legacy.nodes).toHaveLength(0);
    expect(legacy.connections).toHaveLength(0);
  });
});
