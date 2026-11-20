/** @fileoverview Регрессия сохранения клавиатуры при текстовом редактировании через MCP. */
import { describe, expect, it } from 'vitest';
import { editDialogMessageBodySchema } from '../../shared/schema/dialog-write-contracts';
import { resolveEditKeyboard } from '../../server/routes/botIntegration/handlers/messages/resolve-edit-keyboard';
import { normalizeMcpActionResult } from './mcp-action-result';

describe('Редактирование без потери кнопок', () => {
  const buttons = [{ id: 'support', text: 'Поддержка', action: 'url', url: 'https://example.com' }];
  it('не подставляет пустую клавиатуру в запрос без кнопок', () => {
    const body = editDialogMessageBodySchema.parse({ messageText: 'Новый текст' });
    expect(body).not.toHaveProperty('buttons');
    expect(body).not.toHaveProperty('buttonsPerRow');
    expect(resolveEditKeyboard({ buttons, buttonsPerRow: 1 }).replyMarkup.inline_keyboard[0][0])
      .toMatchObject({ text: 'Поддержка', url: 'https://example.com' });
  });
  it('сохраняет точную клавиатуру Telegram и явно удаляет по []', () => {
    const reply_markup = { inline_keyboard: [[{ text: 'Ссылка', url: 'https://example.com', style: 'success' }]] };
    expect(resolveEditKeyboard({ reply_markup }).replyMarkup).toEqual(reply_markup);
    expect(resolveEditKeyboard({ buttons, reply_markup }, []).replyMarkup).toEqual({ inline_keyboard: [] });
  });
  it('распознаёт частичный результат старого массового инструмента', () => {
    const result = normalizeMcpActionResult({ content: [{ type: 'text', text: JSON.stringify({ ok: true, edited: 2, failed: 1 }) }] },
      { section: 'broadcasts', effect: 'external', destructive: true, runtimeApply: 'not_applicable', completionMode: 'immediate' });
    expect(result._meta?.botcraft).toMatchObject({ outcome: 'partial', persistence: { confirmed: false } });
  });
});
