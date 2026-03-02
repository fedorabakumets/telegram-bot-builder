/**
 * @fileoverview Утилита добавления кнопки завершения
 *
 * Автоматически добавляет кнопку "Готово" с действием завершения
 * при включении множественного выбора на узле.
 */

import type { Button } from '@shared/schema';

/**
 * Создаёт новую кнопку завершения
 *
 * @returns {Button} Новый объект кнопки завершения
 */
function createCompleteButton(): Button {
  return {
    id: Date.now().toString(),
    text: 'Готово',
    action: 'complete' as const,
    target: '',
    buttonType: 'complete' as const,
    skipDataCollection: false,
    hideAfterClick: false
  };
}

/**
 * Добавляет кнопку завершения к узлу при включении множественного выбора
 *
 * @param {any} nodeData - Данные узла для обновления
 * @param {(nodeId: string, updates: Partial<any>) => void} onNodeUpdate - Функция обновления узла
 * @param {string} nodeId - ID узла
 */
export function addCompleteButtonOnMultiSelect(
  nodeData: any,
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void,
  nodeId: string
): void {
  const hasCompleteButton = (nodeData.buttons || []).some(
    (btn: Button) => btn.action === 'complete'
  );

  if (nodeData.allowMultipleSelection && !hasCompleteButton) {
    const completeButton = createCompleteButton();
    const currentButtons = nodeData.buttons || [];
    const updatedButtons = [...currentButtons, completeButton];
    onNodeUpdate(nodeId, { buttons: updatedButtons });
  }
}
