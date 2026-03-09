/**
 * @fileoverview Расширение менеджера для операций с группами
 * @module server/telegram/services/client/telegram-client-manager-v2-groups
 * @description Предоставляет методы для управления участниками групп
 */

import type { GroupModule } from './group-module.js';

/**
 * Расширение менеджера для операций с группами
 */
export class GroupMethods {
  constructor(private readonly group: GroupModule) {}

  /**
   * Получить участников группы
   */
  async getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    return this.group.getMembers(userId, chatId);
  }

  /**
   * Исключить участника
   */
  async kickMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.group.kick(userId, chatId, memberId);
  }

  /**
   * Заблокировать участника
   */
  async banMember(
    userId: string,
    chatId: string | number,
    memberId: string,
    untilDate?: number
  ): Promise<any> {
    return this.group.ban(userId, chatId, memberId, untilDate);
  }

  /**
   * Ограничить участника
   */
  async restrictMember(
    userId: string,
    chatId: string | number,
    memberId: string,
    untilDate?: number
  ): Promise<any> {
    return this.group.restrict(userId, chatId, memberId, untilDate);
  }

  /**
   * Назначить администратором
   */
  async promoteMember(
    userId: string,
    chatId: string | number,
    memberId: string,
    adminRights: any
  ): Promise<any> {
    return this.group.promote(userId, chatId, memberId, adminRights);
  }

  /**
   * Снять администраторство
   */
  async demoteMember(
    userId: string,
    chatId: string | number,
    memberId: string
  ): Promise<any> {
    return this.group.demote(userId, chatId, memberId);
  }
}
