/**
 * @fileoverview Типы для узлов бота
 * Определяет базовую структуру узла графа бота
 */

import { Button } from './button-types';

/** Узел бота в графе */
export interface BotNode {
  /** Тип узла */
  type: string;
  /** Данные узла */
  data: {
    /** Кнопки узла */
    buttons?: Button[];
    /** Дополнительные поля */
    [key: string]: any;
  };
  /** Дополнительные поля узла */
  [key: string]: any;
}
