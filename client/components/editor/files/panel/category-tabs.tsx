/**
 * @fileoverview Табы категорий файлов `CategoryTabs` по источнику:
 * «Все», «Входящие», «Исходящие», «Загруженные» (Req 5.1). Категории
 * «Из конструктора», «Файлы оператора», «Сертификаты» сознательно
 * исключены (Req 5.6). Использует shadcn/ui Tabs и смысловые иконки
 * lucide-react (без декоративных эмодзи, Req 13.2). Активная вкладка
 * подсвечивается через токен `primary` (см. CATEGORY_TAB_TRIGGER_CLASS),
 * счётчик автоматически меняет фон/текст по состоянию таба.
 * @module components/editor/files/panel/category-tabs
 */

import type { LucideIcon } from 'lucide-react';
import { Layers, Inbox, Send, Upload } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FileCategory } from '../hooks/project-files-query-params';
import {
  CATEGORY_TAB_COUNT_CLASS,
  CATEGORY_TAB_TRIGGER_CLASS,
  PANEL_SECTION_CLASS,
} from './panel-styles';

/** Пропсы табов категорий */
export interface CategoryTabsProps {
  /** Текущая категория */
  category: FileCategory;
  /** Смена категории */
  onCategoryChange: (category: FileCategory) => void;
  /** Счётчики по категориям (опционально) */
  counts?: Partial<Record<FileCategory, number>>;
}

/** Описание одного таба: код категории, подпись и смысловая иконка */
interface CategoryTabDef {
  /** Код категории-источника */
  value: FileCategory;
  /** Подпись таба */
  label: string;
  /** Смысловая иконка lucide-react */
  icon: LucideIcon;
}

/**
 * Порядок и состав табов (Req 5.1). Только реальные источники файлов;
 * виртуальные категории не добавляются (Req 5.6).
 */
const CATEGORY_TABS: readonly CategoryTabDef[] = [
  { value: 'all', label: 'Все', icon: Layers },
  { value: 'incoming', label: 'Входящие', icon: Inbox },
  { value: 'outgoing', label: 'Исходящие', icon: Send },
  { value: 'uploaded', label: 'Загруженные', icon: Upload },
];

/**
 * Табы категорий файлов по источнику.
 * @param props - Текущая категория, обработчик смены и опциональные счётчики
 * @returns JSX элемент с табами категорий
 */
export function CategoryTabs({ category, onCategoryChange, counts }: CategoryTabsProps) {
  return (
    <Tabs
      value={category}
      onValueChange={(value) => onCategoryChange(value as FileCategory)}
      className={PANEL_SECTION_CLASS}
      data-testid="category-tabs"
    >
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
        {CATEGORY_TABS.map(({ value, label, icon: Icon }) => {
          const count = counts?.[value];
          return (
            <TabsTrigger
              key={value}
              value={value}
              className={CATEGORY_TAB_TRIGGER_CLASS}
              data-testid={`category-tab-${value}`}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              {label}
              {count !== undefined && (
                <span
                  className={CATEGORY_TAB_COUNT_CLASS}
                  data-testid={`category-count-${value}`}
                >
                  {count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
