/**
 * @fileoverview Компонент списка подсказок пустого состояния
 * 
 * Отображает три подсказки для пользователя.
 */

import { EmptyStateTip } from './empty-state-tip';

/**
 * Компонент списка подсказок пустого состояния
 * 
 * @returns {JSX.Element} Список подсказок
 */
export function EmptyStateTips() {
  return (
    <div className="space-y-3">
      <EmptyStateTip icon="lightbulb" text="Перетащите компоненты из левой панели" />
      <EmptyStateTip icon="hand-pointer" text="Кликните по элементу для настройки" />
      <EmptyStateTip icon="sliders-h" text="Свойства элемента появятся здесь" />
    </div>
  );
}
