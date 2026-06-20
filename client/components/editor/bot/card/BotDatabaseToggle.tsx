/**
 * @fileoverview Переключатель базы данных пользователей
 *
 * Компонент отображает и управляет настройкой базы данных для проекта.
 * Под тумблером — раскрывающийся спойлер с пояснением что включает БД.
 *
 * @module BotDatabaseToggle
 */

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Database, ChevronDown } from 'lucide-react';

interface BotDatabaseToggleProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Включена ли база данных (1 — да, 0/null — нет) */
  userDatabaseEnabled: number | null;
  /** Мутация переключения базы данных */
  toggleDatabaseMutation: {
    isPending: boolean;
    mutate: (enabled: boolean) => void;
  };
  /** Дополнительный CSS-класс для управления col-span */
  className?: string;
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Переключатель базы данных пользователей
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotDatabaseToggle({
  tokenId,
  userDatabaseEnabled,
  toggleDatabaseMutation,
  className = '',
  onPendingChange,
}: Omit<BotDatabaseToggleProps, 'projectId'> & { projectId?: number }) {
  const isEnabled = userDatabaseEnabled === 1;
  /** Локальное оптимистичное состояние тумблера (двигается сразу по клику) */
  const [localEnabled, setLocalEnabled] = useState(isEnabled);
  /** Открыт ли спойлер с пояснением */
  const [infoOpen, setInfoOpen] = useState(false);

  // Синхронизируем локальное состояние при изменении пропа извне
  useEffect(() => {
    setLocalEnabled(isEnabled);
  }, [isEnabled]);

  return (
    <div className={`flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg border transition-all ${className} ${
      localEnabled ? 'bg-green-500/8 border-green-500/30 dark:bg-green-500/10 dark:border-green-500/40' 
      : 'bg-red-500/8 border-red-500/30 dark:bg-red-500/10 dark:border-red-500/40'
    }`} data-testid="database-toggle-container-bot-card">
      <div className="flex items-center gap-2 sm:gap-3">
        <Database className={`w-4 h-4 flex-shrink-0 ${localEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
        <Label htmlFor={`db-toggle-bot-${tokenId}`} className={`text-xs sm:text-sm font-semibold cursor-pointer flex-1 ${
          localEnabled ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
        }`}>
          {localEnabled ? 'БД включена' : 'БД выключена'}
        </Label>
        <Switch
          id={`db-toggle-bot-${tokenId}`}
          data-testid="switch-database-toggle-bot-card"
          checked={localEnabled}
          onCheckedChange={(checked) => {
            setLocalEnabled(checked);
            if (onPendingChange) {
              onPendingChange('USER_DATABASE', checked ? '1' : '0');
            } else {
              toggleDatabaseMutation.mutate(checked);
            }
          }}
          disabled={toggleDatabaseMutation.isPending}
        />
      </div>

      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger
          className="flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-muted-foreground transition-colors"
          data-testid="db-toggle-info-trigger"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
          Что это за переключатель?
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1.5">
          <div className="text-[11px] leading-relaxed text-muted-foreground/80 space-y-1.5">
            <p>
              Включает сбор данных в PostgreSQL. Бот начинает сохранять
              <b> профили пользователей</b> (id, имя, @username, язык, premium,
              источник перехода) и <b>историю их сообщений</b>.
            </p>
            <p>
              Когда БД включена — данные видны во вкладке «Пользователи»,
              а боту становятся доступны функции работы с базой.
              Когда выключена — бот ничего не записывает и работает без БД.
            </p>
            <p className="text-muted-foreground/60">
              После переключения перезапустите бота, чтобы изменения применились.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
