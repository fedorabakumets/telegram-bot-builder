/**
 * @fileoverview Тесты для шаблона admin-rights
 * @module templates/admin-rights/admin-rights.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateAdminRightsHandler } from './admin-rights.renderer';
import { adminRightsParamsSchema } from './admin-rights.schema';
import { fixtureAdminRights, fixtureAdminRightsCustom } from './admin-rights.fixture';

describe('generateAdminRightsHandler()', () => {
  describe('command handler', () => {
    it('генерирует command handler с правильной командой', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('Command("admin_rights")'));
      assert.ok(r.includes('admin_rights_node_1_command_handler'));
    });

    it('кастомная команда', () => {
      const r = generateAdminRightsHandler(fixtureAdminRightsCustom);
      assert.ok(r.includes('Command("set_rights")'));
    });

    it('проверяет права вызывающего пользователя', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes("status not in ['administrator', 'creator']"));
      assert.ok(r.includes('can_promote_members'));
    });

    it('определяет target_user_id через reply, mention, ID', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('reply_to_message.from_user.id'));
      assert.ok(r.includes('text_mention'));
      assert.ok(r.includes('re.findall'));
    });
  });

  describe('callback handler', () => {
    it('генерирует callback handler с nodeId', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('c.data == "admin_rights_node_1"'));
      assert.ok(r.includes('handle_callback_admin_rights_node_1'));
    });

    it('проверяет права бота', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('bot.get_chat_member(chat_id, bot.id)'));
      assert.ok(r.includes('Бот не является администратором'));
    });

    it('содержит messageText', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('Управление правами администратора'));
    });
  });

  describe('keyboard builder', () => {
    it('генерирует функцию создания клавиатуры', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('create_admin_rights_keyboard_admin_rights_node_1'));
      assert.ok(r.includes('InlineKeyboardBuilder'));
    });

    it('содержит все 11 прав администратора', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('can_change_info'));
      assert.ok(r.includes('can_delete_messages'));
      assert.ok(r.includes('can_restrict_members'));
      assert.ok(r.includes('can_invite_users'));
      assert.ok(r.includes('can_pin_messages'));
      assert.ok(r.includes('can_manage_video_chats'));
      assert.ok(r.includes('can_post_stories'));
      assert.ok(r.includes('can_edit_stories'));
      assert.ok(r.includes('can_delete_stories'));
      assert.ok(r.includes('is_anonymous'));
      assert.ok(r.includes('can_promote_members'));
    });

    it('генерирует get_admin_rights функцию', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('get_admin_rights_admin_rights_node_1'));
    });
  });

  describe('toggle handlers', () => {
    it('генерирует toggle handler для каждого права', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('toggle_can_change_info_admin_rights_node_1'));
      assert.ok(r.includes('toggle_can_delete_messages_admin_rights_node_1'));
      assert.ok(r.includes('toggle_can_promote_members_admin_rights_node_1'));
    });

    it('toggle handler парсит callback_data', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes("data_parts = callback_query.data.split('_')"));
      assert.ok(r.includes('target_user_id = int(data_parts[-2])'));
    });

    it('toggle handler вызывает promote_chat_member', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('bot.promote_chat_member'));
    });
  });

  describe('refresh handler', () => {
    it('генерирует refresh handler', () => {
      const r = generateAdminRightsHandler(fixtureAdminRights);
      assert.ok(r.includes('refresh_admin_rights_admin_rights_node_1'));
      assert.ok(r.includes('c.data.startswith("ref_")'));
    });
  });

  describe('safe_name изоляция', () => {
    it('разные узлы не конфликтуют по именам функций', () => {
      const r1 = generateAdminRightsHandler(fixtureAdminRights);
      const r2 = generateAdminRightsHandler(fixtureAdminRightsCustom);
      assert.ok(r1.includes('admin_rights_node_1'));
      assert.ok(r2.includes('ar_custom'));
      assert.ok(!r1.includes('ar_custom'));
      assert.ok(!r2.includes('admin_rights_node_1'));
    });
  });
});

describe('adminRightsParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(adminRightsParamsSchema.safeParse(fixtureAdminRights).success);
  });

  it('применяет defaults для messageText и command', () => {
    const result = adminRightsParamsSchema.parse({ nodeId: 'x', safeName: 'x' });
    assert.strictEqual(result.messageText, '⚙️ Управление правами администратора');
    assert.strictEqual(result.command, 'admin_rights');
  });

  it('отклоняет отсутствие nodeId', () => {
    assert.ok(!adminRightsParamsSchema.safeParse({ safeName: 'x' }).success);
  });
});

describe('Производительность', () => {
  it('generateAdminRightsHandler: быстрее 20ms', () => {
    const start = Date.now();
    generateAdminRightsHandler(fixtureAdminRights);
    assert.ok(Date.now() - start < 20);
  });
});
