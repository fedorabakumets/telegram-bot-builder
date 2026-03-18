/**
 * @fileoverview Параметры для шаблона обработчиков входящих медиафайлов
 * @module templates/media-input-handlers/media-input-handlers.params
 */

export interface MediaInputHandlersTemplateParams {
  /** Есть узлы с enablePhotoInput */
  hasPhotoInput: boolean;
  /** Есть узлы с enableVideoInput */
  hasVideoInput: boolean;
  /** Есть узлы с enableAudioInput */
  hasAudioInput: boolean;
  /** Есть узлы с enableDocumentInput */
  hasDocumentInput: boolean;
  /** Код навигации к следующему узлу (вставляется в if next_node_id) */
  navigationCode: string;
}
