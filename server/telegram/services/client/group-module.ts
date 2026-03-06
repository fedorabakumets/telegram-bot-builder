/**
 * @fileoverview Модуль операций с группами Telegram с валидацией
 * @module server/telegram/services/client/group-module
 * @description Реализует операции управления участниками групп
 */

import type { IGroupModule } from '../../types/client/modules.js';
import { TelegramStore } from './telegram-store.js';
import { getClient } from './get-client.js';
import { executeMemberOperation } from './execute-member-operation.js';
import { getGroupMembers } from './get-group-members.js';
import { kickMember } from './kick-member.js';
import { banMember } from './ban-member.js';
import { restrictMember } from './restrict-member.js';
import { promoteMember } from './promote-member.js';
import { demoteMember } from './demote-member.js';
import {
  validateRequired,
  validateChatId,
  validateUserId,
  combineValidationResults,
} from '../../utils/validation/index.js';

/**
 * Модуль операций с участниками групп Telegram
 */
export class GroupModule implements IGroupModule {
  constructor(private readonly store: TelegramStore) {}

  async getMembers(userId: string, chatId: string | number): Promise<any[]> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId)
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    return executeMemberOperation(client, undefined, (c) => getGroupMembers(c, chatId));
  }

  async kick(userId: string, chatId: string | number, memberId: string): Promise<any> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId),
      validateRequired(memberId, 'memberId')
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    return executeMemberOperation(client, undefined, (c) => kickMember(c, chatId, memberId));
  }

  async ban(
    userId: string,
    chatId: string | number,
    memberId: string,
    untilDate?: number
  ): Promise<any> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId),
      validateRequired(memberId, 'memberId')
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    return executeMemberOperation(client, undefined, (c) => banMember(c, chatId, memberId, untilDate));
  }

  async restrict(
    userId: string,
    chatId: string | number,
    memberId: string,
    untilDate?: number
  ): Promise<any> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId),
      validateRequired(memberId, 'memberId')
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    return executeMemberOperation(client, undefined, (c) => restrictMember(c, chatId, memberId, untilDate));
  }

  async promote(
    userId: string,
    chatId: string | number,
    memberId: string,
    adminRights: any
  ): Promise<any> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId),
      validateRequired(memberId, 'memberId'),
      validateRequired(adminRights, 'adminRights')
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    return executeMemberOperation(client, undefined, (c) => promoteMember(c, chatId, memberId, adminRights));
  }

  async demote(userId: string, chatId: string | number, memberId: string): Promise<any> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId),
      validateRequired(memberId, 'memberId')
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    return executeMemberOperation(client, undefined, (c) => demoteMember(c, chatId, memberId));
  }
}
