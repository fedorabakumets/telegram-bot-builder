/**
 * @fileoverview Параметры для генерации настройки ожидания ввода
 * Используется в generateInputWaitingSetup
 */

import type { Connection } from '../../node-navigation/utils/navigation-helpers';
import type { TransitionNode } from './transition-node';

/**
 * Тип ввода: "text", "photo", "video", "audio", "document"
 */
export type InputType = 'text' | 'photo' | 'video' | 'audio' | 'document';

/**
 * Параметры для генерации настройки ожидания ввода
 */
export interface InputWaitingSetupParams {
  /** Узел с данными ввода */
  node: TransitionNode & {
    data: {
      /** Подсказка ввода */
      inputPrompt?: string;
      /** Переменная для сохранения */
      inputVariable?: string;
      /** Тип ввода */
      inputType?: InputType;
      /** Включить ввод фото */
      enablePhotoInput?: boolean;
      /** Включить ввод видео */
      enableVideoInput?: boolean;
      /** Включить ввод аудио */
      enableAudioInput?: boolean;
      /** Включить ввод документов */
      enableDocumentInput?: boolean;
      /** Включить ввод текста */
      enableTextInput?: boolean;
      /** Собирать ввод пользователя */
      collectUserInput?: boolean;
      /** Минимальная длина */
      minLength?: number;
      /** Максимальная длина */
      maxLength?: number;
      /** Таймаут ввода (секунды) */
      inputTimeout?: number;
      /** Сохранять в базу данных */
      saveToDatabase?: boolean;
      /** Текст подсказки */
      placeholder?: string;
    };
  };
  /** Массив соединений */
  connections: Connection[];
  /** Отступ для форматирования */
  indent?: string;
}
