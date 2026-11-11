/**
 * @fileoverview Локальный просмотр профиля и сохранённых данных пользователя в мобильном списке.
 */
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UserBotData } from '@shared/schema';
import { VariableToQuestionMap } from '../../types';
import { UserDetailsHeader } from '../details/user-details-header';
import { UserDates } from '../details/user-dates';
import { UserTags } from '../details/user-tags';
import { UserJsonData } from '../details/user-json-data';
import { ResponseCard } from '../details/response-card';
import { getUserTags, getUserUpdatedAt } from '../../../utils/user-extra-fields';
import { MobileUserBadges } from './mobile-user-badges';

/** Свойства локального диалога просмотра профиля. */
interface MobileUserDetailsDialogProps {
  /** Данные пользователя. */
  user: UserBotData;
  /** Отформатированное имя. */
  name: string;
  /** Открыт ли диалог. */
  open: boolean;
  /** Изменяет состояние диалога. */
  onOpenChange: (open: boolean) => void;
  /** Соответствие переменных вопросам сценария. */
  variableToQuestionMap?: VariableToQuestionMap;
}

/**
 * Сохраняет недоступность медиафайла без подстановки выдуманного адреса.
 * @returns Отсутствующий адрес фотографии.
 */
function getUnavailablePhotoUrl(): null { return null; }

/**
 * Открывает реальные данные карточки, когда внешняя панель профиля не подключена.
 * @param props - Пользователь, вопросы и состояние открытия.
 * @returns Диалог просмотра профиля.
 */
export function MobileUserDetailsDialog({ user, name, open, onOpenChange, variableToQuestionMap = {} }: MobileUserDetailsDialogProps): React.JSX.Element {
  const entries = user.userData && typeof user.userData === 'object' && !Array.isArray(user.userData)
    ? Object.entries(user.userData) : [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="users-portal flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden">
        <UserDetailsHeader />
        <div className="min-h-0 min-w-0 space-y-6 overflow-y-auto pr-1">
          <div className="space-y-2">
            <p className="break-words text-sm font-medium">{name}</p>
            <p className="break-all text-xs text-muted-foreground tabular-nums">Telegram ID: {user.userId}</p>
            <MobileUserBadges user={user} />
            <p className="text-sm tabular-nums">Сообщений: {user.interactionCount ?? 0}</p>
          </div>
          <UserDates createdAt={user.createdAt} updatedAt={getUserUpdatedAt(user)} lastInteraction={user.lastInteraction} />
          <UserTags tags={getUserTags(user)} />
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Сохранённые данные · {entries.length}</h3>
            {entries.length ? entries.map(([key, value]) => (
              <ResponseCard key={key} keyName={key} value={value} variableToQuestionMap={variableToQuestionMap} getPhotoUrlFromMessages={getUnavailablePhotoUrl} />
            )) : <p className="text-sm text-muted-foreground">Нет сохранённых данных</p>}
          </section>
          <UserJsonData userData={user.userData} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
