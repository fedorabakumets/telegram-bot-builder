/**
 * @fileoverview Определение компонента текстового триггера
 *
 * Узел text_trigger срабатывает когда пользователь отправляет
 * текстовое сообщение, совпадающее с одним из заданных текстов.
 * В отличие от command_trigger не требует слеша перед текстом.
 * @module components/editor/sidebar/massive/triggers/text-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/** Текстовый триггер — точка входа по тексту сообщения */
export const textTrigger: ComponentDefinition = {
  id: 'text-trigger',
  name: 'Текстовый триггер',
  description: 'Срабатывает когда пользователь отправляет заданный текст',
  icon: 'fas fa-comment-dots',
  color: 'bg-blue-100 text-blue-600',
  type: 'text_trigger',
  defaultData: {
    /** Список текстов для совпадения */
    textSynonyms: ['привет'],
    /** Режим совпадения: точное или содержит */
    textMatchType: 'exact',
  }
};
