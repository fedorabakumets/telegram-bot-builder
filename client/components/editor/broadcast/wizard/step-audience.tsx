/**
 * @fileoverview Шаг 1 wizard: выбор аудитории рассылки
 * @module client/components/editor/broadcast/wizard/step-audience
 */

import { useState } from 'react';
import { Users, Calendar, Activity, UserCheck, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/utils/utils';
import { useAudiencePreview } from '../hooks/use-audience-preview';
import { ManualUserSelect } from './manual-user-select';
import { GroupSelect } from './group-select';
import { AudienceFilters } from './audience-filters';
import type { NewBroadcastFormData } from '../types';

/**
 * Пропсы компонента StepAudience
 */
interface StepAudienceProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена бота */
  tokenId?: number | null;
  /** Текущие данные формы */
  formData: NewBroadcastFormData;
  /** Обновление данных формы */
  onChange: (data: Partial<NewBroadcastFormData>) => void;
  /** Переход к следующему шагу */
  onNext: () => void;
  /** Отмена wizard */
  onCancel: () => void;
}

/** Варианты аудитории с иконками */
const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Все пользователи', icon: Users },
  { value: 'date', label: 'По дате регистрации', icon: Calendar },
  { value: 'activity', label: 'По активности', icon: Activity },
  { value: 'manual', label: 'Выбрать вручную', icon: UserCheck },
] as const;

/**
 * Шаг выбора аудитории рассылки с предпросмотром количества получателей
 * @param props - Свойства компонента
 * @returns JSX элемент шага выбора аудитории
 */
export function StepAudience({ projectId, tokenId, formData, onChange, onNext, onCancel }: StepAudienceProps) {
  const [tagInput, setTagInput] = useState('');
  const audienceType = formData.filters.audienceType;

  const apiFilters = audienceType === 'tags' ? { tags: formData.filters.tags } :
    audienceType === 'date' ? { registeredFrom: formData.filters.registeredFrom, registeredTo: formData.filters.registeredTo } :
    audienceType === 'activity' ? { activeFrom: formData.filters.activeFrom, activeTo: formData.filters.activeTo } : {};

  const { count, isLoading } = useAudiencePreview(projectId, apiFilters);

  /** Количество получателей: для ручного выбора — длина массива userIds */
  const recipientCount = audienceType === 'manual'
    ? (formData.filters.userIds?.length ?? 0)
    : count;

  /** Обработчик добавления тега */
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const tags = [...(formData.filters.tags ?? []), tagInput.trim()];
      onChange({ filters: { ...formData.filters, tags } });
      setTagInput('');
    }
  };

  /** Обработчик удаления тега */
  const handleRemoveTag = (tag: string) => {
    const tags = (formData.filters.tags ?? []).filter((t) => t !== tag);
    onChange({ filters: { ...formData.filters, tags } });
  };

  /** Обработчик изменения выбранных userId */
  const handleUserIdsChange = (userIds: string[]) => {
    onChange({ filters: { ...formData.filters, userIds } });
  };

  /** Обработчик изменения выбранных групп */
  const handleGroupIdsChange = (groupIds: string[]) => {
    onChange({ filters: { ...formData.filters, groupIds } });
  };

  return (
    <div className="space-y-4">
      {/* Название рассылки */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-blue-500" />
          Название рассылки
        </Label>
        <Input
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Например: Акция ноябрь"
        />
      </div>

      {/* Выбор аудитории */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-500" />
          Аудитория
        </Label>
        <RadioGroup
          value={audienceType}
          onValueChange={(v) => onChange({ filters: { ...formData.filters, audienceType: v as NewBroadcastFormData['filters']['audienceType'] } })}
          className="grid grid-cols-2 gap-2"
        >
          {AUDIENCE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              htmlFor={`aud-${value}`}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-all',
                'hover:bg-accent/60 hover:shadow-sm',
                audienceType === value && 'border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-violet-500/10 shadow-sm',
              )}
            >
              <RadioGroupItem value={value} id={`aud-${value}`} className="sr-only" />
              <Icon className={cn('w-4 h-4 shrink-0', audienceType === value ? 'text-blue-500' : 'text-muted-foreground')} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Фильтры по типу аудитории */}
      <AudienceFilters
        audienceType={audienceType}
        formData={formData}
        onChange={onChange}
        tagInput={tagInput}
        setTagInput={setTagInput}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      {audienceType === 'manual' && (
        <ManualUserSelect
          projectId={projectId}
          tokenId={tokenId}
          selectedUserIds={formData.filters.userIds ?? []}
          onChangeUserIds={handleUserIdsChange}
        />
      )}

      {/* Секция групп */}
      <div className="rounded-xl border border-violet-200/50 dark:border-violet-800/40 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 p-3 space-y-2">
        <Label className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-violet-500" />
          Также отправить в группы
        </Label>
        <GroupSelect
          projectId={projectId}
          selectedGroupIds={formData.filters.groupIds ?? []}
          onChangeGroupIds={handleGroupIdsChange}
        />
      </div>

      {/* Счётчик получателей */}
      <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-200/40 dark:border-blue-800/40 p-3">
        <Users className="w-5 h-5 text-blue-500" />
        <span className="text-sm text-muted-foreground">Получателей:</span>
        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          {audienceType === 'manual' ? recipientCount.toLocaleString('ru-RU') : (isLoading ? '...' : count.toLocaleString('ru-RU'))}
        </span>
      </div>

      {/* Кнопки навигации */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button
          onClick={onNext}
          disabled={!formData.name.trim()}
          className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600"
        >
          Далее →
        </Button>
      </div>
    </div>
  );
}
