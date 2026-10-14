/**
 * @fileoverview Переключатели прав ограничения участника
 * @module configuration/mute-permission-switches
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Описание одного права ограничения
 */
interface MutePermissionSwitch {
  /** Ключ поля в данных узла */
  key: string;
  /** Подпись переключателя */
  label: string;
  /** Иконка Font Awesome */
  icon: string;
  /** Если поле пустое, показать значение canSendMediaMessages */
  useMediaFallback?: boolean;
}

/**
 * Пропсы списка переключателей ограничения
 */
interface MutePermissionSwitchesProps {
  /** Выбранный узел mute_user */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/** Отдельные права вместо устаревшего «Отправлять медиа» */
const MUTE_PERMISSIONS: MutePermissionSwitch[] = [
  { key: 'canSendMessages', label: 'Отправлять сообщения', icon: 'fas fa-comment' },
  { key: 'canSendAudios', label: 'Отправлять аудио', icon: 'fas fa-music', useMediaFallback: true },
  { key: 'canSendDocuments', label: 'Отправлять документы', icon: 'fas fa-file', useMediaFallback: true },
  { key: 'canSendPhotos', label: 'Отправлять фото', icon: 'fas fa-image', useMediaFallback: true },
  { key: 'canSendVideos', label: 'Отправлять видео', icon: 'fas fa-video', useMediaFallback: true },
  { key: 'canSendVideoNotes', label: 'Отправлять кружки', icon: 'fas fa-circle', useMediaFallback: true },
  { key: 'canSendVoiceNotes', label: 'Отправлять голосовые', icon: 'fas fa-microphone', useMediaFallback: true },
  { key: 'canSendPolls', label: 'Создавать опросы', icon: 'fas fa-poll' },
  { key: 'canSendOtherMessages', label: 'Отправлять стикеры/GIF', icon: 'fas fa-laugh' },
  { key: 'canAddWebPagePreviews', label: 'Добавлять превью ссылок', icon: 'fas fa-link' },
  { key: 'canReactToMessages', label: 'Ставить реакции', icon: 'fas fa-heart', useMediaFallback: true },
  { key: 'canChangeGroupInfo', label: 'Изменять информацию группы', icon: 'fas fa-edit' },
  { key: 'canInviteUsers2', label: 'Приглашать пользователей', icon: 'fas fa-user-plus' },
  { key: 'canPinMessages2', label: 'Закреплять сообщения', icon: 'fas fa-thumbtack' },
];

/**
 * Возвращает положение переключателя с учётом старого запрета медиа
 * @param data - Данные узла
 * @param item - Описание права
 * @returns Включено ли право
 */
function isPermissionOn(data: Node['data'], item: MutePermissionSwitch): boolean {
  const value = (data as Record<string, unknown>)[item.key];
  if (typeof value === 'boolean') return value;
  if (item.useMediaFallback) return data.canSendMediaMessages ?? false;
  return false;
}

/**
 * Список переключателей ограничения участника
 * @param props - Свойства компонента
 * @returns Карточка с переключателями
 */
export function MutePermissionSwitches({ selectedNode, onNodeUpdate }: MutePermissionSwitchesProps) {
  return (
    <div className="bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/20 dark:to-gray-950/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">
          <i className="fas fa-ban text-slate-600 dark:text-slate-400 text-xs"></i>
        </div>
        <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ограничения</Label>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {MUTE_PERMISSIONS.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-slate-200/30 dark:border-slate-800/30">
            <div className="flex items-center space-x-2">
              <i className={`${item.icon} text-slate-600 dark:text-slate-400 text-xs`}></i>
              <Label className="text-xs text-slate-700 dark:text-slate-300">{item.label}</Label>
            </div>
            <Switch
              checked={isPermissionOn(selectedNode.data, item)}
              onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { [item.key]: checked } as Partial<Node['data']>)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
