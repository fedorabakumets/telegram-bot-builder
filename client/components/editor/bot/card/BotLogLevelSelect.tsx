/**
 * @fileoverview Компонент выбора уровня логирования бота
 * @module BotLogLevelSelect
 */

import { FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingCard } from './SettingCard';

/** Доступные уровни логирования */
const LOG_LEVELS = [
  { value: 'ERROR',   label: 'Только ошибки',     color: 'red' },
  { value: 'WARNING', label: 'Предупреждения',     color: 'yellow' },
  { value: 'INFO',    label: 'Информация',         color: 'blue' },
  { value: 'DEBUG',   label: 'Отладка (подробно)', color: 'gray' },
] as const;

/** Тип значения уровня логирования */
type LogLevel = typeof LOG_LEVELS[number]['value'];

/** Пропсы компонента выбора уровня логирования */
interface BotLogLevelSelectProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Текущий уровень логирования */
  logLevel: string | null;
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Отправляет запрос на обновление уровня логирования
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param logLevel - Новый уровень логирования
 */
async function updateLogLevel(projectId: number, tokenId: number, logLevel: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/log-level`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logLevel }),
  });
  if (!res.ok) throw new Error('Ошибка обновления уровня логирования');
}

/**
 * Компонент выбора уровня логирования Python-бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotLogLevelSelect({ projectId, tokenId, logLevel, onPendingChange }: BotLogLevelSelectProps) {
  const [localLevel, setLocalLevel] = useState<LogLevel>((logLevel as LogLevel) ?? 'WARNING');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /** Мутация обновления уровня логирования */
  const mutation = useMutation({
    mutationFn: (level: string) => updateLogLevel(projectId, tokenId, level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Перезапустите бота чтобы применить изменения' });
    },
    onError: () => {
      setLocalLevel((logLevel as LogLevel) ?? 'WARNING');
    },
  });

  return (
    <SettingCard
      icon={FileText}
      title="Уровень логирования"
      description="Детализация вывода в терминал"
    >
      <Select
        value={localLevel}
        onValueChange={(val) => {
          setLocalLevel(val as LogLevel);
          if (onPendingChange) {
            onPendingChange('LOG_LEVEL', val);
          } else {
            mutation.mutate(val);
          }
        }}
        disabled={mutation.isPending}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue placeholder="Уровень" />
        </SelectTrigger>
        <SelectContent>
          {LOG_LEVELS.map(({ value, label }) => (
            <SelectItem key={value} value={value} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingCard>
  );
}
