/**
 * @fileoverview Главный компонент контента панели базы данных
 * @description Объединяет все секции: header, фильтры, статистику, tabs
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import './users-workspace.css';
import './users-header.css';
import { DatabaseContentProps } from './database-content-props';
import { DatabaseHeaderSection } from './database-header-section';
import { DatabaseFiltersSection } from './database-filters-section';
import { DatabaseTabs } from './database-tabs';
import { DatabaseDisabled } from '../components/header';

/**
 * Компонент контента панели базы данных
 * @param props - Пропсы компонента
 * @returns JSX компонент контента
 */
export function DatabaseContent(props: DatabaseContentProps): React.JSX.Element {
  const {
    isDatabaseEnabled,
    isMobile,
    project,
    visibleColumns,
    saveIncomingMedia,
    ...restProps
  } = props;

  return (
    <div className="users-workspace flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
        <DatabaseHeaderSection
          {...restProps}
          isDatabaseEnabled={isDatabaseEnabled}
          project={project || null}
          stats={restProps.stats}
        />
      <ScrollArea className="min-h-0 flex-1 w-full">
      <div className="flex flex-col min-h-0 pb-6">
        {!isDatabaseEnabled && <DatabaseDisabled />}
        {isDatabaseEnabled && (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <DatabaseFiltersSection {...restProps} />
            <DatabaseTabs 
              {...restProps} 
              isMobile={isMobile}
              visibleColumns={visibleColumns}
            />
          </div>
        )}
      </div>
    </ScrollArea>
    </div>
  );
}
