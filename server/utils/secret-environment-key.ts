/** @fileoverview Выделение секретных настроек без маскировки идентификаторов и публичных адресов. */

/** Определяет настройки, значения которых дают доступ к боту, аккаунту или хранилищу. */
export function isSecretEnvironmentKey(key: string): boolean {
  if (/(?:^|_)(?:ID|MODE|ENABLED|PORT|HOST|BASE_URL)$/.test(key.toUpperCase())) return false;
  return /(?:^|_)(?:TOKEN|SECRET|PASSWORD|CREDENTIAL|KEY|HASH)(?:$|_)/i.test(key)
    || /(?:^|_)(?:SESSION_STRING|DATABASE_URL|REDIS_URL|AUTHORIZATION)$/i.test(key);
}
