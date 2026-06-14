/**
 * @fileoverview Ряд вкладок-фильтров по типу переменных
 * @description Рендерит кнопки-вкладки [Все] + по одной на каждую непустую
 * группу переменных. Используется в шапке дропдауна выбора переменных поверх
 * сгруппированных сворачиваемых секций. Клики по вкладкам не закрывают
 * дропдаун (preventDefault + stopPropagation).
 * @module variable-list-tabs
 */

import { cn } from '@/utils/utils';

/** Идентификатор группы переменных */
export type GroupKey = 'custom' | 'system' | 'media' | 'tables';

/** Значение активной вкладки: «все» либо конкретная группа */
export type TabKey = 'all' | GroupKey;

/** Описание вкладки для отрисовки */
export interface TabDef {
  /** Ключ вкладки */
  key: TabKey;
  /** Короткая подпись с эмодзи */
  label: string;
}

/** Пропсы компонента VariableListTabs */
interface VariableListTabsProps {
  /** Список вкладок для отображения (уже без пустых групп) */
  tabs: TabDef[];
  /** Текущая активная вкладка */
  activeTab: TabKey;
  /** Обработчик смены активной вкладки */
  onChange: (tab: TabKey) => void;
}

/**
 * Ряд кнопок-вкладок фильтрации переменных по типу
 * @param props - Свойства компонента
 * @returns JSX элемент с вкладками (перенос в несколько рядов при нехватке места)
 */
export function VariableListTabs({ tabs, activeTab, onChange }: VariableListTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 px-1 pb-1.5" onMouseDown={(e) => e.stopPropagation()}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={(e) => {
              // Не даём дропдауну закрыться и не теряем фокус
              e.preventDefault();
              e.stopPropagation();
              onChange(tab.key);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              'h-6 px-2 rounded text-xs select-none border transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground border-transparent'
                : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
