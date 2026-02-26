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
    <TabsContent value="responses" className="mt-3 w-full block px-2 sm:px-3">
      <div className="p-2 sm:p-3 space-y-3 w-full">
        <div className="flex items-center gap-2">
          <Label htmlFor="user-filter" className="text-sm font-medium whitespace-nowrap">
            Фильтр:
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
