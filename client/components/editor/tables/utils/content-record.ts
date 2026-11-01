/** @fileoverview Названия нод и назначение записей контента без изменения ключей хранения. */
import type { CanvasSheet } from '@shared/schema';

/** Описание записи контента для интерфейса. */
export interface ContentRecord {
  /** Идентификатор ноды. */
  nodeId: string;
  /** Идентификатор кнопки при наличии. */
  buttonId?: string;
  /** Название ноды или понятное имя её типа. */
  title: string;
  /** Назначение поля в записи. */
  field: string;
  /** Нода отсутствует в загруженном сценарии. */
  missing: boolean;
  /** Сценарий ещё не предоставлен. */
  loading: boolean;
}
/** Названия типов нод без заданного пользователем имени. */
const nodeTypes: Record<string, string> = { message: 'Сообщение', command_trigger: 'Команда', keyboard: 'Клавиатура', http_request: 'HTTP запрос', condition: 'Условие', start: 'Начало сценария' };
/** Назначения полей контента. */
const fields: Record<string, string> = { caption: 'Подпись медиа', media: 'Медиафайл', api: 'Адрес запроса', body: 'Тело запроса', headers: 'Заголовки запроса', sql: 'SQL запрос', desc: 'Описание команды', prompt: 'Текст запроса', entity: 'Получатель', msg_id: 'ID сообщения', click_val: 'Значение нажатия', bot: 'Имя бота', query: 'Запрос', target: 'Целевой чат' };
/**
 * Разбирает ключ и находит его ноду в актуальных листах.
 * @param key - Полный ключ контента.
 * @param sheets - Текущие листы проекта.
 * @returns Название, назначение поля и состояние связи.
 */
export function describeContent(key: string, sheets?: CanvasSheet[]): ContentRecord {
  return createContentResolver(sheets)(key);
}
/**
 * Индексирует ноды один раз для обработки больших таблиц.
 * @param sheets - Загруженные листы проекта.
 * @returns Определение записи за время, зависящее от длины её ID.
 */
export function createContentResolver(sheets?: CanvasSheet[]): (key: string) => ContentRecord {
  const nodes = new Map(sheets?.flatMap((sheet) => sheet.nodes).map((node) => [node.id, node]) ?? []);
  return (key) => {
  let prefix = nodes.get(key);
  for (let index = key.lastIndexOf('.'); !prefix && index > 0; index = key.lastIndexOf('.', index - 1)) prefix = nodes.get(key.slice(0, index));
  const marker = key.search(/\.(?:btn\.|caption$|media$|api$|body$|headers$|sql$|desc$|prompt$|entity$|msg_id$|click_val$|bot$|query$|target$)/);
  const nodeId = prefix?.id ?? (marker < 0 ? key : key.slice(0, marker));
  const suffix = key.slice(nodeId.length + 1);
  const parts = suffix.split('.');
  const buttonId = parts[0] === 'btn' ? parts[1] : undefined;
  const field = buttonId ? (parts[2] === 'url' ? 'Ссылка кнопки' : parts[2] === 'webapp' ? 'Приложение кнопки' : 'Текст кнопки') : fields[suffix] ?? 'Текст сообщения';
  const data = prefix?.data;
  const explicit = data?.label || data?.title || data?.name;
  const preview = data?.messageText?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const title = typeof explicit === 'string' && explicit.trim() ? explicit : preview || (prefix ? nodeTypes[prefix.type] ?? prefix.type : 'Нода не найдена');
  return { nodeId, buttonId, title, field, missing: Boolean(sheets && !prefix), loading: !sheets };
  };
}
