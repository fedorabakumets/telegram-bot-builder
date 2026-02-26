/**
 * @fileoverview Компонент вкладки ответов
 * @description Отображает таблицу ответов пользователей с фильтрацией
 */

import { TabsContent } from '@/components/ui/tabs';
import { ResponsesTabTable, ResponsesUserFilter } from '../../responses-table/components';
import { useResponsesFilter } from '../../responses-table/hooks';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента ResponsesTabContent
 */
interface ResponsesTabContentProps {
  /** Список пользователей */
  users: UserBotData[];
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
}

/**
 * Компонент вкладки ответов
 * @param props - Пропсы компонента
 * @returns JSX компонент вкладки
 */
export function ResponsesTabContent(props: ResponsesTabContentProps): React.JSX.Element {
  const { users, formatUserName } = props;

  const { selectedUser, setSelectedUser, filteredUsers } = useResponsesFilter({ users });

  return (
    <TabsContent value="responses" className="mt-3 px-2 sm:px-3">
      <div className="p-2 sm:p-3 space-y-3">
        <div className="flex items-center justify-between">
          <ResponsesUserFilter
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            formatUserName={formatUserName}
          />
        </div>
        <ResponsesTabTable users={filteredUsers} />
      </div>
    </TabsContent>
  );
}
