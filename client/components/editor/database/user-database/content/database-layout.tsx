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
      <div className="flex flex-col bg-background">
        <DatabaseHeaderSection {...restProps} project={project || null} />
        {!isDatabaseEnabled && <DatabaseDisabled />}
        {isDatabaseEnabled && (
          <>
            <DatabaseStatsSection stats={restProps.stats} />
            <DatabaseFiltersSection {...restProps} />
            <DatabaseTabs {...restProps} isMobile={isMobile} />
          </>
        )}
      </div>
    </ScrollArea>
  );
}
