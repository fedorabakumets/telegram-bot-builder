/**
 * @fileoverview Юнит-тесты `findFileUsages` — поиск нод, использующих файл, по
 * полю `attachedMedia` и легаси-полям (`imageUrl`/`videoUrl`/`audioUrl`/
 * `documentUrl`) (Req 15.2). Задача 10.1 (юнит-тесты).
 * @module components/editor/files/tests/use-file-node-usages.test
 */

import { describe, it, expect } from 'vitest';

import { findFileUsages } from '../hooks/use-file-node-usages';

/** Тип элемента массива листов, принимаемого `findFileUsages` */
type Sheet = Parameters<typeof findFileUsages>[1][number];

/**
 * Создаёт лист с заданными нодами для тестов.
 * @param id - ID листа
 * @param name - Имя листа
 * @param nodes - Массив нод листа
 * @returns Объект листа
 */
function makeSheet(id: string, name: string, nodes: Sheet['nodes']): Sheet {
  return { id, name, nodes };
}

const URL = '/uploads/1/pic.jpg';

describe('findFileUsages', () => {
  it('возвращает пустой массив при отсутствии url', () => {
    const sheets = [makeSheet('s1', 'Лист 1', [{ id: 'n1', data: { attachedMedia: [URL] } }])];
    expect(findFileUsages(null, sheets)).toEqual([]);
    expect(findFileUsages('', sheets)).toEqual([]);
  });

  it('возвращает пустой массив при отсутствии листов', () => {
    expect(findFileUsages(URL, [])).toEqual([]);
  });

  it('находит использование в attachedMedia (Req 15.2)', () => {
    const sheets = [
      makeSheet('s1', 'Лист 1', [
        { id: 'n1', data: { attachedMedia: [URL], messageText: 'Привет мир' } },
      ]),
    ];
    const usages = findFileUsages(URL, sheets);
    expect(usages).toHaveLength(1);
    expect(usages[0]).toEqual({
      nodeId: 'n1',
      nodeLabel: 'Привет мир',
      sheetId: 's1',
      sheetName: 'Лист 1',
    });
  });

  it('находит использование в легаси-полях imageUrl/videoUrl/audioUrl/documentUrl', () => {
    const sheets = [
      makeSheet('s1', 'Л', [
        { id: 'img', data: { imageUrl: URL } },
        { id: 'vid', data: { videoUrl: URL } },
        { id: 'aud', data: { audioUrl: URL } },
        { id: 'doc', data: { documentUrl: URL } },
      ]),
    ];
    const ids = findFileUsages(URL, sheets).map((u) => u.nodeId);
    expect(ids).toEqual(['img', 'vid', 'aud', 'doc']);
  });

  it('использует id ноды как метку при отсутствии messageText', () => {
    const sheets = [makeSheet('s1', 'Л', [{ id: 'n42', data: { imageUrl: URL } }])];
    expect(findFileUsages(URL, sheets)[0].nodeLabel).toBe('n42');
  });

  it('обрезает длинный messageText до 30 символов', () => {
    const long = 'a'.repeat(50);
    const sheets = [makeSheet('s1', 'Л', [{ id: 'n1', data: { imageUrl: URL, messageText: long } }])];
    expect(findFileUsages(URL, sheets)[0].nodeLabel).toBe('a'.repeat(30));
  });

  it('не находит ноды, не использующие файл', () => {
    const sheets = [
      makeSheet('s1', 'Л', [
        { id: 'n1', data: { attachedMedia: ['/other.jpg'] } },
        { id: 'n2', data: { imageUrl: '/another.png' } },
      ]),
    ];
    expect(findFileUsages(URL, sheets)).toEqual([]);
  });

  it('агрегирует использования по нескольким листам', () => {
    const sheets = [
      makeSheet('s1', 'Лист 1', [{ id: 'n1', data: { attachedMedia: [URL] } }]),
      makeSheet('s2', 'Лист 2', [{ id: 'n2', data: { documentUrl: URL } }]),
    ];
    const usages = findFileUsages(URL, sheets);
    expect(usages.map((u) => u.sheetId)).toEqual(['s1', 's2']);
  });

  it('корректно обрабатывает лист без массива нод', () => {
    const sheets = [{ id: 's1', name: 'Л', nodes: undefined as unknown as Sheet['nodes'] }];
    expect(findFileUsages(URL, sheets)).toEqual([]);
  });
});
