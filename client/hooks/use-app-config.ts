/**
 * @fileoverview Хук загрузки публичной конфигурации с сервера
 *
 * Решает проблему недоступности VITE_* переменных при Docker-сборке на Railway:
 * вместо инлайна при билде — читаем конфиг с сервера в рантайме.
 *
 * @module hooks/use-app-config
 */

import { useQuery } from "@tanstack/react-query";

/** Публичная конфигурация приложения */
export interface AppConfig {
  /** Числовой Client ID для Telegram Login Widget */
  telegramClientId: number;
  /** Имя бота для Telegram Login Widget (без @) */
  telegramBotUsername: string;
}

/**
 * Загружает публичную конфигурацию с сервера
 *
 * @returns Объект с данными конфига, статусом загрузки и ошибкой
 */
export function useAppConfig() {
  return useQuery<AppConfig>({
    queryKey: ["app-config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Не удалось загрузить конфигурацию");
      return res.json();
    },
    /** Конфиг не меняется — кэшируем на всё время сессии */
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
