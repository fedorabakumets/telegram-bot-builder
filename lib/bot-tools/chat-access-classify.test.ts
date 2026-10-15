/** @fileoverview Классификация sendChatAction и whitelist прогресса проверки. */
import { expect, it } from 'vitest';
import { classifyChatAction } from '../../server/routes/dialogs/check-chat-access-classify';
import { toChatAccessCheckProgressPayload } from '../../shared/project-sync/project-event';

it('отличает блокировку, удаление и доступность', () => {
  expect(classifyChatAction({ httpOk: true, ok: true }).kind).toBe('available');
  expect(classifyChatAction({
    httpOk: false, errorCode: 403, description: 'Forbidden: bot was blocked by the user',
  }).kind).toBe('kicked');
  expect(classifyChatAction({
    httpOk: false, errorCode: 403, description: 'Forbidden: user is deactivated',
  })).toEqual({ kind: 'deleted', status: 'error' });
  expect(classifyChatAction({
    httpOk: false, errorCode: 400, description: 'Bad Request: chat not found',
  }).kind).toBe('deleted');
  expect(classifyChatAction({
    httpOk: false, errorCode: 403, description: "Forbidden: bot can't initiate conversation with a user",
  }).kind).toBe('error');
});

it('не кладёт секрет и описание Telegram в payload прогресса', () => {
  const payload = toChatAccessCheckProgressPayload({
    jobId: 4, tokenId: 9, status: 'running',
    processedCount: 2, totalCount: 10,
    availableCount: 1, kickedCount: 1, deletedCount: 0, errorCount: 0,
    token: 'секрет', description: 'bot was blocked',
  } as never);
  expect(payload).toEqual({
    jobId: 4, tokenId: 9, status: 'running',
    processedCount: 2, totalCount: 10,
    availableCount: 1, kickedCount: 1, deletedCount: 0, errorCount: 0,
  });
  expect(JSON.stringify(payload)).not.toContain('секрет');
});
