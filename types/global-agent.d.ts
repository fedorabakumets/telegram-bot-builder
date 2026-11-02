/** @fileoverview Тип используемой точки инициализации установленного прокси-агента Node. */
declare module 'global-agent' {
  /** Подключает прокси по переменным окружения до сетевых запросов приложения. */
  export function bootstrap(): void;
}
