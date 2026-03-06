/**
 * @fileoverview Операции с участниками группы
 * @module server/telegram/services/client/group-member-operations
 */

import { TelegramClient } from 'telegram';
import { getClient } from './get-client.js';
import { executeMemberOperation } from './execute-member-operation.js';
import { getGroupMembers } from './get-group-members.js';
import { getChatInfo } from './get-chat-info.js';
import { kickMember } from './kick-member.js';
import { banMember } from './ban-member.js';
import { restrictMember } from './restrict-member.js';
import { promoteMember } from './promote-member.js';
import { demoteMember } from './demote-member.js';

/**
 * Сервис для выполнения операций с участниками группы
 */
export class GroupMemberOperations {
  private clients: Map<string, TelegramClient>;

  constructor(clients: Map<string, TelegramClient>) {
    this.clients = clients;
  }

  /**
   * Получить список участников группы
   */
  async getMembers(userId: string, chatId: string | number): Promise<any[]> {
    const client = getClient(userId, this.clients);
    return executeMemberOperation(client, undefined, (c) => getGroupMembers(c, chatId));
  }

  /**
   * Получить информацию о чате
   */
  async getChatInfo(userId: string, chatId: string | number): Promise<any> {
    const client = getClient(userId, this.clients);
    return executeMemberOperation(client, undefined, (c) => getChatInfo(c, chatId));
  }

  /**
   * Исключить участника
   */
  async kick(userId: string, chatId: string | number, memberId: string): Promise<any> {
    const client = getClient(userId, this.clients);
    return executeMemberOperation(client, undefined, (c) => kickMember(c, chatId, memberId));
  }

  /**
   * Заблокировать участника
   */
  async ban(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    const client = getClient(userId, this.clients);
    return executeMemberOperation(client, undefined, (c) => banMember(c, chatId, memberId, untilDate));
  }

  /**
   * Ограничить участника (мут)
   */
  async restrict(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    const client = getClient(userId, this.clients);
    return executeMemberOperation(client, undefined, (c) => restrictMember(c, chatId, memberId, untilDate));
  }

  /**
   * Назначить администратором
   */
  async promote(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any> {
    const client = getClient(userId, this.clients);
    return executeMemberOperation(client, undefined, (c) => promoteMember(c, chatId, memberId, adminRights));
  }

  /**
   * Снять администраторство
   */
  async demote(userId: string, chatId: string | number, memberId: string): Promise<any> {
    const client = getClient(userId, this.clients);
    return executeMemberOperation(client, undefined, (c) => demoteMember(c, chatId, memberId));
  }
}
