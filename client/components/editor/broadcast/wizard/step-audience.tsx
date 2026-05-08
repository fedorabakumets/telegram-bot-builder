/**
 * @fileoverview Шаг 1 wizard: выбор аудитории рассылки
 * @module client/components/editor/broadcast/wizard/step-audience
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAudiencePreview } from '../hooks/use-audience-preview';
import type { NewBroadcastFormData } from '../types';

/**
 * Пропсы компонента StepAudience
 */
interface StepAudienceProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Текущие данные формы */
  formData: NewBroadcastFormData;
  /** Обновление данных формы */
  onChange: (data: Partial<NewBroadcastFormData>) => void;
  /** Переход к следующему шагу */
  onNext: () => void;
  /** Отмена wizard */
  onCancel: () => void;
}

/**
 * Шаг выбора аудитории рассылки с предпросмотром количества получателей
 * @param props - Свойства компонента
 * @returns JSX элемент шага выбора аудитории
 */
export function StepAudience({ projectId, formData, onChange, onNext, onCancel }: StepAudienceProps) {
  const [tagInput, setTagInput] = useState('');
  const audienceType = formData.filters.audienceType;

  const apiFilters = audienceType === 'tags' ? { tags: formData.filters.tags } :
    audienceType === 'date' ? { registeredFrom: formData.filters.registeredFrom, registeredTo: formData.filters.registeredTo } :
    audienceType === 'activity' ? { activeFrom: formData.filters.activeFrom, activeTo: formData.filters.activeTo } : {};

  const { count, isLoading } = useAudiencePreview(projectId, apiFilters);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const tags = [...(formData.filters.tags ?? []), tagInput.trim()];
      onChange({ filters: { ...formData.filters, tags } });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const tags = (formData.filters.tags ?? []).filter((t) => t !== tag);
    onChange({ filters: { ...formData.filters, tags } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Название рассылки</Label>
        <Input
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Например: Акция ноябрь"
        />
      </div>

      <div className="space-y-2">
        <Label>Аудитория</Label>
        <RadioGroup
          value={audienceType}
          onValueChange={(v) => onChange({ filters: { ...formData.filters, audienceType: v as NewBroadcastFormData['filters']['audienceType'] } })}
        >
          {[
            { value: 'all', label: 'Все пользователи' },
            { value: 'tags', label: 'По тегам' },
            { value: 'date', label: 'По дате регистрации' },
            { value: 'activity', label: 'По активности' },
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`aud-${value}`} />
              <Label htmlFor={`aud-${value}`} className="cursor-pointer">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {audienceType === 'tags' && (
        <div className="space-y-2">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Введите тег и нажмите Enter" />
          <div className="flex flex-wrap gap-1">
            {(formData.filters.tags ?? []).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                {tag}<button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {audienceType === 'date' && (
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">От</Label><Input type="date" value={formData.filters.registeredFrom ?? ''} onChange={(e) => onChange({ filters: { ...formData.filters, registeredFrom: e.target.value } })} /></div>
          <div><Label className="text-xs">До</Label><Input type="date" value={formData.filters.registeredTo ?? ''} onChange={(e) => onChange({ filters: { ...formData.filters, registeredTo: e.target.value } })} /></div>
        </div>
      )}

      {audienceType === 'activity' && (
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Активен от</Label><Input type="date" value={formData.filters.activeFrom ?? ''} onChange={(e) => onChange({ filters: { ...formData.filters, activeFrom: e.target.value } })} /></div>
          <div><Label className="text-xs">Активен до</Label><Input type="date" value={formData.filters.activeTo ?? ''} onChange={(e) => onChange({ filters: { ...formData.filters, activeTo: e.target.value } })} /></div>
        </div>
      )}

      <div className="text-sm text-muted-foreground border rounded p-2 bg-muted/30">
        👥 Получателей: <strong>{isLoading ? '...' : count.toLocaleString('ru-RU')}</strong>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onCancel}>Отмена</Button>
        <Button onClick={onNext} disabled={!formData.name.trim()}>Далее →</Button>
      </div>
    </div>
  );
}
