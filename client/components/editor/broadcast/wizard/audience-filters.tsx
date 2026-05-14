/**
 * @fileoverview Фильтры аудитории по типу (теги, даты, активность)
 * @module client/components/editor/broadcast/wizard/audience-filters
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NewBroadcastFormData } from '../types';

/**
 * Пропсы компонента AudienceFilters
 */
interface AudienceFiltersProps {
  /** Тип аудитории */
  audienceType: string;
  /** Данные формы */
  formData: NewBroadcastFormData;
  /** Обновление данных формы */
  onChange: (data: Partial<NewBroadcastFormData>) => void;
  /** Текущее значение поля ввода тега */
  tagInput: string;
  /** Установка значения поля ввода тега */
  setTagInput: (value: string) => void;
  /** Обработчик добавления тега по Enter */
  onAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Обработчик удаления тега */
  onRemoveTag: (tag: string) => void;
}

/**
 * Отображает фильтры в зависимости от выбранного типа аудитории
 * @param props - Свойства компонента
 * @returns JSX элемент фильтров или null
 */
export function AudienceFilters({ audienceType, formData, onChange, tagInput, setTagInput, onAddTag, onRemoveTag }: AudienceFiltersProps) {
  if (audienceType === 'tags') {
    return (
      <div className="space-y-2 rounded-xl border p-3 bg-muted/20">
        <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={onAddTag} placeholder="Введите тег и нажмите Enter" />
        <div className="flex flex-wrap gap-1">
          {(formData.filters.tags ?? []).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs">
              {tag}
              <button onClick={() => onRemoveTag(tag)} className="hover:text-red-500 transition-colors">×</button>
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (audienceType === 'date') {
    return (
      <div className="grid grid-cols-2 gap-2 rounded-xl border p-3 bg-muted/20">
        <div>
          <Label className="text-xs">От</Label>
          <Input type="date" value={formData.filters.registeredFrom ?? ''} onChange={(e) => onChange({ filters: { ...formData.filters, registeredFrom: e.target.value } })} />
        </div>
        <div>
          <Label className="text-xs">До</Label>
          <Input type="date" value={formData.filters.registeredTo ?? ''} onChange={(e) => onChange({ filters: { ...formData.filters, registeredTo: e.target.value } })} />
        </div>
      </div>
    );
  }

  if (audienceType === 'activity') {
    return (
      <div className="grid grid-cols-2 gap-2 rounded-xl border p-3 bg-muted/20">
        <div>
          <Label className="text-xs">Активен от</Label>
          <Input type="date" value={formData.filters.activeFrom ?? ''} onChange={(e) => onChange({ filters: { ...formData.filters, activeFrom: e.target.value } })} />
        </div>
        <div>
          <Label className="text-xs">Активен до</Label>
          <Input type="date" value={formData.filters.activeTo ?? ''} onChange={(e) => onChange({ filters: { ...formData.filters, activeTo: e.target.value } })} />
        </div>
      </div>
    );
  }

  return null;
}
