/** @fileoverview Запланированные проверки сохраняют контроль доступа и используют готовые очереди. */
import { beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({ access:vi.fn(),tokens:vi.fn(),active:vi.fn(),task:vi.fn(),expired:vi.fn(),batchExpired:vi.fn(),batch:vi.fn(),runBatch:vi.fn(),audience:vi.fn(),job:vi.fn(),update:vi.fn(),queue:vi.fn() }));
vi.mock('../../storages/storage',()=>({ storage:{hasProjectAccess:mocks.access,getBotTokensByProject:mocks.tokens} }));
vi.mock('../users/telegram-bot-check-task',()=>({telegramBotCheckTask:mocks.task}));
vi.mock('../users/telegram-bot-history-store',()=>({BotHistoryConflictError:class extends Error{},telegramBotHistoryStore:{interruptExpired:mocks.expired,getActive:mocks.active}}));
vi.mock('../dialogs/chat-access-batch-store',()=>({chatAccessBatchStore:{failExpired:mocks.batchExpired,create:mocks.batch}}));
vi.mock('../dialogs/chat-access-batch-worker',()=>({runChatAccessBatch:mocks.runBatch}));
vi.mock('../dialogs/chat-access-check-audience',()=>({listPrivateUserIds:mocks.audience}));
vi.mock('../dialogs/chat-access-check-job-store',()=>({createRunningChatAccessCheckJob:mocks.job,updateChatAccessCheckJob:mocks.update}));
vi.mock('../dialogs/chat-access-check-queue',()=>({runChatAccessCheckQueue:mocks.queue}));
import { runScheduledCheck } from '../check-history/run-scheduled-check';
beforeEach(()=>{vi.resetAllMocks();mocks.access.mockResolvedValue(true);mocks.tokens.mockResolvedValue([{id:9,token:'секрет'}]);mocks.active.mockResolvedValue(null);mocks.audience.mockResolvedValue(['123']);mocks.queue.mockResolvedValue(undefined);mocks.runBatch.mockResolvedValue(undefined);});
/** Отзыв доступа прекращает будущие действия Telegram. */
it('не запускает проверку после отзыва доступа',async()=>{
  mocks.access.mockResolvedValue(false);
  expect(await runScheduledCheck({project_id:12,created_by:1,token_id:9,kind:'private-chats'})).toBe('access_revoked');
  expect(mocks.tokens).not.toHaveBeenCalled();expect(mocks.queue).not.toHaveBeenCalled();
});
/** Работающая ручная проверка не запускается повторно по расписанию. */
it('пропускает активную проверку бота',async()=>{
  mocks.active.mockResolvedValue({id:1});
  expect(await runScheduledCheck({project_id:12,created_by:1,token_id:9,kind:'telegram-bots'})).toBe('skipped_active');
  expect(mocks.task).not.toHaveBeenCalled();
});
/** Все боты используют существующий batch с независимыми очередями. */
it('запускает общую проверку чатов через batch',async()=>{
  mocks.batch.mockResolvedValue({id:7});
  expect(await runScheduledCheck({project_id:12,created_by:1,token_id:null,kind:'private-chats'})).toBe('started');
  expect(mocks.batch).toHaveBeenCalledWith(12,[{tokenId:9,total:1}]);expect(mocks.runBatch).toHaveBeenCalledWith(12,7);
});
/** Один выбранный бот сохраняет ограничение очереди и свою аудиторию. */
it('запускает очередь выбранного бота',async()=>{
  mocks.job.mockResolvedValue({jobId:8});
  expect(await runScheduledCheck({project_id:12,created_by:1,token_id:9,kind:'private-chats'})).toBe('started');
  expect(mocks.job).toHaveBeenCalledWith(12,9,1);expect(mocks.queue).toHaveBeenCalledWith(8,'секрет');
});
