/**
 * @fileoverview Панель детальной информации о пользователе
 */

// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BotProject, UserBotData } from '@shared/schema';
import { buildUsersApiUrl, formatDate, formatUserName } from '../utils';
import { useUserMessages } from './hooks/useUserMessages';
import { useUpdateUser } from './hooks/useUpdateUser';
import { useUserList } from './hooks/useUserList';
import { UserDetailsPanelProps } from './types';
import { EmptyState } from './components/EmptyState';
import { PanelHeader } from './components/PanelHeader';
import { BasicInfo } from './components/BasicInfo';
import { Statistics } from './components/Statistics';
import { UserStatus } from './components/UserStatus';
import { DatesSection } from './components/DatesSection';
import { TagsSection } from './components/TagsSection';
import { UserResponses } from '../responses-table/components/UserResponses';
import { RawJson } from './components/RawJson';

/**
 * Компонент панели с детальной информацией о пользователе
 * @param props - Свойства компонента
 * @returns Элемент интерфейса с информацией о пользователе
 */
export function UserDetailsPanel({
  projectId,
  selectedTokenId,
  user,
  onClose,
  onOpenDialog,
  onSelectUser,
}: UserDetailsPanelProps): React.JSX.Element {
  const { users } = useUserList(projectId, selectedTokenId);
  const projectQueryKey = buildUsersApiUrl(`/api/projects/${projectId}`, selectedTokenId);
  const { data: project } = useQuery<BotProject>({ queryKey: [projectQueryKey, selectedTokenId] });
  const { messages, total, userSent, botSent } = useUserMessages(projectId, user?.userId, selectedTokenId);
  const updateUserMutation = useUpdateUser(projectId, selectedTokenId, user);

  const handleUserStatusToggle = (field: 'isActive') => {
    if (!user) return;
    const currentValue = Boolean(user[field as keyof UserBotData]);
    updateUserMutation.mutate({ [field]: !currentValue ? 1 : 0 } as Partial<UserBotData>);
  };

  if (!user) {
    return <EmptyState />;
  }

  const handleSelectUser = onSelectUser
    ? onSelectUser
    : (onOpenDialog ? (currentUser: UserBotData) => onOpenDialog(currentUser) : undefined);

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="space-y-3 p-2 xs:space-y-3.5 xs:p-2.5 sm:space-y-4 sm:p-3 lg:space-y-5 lg:p-4">
        <PanelHeader
          user={user}
          users={users}
          onClose={onClose}
          formatUserName={formatUserName}
          onSelectUser={handleSelectUser}
          projectId={projectId}
        />
        <BasicInfo user={user} />
        <Statistics user={user} total={total} userSent={userSent} botSent={botSent} onOpenDialog={onOpenDialog} />
        <UserStatus user={user} onToggle={handleUserStatusToggle} />
        <DatesSection user={user} formatDate={formatDate} />
        <TagsSection user={user} />
        <UserResponses user={user} />
        <RawJson user={user} />
      </div>
    </div>
  );
}
