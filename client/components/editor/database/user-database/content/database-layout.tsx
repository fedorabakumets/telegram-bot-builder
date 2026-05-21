/**
 * @fileoverview Главный компонент контента панели базы данных
 * @description Объединяет все секции: header, фильтры, статистику, tabs
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { DatabaseContentProps } from './database-content-props';
import { DatabaseHeaderSection } from './database-header-section';
import { DatabaseStatsSection } from './database-stats-section';
import { DatabaseFiltersSection } from './database-filters-section';
import { DatabaseTabs } from './database-tabs';
import { DatabaseDisabled } from '../components/header';
import { SaveMediaToggle } from '../components/SaveMediaToggle';

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
    <ScrollArea className="h-full w-full overflow-hidden">
      <div className="flex flex-col bg-background h-full min-h-0 pb-32 sm:pb-4">
        <DatabaseHeaderSection
          {...restProps}
          isDatabaseEnabled={isDatabaseEnabled}
          project={project || null}
          stats={restProps.stats}
        />
        {!isDatabaseEnabled && <DatabaseDisabled />}
        {isDatabaseEnabled && (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            {/* DatabaseStatsSection скрыта — статистика теперь отображается инлайн-бейджами в хедере */}
            {/* <DatabaseStatsSection
              stats={restProps.stats}
              projectId={restProps.projectId}
              selectedTokenId={restProps.selectedTokenId}
              onSourceClick={restProps.onSourceClick}
            /> */}
            {/* <SaveMediaToggle
              projectId={restProps.projectId}
              tokenId={restProps.selectedTokenId}
              saveIncomingMedia={saveIncomingMedia ?? null}
            /> */}
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
  );
}
