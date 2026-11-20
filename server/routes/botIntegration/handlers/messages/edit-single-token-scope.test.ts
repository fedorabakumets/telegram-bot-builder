/** @fileoverview Проверка привязки редактирования к боту, отправившему сообщение. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  /** Чтение строки сообщения. */
  read: vi.fn(),
  /** Выбор бота. */
  resolve: vi.fn(),
  /** Токен запроса. */
  requested: vi.fn(),
  /** Изменение Telegram. */
  edit: vi.fn(),
  /** Сохранение истории. */
  save: vi.fn(),
}));
vi.mock('../../../../database/db', () => ({ db: {
  select: () => ({ from: () => ({ where: mocks.read }) }),
  update: () => ({ set: () => ({ where: mocks.save }) }),
} }));
vi.mock('@shared/schema', () => ({ botMessages: { id: 'id' } }));
vi.mock('drizzle-orm', () => ({ eq: vi.fn() }));
vi.mock('../../../utils/resolve-request-token', () => ({
  getRequestTokenId: mocks.requested, resolveEffectiveProjectToken: mocks.resolve,
}));
vi.mock('../../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: vi.fn() }));
vi.mock('./edit-single-telegram', () => ({ hasMediaAttachment: () => false, callTelegramEditMessage: mocks.edit }));
vi.mock('./resolve-edit-keyboard', () => ({ resolveEditKeyboard: () => ({ buttons: [], buttonsPerRow: 0, replyMarkup: { inline_keyboard: [] } }) }));
import { editSingleMessageHandler } from './editSingleMessageHandler';

/** Выполняет обработчик с минимальным запросом и записывает ответ. */
async function invoke() {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await editSingleMessageHandler({ params: { projectId: '12', messageId: '4' }, body: { messageText: 'Текст' } } as never, response as never);
  return response;
}

describe('Бот-отправитель сообщения', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.read.mockResolvedValue([{ id: 4, projectId: 12, tokenId: 7, messageType: 'bot', telegramMessageId: 99, userId: '123' }]);
    mocks.requested.mockReturnValue(null);
    mocks.resolve.mockResolvedValue({ selectedToken: { id: 7, token: 'test' } });
    mocks.edit.mockResolvedValue({ success: true });
  });
  it('без tokenId выбирает бота сообщения', async () => {
    const response = await invoke();
    expect(mocks.resolve).toHaveBeenCalledWith(12, 7);
    expect(mocks.edit).toHaveBeenCalledOnce();
    expect(response.json).toHaveBeenCalledWith({ success: true, editedInTelegram: true });
  });
  it('отклоняет явного другого бота до внешнего вызова', async () => {
    mocks.requested.mockReturnValue(8);
    const response = await invoke();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.resolve).not.toHaveBeenCalled();
    expect(mocks.edit).not.toHaveBeenCalled();
  });
  it('не использует резервного бота, если токен отправителя удалён', async () => {
    mocks.resolve.mockResolvedValue({ selectedToken: { id: 8, token: 'other' } });
    const response = await invoke();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.edit).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
