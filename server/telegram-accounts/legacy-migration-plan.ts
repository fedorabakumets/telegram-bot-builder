/** @fileoverview Предварительный просмотр переноса старых привязок Telegram. */

import type { LegacyMigrationExclusion, LegacyTelegramMigrationGroup, LegacyTelegramMigrationPlan } from '@shared/project-telegram-account-migration';

/** Серверные сведения о старой привязке, очищенные от секретов. */
export interface LegacyTelegramBotMetadata {
  /** Идентификатор проекта бота. */
  projectId: number;
  /** Идентификатор бота. */
  botId: number;
  /** Отображаемое имя бота. */
  name: string;
  /** Установленная привязка к аккаунту проекта. */
  linkedAccountId?: number | null;
  /** Отпечаток ключа авторизации, доступный только на сервере. */
  fingerprint?: string | null;
  /** Проверенный Telegram ID. */
  verifiedTelegramUserId?: string | null;
  /** Причина непригодности старой сессии для переноса. */
  problem?: Exclude<LegacyMigrationExclusion, 'already-linked'>;
}

/** Серверная запись о текущем владельце ключа. */
export interface LegacyTelegramSessionOwner {
  /** Идентификатор проекта аккаунта. */
  projectId: number;
  /** Идентификатор аккаунта. */
  accountId: number;
  /** Отпечаток уже привязанного ключа. */
  fingerprint: string;
  /** Проверенный Telegram ID аккаунта. */
  verifiedTelegramUserId?: string | null;
}

/**
 * Группирует пригодные старые записи по точному совпадению авторизации.
 * @param projectId - Проект, чей перенос просматривается.
 * @param bots - Серверные сведения о ботах, включая совпадения в других проектах.
 * @param owners - Зарегистрированные владельцы подходящих авторизаций.
 * @returns Стабильный план, который можно пересчитать перед применением.
 */
export function planLegacyTelegramAccountMigration(
  projectId: number, bots: readonly LegacyTelegramBotMetadata[], owners: readonly LegacyTelegramSessionOwner[] = [],
): LegacyTelegramMigrationPlan {
  const excluded: LegacyTelegramMigrationPlan['excluded'] = [];
  const bySession = new Map<string, LegacyTelegramBotMetadata[]>();
  for (const bot of [...bots].sort((a, b) => a.botId - b.botId)) {
    if (bot.projectId !== projectId) continue;
    const reason = bot.linkedAccountId != null ? 'already-linked' : bot.problem;
    if (reason || !bot.fingerprint) {
      excluded.push({ botId: bot.botId, reason: reason ?? 'missing-session' });
      continue;
    }
    const group = bySession.get(bot.fingerprint);
    if (group) group.push(bot);
    else bySession.set(bot.fingerprint, [bot]);
  }

  const foreign = new Set([
    ...bots.filter(bot => bot.projectId !== projectId).map(bot => bot.fingerprint),
    ...owners.filter(owner => owner.projectId !== projectId).map(owner => owner.fingerprint),
  ]);
  const ownByFingerprint = new Map<string, LegacyTelegramSessionOwner[]>();
  for (const owner of owners) {
    if (owner.projectId !== projectId) continue;
    const list = ownByFingerprint.get(owner.fingerprint);
    if (list) list.push(owner);
    else ownByFingerprint.set(owner.fingerprint, [owner]);
  }
  const identities = new Map<number, string>();
  const groups = [...bySession].map(([fingerprint, members]): LegacyTelegramMigrationGroup => {
    const id = members[0].botId;
    const matchedOwners = ownByFingerprint.get(fingerprint) ?? [];
    const existing = new Set(matchedOwners.map(owner => owner.accountId));
    const knownIdentities = new Set([...members, ...matchedOwners].map(row => row.verifiedTelegramUserId).filter(Boolean));
    const conflict = foreign.has(fingerprint) ? 'other-project'
      : existing.size > 1 ? 'ambiguous-owner' : knownIdentities.size > 1 ? 'conflicting-identity' : undefined;
    const identity = [...knownIdentities][0];
    if (!conflict && identity) identities.set(id, identity);
    const accountId = [...existing][0];
    return {
      id, botIds: members.map(bot => bot.botId), botNames: members.map(bot => bot.name),
      disposition: conflict ? 'blocked' : accountId != null ? 'reuse' : 'create',
      ...(conflict ? { conflict } : accountId != null ? { accountId } : {}), matchingIdentityGroupIds: [],
    };
  });

  for (const group of groups) {
    const identity = identities.get(group.id);
    if (identity) {
      group.matchingIdentityGroupIds = groups.filter(other => other.id !== group.id && identities.get(other.id) === identity)
        .map(other => other.id);
    }
  }
  return { groups, excluded };
}

/**
 * Проверяет подтверждённый владельцем выбор другой авторизации того же аккаунта.
 * @param plan - Свежий серверный предварительный просмотр.
 * @param sourceGroupId - Группа, чья авторизация будет заменена.
 * @param targetGroupId - Группа, чья авторизация сохраняется.
 * @returns Разрешённая группа назначения или null.
 */
export function confirmLegacyTelegramAccountMerge(
  plan: LegacyTelegramMigrationPlan, sourceGroupId: number, targetGroupId: number,
): LegacyTelegramMigrationGroup | null {
  const source = plan.groups.find(group => group.id === sourceGroupId);
  const target = plan.groups.find(group => group.id === targetGroupId);
  return source?.disposition === 'create' && target && target.disposition !== 'blocked'
    && source.matchingIdentityGroupIds.includes(targetGroupId) ? target : null;
}
