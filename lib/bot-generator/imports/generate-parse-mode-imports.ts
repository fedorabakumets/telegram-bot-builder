/**
 * @fileoverview Генерация импортов для режима парсинга
 * Функции для генерации импортов ParseMode (HTML/Markdown)
 */

/** Параметры для генерации импортов */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: any[];
}

/**
 * Генерирует импорты для режима парсинга (HTML/Markdown)
 * @param options - Параметры генерации
 * @returns {string} Python код импортов
 */
export const generateParseModeImports = (options: ImportGeneratorOptions): string => {
  const { nodes } = options;

  const hasNodesRequiringParseMode = nodes.some((node) => {
    const data = node.data || {};
    
    // Узлы с явным formatMode
    if (
      data.formatMode &&
      (data.formatMode.toLowerCase() === 'html' ||
        data.formatMode.toLowerCase() === 'markdown')
    ) {
      return true;
    }
    
    // Узлы с markdown флагом
    if (data.markdown === true) {
      return true;
    }
    
    // Узлы с кнопками и форматированием
    if (
      data.buttons &&
      data.buttons.length > 0 &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown === true)
    ) {
      return true;
    }
    
    // Узлы с медиа и caption
    if (
      (data.imageUrl ||
        data.videoUrl ||
        data.audioUrl ||
        data.documentUrl) &&
      data.mediaCaption
    ) {
      return true;
    }
    
    // Узлы с сбором ввода и форматированием
    if (
      data.collectUserInput === true &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown === true)
    ) {
      return true;
    }
    
    // Узлы с условными сообщениями и форматированием
    if (
      data.enableConditionalMessages === true &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown === true)
    ) {
      return true;
    }
    
    return false;
  });

  if (!hasNodesRequiringParseMode) {
    return '';
  }

  return 'from aiogram.enums import ParseMode\n';
};
