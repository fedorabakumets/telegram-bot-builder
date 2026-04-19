/**
 * @fileoverview Компонент заголовка панели БД
 * @description Отображает header, toggle, actions и выбор бота
 */

import { BotProject } from '@shared/schema';
import {
  BotTokenSelector,
  DatabaseHeader,
  DatabaseToggle,
  ExportInfo,
  HeaderActions,
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
  > {
  /** Данные проекта */
  project: BotProject | null;
}

/**
 * Компонент заголовка панели БД
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
    project,
  } = props;

  return (
    <div className="border-b border-border/50 bg-card w-full">
      <div className="space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-5">
        <DatabaseHeader projectName={projectName} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DatabaseToggle
            isDatabaseEnabled={isDatabaseEnabled}
            onToggle={(checked) => toggleDatabaseMutation.mutate(checked)}
            isPending={toggleDatabaseMutation.isPending}
          />

          {isDatabaseEnabled && (
            <HeaderActions
              projectId={projectId}
              projectName={projectName}
              onRefresh={handleRefresh}
              onDeleteAll={() => deleteAllUsersMutation.mutate()}
            />
          )}
        </div>

        <BotTokenSelector
          tokens={availableTokens}
          selectedTokenId={selectedTokenId}
          onSelect={onSelectToken}
        />

        <ExportInfo project={project} />
      </div>
    </div>
  );
}
