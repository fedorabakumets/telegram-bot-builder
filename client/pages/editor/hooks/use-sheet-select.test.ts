/** @fileoverview Проверки переключения листов без потери черновика и изменений метаданных. */
import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useState } from 'react';
import { botDataWithSheetsSchema } from '@shared/schema/tables/bot-sheets';
import { nodeSchema } from '@shared/schema/tables/node-schema';
import { useSheetSelect } from './use-sheet-select';

/**
 * Готовит два листа и имитирует несохранённую правку текущего холста.
 * @returns Черновик, состояние холста и обработчик выбора.
 */
function renderSheetNavigation() {
  const updatedAt = new Date('2026-01-01T00:00:00Z');
  const project = botDataWithSheetsSchema.parse({
    sheets: [
      { id: 'first', name: 'Первый', updatedAt },
      { id: 'second', name: 'Второй', updatedAt },
    ],
    activeSheetId: 'first',
  });
  const editedNode = nodeSchema.parse({ id: 'edit', type: 'message', position: { x: 0, y: 0 }, data: {} });
  const toast = vi.fn();
  const onAfterSelect = vi.fn();
  const hook = renderHook(() => {
    const [data, setBotDataWithSheets] = useState(project);
    const [nodes, setNodes] = useState([editedNode]);
    const { handleSheetSelect } = useSheetSelect({
      botDataWithSheets: data, getBotData: () => ({ nodes }), setBotDataWithSheets,
      setBotData: (next) => setNodes(next.nodes), currentNodeSizes: new Map(), toast, onAfterSelect,
    });
    return { data, nodes, handleSheetSelect };
  });
  return { ...hook, project, editedNode, toast, onAfterSelect };
}

it('возвращает несохранённые узлы исходного листа без обновления временных меток', () => {
  const { result, editedNode, project, onAfterSelect } = renderSheetNavigation();
  act(() => result.current.handleSheetSelect('second'));
  expect(result.current.data.activeSheetId).toBe('second');
  expect(result.current.nodes).toEqual([]);
  expect(result.current.data.sheets[0].updatedAt).toEqual(project.sheets[0].updatedAt);

  act(() => result.current.handleSheetSelect('first'));
  expect(result.current.nodes).toEqual([editedNode]);
  expect(onAfterSelect).toHaveBeenCalledTimes(2);
});

it('сохраняет действующий лист при повторном выборе и устаревшей ссылке', () => {
  const { result, project, onAfterSelect, toast } = renderSheetNavigation();
  act(() => result.current.handleSheetSelect('first'));
  expect(result.current.data).toBe(project);
  expect(toast).not.toHaveBeenCalled();
  act(() => result.current.handleSheetSelect('missing'));
  expect(result.current.data).toBe(project);
  expect(onAfterSelect).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledOnce();
});
