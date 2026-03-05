/**
 * @fileoverview Утилита замены переменных в тексте
 * 
 * Заменяет переменные формата {variable_name} на значения
 * из данных пользователя и Telegram.
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
 * Заменяет переменные в тексте на значения
 * 
 * @param params - Параметры замены
 * @returns Текст с замененными переменными
 */
export function replaceVariablesInText(params: ReplaceVariablesParams): string {
  const { text, userData = {}, telegramUser = {} } = params;
  
  if (!text) return text;

  // Создаём полный словарь переменных
  const variables: Record<string, string> = {
    user_name: telegramUser.firstName || telegramUser.userName || `user_${telegramUser.id}`,
    user_id: String(telegramUser.id || ""),
    first_name: telegramUser.firstName || "",
    last_name: telegramUser.lastName || "",
    username: telegramUser.userName || "",
    ...userData as Record<string, string>,
  };

  // Заменяем все переменные в формате {variable_name}
  return text.replace(/\{(\w+)\}/g, (match, varName) => {
    const value = variables[varName];
    return value !== undefined ? String(value) : match;
  });
}
