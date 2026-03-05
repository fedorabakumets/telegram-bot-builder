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
  telegramUser?: Partial<UserBotData>;
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
 * @returns Текст с замененными переменными
 */
export function replaceVariablesInText(params: ReplaceVariablesParams): string {
  const { text, userData = {}, telegramUser = {} } = params;

  if (!text) return text;

  // Создаём полный словарь переменных с приоритетом userData > telegramUser
  const variables: Record<string, string> = {
    user_id: String(telegramUser.id || ""),
    first_name: telegramUser.firstName || "",
    last_name: telegramUser.lastName || "",
    username: telegramUser.userName || "",
  };

  // Базовое имя: firstName из Telegram
  const firstName = telegramUser.firstName;
  const userName = telegramUser.userName;
  
  // Проверяем userData на наличие user_name (из БД)
  if (userData.user_name) {
    variables.user_name = extractVariableValue(userData.user_name);
  } else {
    // Fallback на firstName или username из Telegram
    variables.user_name = firstName || userName || `user_${telegramUser.id}`;
  }

  // Добавляем все переменные из userData
  for (const [key, value] of Object.entries(userData)) {
    if (!variables[key]) {
      variables[key] = extractVariableValue(value);
    }
  }

  // Заменяем все переменные в формате {variable_name}
  return text.replace(/\{(\w+)\}/g, (match, varName) => {
    const value = variables[varName];
    return value !== undefined && value !== "" ? value : match;
  });
}
