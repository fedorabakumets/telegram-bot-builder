/**
 * @fileoverview Шаг 1 wizard: выбор аудитории рассылки
 * @module client/components/editor/broadcast/wizard/step-audience
 */

import { useCallback, useState } from 'react';
import { Users, Calendar, Activity, UserCheck, Tag, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/utils/utils';
import { isRetryAudienceReady } from '../utils/validate-retry-audience';
import { useAudiencePreview } from '../hooks/use-audience-preview';
import { useFrozenBots } from '../hooks/use-frozen-bots';
import { useDefaultTokenIds } from '../hooks/use-default-token-ids';
import { ManualUserSelect } from './manual-user-select';
import { AudienceFilters } from './audience-filters';
import { AudienceContextHint } from './audience-context-hint';
import { AudienceOverlapWarning } from './audience-overlap-warning';
import { BotTokenMultiSelect } from './bot-token-multi-select';
import { BroadcastGroupsByBots } from './broadcast-groups-by-bots';
import { RetryAudienceSelect } from './retry-audience-select';
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
  { value: 'retry', label: 'Повторить после ошибки', icon: RotateCcw },
] as const;

/**
 * Шаг выбора аудитории рассылки с предпросмотром количества получателей
 * @param props - Свойства компонента
 * @returns JSX элемент шага выбора аудитории
 */
export function StepAudience({ projectId, tokenId, formData, onChange, onNext, onCancel }: StepAudienceProps) {
  const [tagInput, setTagInput] = useState('');
  const audienceType = formData.filters.audienceType;
  const tokenIds = formData.tokenIds ?? [];
  /** Замороженные боты исключаются из выбора и отправки. */
  const statuses = useFrozenBots(projectId);
  const frozenTokenIds = (statuses.data?.statuses ?? []).filter((item) => item.frozen).map((item) => item.tokenId);

  /**
   * Обработчик изменения выбранных ботов.
   * Сбрасывает groupsByTokenId для снятых ботов.
   */
  const handleTokenIdsChange = useCallback(
    (nextTokenIds: number[]) => {
      const prev = formData.groupsByTokenId ?? {};
      const nextGroups: Record<number, string[]> = {};
      for (const tid of nextTokenIds) {
        if (prev[tid]) nextGroups[tid] = prev[tid];
      }
      onChange({
        retryAudience: undefined,
        tokenIds: nextTokenIds,
        groupsByTokenId: formData.filters.audienceType === 'retry' ? {} : nextGroups,
        filters: { ...formData.filters, groupIds: undefined, ...(formData.filters.audienceType === 'retry' ? { retryBroadcastId: undefined, userIds: [] } : {}) },
      });
    },
    [onChange, formData.filters, formData.groupsByTokenId],
  );

  useDefaultTokenIds(projectId, tokenIds, handleTokenIdsChange);

  const apiFilters = audienceType === 'tags' ? { tags: formData.filters.tags } :
    audienceType === 'date' ? { registeredFrom: formData.filters.registeredFrom, registeredTo: formData.filters.registeredTo } :
    audienceType === 'activity' ? { activeFrom: formData.filters.activeFrom, activeTo: formData.filters.activeTo } :
    audienceType === 'manual' || audienceType === 'retry' ? { userIds: formData.filters.userIds ?? [] } : {};

  const { count, isLoading, perBot, overlapEstimate } = useAudiencePreview(
    projectId,
    apiFilters,
    tokenId,
    tokenIds,
  );

  /** Сервер учитывает доступность пользователей для каждого выбранного бота. */
  const retryReady = isRetryAudienceReady(formData);
  const retryGroups = audienceType === 'retry' && retryReady ? formData.retryAudience?.groupIds.length ?? 0 : 0;
  const recipientCount = tokenIds.length > 0 && (audienceType !== 'retry' || retryReady) ? count + retryGroups : 0;

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

  return (
    <div className="space-y-4">
      {/* Название рассылки (необязательно) */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
          Название рассылки
          <span className="text-xs font-normal text-muted-foreground">необязательно</span>
        </Label>
        <Input
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Например: Акция ноябрь"
        />
      </div>

      {/* Выбор ботов, от которых уйдёт рассылка */}
      <BotTokenMultiSelect
        projectId={projectId}
        frozenTokenIds={frozenTokenIds}
        selectedTokenIds={tokenIds}
        onChange={handleTokenIdsChange}
        perBot={perBot}
      />
      {statuses.isError && <p role="alert" className="text-sm text-destructive">Не удалось проверить статусы ботов. Попробуйте снова.</p>}

      {/* Выбор аудитории */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          Аудитория
        </Label>
        <AudienceContextHint projectId={projectId} tokenId={tokenId} selectedTokenIds={tokenIds} />
        <RadioGroup
          value={audienceType}
          onValueChange={(v) => onChange({
            retryAudience: undefined,
            filters: { ...formData.filters, audienceType: v as NewBroadcastFormData['filters']['audienceType'], retryBroadcastId: undefined, userIds: undefined, ...(v === 'retry' ? { groupIds: undefined } : {}) },
            ...((v === 'retry' || audienceType === 'retry') ? { groupsByTokenId: {} } : {}),
          })}
          className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2"
        >
          {AUDIENCE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              htmlFor={`aud-${value}`}
              className={cn(
                'flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-ring',
                'hover:bg-accent/60',
                audienceType === value && 'border-blue-500/40 bg-blue-500/10',
              )}
            >
              <RadioGroupItem value={value} id={`aud-${value}`} />
              <Icon className={cn('w-4 h-4 shrink-0', audienceType === value ? 'text-muted-foreground' : 'text-muted-foreground')} />
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
          initializeAll={formData.filters.userIds === undefined}
          onChangeUserIds={handleUserIdsChange}
        />
      )}

      {audienceType === 'retry' && <RetryAudienceSelect projectId={projectId} formData={formData} onChange={onChange} />}

      {/* Секция групп — у каждого выбранного бота свои */}
      {audienceType !== 'retry' && <div className="rounded-xl border border-border bg-background p-3 space-y-2">
        <Label className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          Также отправить в группы
        </Label>
        <BroadcastGroupsByBots
          projectId={projectId}
          tokenIds={tokenIds}
          groupsByTokenId={formData.groupsByTokenId ?? {}}
          onChange={(groupsByTokenId) => onChange({ groupsByTokenId })}
        />
      </div>}

      {/* Счётчик получателей */}
      <div className="flex items-center gap-2 rounded-xl bg-muted/20 border border-border p-3">
        <Users className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Получателей:</span>
        <span className="text-lg font-bold text-primary tabular-nums">
          {isLoading && tokenIds.length > 0 && (audienceType !== 'retry' || !!formData.filters.userIds?.length) ? '...' : recipientCount.toLocaleString('ru-RU')}
        </span>
      </div>

      {audienceType !== 'manual' && <AudienceOverlapWarning overlapEstimate={overlapEstimate} />}

      {/* Кнопки навигации */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button
          onClick={onNext}
          disabled={statuses.isLoading || statuses.isError || tokenIds.length === 0 || tokenIds.some((id) => frozenTokenIds.includes(id)) || (audienceType === 'retry' && (!retryReady || isLoading || recipientCount === 0))}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Далее →
        </Button>
      </div>
    </div>
  );
}
