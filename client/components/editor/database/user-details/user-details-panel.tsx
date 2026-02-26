// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserBotData, BotProject } from '@shared/schema';
import { formatDate, formatUserName } from '../utils';
import { useUserMessages } from './hooks/useUserMessages';
import { useUpdateUser } from './hooks/useUpdateUser';
import { useUserList } from './hooks/useUserList';
import { UserDetailsPanelProps, BotMessageWithMedia } from './types';
import { EmptyState } from './components/EmptyState';
import { PanelHeader } from './components/PanelHeader';
import { BasicInfo } from './components/BasicInfo';
import { Statistics } from './components/Statistics';
import { UserStatus } from './components/UserStatus';
import { DatesSection } from './components/DatesSection';
import { TagsSection } from './components/TagsSection';
import { UserResponses } from '../responses-table/components/UserResponses';
import { RawJson } from './components/RawJson';
import { UserNavigation } from './components/UserNavigation';

/**
 * @function UserDetailsPanel
 * @description Компонент панели с детальной информацией о пользователе
 * @param {UserDetailsPanelProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент интерфейса с информацией о пользователе
 */
export function UserDetailsPanel({ projectId, user, onClose, onOpenDialog, onSelectUser }: UserDetailsPanelProps): React.JSX.Element {
  const { users } = useUserList(projectId);
  const { data: project } = useQuery<BotProject>({ queryKey: [`/api/projects/${projectId}`] });
  const { messages, total, userSent, botSent } = useUserMessages(projectId, user?.userId);
  const updateUserMutation = useUpdateUser(projectId, user);

  const handleUserStatusToggle = (field: 'isActive') => {
    if (!user) return;
    const currentValue = Boolean(user[field as keyof UserBotData]);
    updateUserMutation.mutate({ [field]: !currentValue ? 1 : 0 } as Partial<UserBotData>);
  };

  if (!user) {
    return <EmptyState />;
  }

  const handleSelectUser = onSelectUser || onOpenDialog;

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="p-2 xs:p-2.5 sm:p-3 lg:p-4 space-y-3 xs:space-y-3.5 sm:space-y-4 lg:space-y-5">
        <PanelHeader user={user} onClose={onClose} formatUserName={formatUserName} />
        <UserNavigation user={user} users={users} onSelectUser={handleSelectUser} />
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
