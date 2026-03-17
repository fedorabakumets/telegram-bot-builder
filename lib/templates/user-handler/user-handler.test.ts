/**
 * @fileoverview Тесты для шаблона user-handler
 * @module templates/user-handler/user-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUserHandler } from './user-handler.renderer';
import { userHandlerParamsSchema } from './user-handler.schema';
import {
  fixtureBanUser,
  fixtureBanUserTimed,
  fixtureUnbanUser,
  fixtureKickUser,
  fixtureKickUserTargetGroup,
  fixtureMuteUser,
  fixtureUnmuteUser,
  fixturePromoteUser,
  fixtureDemoteUser,
} from './user-handler.fixture';

// ─── ban_user ────────────────────────────────────────────────────────────────

describe('ban_user', () => {
  it('генерирует command handler /ban_user', () => {
    const r = generateUserHandler(fixtureBanUser);
    assert.ok(r.includes('Command("ban_user")'));
    assert.ok(r.includes('ban_user_ban_node_1_command_handler'));
  });

  it('бессрочный бан: ban_chat_member без until_date', () => {
    const r = generateUserHandler(fixtureBanUser);
    assert.ok(r.includes('bot.ban_chat_member'));
    assert.ok(r.includes('заблокирован навсегда'));
    assert.ok(r.includes('Спам'));
  });

  it('временный бан: содержит until_date', () => {
    const r = generateUserHandler(fixtureBanUserTimed);
    assert.ok(r.includes('1700000000'));
    assert.ok(r.includes('заблокирован до'));
  });

  it('генерирует synonym handler с синонимами', () => {
    const r = generateUserHandler(fixtureBanUser);
    assert.ok(r.includes('ban_user_ban_node_1_handler'));
    assert.ok(r.includes('"бан", "забанить"') || r.includes('"бан"'));
  });

  it('фильтр чата: только группы', () => {
    const r = generateUserHandler(fixtureBanUser);
    assert.ok(r.includes("message.chat.type in ['group', 'supergroup']"));
  });

  it('определяет target_user_id через reply и text_mention', () => {
    const r = generateUserHandler(fixtureBanUser);
    assert.ok(r.includes('reply_to_message.from_user.id'));
    assert.ok(r.includes('text_mention'));
  });

  it('обработка TelegramBadRequest', () => {
    const r = generateUserHandler(fixtureBanUser);
    assert.ok(r.includes('except TelegramBadRequest as e:'));
    assert.ok(r.includes('CHAT_ADMIN_REQUIRED'));
  });
});

// ─── unban_user ──────────────────────────────────────────────────────────────

describe('unban_user', () => {
  it('вызывает unban_chat_member с only_if_banned=True', () => {
    const r = generateUserHandler(fixtureUnbanUser);
    assert.ok(r.includes('bot.unban_chat_member'));
    assert.ok(r.includes('only_if_banned=True'));
    assert.ok(r.includes('разблокирован'));
  });

  it('генерирует command handler /unban_user', () => {
    const r = generateUserHandler(fixtureUnbanUser);
    assert.ok(r.includes('Command("unban_user")'));
  });
});

// ─── kick_user ───────────────────────────────────────────────────────────────

describe('kick_user', () => {
  it('ban + sleep + unban для кика', () => {
    const r = generateUserHandler(fixtureKickUser);
    assert.ok(r.includes('bot.ban_chat_member'));
    assert.ok(r.includes('asyncio.sleep'));
    assert.ok(r.includes('bot.unban_chat_member'));
    assert.ok(r.includes('исключен из группы'));
    assert.ok(r.includes('Нарушение правил'));
  });

  it('targetGroupId: фильтр по конкретной группе', () => {
    const r = generateUserHandler(fixtureKickUserTargetGroup);
    assert.ok(r.includes('-1001234567890'));
    assert.ok(r.includes('str(message.chat.id)'));
    assert.ok(!r.includes("message.chat.type in ['group', 'supergroup']"));
  });
});

// ─── mute_user ───────────────────────────────────────────────────────────────

describe('mute_user', () => {
  it('вызывает restrict_chat_member с ChatPermissions', () => {
    const r = generateUserHandler(fixtureMuteUser);
    assert.ok(r.includes('bot.restrict_chat_member'));
    assert.ok(r.includes('types.ChatPermissions'));
    assert.ok(r.includes('can_send_messages=False'));
  });

  it('вычисляет время из duration', () => {
    const r = generateUserHandler(fixtureMuteUser);
    assert.ok(r.includes('timedelta(seconds=3600)'));
    assert.ok(r.includes('Флуд'));
  });

  it('генерирует оба handler (command + synonym)', () => {
    const r = generateUserHandler(fixtureMuteUser);
    assert.ok(r.includes('Command("mute_user")'));
    assert.ok(r.includes('mute_user_mute_node_1_handler'));
  });
});

// ─── unmute_user ─────────────────────────────────────────────────────────────

describe('unmute_user', () => {
  it('снимает все ограничения (все True)', () => {
    const r = generateUserHandler(fixtureUnmuteUser);
    assert.ok(r.includes('can_send_messages=True'));
    assert.ok(r.includes('can_send_polls=True'));
    assert.ok(r.includes('Ограничения с пользователя'));
  });
});

// ─── promote_user ────────────────────────────────────────────────────────────

describe('promote_user', () => {
  it('вызывает promote_chat_member с правами', () => {
    const r = generateUserHandler(fixturePromoteUser);
    assert.ok(r.includes('bot.promote_chat_member'));
    assert.ok(r.includes('can_delete_messages=True'));
    assert.ok(r.includes('can_invite_users=True'));
    assert.ok(r.includes('can_pin_messages=True'));
  });

  it('canManageTopics включается если задан', () => {
    const r = generateUserHandler(fixturePromoteUser);
    assert.ok(r.includes('can_manage_topics=True'));
  });

  it('обработка USER_NOT_PARTICIPANT', () => {
    const r = generateUserHandler(fixturePromoteUser);
    assert.ok(r.includes('USER_NOT_PARTICIPANT'));
  });
});

// ─── demote_user ─────────────────────────────────────────────────────────────

describe('demote_user', () => {
  it('снимает все права (все False)', () => {
    const r = generateUserHandler(fixtureDemoteUser);
    assert.ok(r.includes('can_change_info=False'));
    assert.ok(r.includes('can_promote_members=False'));
    assert.ok(r.includes('can_manage_topics=False'));
    assert.ok(r.includes('снят с должности администратора'));
  });
});

// ─── Схема ───────────────────────────────────────────────────────────────────

describe('userHandlerParamsSchema', () => {
  it('принимает валидные параметры ban_user', () => {
    assert.ok(userHandlerParamsSchema.safeParse(fixtureBanUser).success);
  });

  it('принимает все типы узлов', () => {
    for (const f of [fixtureBanUser, fixtureUnbanUser, fixtureKickUser,
                     fixtureMuteUser, fixtureUnmuteUser, fixturePromoteUser, fixtureDemoteUser]) {
      assert.ok(userHandlerParamsSchema.safeParse(f).success, `Провал для ${f.nodeType}`);
    }
  });

  it('отклоняет неправильный nodeType', () => {
    assert.ok(!userHandlerParamsSchema.safeParse({ ...fixtureBanUser, nodeType: 'admin_rights' }).success);
  });

  it('отклоняет пустой массив synonyms', () => {
    assert.ok(!userHandlerParamsSchema.safeParse({ ...fixtureBanUser, synonyms: [] }).success);
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateUserHandler: быстрее 10ms', () => {
    const start = Date.now();
    generateUserHandler(fixtureMuteUser);
    assert.ok(Date.now() - start < 10);
  });
});
