/**
 * @fileoverview Тесты мутаций project.json: поиск ноды по листам, отсутствие silent ok
 * @module lib/bot-tools/project-mutate.test
 */

import { describe, expect, it } from 'vitest';
import { buttonSchema } from '@shared/schema';
import {
  removeNodeFromProject,
  updateNodeInProject,
} from './project-mutate.ts';

/** Минимальный проект с нодой на втором (неактивном) листе */
function multiSheetProject() {
  return {
    version: 2,
    activeSheetId: 'sheet-a',
    sheets: [
      {
        id: 'sheet-a',
        name: 'A',
        nodes: [
          {
            id: 'on-active',
            type: 'message',
            position: { x: 0, y: 0 },
            data: { messageText: 'active' },
          },
        ],
      },
      {
        id: 'sheet-b',
        name: 'B',
        nodes: [
          {
            id: 'on-other',
            type: 'message',
            position: { x: 10, y: 10 },
            data: {
              messageText: 'other',
              buttons: [
                {
                  id: 'btn1',
                  text: 'Link',
                  action: 'url',
                  url: 'https://example.com/old-path',
                  style: 'default',
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('updateNodeInProject sheet lookup', () => {
  it('обновляет ноду на неактивном листе без sheet_id', () => {
    const result = updateNodeInProject(multiSheetProject(), 'on-other', {
      data: { messageText: 'patched' },
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    const node = result.project.sheets![1]!.nodes!.find((n) => n.id === 'on-other');
    expect(node?.data).toMatchObject({ messageText: 'patched' });
  });

  it('возвращает ошибку, если ноды нет (не silent ok)', () => {
    const result = updateNodeInProject(multiSheetProject(), 'missing-node', {
      data: { messageText: 'x' },
    });
    expect(result).toEqual({ error: 'Нода не найдена: missing-node' });
  });

  it('при неверном sheet_id возвращает ошибку, даже если нода на другом листе', () => {
    const result = updateNodeInProject(
      multiSheetProject(),
      'on-other',
      { data: { messageText: 'x' } },
      'sheet-a',
    );
    expect(result).toEqual({ error: 'Нода не найдена: on-other' });
  });
});

describe('removeNodeFromProject sheet lookup', () => {
  it('удаляет ноду с неактивного листа без sheet_id', () => {
    const result = removeNodeFromProject(multiSheetProject(), 'on-other');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.project.sheets![1]!.nodes!.some((n) => n.id === 'on-other')).toBe(false);
  });
});

describe('buttonSchema style default', () => {
  it('принимает style: default и нормализует в undefined', () => {
    const parsed = buttonSchema.safeParse({
      id: 'b1',
      text: 'Go',
      action: 'url',
      url: 'https://example.com',
      style: 'default',
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.style).toBeUndefined();
  });

  it('принимает primary/success/danger без изменений', () => {
    for (const style of ['primary', 'success', 'danger'] as const) {
      const parsed = buttonSchema.safeParse({
        id: 'b1',
        text: 'Go',
        style,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.style).toBe(style);
    }
  });
});
