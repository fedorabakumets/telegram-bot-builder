/**
 * @fileoverview Утилиты маппинга нод сценария в ключи таблицы _content и обратно
 * @module services/content-table/content-key-parser
 */

/** Запись контента для таблицы _content */
export interface ContentEntry {
  /** Уникальный ключ (формат: node_id[.тип.sub_id]) */
  key: string;
  /** Тип контента: message, caption, button, url, media_url и т.д. */
  type: string;
  /** Имя листа (sheet) */
  sheet: string;
  /** Человекочитаемое описание */
  label: string;
  /** Значение (текст, URL и т.д.) */
  value: string;
}

/** Результат парсинга ключа контента */
export interface ParsedContentKey {
  /** ID ноды */
  nodeId: string;
  /** Поле ноды для обновления */
  field: string;
  /** ID вложенного элемента (кнопки) */
  subId?: string;
  /** Подполе вложенного элемента */
  subField?: string;
}

/**
 * Обрезает строку до указанной длины
 * @param text - Исходная строка
 * @param max - Максимальная длина
 * @returns Обрезанная строка
 */
function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

/**
 * Проверяет что значение не пустое
 * @param val - Проверяемое значение
 * @returns true если значение непустое
 */
function isNotEmpty(val: unknown): val is string {
  return typeof val === "string" && val.trim().length > 0;
}

/**
 * Извлекает контент из нод сценария для таблицы _content
 * @param sheets - Массив листов сценария
 * @returns Массив записей контента
 */
export function extractContentFromNodes(sheets: any[]): ContentEntry[] {
  const entries: ContentEntry[] = [];

  for (const sheet of sheets) {
    const sheetName = sheet.name || "";
    const nodes: any[] = sheet.nodes || [];

    for (const node of nodes) {
      const id = node.id as string;
      const data = node.data || {};
      const nodeType = node.type as string;

      // messageText
      if (isNotEmpty(data.messageText)) {
        entries.push({ key: id, type: "message", sheet: sheetName, label: truncate(data.messageText, 30), value: data.messageText });
      }

      // mediaCaption
      if (isNotEmpty(data.mediaCaption)) {
        entries.push({ key: `${id}.caption`, type: "caption", sheet: sheetName, label: truncate(data.mediaCaption, 30), value: data.mediaCaption });
      }

      // buttons
      const buttons: any[] = data.buttons || [];
      for (const btn of buttons) {
        const btnId = btn.id as string;
        if (isNotEmpty(btn.text)) {
          entries.push({ key: `${id}.btn.${btnId}`, type: "button", sheet: sheetName, label: `🔘 ${btn.text}`, value: btn.text });
        }
        if (isNotEmpty(btn.url)) {
          entries.push({ key: `${id}.btn.${btnId}.url`, type: "url", sheet: sheetName, label: `🔗 ${btn.text || ""}`, value: btn.url });
        }
        if (isNotEmpty(btn.webAppUrl)) {
          entries.push({ key: `${id}.btn.${btnId}.webapp`, type: "url", sheet: sheetName, label: `🌐 ${btn.text || ""}`, value: btn.webAppUrl });
        }
      }

      // media URLs
      if (isNotEmpty(data.imageUrl)) {
        entries.push({ key: `${id}.media`, type: "media_url", sheet: sheetName, label: "🖼 Медиа", value: data.imageUrl });
      } else if (isNotEmpty(data.videoUrl)) {
        entries.push({ key: `${id}.media`, type: "media_url", sheet: sheetName, label: "🎬 Медиа", value: data.videoUrl });
      } else if (isNotEmpty(data.audioUrl)) {
        entries.push({ key: `${id}.media`, type: "media_url", sheet: sheetName, label: "🎵 Медиа", value: data.audioUrl });
      } else if (isNotEmpty(data.documentUrl)) {
        entries.push({ key: `${id}.media`, type: "media_url", sheet: sheetName, label: "📄 Медиа", value: data.documentUrl });
      }

      // http_request
      if (nodeType === "http_request") {
        if (isNotEmpty(data.httpRequestUrl)) {
          entries.push({ key: `${id}.api`, type: "api_url", sheet: sheetName, label: `🌐 ${truncate(data.httpRequestUrl, 30)}`, value: data.httpRequestUrl });
        }
        if (isNotEmpty(data.httpRequestBody)) {
          entries.push({ key: `${id}.body`, type: "http_body", sheet: sheetName, label: "📦 Тело запроса", value: data.httpRequestBody });
        }
        if (isNotEmpty(data.httpRequestHeaders)) {
          entries.push({ key: `${id}.headers`, type: "http_headers", sheet: sheetName, label: "📋 Заголовки", value: data.httpRequestHeaders });
        }
      }

      // psql_query
      if (nodeType === "psql_query" && isNotEmpty(data.query)) {
        entries.push({ key: `${id}.sql`, type: "sql", sheet: sheetName, label: `🗄 ${truncate(data.query, 30)}`, value: data.query });
      }

      // command_trigger
      if (nodeType === "command_trigger" && isNotEmpty(data.description)) {
        entries.push({ key: `${id}.desc`, type: "command", sheet: sheetName, label: `📋 ${truncate(data.description, 30)}`, value: data.description });
      }

      // inputPrompt (collectUserInput)
      if (data.collectUserInput && isNotEmpty(data.inputPrompt)) {
        entries.push({ key: `${id}.prompt`, type: "prompt", sheet: sheetName, label: `❓ ${truncate(data.inputPrompt, 30)}`, value: data.inputPrompt });
      }
    }
  }

  return entries;
}


