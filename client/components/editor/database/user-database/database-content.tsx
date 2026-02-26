/**
 * @fileoverview Главный компонент контента панели базы данных
 * @description Отображает header, фильтры, статистику и список пользователей
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BotProject, UserBotData } from '@shared/schema';
import { SortField, SortDirection } from '../types';
import { StatsCards } from './components/stats';
import { ResponsesTabTable } from './components/responses';
import { MobileUserList } from './components/mobile';
import { DesktopTable } from './components/desktop';
import { DatabaseHeader, DatabaseToggle, HeaderActions, ExportInfo, DatabaseDisabled } from './components/header';
import { FiltersContainer } from './components/filters';

/**
 * Пропсы компонента DatabaseContent
 */
export interface DatabaseContentProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Флаг включена ли БД */
  isDatabaseEnabled: boolean;
  /** Мутация переключения БД */
  toggleDatabaseMutation: any;
  /** Функция обновления */
  handleRefresh: () => void;
  /** Мутация удаления всех */
  deleteAllUsersMutation: any;
  /** Статистика */
  stats: { totalUsers?: number; activeUsers?: number; blockedUsers?: number; premiumUsers?: number; totalInteractions?: number; avgInteractionsPerUser?: number; usersWithResponses?: number };
  /** Поисковый запрос */
  searchQuery: string;
  /** Фильтр по статусу */
  filterActive: boolean | null;
  /** Установка фильтра статуса */
  setFilterActive: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** Фильтр по Premium */
  filterPremium: boolean | null;
  /** Установка фильтра Premium */
  setFilterPremium: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** Поле сортировки */
  sortField: string;
  /** Направление сортировки */
  sortDirection: string;
  /** Установка поля сортировки */
  setSortField: React.Dispatch<React.SetStateAction<SortField>>;
  /** Установка направления сортировки */
  setSortDirection: React.Dispatch<React.SetStateAction<SortDirection>>;
  /** Флаг мобильного режима */
  isMobile: boolean;
  /** Список пользователей */
  filteredAndSortedUsers: UserBotData[];
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Открытие панели деталей */
  onOpenUserDetailsPanel: ((user: UserBotData) => void) | undefined;
  /** Установка выбранного пользователя */
  setSelectedUser: React.Dispatch<React.SetStateAction<UserBotData | null>>;
  /** Установка флага показа деталей */
  setShowUserDetails: React.Dispatch<React.SetStateAction<boolean>>;
  /** Открытие диалога */
  onOpenDialogPanel: ((user: UserBotData) => void) | undefined;
  /** Установка пользователя для диалога */
  setSelectedUserForDialog: React.Dispatch<React.SetStateAction<UserBotData | null>>;
  /** Установка флага показа диалога */
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
  /** Прокрутка вниз */
  scrollToBottom: () => void;
  /** Переключение статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
  /** Мутация удаления */
  deleteUserMutation: any;
  /** Данные проекта */
  project?: BotProject;
}

/**
 * Компонент контента панели базы данных
 * @param props - Пропсы компонента
 * @returns JSX компонент контента
 */
export function DatabaseContent(props: DatabaseContentProps): React.JSX.Element {
  const {
    projectId,
    projectName,
    isDatabaseEnabled,
    toggleDatabaseMutation,
    handleRefresh,
    deleteAllUsersMutation,
    stats,
    searchQuery,
    filterActive,
    setFilterActive,
    filterPremium,
    setFilterPremium,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    isMobile,
    filteredAndSortedUsers,
    formatUserName,
    onOpenUserDetailsPanel,
    setSelectedUser,
    setShowUserDetails,
    onOpenDialogPanel,
    setSelectedUserForDialog,
    setShowDialog,
    scrollToBottom,
    handleUserStatusToggle,
    deleteUserMutation,
    project,
  } = props;

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col bg-background">
        <div className="border-b border-border/50 bg-card">
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

            {isDatabaseEnabled && stats && <StatsCards stats={stats} />}

            {isDatabaseEnabled && (
              <FiltersContainer
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterActive={filterActive?.toString() || 'all'}
                setFilterActive={setFilterActive}
                filterPremium={filterPremium?.toString() || 'all'}
                setFilterPremium={setFilterPremium}
                sortField={sortField}
                sortDirection={sortDirection}
                setSort={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
            )}
          </div>
        </div>

        {!isDatabaseEnabled && <DatabaseDisabled />}

        {isDatabaseEnabled && (
          <div>
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0 m-3 sm:m-4">
                <TabsTrigger value="users">Пользователи</TabsTrigger>
                <TabsTrigger value="responses">Ответы пользователей</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-2">
                {isMobile ? (
                  <MobileUserList
                    users={filteredAndSortedUsers}
                    searchQuery={searchQuery}
                    formatUserName={formatUserName}
                    onOpenUserDetailsPanel={onOpenUserDetailsPanel}
                    onOpenDialogPanel={onOpenDialogPanel}
                    handleUserStatusToggle={handleUserStatusToggle}
                    setSelectedUser={setSelectedUser}
                    setShowUserDetails={setShowUserDetails}
                    setSelectedUserForDialog={setSelectedUserForDialog}
                    setShowDialog={setShowDialog}
                    scrollToBottom={scrollToBottom}
                  />
                ) : (
                  <DesktopTable
                    users={filteredAndSortedUsers}
                    searchQuery={searchQuery}
                    formatUserName={formatUserName}
                    onOpenUserDetailsPanel={onOpenUserDetailsPanel}
                    onOpenDialogPanel={onOpenDialogPanel}
                    handleUserStatusToggle={handleUserStatusToggle}
                    setSelectedUser={setSelectedUser}
                    setShowUserDetails={setShowUserDetails}
                    setSelectedUserForDialog={setSelectedUserForDialog}
                    setShowDialog={setShowDialog}
                    scrollToBottom={scrollToBottom}
                    deleteUserMutation={deleteUserMutation}
                  />
                )}
              </TabsContent>

              <TabsContent value="responses" className="mt-2">
                <div className="p-2 sm:p-3">
                  <ResponsesTabTable users={filteredAndSortedUsers} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
