/**
 * @fileoverview Тесты для компонентов управления пользователями
 * @module tests/unit/massive/user-management.test
 */

/// <reference types="vitest/globals" />

import { banUser } from '../../../massive/user-management/ban-user';
import { unbanUser } from '../../../massive/user-management/unban-user';
import { muteUser } from '../../../massive/user-management/mute-user';
import { unmuteUser } from '../../../massive/user-management/unmute-user';
import { kickUser } from '../../../massive/user-management/kick-user';
import { promoteUser } from '../../../massive/user-management/promote-user';
import { demoteUser } from '../../../massive/user-management/demote-user';
import { adminRights } from '../../../massive/user-management/admin-rights';

describe('User Management Components', () => {
  describe('banUser', () => {
    it('должен иметь правильный id', () => {
      expect(banUser.id).toBe('ban-user');
    });

    it('должен иметь тип ban_user', () => {
      expect(banUser.type).toBe('ban_user');
    });

    it('должен иметь reason по умолчанию', () => {
      expect(banUser.defaultData?.reason).toBe('Нарушение правил группы');
    });

    it('должен иметь userIdSource: last_message', () => {
      expect(banUser.defaultData?.userIdSource).toBe('last_message');
    });

    it('должен иметь пустой targetUserId', () => {
      expect(banUser.defaultData?.targetUserId).toBe('');
    });

    it('должен иметь untilDate: 0 (вечный бан)', () => {
      expect(banUser.defaultData?.untilDate).toBe(0);
    });

    it('должен иметь иконку ban', () => {
      expect(banUser.icon).toBe('fas fa-ban');
    });

    it('должен иметь красный цвет', () => {
      expect(banUser.color).toBe('bg-red-100 text-red-600');
    });
  });

  describe('unbanUser', () => {
    it('должен иметь правильный id', () => {
      expect(unbanUser.id).toBe('unban-user');
    });

    it('должен иметь тип unban_user', () => {
      expect(unbanUser.type).toBe('unban_user');
    });

    it('должен иметь иконку user-check', () => {
      expect(unbanUser.icon).toBe('fas fa-user-check');
    });
  });

  describe('muteUser', () => {
    it('должен иметь правильный id', () => {
      expect(muteUser.id).toBe('mute-user');
    });

    it('должен иметь тип mute_user', () => {
      expect(muteUser.type).toBe('mute_user');
    });

    it('должен иметь duration 3600 (1 час) по умолчанию', () => {
      expect(muteUser.defaultData?.duration).toBe(3600);
    });

    it('должен иметь reason по умолчанию', () => {
      expect(muteUser.defaultData?.reason).toBe('Нарушение правил группы');
    });

    it('должен запрещать отправку сообщений по умолчанию', () => {
      expect(muteUser.defaultData?.canSendMessages).toBe(false);
    });

    it('должен запрещать отправку медиа по умолчанию', () => {
      expect(muteUser.defaultData?.canSendMediaMessages).toBe(false);
    });

    it('должен запрещать опросы по умолчанию', () => {
      expect(muteUser.defaultData?.canSendPolls).toBe(false);
    });

    it('должен иметь иконку volume-mute', () => {
      expect(muteUser.icon).toBe('fas fa-volume-mute');
    });

    it('должен иметь оранжевый цвет', () => {
      expect(muteUser.color).toBe('bg-orange-100 text-orange-600');
    });
  });

  describe('unmuteUser', () => {
    it('должен иметь правильный id', () => {
      expect(unmuteUser.id).toBe('unmute-user');
    });

    it('должен иметь тип unmute_user', () => {
      expect(unmuteUser.type).toBe('unmute_user');
    });

    it('должен иметь иконку volume-up', () => {
      expect(unmuteUser.icon).toContain('fa-volume');
    });
  });

  describe('kickUser', () => {
    it('должен иметь правильный id', () => {
      expect(kickUser.id).toBe('kick-user');
    });

    it('должен иметь тип kick_user', () => {
      expect(kickUser.type).toBe('kick_user');
    });

    it('должен иметь reason по умолчанию', () => {
      expect(kickUser.defaultData?.reason).toBe('Нарушение правил группы');
    });

    it('должен иметь иконку user-times', () => {
      expect(kickUser.icon).toBe('fas fa-user-times');
    });

    it('должен иметь красный цвет', () => {
      expect(kickUser.color).toBe('bg-red-100 text-red-600');
    });
  });

  describe('promoteUser', () => {
    it('должен иметь правильный id', () => {
      expect(promoteUser.id).toBe('promote-user');
    });

    it('должен иметь тип promote_user', () => {
      expect(promoteUser.type).toBe('promote_user');
    });

    it('должен иметь canDeleteMessages: true по умолчанию', () => {
      expect(promoteUser.defaultData?.canDeleteMessages).toBe(true);
    });

    it('должен иметь canBanUsers: false по умолчанию', () => {
      expect(promoteUser.defaultData?.canBanUsers).toBe(false);
    });

    it('должен иметь canInviteUsers: true по умолчанию', () => {
      expect(promoteUser.defaultData?.canInviteUsers).toBe(true);
    });

    it('должен иметь canPinMessages: true по умолчанию', () => {
      expect(promoteUser.defaultData?.canPinMessages).toBe(true);
    });

    it('должен иметь canChangeInfo: false по умолчанию', () => {
      expect(promoteUser.defaultData?.canChangeInfo).toBe(false);
    });

    it('должен иметь canAddAdmins: false по умолчанию', () => {
      expect(promoteUser.defaultData?.canAddAdmins).toBe(false);
    });

    it('должен иметь иконку crown', () => {
      expect(promoteUser.icon).toBe('fas fa-crown');
    });

    it('должен иметь жёлтый цвет', () => {
      expect(promoteUser.color).toBe('bg-yellow-100 text-yellow-600');
    });
  });

  describe('demoteUser', () => {
    it('должен иметь правильный id', () => {
      expect(demoteUser.id).toBe('demote-user');
    });

    it('должен иметь тип demote_user', () => {
      expect(demoteUser.type).toBe('demote_user');
    });

    it('должен иметь иконку user-minus', () => {
      expect(demoteUser.icon).toContain('fa-user-minus');
    });
  });

  describe('adminRights', () => {
    it('должен иметь правильный id', () => {
      expect(adminRights.id).toBe('admin-rights');
    });

    it('должен иметь тип admin_rights', () => {
      expect(adminRights.type).toBe('admin_rights');
    });

    it('должен иметь название "Тг права"', () => {
      expect(adminRights.name).toBe('Тг права');
    });

    it('должен иметь synonyms по умолчанию', () => {
      expect(adminRights.defaultData?.synonyms).toEqual(
        expect.arrayContaining(['права админа', 'админ права', 'тг права'])
      );
    });

    it('должен иметь can_delete_messages: true по умолчанию', () => {
      expect(adminRights.defaultData?.can_delete_messages).toBe(true);
    });

    it('должен иметь can_invite_users: true по умолчанию', () => {
      expect(adminRights.defaultData?.can_invite_users).toBe(true);
    });

    it('должен иметь can_pin_messages: true по умолчанию', () => {
      expect(adminRights.defaultData?.can_pin_messages).toBe(true);
    });

    it('должен иметь can_manage_chat: false по умолчанию', () => {
      expect(adminRights.defaultData?.can_manage_chat).toBe(false);
    });

    it('должен иметь can_post_messages: false по умолчанию', () => {
      expect(adminRights.defaultData?.can_post_messages).toBe(false);
    });

    it('должен иметь is_anonymous: false по умолчанию', () => {
      expect(adminRights.defaultData?.is_anonymous).toBe(false);
    });

    it('должен иметь adminUserIdSource: last_message', () => {
      expect(adminRights.defaultData?.adminUserIdSource).toBe('last_message');
    });

    it('должен иметь adminChatIdSource: current_chat', () => {
      expect(adminRights.defaultData?.adminChatIdSource).toBe('current_chat');
    });

    it('должен иметь иконку user-cog', () => {
      expect(adminRights.icon).toBe('fas fa-user-cog');
    });

    it('должен иметь фиолетовый цвет', () => {
      expect(adminRights.color).toBe('bg-purple-100 text-purple-600');
    });
  });
});
