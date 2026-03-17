/**
 * @fileoverview Тесты для шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSynonyms, generateSynonymHandlers, collectSynonymEntries } from './synonyms.renderer';
import {
  validParamsEmpty,
  validParamsStartSynonyms,
  validParamsCommandSynonyms,
  validParamsMessageSynonyms,
  validParamsPinSynonyms,
  validParamsBanUser,
  validParamsBanUserTimed,
  validParamsUnbanUser,
  validParamsKickUser,
  validParamsMuteUser,
  validParamsUnmuteUser,
  validParamsPromoteUser,
  validParamsDemoteUser,
  validParamsAdminRights,
  validParamsMixed,
  invalidParamsWrongNodeType,
  nodesWithStartSynonym,
  nodesWithCommandSynonym,
  nodesWithMessageSynonym,
  nodesWithBanSynonym,
  nodesWithMuteSynonym,
  nodesWithPromoteSynonym,
  nodesWithAdminRightsSynonym,
  nodesStartSynonymWithoutStartNode,
  nodesWithNullAndEmpty,
  nodesMixed,
} from './synonyms.fixture';
import { synonymsParamsSchema } from './synonyms.schema';

// ─── generateSynonyms() ──────────────────────────────────────────────────────

describe('generateSynonyms()', () => {
  it('пустой массив → пустая строка', () => {
    assert.strictEqual(generateSynonyms(validParamsEmpty), '');
  });

  // ── start / command ──
  describe('start / command', () => {
    it('генерирует обработчик для start', () => {
      const r = generateSynonyms(validParamsStartSynonyms);
      assert.ok(r.includes('message.text.lower() == "привет"'));
      assert.ok(r.includes('await start_handler(message)'));
      assert.ok(r.includes('"start_handler" in globals()'));
    });

    it('генерирует оба синонима start', () => {
      const r = generateSynonyms(validParamsStartSynonyms);
      assert.ok(r.includes('"привет"'));
      assert.ok(r.includes('"hello"'));
    });

    it('генерирует обработчик для command', () => {
      const r = generateSynonyms(validParamsCommandSynonyms);
      assert.ok(r.includes('message.text.lower() == "помощь"'));
      assert.ok(r.includes('await help_handler(message)'));
      assert.ok(r.includes('"help_handler" in globals()'));
    });

    it('fallback сообщение содержит оригинальную команду', () => {
      const r = generateSynonyms(validParamsCommandSynonyms);
      assert.ok(r.includes('Команда /help временно недоступна'));
    });
  });

  // ── message ──
  describe('message', () => {
    it('генерирует MockCallback', () => {
      const r = generateSynonyms(validParamsMessageSynonyms);
      assert.ok(r.includes('class MockCallback:'));
      assert.ok(r.includes('mock_callback = MockCallback'));
    });

    it('вызывает handle_callback с правильным id', () => {
      const r = generateSynonyms(validParamsMessageSynonyms);
      assert.ok(r.includes('handle_callback_msg_main_menu'));
    });

    it('MockCallback содержит edit_text с fallback', () => {
      const r = generateSynonyms(validParamsMessageSynonyms);
      assert.ok(r.includes('async def edit_text'));
      assert.ok(r.includes('self.message.answer(text'));
    });
  });

  // ── content management ──
  describe('pin_message / unpin_message / delete_message', () => {
    it('pin_message: вызывает bot.pin_chat_message', () => {
      const r = generateSynonyms(validParamsPinSynonyms);
      assert.ok(r.includes('bot.pin_chat_message'));
      assert.ok(r.includes('disable_notification=False'));
    });

    it('unpin_message: вызывает bot.unpin_chat_message', () => {
      const r = generateSynonyms(validParamsPinSynonyms);
      assert.ok(r.includes('bot.unpin_chat_message'));
    });

    it('delete_message: вызывает bot.delete_message с кастомным текстом', () => {
      const r = generateSynonyms(validParamsPinSynonyms);
      assert.ok(r.includes('bot.delete_message'));
      assert.ok(r.includes('🗑️ Удалено!'));
    });

    it('фильтр чата только для групп', () => {
      const r = generateSynonyms(validParamsPinSynonyms);
      assert.ok(r.includes("message.chat.type in ['group', 'supergroup']"));
    });

    it('обработка ошибок TelegramBadRequest', () => {
      const r = generateSynonyms(validParamsPinSynonyms);
      assert.ok(r.includes('except TelegramBadRequest as e:'));
      assert.ok(r.includes('CHAT_ADMIN_REQUIRED'));
    });

    it('поддержка reply_to_message и ID из текста', () => {
      const r = generateSynonyms(validParamsPinSynonyms);
      assert.ok(r.includes('message.reply_to_message'));
      assert.ok(r.includes('text_parts[1].isdigit()'));
    });
  });

  // ── user management ──
  describe('ban_user', () => {
    it('бессрочный бан: вызывает ban_chat_member без until_date', () => {
      const r = generateSynonyms(validParamsBanUser);
      assert.ok(r.includes('bot.ban_chat_member'));
      assert.ok(r.includes('заблокирован навсегда'));
      assert.ok(r.includes('Спам'));
    });

    it('временный бан: содержит until_date', () => {
      const r = generateSynonyms(validParamsBanUserTimed);
      assert.ok(r.includes('1700000000'));
      assert.ok(r.includes('заблокирован до'));
    });

    it('фильтр чата только для групп', () => {
      const r = generateSynonyms(validParamsBanUser);
      assert.ok(r.includes("message.chat.type in ['group', 'supergroup']"));
    });

    it('определяет target_user_id через reply или ID', () => {
      const r = generateSynonyms(validParamsBanUser);
      assert.ok(r.includes('reply_to_message.from_user.id'));
      assert.ok(r.includes('text_parts[1].isdigit()'));
    });
  });

  describe('unban_user', () => {
    it('вызывает unban_chat_member с only_if_banned=True', () => {
      const r = generateSynonyms(validParamsUnbanUser);
      assert.ok(r.includes('bot.unban_chat_member'));
      assert.ok(r.includes('only_if_banned=True'));
    });
  });

  describe('kick_user', () => {
    it('ban + unban для кика', () => {
      const r = generateSynonyms(validParamsKickUser);
      assert.ok(r.includes('bot.ban_chat_member'));
      assert.ok(r.includes('bot.unban_chat_member'));
      assert.ok(r.includes('исключен из группы'));
      assert.ok(r.includes('Нарушение правил'));
    });
  });

  describe('mute_user', () => {
    it('вызывает restrict_chat_member с ChatPermissions', () => {
      const r = generateSynonyms(validParamsMuteUser);
      assert.ok(r.includes('bot.restrict_chat_member'));
      assert.ok(r.includes('types.ChatPermissions'));
      assert.ok(r.includes('can_send_messages=False'));
    });

    it('вычисляет время из duration', () => {
      const r = generateSynonyms(validParamsMuteUser);
      assert.ok(r.includes('timedelta(seconds=3600)'));
      assert.ok(r.includes('Флуд'));
    });
  });

  describe('unmute_user', () => {
    it('снимает все ограничения', () => {
      const r = generateSynonyms(validParamsUnmuteUser);
      assert.ok(r.includes('can_send_messages=True'));
      assert.ok(r.includes('can_send_polls=True'));
      assert.ok(r.includes('Ограничения с пользователя'));
    });
  });

  describe('promote_user', () => {
    it('вызывает promote_chat_member с правами', () => {
      const r = generateSynonyms(validParamsPromoteUser);
      assert.ok(r.includes('bot.promote_chat_member'));
      assert.ok(r.includes('can_delete_messages=True'));
      assert.ok(r.includes('can_invite_users=True'));
      assert.ok(r.includes('can_pin_messages=False'));
    });
  });

  describe('demote_user', () => {
    it('снимает все права администратора', () => {
      const r = generateSynonyms(validParamsDemoteUser);
      assert.ok(r.includes('can_change_info=False'));
      assert.ok(r.includes('can_promote_members=False'));
      assert.ok(r.includes('Права администратора сняты'));
    });
  });

  describe('admin_rights', () => {
    it('нет фильтра чата (работает везде)', () => {
      const r = generateSynonyms(validParamsAdminRights);
      assert.ok(!r.includes("message.chat.type in ['group', 'supergroup']"));
    });

    it('создаёт MockCallback и вызывает handle_callback с bot', () => {
      const r = generateSynonyms(validParamsAdminRights);
      assert.ok(r.includes('class MockCallback:'));
      assert.ok(r.includes('handle_callback_admin_1(mock_callback, bot)'));
    });
  });

  // ── маркеры и общее ──
  describe('маркеры и структура', () => {
    it('генерирует NODE_START/NODE_END маркеры', () => {
      const r = generateSynonyms(validParamsStartSynonyms);
      assert.ok(r.includes('@@NODE_START:start_1@@'));
      assert.ok(r.includes('@@NODE_END:start_1@@'));
    });

    it('смешанные типы генерируются вместе', () => {
      const r = generateSynonyms(validParamsMixed);
      assert.ok(r.includes('start_handler'));
      assert.ok(r.includes('MockCallback'));
      assert.ok(r.includes('bot.pin_chat_message'));
      assert.ok(r.includes('bot.ban_chat_member'));
      assert.ok(r.includes('timedelta'));
    });
  });
});

// ─── synonymsParamsSchema ────────────────────────────────────────────────────

describe('synonymsParamsSchema', () => {
  it('принимает валидные start параметры', () => {
    assert.ok(synonymsParamsSchema.safeParse(validParamsStartSynonyms).success);
  });

  it('принимает все user management типы', () => {
    for (const params of [
      validParamsBanUser, validParamsUnbanUser, validParamsKickUser,
      validParamsMuteUser, validParamsUnmuteUser, validParamsPromoteUser,
      validParamsDemoteUser, validParamsAdminRights,
    ]) {
      assert.ok(synonymsParamsSchema.safeParse(params).success);
    }
  });

  it('отклоняет неправильный nodeType', () => {
    assert.ok(!synonymsParamsSchema.safeParse(invalidParamsWrongNodeType).success);
  });

  it('принимает пустой массив', () => {
    assert.ok(synonymsParamsSchema.safeParse(validParamsEmpty).success);
  });
});

// ─── collectSynonymEntries() ─────────────────────────────────────────────────

describe('collectSynonymEntries()', () => {
  it('собирает start синонимы с functionName и originalCommand', () => {
    const entries = collectSynonymEntries(nodesWithStartSynonym);
    assert.strictEqual(entries.length, 2);
    assert.strictEqual(entries[0].nodeType, 'start');
    assert.strictEqual(entries[0].functionName, 'start');
    assert.strictEqual(entries[0].originalCommand, '/start');
  });

  it('собирает command синонимы', () => {
    const entries = collectSynonymEntries(nodesWithCommandSynonym);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].nodeType, 'command');
    assert.strictEqual(entries[0].functionName, 'help');
  });

  it('собирает message синонимы', () => {
    const entries = collectSynonymEntries(nodesWithMessageSynonym);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].nodeType, 'message');
  });

  it('собирает ban_user синонимы с reason и untilDate', () => {
    const entries = collectSynonymEntries(nodesWithBanSynonym);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].nodeType, 'ban_user');
    assert.strictEqual(entries[0].reason, 'Спам');
    assert.strictEqual(entries[0].untilDate, 0);
  });

  it('собирает mute_user синонимы с duration и canSendMessages', () => {
    const entries = collectSynonymEntries(nodesWithMuteSynonym);
    assert.strictEqual(entries[0].duration, 3600);
    assert.strictEqual(entries[0].canSendMessages, false);
  });

  it('собирает promote_user синонимы с правами', () => {
    const entries = collectSynonymEntries(nodesWithPromoteSynonym);
    assert.strictEqual(entries[0].canDeleteMessages, true);
    assert.strictEqual(entries[0].canPinMessages, false);
  });

  it('собирает admin_rights синонимы', () => {
    const entries = collectSynonymEntries(nodesWithAdminRightsSynonym);
    assert.strictEqual(entries[0].nodeType, 'admin_rights');
  });

  it('фильтрует null узлы и узлы без синонимов', () => {
    const entries = collectSynonymEntries(nodesWithNullAndEmpty);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].synonym, 'меню');
  });

  it('возвращает пустой массив если нет синонимов', () => {
    const entries = collectSynonymEntries(nodesStartSynonymWithoutStartNode);
    assert.strictEqual(entries.length, 0);
  });

  it('смешанные узлы: собирает все типы', () => {
    const entries = collectSynonymEntries(nodesMixed);
    const types = entries.map(e => e.nodeType);
    assert.ok(types.includes('start'));
    assert.ok(types.includes('message'));
    assert.ok(types.includes('ban_user'));
    assert.ok(types.includes('mute_user'));
    assert.ok(types.includes('promote_user'));
  });
});

// ─── generateSynonymHandlers() ───────────────────────────────────────────────

describe('generateSynonymHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    assert.strictEqual(generateSynonymHandlers([]), '');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateSynonymHandlers(nodesWithStartSynonym);
    assert.ok(r.includes('await start_handler(message)'));
    assert.ok(r.includes('"привет"'));
    assert.ok(r.includes('"hello"'));
  });

  it('генерирует ban_user из узлов', () => {
    const r = generateSynonymHandlers(nodesWithBanSynonym);
    assert.ok(r.includes('bot.ban_chat_member'));
    assert.ok(r.includes('Спам'));
  });

  it('генерирует смешанные типы из узлов', () => {
    const r = generateSynonymHandlers(nodesMixed);
    assert.ok(r.includes('start_handler'));
    assert.ok(r.includes('MockCallback'));
    assert.ok(r.includes('ban_chat_member'));
    assert.ok(r.includes('timedelta'));
    assert.ok(r.includes('promote_chat_member'));
  });

  it('фильтрует null и пустые узлы', () => {
    const r = generateSynonymHandlers(nodesWithNullAndEmpty);
    assert.ok(r.includes('"меню"'));
    assert.ok(!r.includes('null'));
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateSynonyms: быстрее 10ms', () => {
    const start = Date.now();
    generateSynonyms(validParamsMixed);
    assert.ok(Date.now() - start < 10);
  });

  it('generateSynonymHandlers: быстрее 10ms', () => {
    const start = Date.now();
    generateSynonymHandlers(nodesMixed);
    assert.ok(Date.now() - start < 10);
  });
});