/**
 * Парсит ключ контента и возвращает информацию для обратной синхронизации
 * @param key - Ключ записи (например "msg-welcome.btn.btn1.url")
 * @param type - Тип записи (message, button, url и т.д.)
 * @returns Объект с nodeId, field, subId и subField для обновления ноды
 */
export function parseContentKey(key: string, type: string): ParsedContentKey {
  const parts = key.split(".");

  // Простой ключ без точек — это nodeId целиком для message
  if (parts.length === 1) {
    return { nodeId: key, field: "messageText" };
  }

  // Определяем nodeId — всё до первого известного суффикса
  const suffixIndex = findSuffixStart(parts);
  const nodeId = parts.slice(0, suffixIndex).join(".");
  const suffix = parts.slice(suffixIndex).join(".");

  if (suffix === "caption") {
    return { nodeId, field: "mediaCaption" };
  }

  if (suffix === "media") {
    return { nodeId, field: "media" };
  }

  if (suffix === "api") {
    return { nodeId, field: "httpRequestUrl" };
  }

  if (suffix === "body") {
    return { nodeId, field: "httpRequestBody" };
  }

  if (suffix === "headers") {
    return { nodeId, field: "httpRequestHeaders" };
  }

  if (suffix === "sql") {
    return { nodeId, field: "query" };
  }

  if (suffix === "desc") {
    return { nodeId, field: "description" };
  }

  if (suffix === "prompt") {
    return { nodeId, field: "inputPrompt" };
  }

  // btn.{btnId}[.url|.webapp]
  if (suffix.startsWith("btn.")) {
    const btnParts = suffix.split(".");
    const subId = btnParts[1];

    if (btnParts.length === 2) {
      return { nodeId, field: "buttons", subId, subField: "text" };
    }
    if (btnParts[2] === "url") {
      return { nodeId, field: "buttons", subId, subField: "url" };
    }
    if (btnParts[2] === "webapp") {
      return { nodeId, field: "buttons", subId, subField: "webAppUrl" };
    }
  }

  // Fallback
  return { nodeId: key, field: "messageText" };
}

/** Известные суффиксы-маркеры */
const KNOWN_SUFFIXES = ["caption", "btn", "media", "api", "body", "headers", "sql", "desc", "prompt"];

/**
 * Находит индекс начала суффикса в массиве частей ключа
 * @param parts - Части ключа разделённые точкой
 * @returns Индекс начала суффикса
 */
function findSuffixStart(parts: string[]): number {
  for (let i = 1; i < parts.length; i++) {
    if (KNOWN_SUFFIXES.includes(parts[i])) {
      return i;
    }
  }
  // Если суффикс не найден — последняя часть считается суффиксом
  return parts.length - 1;
}
