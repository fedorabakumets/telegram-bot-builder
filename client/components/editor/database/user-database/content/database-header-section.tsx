/**
 * @fileoverview Компактная секция заголовка панели базы данных пользователей
 * @description Строка 1: заголовок + кнопка обновить. Строка 2: проект, бот, статус БД, удалить
 */

import { BotProject } from '@shared/schema';
import {
  BotTokenSelector,
  DatabaseHeader,
  DatabaseToggle,
  HeaderActions,
  ProjectSelector,
} from '../components/header';
import { DatabaseContentProps } from './database-content-props';

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
  > {
  /** Данные проекта */
  project: BotProject | null;
}

/**
 * Компактная секция заголовка панели БД
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
  } = props;

  /** Показывать селектор проекта только если передан список из более чем одного проекта */
  const showProjectSelector =
    allProjects !== undefined && allProjects.length > 1 && onProjectChange !== undefined;

  return (
    <div className="border-b border-border/50 bg-card w-full px-3 py-2 sm:px-4 sm:py-3">
      {/* Строка 1: заголовок + кнопка обновить */}
      <DatabaseHeader projectName={projectName} onRefresh={handleRefresh} />

      <div className="mt-1 border-b border-border/40" />

      {/* Строка 2: проект, бот, статус БД, удалить */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* Селектор проекта — только если доступно несколько проектов */}
        {showProjectSelector ? (
          <ProjectSelector
            projects={allProjects!}
            selectedProjectId={projectId}
            onSelect={onProjectChange!}
          />
        ) : (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Проект: <span className="font-medium text-foreground">{projectName}</span>
          </span>
        )}

        <span className="text-border/60 hidden sm:inline">·</span>

        {/* Селектор бота */}
        <BotTokenSelector
          tokens={availableTokens}
          selectedTokenId={selectedTokenId}
          onSelect={onSelectToken}
        />

        <span className="text-border/60 hidden sm:inline">·</span>

        {/* Переключатель БД */}
        <DatabaseToggle
          isDatabaseEnabled={isDatabaseEnabled}
          onToggle={(checked) => toggleDatabaseMutation.mutate(checked)}
          isPending={toggleDatabaseMutation.isPending}
        />

        {/* Кнопка удалить — только когда БД включена */}
        {isDatabaseEnabled && (
          <HeaderActions
            projectId={projectId}
            projectName={projectName}
            onRefresh={handleRefresh}
            onDeleteAll={() => deleteAllUsersMutation.mutate()}
          />
        )}
      </div>
    </div>
  );
}
