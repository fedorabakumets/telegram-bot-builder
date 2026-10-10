/**
 * @fileoverview Регрессионные проверки сверки запуска и доступа к пустым логам.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { beginBotStart, finishBotStart } from './botStartState';

const mocks = vi.hoisted(() => ({
  /** Закрытие истории */ close: vi.fn(),
  /** Удаление активной привязки */ clear: vi.fn(),
  /** Поиск запуска */ launch: vi.fn(),
  /** Проверка доступа */ access: vi.fn(),
  /** Чтение логов */ logs: vi.fn(),
}));
vi.mock('../storages/storage', () => ({ storage: {
  closeAllRunningLaunchHistory: mocks.close,
  getLaunchHistoryById: mocks.launch,
  hasProjectAccess: mocks.access,
  getBotLogsByLaunch: mocks.logs,
} }));
vi.mock('../terminal/activeLaunchIds', () => ({ clearActiveLaunchId: mocks.clear }));
vi.mock('../terminal/setupBotProcessListeners', () => ({ pendingLaunchIds: new Map() }));
vi.mock('../telegram/auth-middleware', () => ({ getOwnerIdFromRequest: () => 123 }));
import { reconcileLaunchHistoryForToken } from './reconcileLaunchHistory';
import { handleGetLaunchLogs } from '../routes/botManagement/handlers/botLaunchLogsHandler';

afterEach(() => { finishBotStart(301); vi.resetAllMocks(); });

/**
 * Создаёт HTTP-ответ для проверки кода и тела.
 * @returns Заглушка ответа Express
 */
function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

describe('Синхронизация запуска', () => {
  it('опрос во время подготовки не закрывает историю и не стирает привязку', async () => {
    expect(beginBotStart(301)).toBe(true);
    expect(beginBotStart(301)).toBe(false);
    expect(await reconcileLaunchHistoryForToken(301, false)).toBe(0);
    expect(mocks.close).not.toHaveBeenCalled();
    expect(mocks.clear).not.toHaveBeenCalled();
    finishBotStart(301);
    expect(await reconcileLaunchHistoryForToken(301, true)).toBe(0);
    expect(mocks.close).not.toHaveBeenCalled();
  });

  it('после завершения неудачного запуска закрывает действительно отсутствующий процесс', async () => {
    beginBotStart(301);
    finishBotStart(301);
    mocks.close.mockResolvedValue(1);
    expect(await reconcileLaunchHistoryForToken(301, false)).toBe(1);
    expect(mocks.clear).toHaveBeenCalledWith(301);
  });
});

describe('Логи запуска', () => {
  it('существующий доступный запуск без логов возвращает пустой список', async () => {
    mocks.launch.mockResolvedValue({ id: 3595, projectId: 289 });
    mocks.access.mockResolvedValue(true);
    mocks.logs.mockResolvedValue([]);
    const res = response();
    await handleGetLaunchLogs({ params: { launchId: '3595' } } as unknown as Request, res as unknown as Response);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([]);
    expect(mocks.access).toHaveBeenCalledWith(289, 123);
  });

  it('чужой пустой запуск не раскрывает логи', async () => {
    mocks.launch.mockResolvedValue({ id: 3595, projectId: 289 });
    mocks.access.mockResolvedValue(false);
    const res = response();
    await handleGetLaunchLogs({ params: { launchId: '3595' } } as unknown as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.logs).not.toHaveBeenCalled();
  });
});
