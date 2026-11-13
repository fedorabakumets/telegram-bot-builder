/** @fileoverview Проверки черновика режима при обновлении данных, отмене и смене бота. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BotRuntimeModeSettings } from './BotRuntimeModeSettings';

/** Управляемые серверные данные вместо сетевых запросов. */
const server = vi.hoisted(() => ({ mode: 'direct', mutate: vi.fn() }));
vi.mock('./use-bot-runtime-settings', () => ({
  /** Возвращает последний снимок, полученный после серверного события. */
  useBotRuntimeSettings: () => ({
    query: { data: { mode: server.mode, source: 'bot', launchMode: 'polling' }, isLoading: false, isError: false },
    mutation: { mutate: server.mutate, isPending: false },
  }),
}));
vi.mock('./SettingCard', () => ({
  /** Сохраняет содержимое настройки без декоративного контейнера. */
  SettingCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/select', () => ({
  /** Заменяет портальный контрол нативным выбором для проверки состояния формы. */
  Select: ({ value, onValueChange, disabled, children }: any) => <select aria-label="Режим" value={value} disabled={disabled} onChange={(event) => onValueChange(event.target.value)}>{children}</select>,
  /** Исключает декоративный триггер из тестового выбора. */
  SelectTrigger: () => null,
  /** Исключает декоративное отображение текущего значения. */
  SelectValue: () => null,
  /** Сохраняет список доступных вариантов. */
  SelectContent: ({ children }: any) => <>{children}</>,
  /** Представляет вариант нативным элементом. */
  SelectItem: ({ children, value, disabled }: any) => <option value={value} disabled={disabled}>{children}</option>,
}));

afterEach(() => { cleanup(); server.mode = 'direct'; vi.clearAllMocks(); });

describe('режим обработчика в общей форме настроек', () => {
  it('сохраняет выбор после серверного обновления и отменяет вместе с общей очередью', () => {
    const onPendingChange = vi.fn();
    const props = { projectId: 40, tokenId: 31, canManage: true, launchMode: 'polling', onPendingChange };
    const view = render(<BotRuntimeModeSettings {...props} />);
    fireEvent.change(screen.getByLabelText('Режим'), { target: { value: 'process' } });
    expect(onPendingChange).toHaveBeenCalledWith('BOT_POLLING_MODE', 'process');
    view.rerender(<BotRuntimeModeSettings {...props} pendingRuntimeMode="process" />);
    server.mode = 'ondemand';
    view.rerender(<BotRuntimeModeSettings {...props} pendingRuntimeMode="process" />);
    expect((screen.getByLabelText('Режим') as HTMLSelectElement).value).toBe('process');
    view.rerender(<BotRuntimeModeSettings {...props} pendingRuntimeMode={undefined} />);
    expect((screen.getByLabelText('Режим') as HTMLSelectElement).value).toBe('ondemand');
    expect(server.mutate).not.toHaveBeenCalled();
  });

  it('показывает настройку другого бота после очистки очереди и блокирует изменение при сохранении', () => {
    const props = { projectId: 40, tokenId: 31, canManage: true, launchMode: 'polling', onPendingChange: vi.fn() };
    const view = render(<BotRuntimeModeSettings {...props} pendingRuntimeMode="process" />);
    view.rerender(<BotRuntimeModeSettings {...props} tokenId={32} settingsSaving />);
    const control = screen.getByLabelText('Режим') as HTMLSelectElement;
    expect(control.value).toBe('direct');
    expect(control.disabled).toBe(true);
  });

  it('разрешает освобождение памяти для webhook и отключает только неподдерживаемый сон', () => {
    const onPendingChange = vi.fn();
    render(<BotRuntimeModeSettings projectId={12} tokenId={58} canManage launchMode="webhook" onPendingChange={onPendingChange} />);
    expect((screen.getByRole('option', { name: 'Всегда активен' }) as HTMLOptionElement).disabled).toBe(false);
    expect((screen.getByRole('option', { name: 'Освобождает память после простоя' }) as HTMLOptionElement).disabled).toBe(false);
    expect((screen.getByRole('option', { name: 'Засыпает при простое' }) as HTMLOptionElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Режим'), { target: { value: 'process' } });
    expect(onPendingChange).toHaveBeenCalledWith('BOT_POLLING_MODE', 'process');
  });

  it('объясняет очередь webhook, пробуждение и ограничение фоновых задач', () => {
    server.mode = 'process';
    render(<BotRuntimeModeSettings projectId={12} tokenId={58} canManage launchMode="webhook" />);
    expect(screen.getByText(/Входящий webhook сохраняет сообщение в очереди/)).toBeTruthy();
    expect(screen.getByText(/Для расписаний и фоновых задач выберите/)).toBeTruthy();
    expect(screen.getByText(/когда больше не нужен другим ботам/)).toBeTruthy();
  });
});
