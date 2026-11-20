/** @fileoverview Очистка браузерных копий проектов, ботов и шаблонов от известных секретов. */

/** Ключи старого локального хранилища, которые могли содержать секреты. */
export const LOCAL_RECORD_KEYS = {
  PROJECTS: 'botcraft_projects',
  TOKENS: 'botcraft_tokens',
  TEMPLATES: 'botcraft_templates',
} as const;

/** Известные поля учётных данных записей и узлов сценария. */
const CREDENTIAL_FIELDS = new Set([
  'token', 'bottoken', 'sessionid', 'webhooksecrettoken', 'webhooksecret',
  'userbotapihash', 'userbotsessionstring', 'apisecrettoken', 'invoiceprovidertoken',
  'httprequestauthbearertoken', 'httprequestauthbasicpassword',
  'httprequestauthheadervalue', 'httprequestauthqueryvalue',
]);

/**
 * Определяет поля известных секретов, включая старые имена с подчёркиваниями.
 * @param field - Ключ в сериализуемой записи.
 * @returns Нужно ли исключить поле из копии.
 */
function isCredentialField(field: string): boolean {
  return CREDENTIAL_FIELDS.has(field.replace(/[-_]/g, '').toLowerCase());
}

/**
 * Сериализует записи для хранилища без известных секретов, в том числе во вложенных узлах.
 * @param value - Значение для записи.
 * @returns Безопасное представление известных полей в JSON.
 */
export function serializeLocalRecord(value: unknown): string {
  return JSON.stringify(value, (field, item: unknown) => isCredentialField(field) ? undefined : item);
}

/**
 * Читает запись и заменяет старую копию очищенным JSON только при обнаружении секретов.
 * @param storage - Браузерное хранилище.
 * @param key - Ключ локальной записи.
 * @param fallback - Значение, когда записи нет или она повреждена.
 * @returns Копия без известных секретов.
 */
export function readLocalRecord<T>(storage: Storage, key: string, fallback: T): T {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;

  let containsCredentials = false;
  let cleaned: T;
  try {
    cleaned = JSON.parse(raw, (field, item: unknown) => {
      if (!isCredentialField(field)) return item;
      containsCredentials = true;
      return undefined;
    }) as T;
  } catch {
    /** Сохраняем повреждённую копию, так как нельзя отделить данные и секреты без корректного JSON. */
    return fallback;
  }
  if (containsCredentials) {
    try {
      storage.setItem(key, serializeLocalRecord(cleaned));
    } catch {
      storage.removeItem(key);
    }
  }
  return cleaned;
}

/** Очищает ранее сохранённые копии при запуске приложения, сохраняя доступные данные. */
export function scrubLegacyLocalRecords(): void {
  for (const key of Object.values(LOCAL_RECORD_KEYS)) {
    try {
      readLocalRecord(window.localStorage, key, []);
    } catch {
      /** Недоступность хранилища не мешает открыть редактор. */
    }
  }
}
