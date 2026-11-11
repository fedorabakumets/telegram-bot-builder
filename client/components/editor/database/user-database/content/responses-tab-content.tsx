/**
 * @fileoverview Компонент вкладки ответов
 * @description Отображает таблицу ответов пользователей с фильтрацией и пагинацией
 */

import { TabsContent } from '@/components/ui/tabs';
import { ResponsesUserFilter, ResponsesTableWithPagination } from '../../responses-table/components';
import { useResponsesFilter } from '../../responses-table/hooks';
import { UserBotData } from '@shared/schema';
import { Label } from '@/components/ui/label';

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
    <TabsContent value="responses" className="users-tab-content mt-0 w-full min-w-0 px-4 py-4">
      <div className="space-y-4 w-full min-w-0">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="user-filter" className="text-sm font-medium whitespace-nowrap">
            Пользователь
          </Label>
          <ResponsesUserFilter
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            formatUserName={formatUserName}
          />
        </div>
        <ResponsesTableWithPagination users={filteredUsers} />
      </div>
    </TabsContent>
  );
}
