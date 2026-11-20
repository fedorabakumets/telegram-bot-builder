/** @fileoverview Регрессии повтора, конфликта и смены проекта при автосохранении. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useEditorAutosave } from './use-editor-autosave';

/** Свойства автосохранения, передаваемые редактором. */
type Options = Parameters<typeof useEditorAutosave>[0];

/**
 * Создаёт состояние редактора с одной локальной правкой.
 * @param onSave - Действие записи.
 * @returns Параметры автосохранения.
 */
function options(onSave: Options['onSave']): Options {
  return { projectId: 1, enabled: true, hasLocalChanges: true, isSaving: false,
    mode: 'canvas', latestActionId: 'edit-1', onSave };
}

/**
 * Дожидается паузы перед автосохранением.
 * @param delay - Время ожидания в миллисекундах.
 */
async function advance(delay = 700): Promise<void> {
  await act(async () => { await vi.advanceTimersByTimeAsync(delay); });
}

beforeEach(() => { vi.useFakeTimers(); localStorage.setItem('editor-autosave', '1'); });
afterEach(() => { cleanup(); localStorage.removeItem('editor-autosave'); vi.useRealTimers(); });

it('не повторяет автоматически неудавшуюся запись того же черновика', async () => {
  const save = vi.fn<Options['onSave']>().mockResolvedValue('failed');
  const initial = options(save);
  const view = renderHook(useEditorAutosave, { initialProps: initial });
  await advance(2100);
  view.rerender({ ...initial, isSaving: true });
  view.rerender(initial);
  await advance(2100);
  expect(save).toHaveBeenCalledTimes(1);
  view.rerender({ ...initial, latestActionId: 'edit-2' });
  await advance();
  expect(save).toHaveBeenCalledTimes(2);
});

it('объединяет правки в одну следующую попытку, пока первая не завершилась', async () => {
  let finish: (result: 'saved') => void = () => {};
  const save = vi.fn<Options['onSave']>().mockImplementationOnce(
    () => new Promise((resolve) => { finish = resolve; }),
  ).mockResolvedValue('saved');
  const initial = { ...options(save), latestActionId: null, draftRevision: 1 };
  const view = renderHook(useEditorAutosave, { initialProps: initial });
  await advance();
  view.rerender({ ...initial, draftRevision: 2 });
  view.rerender({ ...initial, draftRevision: 3 });
  await advance(1400);
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => finish('saved'));
  await advance();
  expect(save).toHaveBeenCalledTimes(2);
});

it('после конфликта ждёт ручного завершения текущего черновика', async () => {
  const save = vi.fn<Options['onSave']>().mockResolvedValueOnce('conflict').mockResolvedValue('saved');
  const initial = options(save);
  const view = renderHook(useEditorAutosave, { initialProps: initial });
  await advance();
  view.rerender({ ...initial, latestActionId: 'edit-2' });
  await advance(1400);
  expect(save).toHaveBeenCalledTimes(1);
  view.rerender({ ...initial, hasLocalChanges: false });
  view.rerender({ ...initial, latestActionId: 'edit-3' });
  await advance();
  expect(save).toHaveBeenCalledTimes(2);
});

it('при уходе со страницы и смене проекта отменяет старый таймер', async () => {
  const saveFirst = vi.fn<Options['onSave']>().mockResolvedValue('saved');
  const saveNext = vi.fn<Options['onSave']>().mockResolvedValue('saved');
  const initial = options(saveFirst);
  const view = renderHook(useEditorAutosave, { initialProps: initial });
  await advance(300);
  view.rerender({ ...initial, enabled: false });
  await advance();
  expect(saveFirst).not.toHaveBeenCalled();
  view.rerender(initial);
  await advance(300);
  view.rerender({ ...initial, projectId: 2, onSave: saveNext });
  await advance(400);
  expect(saveFirst).not.toHaveBeenCalled();
  expect(saveNext).not.toHaveBeenCalled();
  await advance(300);
  expect(saveNext).toHaveBeenCalledOnce();
});

it('не блокирует другой проект из-за запоздалого конфликта предыдущего', async () => {
  let finish: (result: 'conflict') => void = () => {};
  const first = vi.fn<Options['onSave']>().mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const next = vi.fn<Options['onSave']>().mockResolvedValue('saved');
  const initial = options(first);
  const view = renderHook(useEditorAutosave, { initialProps: initial });
  await advance();
  const switched = { ...initial, projectId: 2, onSave: next };
  view.rerender(switched);
  await act(async () => finish('conflict'));
  await advance();
  expect(next).toHaveBeenCalledOnce();
});
