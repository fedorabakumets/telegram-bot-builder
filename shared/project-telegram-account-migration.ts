/** @fileoverview Открытые данные предварительного просмотра переноса старых сессий Telegram. */

/** Причина, по которой бот не попал в группы переноса. */
export type LegacyMigrationExclusion = 'already-linked' | 'missing-session' | 'invalid-session' | 'missing-api-credentials';

/** Строка публичного предварительного просмотра. */
export interface LegacyTelegramMigrationGroup {
  /** Ключ группы, равный наименьшему ID входящего в неё бота. */
  id: number;
  /** Боты, подлежащие переносу этой группой. */
  botIds: number[];
  /** Названия ботов в том же порядке. */
  botNames: string[];
  /** Предлагаемое действие. */
  disposition: 'create' | 'reuse' | 'blocked';
  /** Существующий аккаунт, когда его сессия совпала. */
  accountId?: number;
  /** Причина блокировки группы. */
  conflict?: 'other-project' | 'ambiguous-owner' | 'conflicting-identity';
  /** Группы с другой сессией того же проверенного аккаунта. */
  matchingIdentityGroupIds: number[];
}

/** Предварительный просмотр без сессионных ключей и отпечатков. */
export interface LegacyTelegramMigrationPlan {
  /** Предлагаемые группы. */
  groups: LegacyTelegramMigrationGroup[];
  /** Боты без действий при переносе. */
  excluded: {
    /** Идентификатор бота. */
    botId: number;
    /** Причина исключения. */
    reason: LegacyMigrationExclusion;
  }[];
}
