/**
 * @fileoverview Параметры для шаблона обработчиков входящих медиафайлов
 * @module templates/media-input-handlers/media-input-handlers.params
 */

/** Конфигурация метаданных для одной input-ноды */
export interface MediaMetadataConfig {
  /** Тип медиа: photo, video, audio, document */
  mediaType: string;
  /** Имя базовой переменной (из которой формируются суффиксы) */
  baseVariable: string;
  /** Включённые суффиксы (если пуст — сохраняются все доступные) */
  enabledSuffixes: string[];
  /** Кастомные имена: ключ — суффикс, значение — имя переменной */
  customNames: Record<string, string>;
}

export interface MediaInputHandlersTemplateParams {
  /** Есть узлы с enablePhotoInput */
  hasPhotoInput: boolean;
  /** Есть узлы с enableVideoInput */
  hasVideoInput: boolean;
  /** Есть узлы с enableAudioInput */
  hasAudioInput: boolean;
  /** Есть узлы с enableDocumentInput */
  hasDocumentInput: boolean;
  /** Есть узлы с enableLocationInput */
  hasLocationInput: boolean;
  /** Есть узлы с enableContactInput */
  hasContactInput: boolean;
  /** Код навигации к следующему узлу (вставляется в if next_node_id) */
  navigationCode: string;
  /** Конфигурация сохранения метаданных для каждого типа медиа */
  mediaMetadataConfigs?: MediaMetadataConfig[];
}
