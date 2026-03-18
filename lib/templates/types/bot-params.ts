/**
 * @fileoverview Параметры для главного шаблона бота (bot.py.jinja2)
 * @module templates/types/bot-params
 */

/** Узел бота для генерации обработчиков */
export interface BotTemplateNode {
  /** Имя узла */
  name: string;
  /** Команда узла */
  command?: string;
  /** Тип узла */
  type?: string;
}

/** Параметры для генерации полного кода бота */
export interface BotTemplateParams {
  /** Имя бота */
  botName: string;
  /** Массив узлов бота */
  nodes: BotTemplateNode[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** ID проекта для сохранения в базу данных */
  projectId: number | null;
  /** Включить ли комментарии в коде */
  enableComments: boolean;
  /** Включить ли логирование */
  enableLogging: boolean;
  /** Команды для BotFather */
  botFatherCommands?: string;
  /** Есть ли inline кнопки */
  hasInlineButtons: boolean;
  /** Есть ли автопереходы */
  hasAutoTransitions: boolean;
  /** Есть ли узлы с медиа */
  hasMediaNodes: boolean;
  /** Есть ли ссылки на /uploads/ */
  hasUploadImages: boolean;
}
