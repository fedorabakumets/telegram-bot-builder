/**
 * @fileoverview Результат проверки наличия сбора ввода
 * Используется для оптимизированной проверки узлов в одном проходе
 */

/**
 * Результат проверки наличия сбора пользовательского ввода
 */
export interface InputCollectionCheckResult {
  /** Есть ли узлы с collectUserInput */
  hasCollectInput: boolean;
  /** Есть ли узлы с enableTextInput */
  hasTextInput: boolean;
  /** Есть ли узлы с enablePhotoInput */
  hasPhotoInput: boolean;
  /** Есть ли узлы с enableVideoInput */
  hasVideoInput: boolean;
  /** Есть ли узлы с enableAudioInput */
  hasAudioInput: boolean;
  /** Есть ли узлы с enableDocumentInput */
  hasDocumentInput: boolean;
  /** Есть ли условные сообщения с waitForTextInput */
  hasConditionalInput: boolean;
  /** Есть ли узлы с множественным выбором */
  hasMultiSelect: boolean;
  /** Общий результат: есть ли хоть один тип ввода */
  hasAnyInput: boolean;
}
