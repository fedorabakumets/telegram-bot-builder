/** @fileoverview Проверяет доступность действий и выбора проекта в горизонтальной шапке. */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EditorHorizontalHeader } from './editor-horizontal-header';

/** Возвращает подтверждённые числа ботов без обращения к серверу. */
vi.mock('@/components/editor/database/user-database/components/header/use-project-bot-counts', () => ({
  useProjectBotCounts: () => new Map([[10, 2], [11, 0]]),
}));

/** Вызывает перерасчёт заголовка после изменения измеряемой ширины. */
let updateWidth = () => {};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    /** Сохраняет обратный вызов измерения вместо реального наблюдателя размеров. */
    constructor(callback: () => void) { updateWidth = callback; }
    /** Подключает заглушку к элементу. */
    observe() {}
    /** Отключает заглушку. */
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('показывает название проекта без переключателя, когда смена проекта недоступна', () => {
  const openHelp = vi.fn();
  const openActions = vi.fn();
  render(<EditorHorizontalHeader projectName="Казино"
    help={<button type="button" onClick={openHelp}>Обучение</button>}
    fallbackActions={<button type="button" onClick={openActions}>Действия редактора</button>}
  />);

  expect(screen.getByRole('heading', { name: 'Редактор' })).toBeTruthy();
  const project = within(screen.getByRole('group', { name: 'Проект' }));
  expect(project.getByText('Казино')).toBeTruthy();
  expect(project.queryByRole('button')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Обучение' }));
  fireEvent.click(screen.getByRole('button', { name: 'Действия редактора' }));
  expect(openHelp).toHaveBeenCalledOnce();
  expect(openActions).toHaveBeenCalledOnce();
});

it('открывает переключатель с клавиатуры и передаёт идентификатор проекта', async () => {
  /** Эмулятор DOM не реализует прокрутку при открытии выпадающего списка. */
  const scroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  try {
    const select = vi.fn();
    render(<EditorHorizontalHeader projectName="Казино" currentProjectId={10} onProjectChange={select}
      projects={[{ id: 10, name: 'Казино' }, { id: 11, name: 'Магазин' }]}
    />);

    const trigger = screen.getByRole('combobox', { name: 'Выбрать проект' });
    expect(within(trigger).getByText('2')).toBeTruthy();
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('option', { name: /Магазин/ }));
    expect(select).toHaveBeenCalledWith(11);
  } finally {
    if (scroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scroll);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  }
});

it('переключает компоновку на компактную при сужении, сохраняя доступ к действиям', async () => {
  let availableWidth = 620;
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => availableWidth);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: 100 }) as DOMRect);
  const help = vi.fn();
  const { container } = render(<EditorHorizontalHeader projectName="Казино"
    help={<button type="button" aria-label="Обучение" onClick={help}>Обучение</button>} />);
  const header = container.querySelector('.workspace-adaptive-header');
  expect(header?.getAttribute('data-compact-actions')).toBe('false');

  availableWidth = 220;
  await act(async () => {
    updateWidth();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });

  expect(header?.getAttribute('data-compact-actions')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Обучение' }));
  expect(help).toHaveBeenCalledOnce();
});
