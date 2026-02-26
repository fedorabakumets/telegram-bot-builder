/**
 * @fileoverview Компонент заголовка панели БД
 * @description Отображает header, toggle и actions
 */

import { DatabaseHeader, DatabaseToggle, HeaderActions, ExportInfo } from '../components/header';
import { DatabaseContentProps } from './database-content-props';
import { BotProject } from '@shared/schema';

/**
 * Пропсы компонента DatabaseHeaderSection
 */
interface DatabaseHeaderSectionProps
  extends Pick<
    DatabaseContentProps,
    | 'projectId'
    | 'projectName'
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
    isDatabaseEnabled,
    toggleDatabaseMutation,
    handleRefresh,
    deleteAllUsersMutation,
    project,
  } = props;

  return (
    <div className="border-b border-border/50 bg-card w-full">
      <div className="p-3 sm:p-4 lg:p-5 space-y-4 sm:space-y-5">
        <DatabaseHeader projectName={projectName} />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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

        <ExportInfo project={project} />
      </div>
    </div>
  );
}
