/** @fileoverview Проверки поиска, доступных состояний и честной деградации списка режимов ботов. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkerBotsPanel } from './worker-bots-panel';

/** Подмена запроса исключает сеть и даёт воспроизводимые состояния интерфейса. */
const state = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('./use-worker-bots', () => ({ useWorkerBots: () => state.value }));
vi.mock('./worker-bot-table', () => ({ WorkerBotTable: () => <div>Строки ботов</div> }));

/** Восстанавливает состояние панели перед каждым сценарием. */
function setup(overrides: Record<string, unknown> = {}) {
  state.value = { activity: 'enabled', changeActivity: vi.fn(), search: '', mode: 'all', page: 1, isError: false, isPending: false, isFetching: false,
    searching: false, refetch: vi.fn(), changeSearch: vi.fn(), changeMode: vi.fn(), setPage: vi.fn(),
    ...overrides };
  return render(<WorkerBotsPanel />);
}
afterEach(cleanup);

describe('состояния списка режимов', () => {
  it('по умолчанию скрывает остановленных и позволяет раскрыть их отдельно', () => {
    setup();
    const toggle = screen.getByRole('checkbox', { name: 'Показать остановленных ботов' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(state.value.changeActivity).toHaveBeenCalledWith('all');
    expect(screen.getByText('Список ботов').closest('details')?.open).toBe(true);
  });
  it('загрузка обозначена доступным статусом, а обновление недоступно во время запроса', () => {
    setup({ isPending: true, isFetching: true });
    expect(screen.getByRole('status', { name: 'Загрузка списка ботов' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Обновляем…' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('ошибка без данных предлагает повторить запрос и не показывает фиктивные строки', () => {
    setup({ isError: true });
    expect(screen.getByRole('alert').textContent).toContain('Не удалось обновить список');
    fireEvent.click(screen.getByRole('button', { name: 'Обновить список' }));
    expect(state.value.refetch).toHaveBeenCalledOnce();
    expect(screen.queryByText('Строки ботов')).toBeNull();
  });
  it('пустой результат поиска отличается от отсутствия подключённых ботов', () => {
    setup({ search: 'тест', data: { rows: [], total: 0, page: 1, pageSize: 25, runtimeAvailable: true, sampledAt: null } });
    expect(screen.getByText('По этим условиям ботов нет')).toBeTruthy();
    expect(screen.queryByText('Боты ещё не подключены')).toBeNull();
  });
  it('потеря исполнителя сохраняет строки и предупреждает об отсутствии подтверждения', () => {
    setup({ isError: true, data: { rows: [{}], total: 1, page: 1, pageSize: 25, runtimeAvailable: false, sampledAt: null } });
    expect(screen.getByText('Строки ботов')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('фактический режим может быть неизвестен');
    expect(screen.getByRole('alert').textContent).toContain('Показаны предыдущие данные');
  });
  it('поиск и выбор режима имеют подписи и передают ввод без потери фокуса', () => {
    setup();
    const input = screen.getByRole('textbox', { name: 'Поиск бота или проекта' });
    input.focus();
    fireEvent.change(input, { target: { value: 'напоминалка' } });
    expect(state.value.changeSearch).toHaveBeenCalledWith('напоминалка');
    expect(document.activeElement).toBe(input);
    fireEvent.change(screen.getByRole('combobox', { name: 'Режим запуска' }), { target: { value: 'process' } });
    expect(state.value.changeMode).toHaveBeenCalledWith('process');
  });
});
