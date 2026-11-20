/**
 * @fileoverview Переключатель базы данных пользователей
 *
 * Компонент отображает и управляет настройкой базы данных для проекта.
 * Под тумблером — раскрывающийся спойлер с пояснением что включает БД.
 *
 * @module BotDatabaseToggle
 */

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Database, ChevronDown } from 'lucide-react';
import { SettingCard } from './SettingCard';
import { useProjectDatabaseSetting } from '../project/use-project-database-setting';

/** Свойства настройки, общей для всех ботов проекта. */
interface BotDatabaseToggleProps {
  /** ID проекта */
  projectId: number;
  /** Включена ли база данных в проекте (1 — да, 0/null — нет). */
  userDatabaseEnabled: number | null;
  /** Может ли пользователь менять настройки проекта. */
  canManage: boolean;
  /** Дополнительный CSS-класс для управления col-span */
  className?: string;
}

/**
 * Переключатель базы данных пользователей
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotDatabaseToggle({
  projectId,
  userDatabaseEnabled,
  canManage,
  className = '',
}: BotDatabaseToggleProps) {
  const { enabled, disabled, setEnabled } = useProjectDatabaseSetting(projectId, userDatabaseEnabled, canManage);
  /** Открыт ли спойлер с пояснением */
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <SettingCard
      icon={Database}
      title="База данных пользователей"
      description={enabled ? 'Боты проекта сохраняют профили и историю сообщений' : 'Боты проекта работают без базы данных'}
      active={enabled}
      className={className}
      testId="database-toggle-container-project"
      action={
        <Switch
          id={`db-toggle-project-${projectId}`}
          data-testid="switch-database-toggle-project"
          aria-label="База данных пользователей"
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={disabled}
        />
      }
    >
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
              Включает сбор данных в PostgreSQL. Боты проекта сохраняют
              <b> профили пользователей</b> (id, имя, @username, язык, premium,
              источник перехода) и <b>историю их сообщений</b>.
            </p>
            <p>
              Когда БД включена — данные видны во вкладке «Пользователи»,
              а боту становятся доступны функции работы с базой.
              Когда выключена — бот ничего не записывает и работает без БД.
            </p>
            <p className="text-muted-foreground/60">
              Изменение применяется при следующем запуске ботов.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SettingCard>
  );
}
