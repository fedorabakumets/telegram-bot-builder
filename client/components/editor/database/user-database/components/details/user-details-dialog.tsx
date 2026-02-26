/**
 * @fileoverview Главный компонент диалога деталей пользователя
 * @description Объединяет все подкомпоненты деталей пользователя
 */

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserBotData } from '@shared/schema';
import { VariableToQuestionMap } from '../../types';
import { UserDetailsHeader } from './user-details-header';
import { UserInfoGrid } from './user-info-grid';
import { UserStatusToggle } from './user-status-toggle';
import { UserDates } from './user-dates';
import { UserTags } from './user-tags';
import { UserResponsesList } from '../../../responses-table/components/user-responses-list';
import { UserJsonData } from './user-json-data';

/**
 * Пропсы компонента UserDetailsDialog
 */
interface UserDetailsDialogProps {
  /** Флаг открытия диалога */
  open: boolean;
  /** Функция закрытия диалога */
  onOpenChange: (open: boolean) => void;
  /** Выбранный пользователь */
  selectedUser: UserBotData | null;
  /** Количество сообщений */
  userMessageCounts: { userSent: number; botSent: number; total: number };
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
  /** Карта вопросов */
  variableToQuestionMap: VariableToQuestionMap;
  /** Функция поиска URL фото */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}

/**
 * Компонент диалога деталей пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент диалога или null
 */
export function UserDetailsDialog(props: UserDetailsDialogProps): React.JSX.Element | null {
  const {
    open,
    onOpenChange,
    selectedUser,
    userMessageCounts,
    handleUserStatusToggle,
    variableToQuestionMap,
    getPhotoUrlFromMessages,
  } = props;

  const isMobile = useIsMobile();

  if (!selectedUser) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-3xl max-h-[80vh]'} overflow-auto`}
      >
        <UserDetailsHeader />

        <div className="space-y-6">
          <UserInfoGrid
            selectedUser={selectedUser}
            userMessageCounts={userMessageCounts}
            isMobile={isMobile}
          />

          <UserStatusToggle selectedUser={selectedUser} handleUserStatusToggle={handleUserStatusToggle} />

          <UserDates
            createdAt={selectedUser.createdAt}
            updatedAt={selectedUser.updatedAt}
            lastInteraction={selectedUser.lastInteraction}
          />

          <UserTags tags={selectedUser.tags || []} />

          {selectedUser.userData && Object.keys(selectedUser.userData).length > 0 ? (
            <UserResponsesList
              userData={selectedUser.userData}
              variableToQuestionMap={variableToQuestionMap}
              getPhotoUrlFromMessages={getPhotoUrlFromMessages}
            />
          ) : null}

          <UserJsonData userData={selectedUser.userData} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
