/** @fileoverview Минимальный контракт Telegram Mini App для клиентской авторизации. */

/** Пользователь из неподтверждённых данных SDK; сервер проверяет подписанную строку initData. */
export interface TelegramMiniAppUser {
  /** Числовой идентификатор пользователя Telegram. */
  id: number;
  /** Имя пользователя Telegram. */
  first_name: string;
}

/** Используемая приложением часть API, загружаемого внешним скриптом Telegram. */
export interface TelegramMiniApp {
  /** Подписанные данные запуска для проверки сервером. */
  initData?: string;
  /** Непроверенные данные используются только для обнаружения запуска внутри Telegram. */
  initDataUnsafe?: {
    /** Пользователь может отсутствовать до завершения загрузки SDK. */
    user?: TelegramMiniAppUser;
  };
  /** Сообщить клиенту Telegram о готовности интерфейса. */
  ready?: () => void;
}

declare global {
  interface Window {
    /** Внешний SDK может отсутствовать в обычном браузере или загружаться позднее. */
    Telegram?: {
      /** API приложения становится доступным после загрузки SDK. */
      WebApp?: TelegramMiniApp;
    };
  }
}
