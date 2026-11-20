/**
 * @fileoverview Проверки наследования адреса webhook, отмены черновиков и явного сохранения.
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBotLaunchSettings } from './use-bot-launch-settings';
import type { BotLaunchSettingsProps } from './bot-launch-helpers';
const mocks = vi.hoisted(() => ({ mutate: vi.fn(), invalidate: vi.fn(), toast: vi.fn() }));
vi.mock('@/hooks/use-app-config', () => ({ useAppConfig: () => ({ data: { webhookBaseUrl: 'https://api.example/' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
  useMutation: () => ({ mutate: mocks.mutate }),
}));
/** Создаёт входные настройки без собственного адреса и секрета. */
function props(overrides: Partial<BotLaunchSettingsProps> = {}): BotLaunchSettingsProps {
  return { projectId: 12, tokenId: 58, launchMode: 'webhook', webhookBaseUrl: null,
    webhookSecretToken: null, ...overrides };
}
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('черновик настроек webhook', () => {
  it('передаёт сброс индивидуального режима в общую очередь', () => {
    const onPendingChange = vi.fn();
    const { result } = renderHook(() => useBotLaunchSettings(props({ onPendingChange })));
    act(() => result.current.handleModeChange('inherit'));
    expect(result.current.localMode).toBe('inherit');
    expect(onPendingChange).toHaveBeenCalledWith('LAUNCH_MODE', 'inherit');
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it('наследует адрес API и не сохраняет конфигурацию при открытии', () => {
    const { result } = renderHook(() => useBotLaunchSettings(props()));
    expect(result.current.effectiveBaseUrl).toBe('https://api.example');
    expect(result.current.localBaseUrl).toBe('');
    act(() => vi.advanceTimersByTime(1000));
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it('сохраняет собственный адрес и возвращает наследование после очистки', () => {
    const { result } = renderHook(() => useBotLaunchSettings(props()));
    act(() => result.current.handleBaseUrlChange('https://custom.example'));
    act(() => vi.advanceTimersByTime(800));
    expect(mocks.mutate).toHaveBeenLastCalledWith({ webhookBaseUrl: 'https://custom.example' });
    act(() => result.current.handleBaseUrlChange(''));
    act(() => vi.advanceTimersByTime(800));
    expect(result.current.effectiveBaseUrl).toBe('https://api.example');
    expect(mocks.mutate).toHaveBeenLastCalledWith({ webhookBaseUrl: null });
  });
  it('отличает пустой собственный адрес от наследования проекта', () => {
    const onPendingChange = vi.fn();
    const initialProps = props({ projectWebhookBaseUrl: 'https://project.example/', onPendingChange });
    const { result } = renderHook(() => useBotLaunchSettings(initialProps));
    expect(result.current.effectiveBaseUrl).toBe('https://api.example');
    act(() => result.current.handleBaseUrlChange('inherit'));
    expect(result.current.effectiveBaseUrl).toBe('https://project.example');
    expect(onPendingChange).toHaveBeenCalledWith('WEBHOOK_BASE_URL', 'inherit');
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it('синхронизирует адрес и секрет после отмены общей очереди', () => {
    const onPendingChange = vi.fn();
    const { result, rerender } = renderHook((value) => useBotLaunchSettings(value), {
      initialProps: props({ onPendingChange }),
    });
    act(() => result.current.handleBaseUrlChange('https://draft.example'));
    rerender(props({ onPendingChange, webhookBaseUrl: 'https://draft.example', webhookSecretToken: 'draft-secret' }));
    rerender(props({ onPendingChange }));
    expect(result.current.localBaseUrl).toBe('');
    expect(result.current.localSecret).toBe('');
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it('отменяет отложенное сохранение при смене бота', () => {
    const { result, rerender } = renderHook((value) => useBotLaunchSettings(value), { initialProps: props() });
    act(() => result.current.handleBaseUrlChange('https://old.example'));
    rerender(props({ tokenId: 59, webhookBaseUrl: 'https://next.example', webhookSecretToken: 'next-secret' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.localBaseUrl).toBe('https://next.example');
    expect(result.current.localSecret).toBe('next-secret');
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
