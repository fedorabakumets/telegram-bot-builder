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
    ...restProps
  } = props;

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col bg-background h-full pb-32 sm:pb-4">
        <DatabaseHeaderSection
          {...restProps}
          isDatabaseEnabled={isDatabaseEnabled}
          project={project || null}
        />
        {!isDatabaseEnabled && <DatabaseDisabled />}
        {isDatabaseEnabled && (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <DatabaseStatsSection stats={restProps.stats} />
            <DatabaseFiltersSection {...restProps} />
            <DatabaseTabs {...restProps} isMobile={isMobile} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
