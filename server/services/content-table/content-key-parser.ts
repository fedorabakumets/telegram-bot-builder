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

    // Строим индекс: keyboardNodeId → messageNodeId
    const keyboardToMessage = new Map<string, string>();
    for (const node of nodes) {
      if (node.data?.keyboardNodeId) {
        keyboardToMessage.set(node.data.keyboardNodeId, node.id);
      }
    }

    for (const node of nodes) {
      const id = node.id as string;
      const data = node.data || {};
      const nodeType = node.type as string;

      // Для keyboard-нод используем ID связанной message-ноды
      const contentId = nodeType === "keyboard" ? (keyboardToMessage.get(id) || id) : id;

      // messageText
      if (isNotEmpty(data.messageText)) {
        entries.push({ key: contentId, type: "message", sheet: sheetName, value: data.messageText });
      }

      // mediaCaption
      if (isNotEmpty(data.mediaCaption)) {
        entries.push({ key: `${contentId}.caption`, type: "caption", sheet: sheetName, value: data.mediaCaption });
      }

      // buttons
      const buttons: any[] = data.buttons || [];
      for (const btn of buttons) {
        const btnId = btn.id as string;
        if (isNotEmpty(btn.text)) {
          entries.push({ key: `${contentId}.btn.${btnId}`, type: "button", sheet: sheetName, value: btn.text });
        }
        if (isNotEmpty(btn.url)) {
          entries.push({ key: `${contentId}.btn.${btnId}.url`, type: "url", sheet: sheetName, value: btn.url });
        }
        if (isNotEmpty(btn.webAppUrl)) {
          entries.push({ key: `${contentId}.btn.${btnId}.webapp`, type: "url", sheet: sheetName, value: btn.webAppUrl });
        }
      }

      // media URLs
      if (isNotEmpty(data.imageUrl)) {
        entries.push({ key: `${contentId}.media`, type: "media_url", sheet: sheetName, value: data.imageUrl });
      } else if (isNotEmpty(data.videoUrl)) {
        entries.push({ key: `${contentId}.media`, type: "media_url", sheet: sheetName, value: data.videoUrl });
      } else if (isNotEmpty(data.audioUrl)) {
        entries.push({ key: `${contentId}.media`, type: "media_url", sheet: sheetName, value: data.audioUrl });
      } else if (isNotEmpty(data.documentUrl)) {
        entries.push({ key: `${contentId}.media`, type: "media_url", sheet: sheetName, value: data.documentUrl });
      }

      // http_request
      if (nodeType === "http_request") {
        if (isNotEmpty(data.httpRequestUrl)) {
          entries.push({ key: `${contentId}.api`, type: "api_url", sheet: sheetName, value: data.httpRequestUrl });
        }
        if (isNotEmpty(data.httpRequestBody)) {
          entries.push({ key: `${contentId}.body`, type: "http_body", sheet: sheetName, value: data.httpRequestBody });
        }
        if (isNotEmpty(data.httpRequestHeaders)) {
          entries.push({ key: `${contentId}.headers`, type: "http_headers", sheet: sheetName, value: data.httpRequestHeaders });
        }
      }

      // psql_query
      if (nodeType === "psql_query" && isNotEmpty(data.query)) {
        entries.push({ key: `${contentId}.sql`, type: "sql", sheet: sheetName, value: data.query });
      }

      // command_trigger
      if (nodeType === "command_trigger" && isNotEmpty(data.description)) {
        entries.push({ key: `${contentId}.desc`, type: "command", sheet: sheetName, value: data.description });
      }

      // inputPrompt (collectUserInput)
      if (data.collectUserInput && isNotEmpty(data.inputPrompt)) {
        entries.push({ key: `${contentId}.prompt`, type: "prompt", sheet: sheetName, value: data.inputPrompt });
      }

      // userbotEntity (для userbot_message)
      if (nodeType === 'userbot_message' && isNotEmpty(data.userbotEntity)) {
        entries.push({ key: `${contentId}.entity`, type: "entity", sheet: sheetName, value: data.userbotEntity });
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

  if (suffix === "entity") {
    return { nodeId, field: "userbotEntity" };
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
const KNOWN_SUFFIXES = ["caption", "btn", "media", "api", "body", "headers", "sql", "desc", "prompt", "entity"];

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
