/** @fileoverview Общий профиль собеседника во вкладке пользователей с сохранением статистики и ответов. */
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatUserName } from '../utils';
import { DialogProfileData } from '../dialog/components/dialog-profile-data';
import { useUserList } from './hooks/useUserList';
import type { UserDetailsPanelProps } from './types';
import { EmptyState } from './components/EmptyState';
import { UserSelect } from './components/UserSelect';
import { UserProfileExtras } from './components/user-profile-extras';
import { mergeProfileUser } from './merge-profile-user';

/**
 * Открывает тот же профиль, что и в диалогах, дополняя его данными вкладки пользователей.
 * @param props - Область проекта, выбранный пользователь и действия панели
 * @returns Общий профиль либо пустое состояние
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
  if (!user) return <EmptyState />;
  const initialUser = user;
  const selectUser = onSelectUser ?? onOpenDialog;
  return <DialogProfileData user={user} projectId={projectId} tokenId={selectedTokenId} onClose={onClose}
    actions={({ user: profile, tokenId }) => <div className="space-y-2">
      {selectUser && <UserSelect user={user} users={users} formatUserName={formatUserName} onSelectUser={selectUser} />}
      {onOpenDialog && <Button type="button" variant="outline" size="sm" className="w-full"
        data-testid="button-open-dialog-from-details" onClick={() => onOpenDialog(mergeProfileUser(initialUser, profile, tokenId))}>
        <MessageSquare className="mr-2 h-4 w-4" />Открыть историю диалога
      </Button>}
    </div>}>
    {({ user: profile, tokenId }) => <UserProfileExtras projectId={projectId} tokenId={tokenId} user={mergeProfileUser(initialUser, profile, tokenId)} />}
  </DialogProfileData>;
}
