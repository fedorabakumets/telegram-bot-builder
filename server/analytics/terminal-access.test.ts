/** @fileoverview Проверки HTTP-сессии, области бота и отзыва доступа в общем WebSocket. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebSocket } from 'ws';
import { authorizeTerminal, terminalCanReceive, terminalScopeIds, type TerminalRequest } from '../terminal/terminal-access';
/** Зависимости безопасности заменены отдельно от транспорта и интерфейса. */
const mocks = vi.hoisted(() => ({ access: vi.fn(), token: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: { hasProjectAccess: mocks.access, getBotToken: mocks.token } }));
/** Создаёт соединение и изменяемую сессию для проверки отзыва. */
function fixture(url = '/api/terminal?projectId=12&tokenId=4') {
  const reload = vi.fn((callback: (error?: Error) => void) => callback());
  const request = { url, headers: { host: 'localhost:5000', origin: 'http://localhost:5000' }, session: { telegramUser: { id: 42 }, reload } } as unknown as TerminalRequest;
  const socket = { readyState: 1, close: vi.fn(), send: vi.fn() } as unknown as WebSocket;
  return { request, socket, reload };
}
beforeEach(() => { vi.clearAllMocks(); mocks.access.mockResolvedValue(true); mocks.token.mockResolvedValue({ projectId: 12 }); });
describe('Авторизация общего WebSocket', () => {
  it('отклоняет некорректные области и отсутствующую сессию', async () => {
    for (const query of ['projectId=12oops&tokenId=4','projectId=12&tokenId=-1','projectId=0&tokenId=4','projectId=1.5&tokenId=4']) expect(terminalScopeIds(`/?${query}`)).toBeNull();
    const { request, socket } = fixture();
    request.session = undefined;
    expect(await authorizeTerminal(socket, request)).toBeNull();
  });
  it('запрещает чужой проект, токен другого проекта и внешний origin', async () => {
    const { request, socket } = fixture();
    mocks.access.mockResolvedValueOnce(false);
    expect(await authorizeTerminal(socket, request)).toBeNull();
    mocks.token.mockResolvedValueOnce({ projectId: 99 });
    expect(await authorizeTerminal(socket, request)).toBeNull();
    request.headers.origin = 'https://example.com';
    expect(await authorizeTerminal(socket, request)).toBeNull();
  });
  it('после отзыва прав перестаёт передавать историю и события', async () => {
    const { request, socket } = fixture();
    expect(await authorizeTerminal(socket, request)).not.toBeNull();
    expect(await terminalCanReceive(socket, 12, 4)).toBe(true);
    mocks.access.mockResolvedValue(false);
    expect(await terminalCanReceive(socket, 12, 4)).toBe(false);
    expect(socket.close).toHaveBeenCalledWith(4003, expect.any(String));
  });
  it('общая подписка проверяет каждый проект и аннулирование сессии', async () => {
    const { request, socket, reload } = fixture('/api/terminal?projectId=0&tokenId=0');
    expect(await authorizeTerminal(socket, request)).not.toBeNull();
    mocks.access.mockImplementation((project: number) => Promise.resolve(project === 12));
    expect(await terminalCanReceive(socket, 12, 4)).toBe(true);
    expect(await terminalCanReceive(socket, 99, 0)).toBe(false);
    reload.mockImplementationOnce(callback => callback(new Error('Сессия удалена')));
    expect(await terminalCanReceive(socket, 12, 4)).toBe(false);
  });
});
