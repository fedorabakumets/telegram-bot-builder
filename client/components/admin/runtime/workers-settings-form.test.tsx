/** @fileoverview Проверки сохранения черновика настроек воркеров при обновлении снимков. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UseFormReturn } from 'react-hook-form';
import { WorkersSettingsForm } from './workers-settings-form';
import { workersSettingsPayload, workersSettingsValues, validateWorkerNumber } from './workers-settings-values';
import type { RuntimeGroupView, RuntimeFieldView } from './runtime-types';
import type { RuntimeFormShape } from './runtime-field-control';

/** Подмена сохранения без сетевых запросов и запущенных ботов. */
const state = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock('./use-runtime-settings', () => ({
  /** Возвращает управляемую мутацию для проверки тела сохранения. */
  useSaveRuntimeSettings: () => ({ mutate: state.mutate, isPending: false, isError: false }),
}));
vi.mock('./worker-runtime-status', () => ({ WorkerRuntimeStatus: () => null }));
// Список ботов проверяется отдельно и не участвует в состоянии черновика формы.
vi.mock('./worker-bots-panel', () => ({ WorkerBotsPanel: () => null }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('./workers-settings-field', () => ({
  /** Убирает оформление контролов, сохраняя настоящую регистрацию react-hook-form. */
  WorkersSettingsField: ({ field, form }: { field: RuntimeFieldView; form: UseFormReturn<RuntimeFormShape> }) =>
    <input aria-label={field.env} {...form.register(`values.${field.env}`)} />,
}));

/** Создаёт снимок настроек с изменяемыми полями группировки и сна. */
function snapshot(grouping = 'shared', idle = '30'): RuntimeGroupView {
  return { id: 'workers', title: 'Воркеры', description: '', docs: [], storages: [], fields: [
    { env: 'WORKER_GROUPING', label: 'Группировка', kind: 'text', value: grouping, configured: true },
    { env: 'BOT_ON_DEMAND_IDLE_SECONDS', label: 'Простой', kind: 'number', value: idle, configured: true },
  ] };
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('черновик настроек воркеров', () => {
  it('относит прежний лимит к дополнительным параметрам без потери значения', () => {
    const data = snapshot();
    data.fields.push({ env: 'BOT_ON_DEMAND_MAX_ACTIVE', label: 'Лимит', kind: 'number', value: '4', configured: true });
    render(<WorkersSettingsForm data={data} />);
    const input = screen.getByLabelText('BOT_ON_DEMAND_MAX_ACTIVE') as HTMLInputElement;
    expect(input.closest('details')).not.toBeNull();
    expect(input.value).toBe('4');
  });
  it('опрос не стирает изменённое поле, но обновляет нетронутое', async () => {
    const view = render(<WorkersSettingsForm data={snapshot()} />);
    fireEvent.change(screen.getByLabelText('WORKER_GROUPING'), { target: { value: 'owner' } });
    view.rerender(<WorkersSettingsForm data={snapshot('project', '60')} />);
    expect((screen.getByLabelText('WORKER_GROUPING') as HTMLInputElement).value).toBe('owner');
    expect((screen.getByLabelText('BOT_ON_DEMAND_IDLE_SECONDS') as HTMLInputElement).value).toBe('60');
    await waitFor(() => expect((screen.getByText('Сохранить настройки') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByText('Сохранить настройки'));
    await waitFor(() => expect(state.mutate).toHaveBeenCalled());
    expect(state.mutate.mock.calls[0][0]).toEqual({ WORKER_GROUPING: 'owner', BOT_ON_DEMAND_IDLE_SECONDS: '60' });
  });

  it('отмена возвращает последний полученный снимок', () => {
    const view = render(<WorkersSettingsForm data={snapshot()} />);
    fireEvent.change(screen.getByLabelText('WORKER_GROUPING'), { target: { value: 'owner' } });
    view.rerender(<WorkersSettingsForm data={snapshot('project')} />);
    fireEvent.click(screen.getByText('Отменить изменения'));
    expect((screen.getByLabelText('WORKER_GROUPING') as HTMLInputElement).value).toBe('project');
  });

  it('не отправляет неизвестные поля и пустые секреты, сохраняет сброс наследования', () => {
    const data = snapshot();
    data.fields.push({ env: 'SECRET', label: 'Секрет', kind: 'secret', value: 'не раскрывать', configured: true });
    expect(workersSettingsValues(data).SECRET).toBe('');
    expect(workersSettingsPayload(data, { WORKER_GROUPING: '', SECRET: ' ', UNKNOWN: 'лишнее' }))
      .toEqual({ WORKER_GROUPING: '', BOT_ON_DEMAND_IDLE_SECONDS: '' });
  });

  it('валидирует дробное время простоя и целый лимит обработчиков', () => {
    expect(validateWorkerNumber('BOT_ON_DEMAND_IDLE_SECONDS', '0.1')).toBe(true);
    expect(validateWorkerNumber('BOT_ON_DEMAND_IDLE_SECONDS', '0')).not.toBe(true);
    expect(validateWorkerNumber('BOT_ON_DEMAND_MAX_ACTIVE', '1.5')).not.toBe(true);
    expect(validateWorkerNumber('BOT_ON_DEMAND_MAX_ACTIVE', '64')).toBe(true);
    expect(validateWorkerNumber('BOT_ON_DEMAND_MAX_ACTIVE', '0')).toBe(true);
    expect(validateWorkerNumber('BOT_ON_DEMAND_MAX_ACTIVE', '-1')).not.toBe(true);
    expect(validateWorkerNumber('BOT_ON_DEMAND_MAX_ACTIVE', '')).toBe(true);
  });

  it('оставляет наследуемое поле пустым вместо закрепления значения окружения', () => {
    const data = snapshot();
    data.fields[0] = { ...data.fields[0], savedValue: '', effectiveValue: 'shared', source: 'environment' };
    const values = workersSettingsValues(data);
    expect(values.WORKER_GROUPING).toBe('');
    values.BOT_ON_DEMAND_IDLE_SECONDS = '60';
    expect(workersSettingsPayload(data, values).WORKER_GROUPING).toBe('');
  });
});
