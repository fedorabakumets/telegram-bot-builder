/**
 * @fileoverview Переиспользуемое содержимое дропдауна выбора переменных
 * @description Рендерит поле поиска (при большом числе переменных), ряд
 * вкладок-фильтров по типу и сгруппированный по типу список VariableMenuItem
 * со сворачиваемыми секциями. Вкладки сужают список до одной группы поверх
 * поиска. Вставляется внутрь любого DropdownMenuContent. Заголовок
 * ("📌 Доступные переменные") оставляется в местах вызова. Внутренний стейт
 * поиска и раскрытия секций сбрасывается автоматически, так как Radix
 * размонтирует содержимое дропдауна при закрытии.
 * @module variable-list-content
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { VariableMenuItem } from './variable-menu-item';
import { VariableListTabs, type GroupKey, type TabKey, type TabDef } from './variable-list-tabs';
import type { Variable } from '../types';

/** Порог, начиная с которого показывается поле поиска */
const SEARCH_THRESHOLD = 7;

/** Описание секции группы переменных */
interface GroupDef {
  /** Ключ группы */
  key: GroupKey;
  /** Заголовок секции с эмодзи */
  label: string;
  /** Короткая подпись для вкладки-фильтра */
  tabLabel: string;
}

/**
 * Определения групп в порядке отображения.
 * Пользовательские идут первыми — свои переменные нужнее.
 */
const GROUP_DEFS: GroupDef[] = [
  { key: 'custom', label: '✏️ Пользовательские', tabLabel: '✏️ Свои' },
  { key: 'system', label: '⚙️ Системные', tabLabel: '⚙️ Системные' },
  { key: 'media', label: '📎 Медиа', tabLabel: '📎 Медиа' },
  { key: 'tables', label: '📊 Таблицы', tabLabel: '📊 Таблицы' }
];

/**
 * Определяет группу, к которой относится переменная
 * @param variable - Переменная для классификации
 * @returns Ключ группы
 */
function classifyVariable(variable: Variable): GroupKey {
  // Сравниваем как строки: значения могут приходить шире типа NodeType
  const nodeType = variable.nodeType as string;
  if (variable.mediaType) return 'media';
  if (
    nodeType === 'bot_table' ||
    nodeType === 'table' ||
    variable.sourceTable === 'bot_tables'
  ) {
    return 'tables';
  }
  if (nodeType === 'system') return 'system';
  return 'custom';
}

/**
 * Группирует переменные по типу
 * @param variables - Список переменных
 * @returns Карта «ключ группы → переменные»
 */
function groupVariables(variables: Variable[]): Record<GroupKey, Variable[]> {
  const groups: Record<GroupKey, Variable[]> = {
    custom: [],
    system: [],
    media: [],
    tables: []
  };
  for (const variable of variables) {
    groups[classifyVariable(variable)].push(variable);
  }
  return groups;
}

/** Пропсы компонента VariableListContent */
interface VariableListContentProps {
  /** Доступные переменные */
  availableVariables: Variable[];
  /** Функция выбора переменной по имени */
  onSelect: (variableName: string) => void;
  /** Текст для состояния «нет переменных» */
  emptyText?: string;
}

/**
 * Содержимое дропдауна: поиск + сгруппированный список переменных
 * @param props - Пропсы компонента
 * @returns JSX элемент с поиском и сворачиваемыми секциями переменных
 */
export function VariableListContent({
  availableVariables,
  onSelect,
  emptyText = 'Нет переменных. Добавьте узел со сбором медиа-ввода.'
}: VariableListContentProps) {
  /** Текущий поисковый запрос по имени/описанию переменной */
  const [search, setSearch] = useState('');

  /** Свёрнутые секции (по умолчанию все развёрнуты, поэтому хранятся именно свёрнутые) */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  /** Активная вкладка-фильтр по типу переменных */
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  /** Показывать поле поиска только когда переменных много */
  const showSearch = availableVariables.length > SEARCH_THRESHOLD;

  /**
   * Группировка ВСЕХ переменных (без учёта поиска) — нужна для определения
   * непустых групп, чтобы набор вкладок не «прыгал» при вводе запроса.
   */
  const allGroups = groupVariables(availableVariables);

  /** Ключи групп, в которых есть хотя бы одна переменная */
  const nonEmptyGroupKeys = GROUP_DEFS.filter((g) => allGroups[g.key].length > 0).map((g) => g.key);

  /** Вкладки показываем только когда заполнено больше одной группы */
  const showTabs = nonEmptyGroupKeys.length > 1;

  /** Набор вкладок: «Все» + по одной на каждую непустую группу */
  const tabs: TabDef[] = [
    { key: 'all', label: 'Все' },
    ...GROUP_DEFS.filter((g) => nonEmptyGroupKeys.includes(g.key)).map((g) => ({
      key: g.key,
      label: g.tabLabel
    }))
  ];

  /** Отфильтрованный список переменных по подстроке в имени или описании */
  const query = search.trim().toLowerCase();
  const filteredVariables = query
    ? availableVariables.filter((variable) =>
        variable.name.toLowerCase().includes(query) ||
        (variable.description?.toLowerCase().includes(query) ?? false)
      )
    : availableVariables;

  /** Сгруппированные отфильтрованные (поиском) переменные */
  const groups = groupVariables(filteredVariables);

  /** Группы, видимые с учётом активной вкладки (вкладка сужает до одной группы) */
  const visibleGroupDefs =
    showTabs && activeTab !== 'all'
      ? GROUP_DEFS.filter((g) => g.key === activeTab)
      : GROUP_DEFS;

  /** Сколько переменных осталось после применения поиска и вкладки */
  const visibleCount = visibleGroupDefs.reduce((sum, g) => sum + groups[g.key].length, 0);

  /**
   * Переключает свёрнутость секции, не закрывая дропдаун
   * @param key - Ключ группы
   */
  const toggle = (key: GroupKey) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {showSearch && (
        <div className="relative px-1 pb-1.5" onClick={(e) => e.stopPropagation()}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Поиск переменной..."
            className="h-7 text-xs pl-7 pr-2 py-0"
          />
        </div>
      )}
      {showTabs && availableVariables.length > 0 && (
        <VariableListTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      )}
      {availableVariables.length === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground text-center">
          {emptyText}
        </div>
      ) : visibleCount === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground text-center">
          Ничего не найдено
        </div>
      ) : (
        visibleGroupDefs.map((group) => {
          const items = groups[group.key];
          // Пустые группы не показываем вообще
          if (items.length === 0) return null;

          // При активном поиске секции принудительно развёрнуты
          const isCollapsed = query ? false : Boolean(collapsed[group.key]);

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(group.key);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground select-none"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{`${group.label} (${items.length})`}</span>
              </button>
              {!isCollapsed &&
                items.map((variable, index) => (
                  <VariableMenuItem
                    key={`${variable.nodeId}-${variable.name}-${index}`}
                    variable={variable}
                    onSelect={onSelect}
                  />
                ))}
            </div>
          );
        })
      )}
    </>
  );
}
