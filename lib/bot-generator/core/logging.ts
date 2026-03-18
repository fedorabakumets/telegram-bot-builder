/**
 * @fileoverview Логирование генератора ботов
 * Функции для отладки и анализа процесса генерации кода
 */

/**
 * Проверяет включено ли логирование отладки
 * @returns {boolean} Статус включения логирования
 */
export const isLoggingEnabled = (): boolean => {
  // Проверяем localStorage (только в браузере)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('botcraft-generator-logs') === 'true';
  }
  return false;
};

/**
 * Анализирует и логирует структуру узлов для отладки
 * @param {any[]} nodes - Массив узлов для анализа
 */
export const logFlowAnalysis = (nodes: any[]): void => {
  if (!isLoggingEnabled()) return;

  console.log(`🔍 ГЕНЕРАТОР НАЧАЛ РАБОТУ: узлов - ${nodes?.length || 0}`);

  if (nodes && nodes.length > 0) {
    console.log('📊 ГЕНЕРАТОР: Анализируем все узла:');
    nodes.forEach((node, index) => {
      console.log(`📊 ГЕНЕРАТОР: Узел ${index + 1}: "${node.id}" (тип: ${node.type})`);
      console.log(`📊 ГЕНЕРАТОР:   - allowMultipleSelection: ${node.data.allowMultipleSelection}`);
      console.log(`📊 ГЕНЕРАТОР:   - кнопок: ${node.data.buttons?.length || 0}`);
      console.log(`📊 ГЕНЕРАТОР:   - keyboardType: ${node.data.keyboardType || 'нет'}`);
      console.log(`📊 ГЕНЕРАТОР:   - continueButtonTarget: ${node.data.continueButtonTarget || 'нет'}`);

    });
  }
};
