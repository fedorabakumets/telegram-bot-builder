/**
 * @fileoverview Вспомогательные функции для макетов
 * @description Утилиты для работы с элементами конфигурации
 */

import { SimpleLayoutConfig } from '../../simple-layout-customizer';

/**
 * Фильтрует видимые элементы конфигурации
 * @param config - Конфигурация макета
 * @param hideOnMobile - Скрывать на мобильных
 * @param isMobile - Мобильное устройство
 * @returns Массив видимых элементов
 */
export function getVisibleElements(
  config: SimpleLayoutConfig,
  hideOnMobile: boolean,
  isMobile: boolean
) {
  return config.elements.filter(el => {
    if (!el.visible) return false;
    if (hideOnMobile && isMobile && (el.type === 'sidebar' || el.type === 'properties')) {
      return false;
    }
    return true;
  });
}

/**
 * Определяет элементы по позициям
 * @param elements - Массив элементов
 * @returns Объект с элементами по позициям
 */
export function getElementsByPosition(elements: SimpleLayoutConfig['elements']) {
  return {
    topEl: elements.find(el => el.position === 'top'),
    bottomEl: elements.find(el => el.position === 'bottom'),
    leftEl: elements.find(el => el.position === 'left'),
    rightElements: elements.filter(el => el.position === 'right' && el.visible),
    centerEl: elements.find(el => el.position === 'center'),
  };
}

/**
 * Вычисляет общий размер правых элементов
 * @param rightElements - Массив правых элементов
 * @returns Суммарный размер
 */
export function calculateTotalRightSize(rightElements: SimpleLayoutConfig['elements']) {
  return rightElements.reduce((sum, el) => sum + el.size, 0);
}

/**
 * Проверяет, является ли макет вкладкой пользователей
 * @param leftEl - Левый элемент
 * @param rightElements - Правые элементы
 * @returns Флаг вкладки пользователей
 */
export function isUsersTabLayout(
  leftEl: SimpleLayoutConfig['elements'][0] | undefined,
  rightElements: SimpleLayoutConfig['elements']
) {
  const hasDialog = rightElements.some(el => el.type === 'dialog');
  const hasUserDetails = leftEl?.type === 'userDetails';
  return hasDialog || hasUserDetails;
}
