/**
 * @fileoverview Типы и интерфейсы для компонента терминала
 *
 * Содержит определения типов для строк терминала, свойств компонента
 * и методов, доступных через ref.
 *
 * @module terminalTypes
 */

/**
 * Тип для одной строки в терминале
 */
export interface TerminalLine {
  /** Уникальный идентификатор строки */
  id: string;
  /** Содержимое строки */
  content: string;
  /** Тип вывода */
  type: 'stdout' | 'stderr';
  /** Время добавления строки */
  timestamp: Date;
}

/**
 * Свойства компонента терминала
 */
export interface TerminalProps {
  /** Состояние видимости терминала */
  isVisible?: boolean;
  /** Функция для переключения видимости терминала */
  onToggleVisibility?: () => void;
  /** WebSocket-соединение для отправки логов на сервер */
  wsConnection?: WebSocket | null;
  /** Идентификатор проекта для отправки логов */
  projectId?: number;
  /** Идентификатор токена для отправки логов */
  tokenId?: number;
}

/**
 * Интерфейс для методов, доступных через ref
 */
export interface TerminalHandle {
  /** Добавить новую строку в терминал */
  addLine: (content: string, type?: 'stdout' | 'stderr', sendToServer?: boolean) => void;
  /** Добавить новую строку в терминал без отправки на сервер */
  addLineLocal: (content: string, type?: 'stdout' | 'stderr') => void;
  /** Отправить строку в серверный терминал */
  sendToServer: (content: string, type?: 'stdout' | 'stderr') => void;
}
