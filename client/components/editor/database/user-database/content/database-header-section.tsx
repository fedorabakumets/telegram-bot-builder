/**
 * @fileoverview Компактная секция заголовка панели базы данных пользователей
 * @description Строка с заголовком, инлайн-бейджами статистики и кнопками управления
 */

import { Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotProject } from '@shared/schema';
import {
  BotTokenSelector,
  HeaderActions,
  ProjectSelector,
} from '../components/header';
import { DatabaseContentProps } from './database-content-props';
import { InlineStatsBadges } from '../components/header/inline-stats-badges';

/**
 * Пропсы компонента DatabaseHeaderSection
 */
interface DatabaseHeaderSectionProps
  extends Pick<
    DatabaseContentProps,
    | 'projectId'
    | 'projectName'
    | 'selectedTokenId'
    | 'availableTokens'
    | 'onSelectToken'
    | 'isDatabaseEnabled'
    | 'toggleDatabaseMutation'
    | 'handleRefresh'
    | 'deleteAllUsersMutation'
    | 'allProjects'
    | 'onProjectChange'
    | 'stats'
  > {
  /** Данные проекта */
  project: BotProject | null;
}

/**
 * Компактная секция заголовка панели БД — одна строка
 * @param props - Пропсы компонента
 * @returns JSX компонент заголовка
 */
export function DatabaseHeaderSection(props: DatabaseHeaderSectionProps): React.JSX.Element {
  const {
    projectId,
    projectName,
    selectedTokenId,
    availableTokens,
    onSelectToken,
    isDatabaseEnabled,
    toggleDatabaseMutation,
    handleRefresh,
    deleteAllUsersMutation,
    allProjects,
    onProjectChange,
    stats,
  } = props;

  /** Показывать селектор проекта только если передан список из более чем одного проекта */
  const showProjectSelector =
    allProjects !== undefined && allProjects.length > 1 && onProjectChange !== undefined;

  return (
    <div className="border-b border-border/50 bg-card w-full px-3 py-2 sm:px-4 sm:py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* Иконка + заголовок */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold leading-none">Пользователи</h2>
        </div>

        <span className="text-border/60 text-[10px]">·</span>

        {/* Селектор проекта */}
        {showProjectSelector ? (
          <ProjectSelector
            projects={allProjects!}
            selectedProjectId={projectId}
            onSelect={onProjectChange!}
          />
        ) : null}

        {/* Селектор бота */}
        <BotTokenSelector
          tokens={availableTokens}
          selectedTokenId={selectedTokenId}
          onSelect={onSelectToken}
        />

        {/* Кнопка очистить */}
        {isDatabaseEnabled && (
          <>
            <span className="text-border/60 text-[10px]">·</span>
            <HeaderActions
              projectId={projectId}
              projectName={projectName}
              onRefresh={handleRefresh}
              onDeleteAll={() => deleteAllUsersMutation.mutate()}
            />
          </>
        )}

        {/* Инлайн-бейджи статистики */}
        {isDatabaseEnabled && stats && (
          <>
            <span className="text-border/60 text-[10px]">·</span>
            <InlineStatsBadges stats={stats} />
          </>
        )}

        {/* Кнопка обновить — справа */}
        {handleRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 px-2 text-muted-foreground hover:text-foreground ml-auto"
            title="Обновить данные"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs hidden sm:inline">Обновить</span>
          </Button>
        )}
      </div>
    </div>
  );
}
