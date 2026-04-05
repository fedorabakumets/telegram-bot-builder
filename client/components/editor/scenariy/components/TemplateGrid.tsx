/**
 * @fileoverview Компонент сетки карточек сценариев
 * @module client/components/editor/scenariy/components/TemplateGrid
 */

import { Loader2 } from 'lucide-react';
import { TemplateCard } from './TemplateCard';
import { TemplateEmptyState } from './TemplateEmptyState';
import type { TemplateGridProps } from '../types/scenariy-tipy';

/**
 * Сетка карточек сценариев с состояниями загрузки и пустого списка
 * @param props - свойства компонента
 * @returns JSX элемент сетки
 */
export function TemplateGrid({ templates, isLoading, onUse, showDelete, onDelete }: TemplateGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (templates.length === 0) {
    return <TemplateEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
      {templates.map((template) => {
        if (!template || typeof template.id === 'undefined') return null;
        return (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={onUse}
            showDelete={showDelete}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
