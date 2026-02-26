/**
 * @fileoverview Компонент вкладки ответов
 * @description Отображает таблицу ответов пользователей
 */

import { TabsContent } from '@/components/ui/tabs';
import { ResponsesTabTable } from '../../responses-table/components/responses-tab-table';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента ResponsesTabContent
 */
interface ResponsesTabContentProps {
  /** Список пользователей */
  users: UserBotData[];
}

/**
 * Компонент вкладки ответов
 * @param props - Пропсы компонента
 * @returns JSX компонент вкладки
 */
export function ResponsesTabContent(props: ResponsesTabContentProps): React.JSX.Element {
  const { users } = props;

  return (
    <TabsContent value="responses" className="mt-3 px-2 sm:px-3">
      <div className="p-2 sm:p-3">
        <ResponsesTabTable users={users} />
      </div>
    </TabsContent>
  );
}
