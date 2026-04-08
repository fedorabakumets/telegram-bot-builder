/**
 * @fileoverview Утилита замены переменных в тексте
 *
 * Заменяет переменные формата {variable_name} на значения
 * из данных пользователя и Telegram.
 * Поддерживает формат хранения {value: "..."} как в Python-боте.
 */

import { UserBotData } from "@shared/schema";

/**
 * Параметры для замены переменных
 */
export interface ReplaceVariablesParams {
  /** Текст с переменными для замены */
  text: string;
  /** Данные пользователя из БД */
  userData?: Record<string, unknown>;
  /** Данные Telegram пользователя */
  telegramUser?: Partial<UserBotData> & { user_name_from_db?: string };
}

/**
 * Извлекает значение из переменной (поддерживает формат {value: "..."} и прямое значение)
 */
function extractVariableValue(varData: unknown): string {
  if (varData === null || varData === undefined) return "";
  
  // Если это объект с value (формат из БД)
  if (typeof varData === "object" && varData !== null && "value" in varData) {
    const value = (varData as { value?: unknown }).value;
    return value !== null && value !== undefined ? String(value) : "";
  }
  
  // Прямое значение
  return String(varData);
}

/**
 * Заменяет переменные в тексте на значения
 *
 * @param params - Параметры замены
 * @param params.projectId - ID проекта (для получения данных бота)
 * @returns Текст с замененными переменными
 */
export async function replaceVariablesInText(
  params: ReplaceVariablesParams & { projectId?: number }
): Promise<string> {
  const { text, userData = {}, telegramUser = {}, projectId } = params;

  if (!text) return text;

  // Создаём полный словарь переменных с приоритетом userData > telegramUser
  const variables: Record<string, string> = {
    user_id: String(telegramUser.id || ""),
    chat_id: String(telegramUser.id || ""), // chat_id = user_id для личных сообщений
    first_name: telegramUser.firstName || "",
    last_name: telegramUser.lastName || "",
    username: telegramUser.userName || "",
  };

  // Базовое имя: приоритет user_name из БД (из вопросов/форм) > firstName из Telegram > username из Telegram
  const firstName = telegramUser.firstName;
  const userName = telegramUser.userName;
  const userNameFromDb = (telegramUser as Partial<UserBotData> & { user_name_from_db?: string }).user_name_from_db;
  
  // Определяем user_name с приоритетом
  if (userNameFromDb) {
    variables.user_name = userNameFromDb;
  } else if (userData.user_name) {
    variables.user_name = extractVariableValue(userData.user_name);
  } else {
    variables.user_name = firstName || userName || `user_${telegramUser.id}`;
  }

  // Добавляем все переменные из userData (пользовательские переменные)
  for (const [key, value] of Object.entries(userData)) {
    if (!variables[key]) {
      variables[key] = extractVariableValue(value);
    }
  }

  // Получаем имя бота из проекта (если есть projectId)
  if (projectId) {
    const { storage } = await import("../../../../storages/storage");
    const botToken = await storage.getDefaultBotToken(projectId);
    if (botToken) {
      try {
        // Получаем информацию о боте
        const response = await fetch(
          `https://api.telegram.org/bot${botToken.token}/getMe`
        );
        const result = await response.json();
        if (result.ok) {
          variables.bot_name = result.result.username || result.result.first_name || "Бот";
        }
      } catch (e) {
        console.warn("Не удалось получить имя бота:", e);
        variables.bot_name = "Бот";
      }
    } else {
      variables.bot_name = "Бот";
    }
  } else {
    variables.bot_name = "Бот";
  }

  // Переменные для рассылок (заглушки, так как это админская отправка)
  variables.user_ids = [];
  variables.user_ids_count = "0";

  // Заменяем все переменные в формате {variable_name} и {variable.path.nested}
  return text.replace(/\{([\w.]+)\}/g, (match, varPath) => {
    // Поддержка вложенных путей через точку (например validate_response.result.first_name)
    if (varPath.includes('.')) {
      const parts = varPath.split('.');
      const rootKey = parts[0];
      const rootVal = variables[rootKey];
      if (rootVal === undefined) return match;
      try {
        // Пробуем распарсить как JSON если это строка
        let obj: unknown = typeof rootVal === 'string' ? JSON.parse(rootVal) : rootVal;
        for (let i = 1; i < parts.length; i++) {
          if (obj === null || typeof obj !== 'object') return match;
          obj = (obj as Record<string, unknown>)[parts[i]];
        }
        return obj !== undefined && obj !== null ? String(obj) : match;
      } catch {
        return match;
      }
    }
    const value = variables[varPath];
    return value !== undefined && value !== "" ? value : match;
  });
}
