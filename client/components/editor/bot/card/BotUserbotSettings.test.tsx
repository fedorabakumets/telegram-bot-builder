/**
 * @fileoverview Проверки синхронизации формы юзербота между вкладками.
 * @module client/components/editor/bot/card/BotUserbotSettings.test
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BotUserbotSettings } from './BotUserbotSettings';

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

/** Подписчики подменённого общего WebSocket */
const ws = vi.hoisted(() => ({ listeners: new Set<(event: unknown) => void>() }));
vi.mock('@/lib/shared-terminal-ws', () => ({
  /** Подписка тестовой формы на события */
  subscribeSharedTerminalWs: (listener: (event: unknown) => void) => {
    ws.listeners.add(listener);
    return () => { ws.listeners.delete(listener); };
  },
}));

/**
 * Имитирует доставку события от сервера.
 * @param step - Шаг авторизации
 * @param tokenId - Токен получателя
 * @returns Ничего
 */
function emitStep(step: string, tokenId = 2): void {
  act(() => ws.listeners.forEach(listener => listener({
    type: 'userbot-auth-progress', projectId: 1, tokenId,
    eventId: step, data: { step, phone: '+7900' },
  })));
}

/** Исходные настройки аккаунта без сессии */
const initial = {
  projectId: 1, tokenId: 2, userbotEnabled: 1,
  userbotApiId: '123', userbotApiHash: '••••••••', userbotSessionString: null,
};

/**
 * Создаёт форму с отдельным кэшем и возможностью обновить серверные значения.
 * @param props - Настройки аккаунта
 * @returns Результат отрисовки и функция повторной отрисовки
 */
function renderSettings(props = initial) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><BotUserbotSettings {...props} /></QueryClientProvider>);
  return {
    ...view,
    /**
     * Имитирует новые данные токена после события WebSocket.
     * @param next - Состояние, полученное из API
     * @returns Ничего
     */
    update(next: Parameters<typeof BotUserbotSettings>[0]) {
      view.rerender(<QueryClientProvider client={client}><BotUserbotSettings {...next} /></QueryClientProvider>);
    },
  };
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('синхронизация настроек юзербота', () => {
  it('позволяет продолжить вход по коду из формы после события MCP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, needs_2fa: true }) });
    vi.stubGlobal('fetch', fetchMock);
    renderSettings();
    emitStep('code');
    fireEvent.change(screen.getByLabelText('Код из Telegram / SMS'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));
    await screen.findByLabelText('Пароль двухфакторной аутентификации');
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/1/tokens/2/userbot/sign-in', expect.objectContaining({
      body: JSON.stringify({ phone: '+7900', code: '12345' }),
    }));
  });
  it('переключает шаги от MCP, фильтрует токены и не сбрасывает ввод при дубле', () => {
    const view = renderSettings();
    emitStep('code', 999);
    expect(screen.getByLabelText('Номер телефона')).toBeInTheDocument();
    emitStep('code');
    const code = screen.getByLabelText('Код из Telegram / SMS');
    fireEvent.change(code, { target: { value: '12345' } });
    emitStep('code');
    expect(code).toHaveValue('12345');
    emitStep('2fa');
    expect(screen.getByLabelText('Пароль двухфакторной аутентификации')).toBeInTheDocument();
    emitStep('done');
    expect(screen.getByText('Аккаунт авторизован')).toBeInTheDocument();
    view.unmount();
    expect(ws.listeners.size).toBe(0);
  });
  it('обновляет переключатель и реквизиты из серверных данных', () => {
    const view = renderSettings({ ...initial, userbotEnabled: 0 });
    expect(screen.getByRole('switch')).not.toBeChecked();
    view.update({ ...initial, userbotApiId: '456', userbotApiHash: null });
    expect(screen.getByRole('switch')).toBeChecked();
    expect(screen.getByLabelText('API ID')).toHaveValue('456');
    expect(screen.getByLabelText('API Hash')).toHaveValue('');
    view.update({ ...initial, userbotEnabled: 0 });
    expect(screen.getByRole('switch')).not.toBeChecked();
  });
  it('не затирает черновик при обновлении неизменённых реквизитов', () => {
    const view = renderSettings();
    fireEvent.change(screen.getByLabelText('API ID'), { target: { value: 'draft' } });
    view.update({ ...initial });
    expect(screen.getByLabelText('API ID')).toHaveValue('draft');
    view.update({ ...initial, userbotApiId: '789' });
    expect(screen.getByLabelText('API ID')).toHaveValue('789');
  });
  it('сохраняет шаг ввода кода при обновлении и завершает его при появлении сессии', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) }));
    const view = renderSettings();
    fireEvent.change(screen.getByLabelText('Номер телефона'), { target: { value: '+7900' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить код' }));
    const code = await screen.findByLabelText('Код из Telegram / SMS');
    fireEvent.change(code, { target: { value: '12345' } });
    view.update({ ...initial, userbotApiId: '456' });
    expect(screen.getByLabelText('Код из Telegram / SMS')).toHaveValue('12345');
    view.update({ ...initial, userbotApiId: '456', userbotSessionString: '••••••••' });
    expect(screen.getByText('Аккаунт авторизован')).toBeInTheDocument();
    expect(screen.queryByLabelText('Код из Telegram / SMS')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Переавторизовать' }));
    view.update({ ...initial, userbotApiId: '456', userbotSessionString: '••••••••' });
    expect(screen.getByLabelText('Номер телефона')).toHaveValue('');
  });
});
