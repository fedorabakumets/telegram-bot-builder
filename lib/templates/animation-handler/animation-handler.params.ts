/**
 * @fileoverview Параметры шаблона animation-handler
 * @module templates/animation-handler/animation-handler.params
 */

/** Параметры для генерации шага отправки анимации */
export interface AnimationHandlerTemplateParams {
  /** URL анимации (GIF) или путь /uploads/ */
  animationUrl?: string;
  /** ID узла */
  nodeId?: string;
  /** Уровень отступа (совместимость вызовов, шаблон его не использует) */
  indentLevel?: string;
  /** Флаг: animationUrl является локальным путём /uploads/ */
  isLocalAnimationUrl?: boolean;
  /** Подпись к GIF. У sendAnimation она есть */
  mediaCaption?: string;
  /** ID следующего узла автоперехода */
  autoTransitionTo?: string;
}
