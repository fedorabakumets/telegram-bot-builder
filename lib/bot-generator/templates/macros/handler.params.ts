/**
 * @fileoverview Параметры для макроса обработчика узлов
 * @module templates/macros/handler.params
 */

/** Параметры для рендеринга обработчика узла */
export interface HandlerMacroParams {
  /** Объект узла с типом и данными */
  node: {
    /** ID узла */
    id: string;
    /** Тип узла: start, command, callback */
    type: 'start' | 'command' | 'callback';
    /** Данные узла */
    data?: {
      /** Текст сообщения */
      messageText?: string;
      /** Команда (для command типа) */
      command?: string;
      /** Кнопки */
      buttons?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
      /** Тип клавиатуры */
      keyboardType?: 'inline' | 'reply';
    };
  };
  /** Включить ли комментарии в коде */
  enableComments?: boolean;
}
