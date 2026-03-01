/**
 * @fileoverview Компонент настройки управления пользователями
 * 
 * Блок управления настройками бана, мута, кика и продвижения пользователей.
 * 
 * @module UserManagementConfiguration
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SynonymEditor } from '../synonym-editor';
import { AdminRightsEditor } from '../admin-rights-editor';

/**
 * Пропсы компонента настройки управления пользователями
 */
interface UserManagementConfigurationProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки управления пользователями
 * 
 * Поддерживает типы узлов:
 * - ban_user, unban_user, mute_user, unmute_user
 * - kick_user, promote_user, demote_user, admin_rights
 * 
 * @param {UserManagementConfigurationProps} props - Пропсы компонента
 * @returns {JSX.Element} Конфигурация управления пользователями
 */
export function UserManagementConfiguration({
  selectedNode,
  onNodeUpdate
}: UserManagementConfigurationProps) {
  const isReasonRequired = selectedNode.type === 'ban_user' || 
    selectedNode.type === 'mute_user' || selectedNode.type === 'kick_user';

  const getDefaultSynonyms = () => {
    switch (selectedNode.type) {
      case 'ban_user': return ['забанить', 'заблокировать', 'бан'];
      case 'unban_user': return ['разбанить', 'разблокировать', 'unbан'];
      case 'mute_user': return ['замутить', 'заглушить', 'мут'];
      case 'unmute_user': return ['размутить', 'разглушить', 'анмут'];
      case 'kick_user': return ['кикнуть', 'исключить', 'выгнать'];
      case 'promote_user': return ['повысить', 'назначить админом', 'промоут'];
      case 'demote_user': return ['понизить', 'снять с админки', 'демоут'];
      case 'admin_rights': return ['права админа', 'изменить права', 'админ права', 'тг права', 'права'];
      default: return [];
    }
  };

  const getSynonymDescription = () => {
    switch (selectedNode.type) {
      case 'ban_user': return 'Команды для блокировки пользователя';
      case 'unban_user': return 'Команды для разблокировки пользователя';
      case 'mute_user': return 'Команды для ограничения пользователя';
      case 'unmute_user': return 'Команды для снятия ограничений';
      case 'kick_user': return 'Команды для исключения пользователя';
      case 'promote_user': return 'Команды для назначения администратором';
      case 'demote_user': return 'Команды для снятия с должности администратора';
      case 'admin_rights': return 'Команды для управления правами администратора';
      default: return 'Альтернативные команды для этого действия';
    }
  };

  const getSynonymPlaceholder = () => {
    switch (selectedNode.type) {
      case 'ban_user': return 'забанить, заблокировать, бан';
      case 'unban_user': return 'разбанить, разблокировать, unbан';
      case 'mute_user': return 'замутить, заглушить, мут';
      case 'unmute_user': return 'размутить, разглушить, анмут';
      case 'kick_user': return 'кикнуть, исключить, выгнать';
      case 'promote_user': return 'повысить, назначить админом, промоут';
      case 'demote_user': return 'понизить, снять с админки, демоут';
      case 'admin_rights': return 'права админа, изменить права, админ права, тг права, права';
      default: return 'команда1, команда2, команда3';
    }
  };

  return (
    <div className="space-y-6">
      {/* Reason Section */}
      {isReasonRequired && (
        <div className="bg-gradient-to-br from-orange-50/50 to-yellow-50/30 dark:from-orange-950/20 dark:to-yellow-950/10 border border-orange-200/30 dark:border-orange-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <i className="fas fa-clipboard text-orange-600 dark:text-orange-400 text-xs"></i>
            </div>
            <Label className="text-sm font-semibold text-orange-900 dark:text-orange-100">Причина действия</Label>
          </div>

          <div>
            <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
              <i className="fas fa-comment mr-1"></i>
              Причина
            </Label>
            <Input
              value={selectedNode.data.reason || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { reason: e.target.value })}
              className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
              placeholder="Нарушение правил группы"
            />
          </div>
        </div>
      )}

      {/* Ban Duration Section */}
      {selectedNode.type === 'ban_user' && (
        <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-200/30 dark:border-purple-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <i className="fas fa-clock text-purple-600 dark:text-purple-400 text-xs"></i>
            </div>
            <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">Длительность бана</Label>
          </div>

          <div>
            <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
              <i className="fas fa-calendar mr-1"></i>
              Дата окончания (Unix timestamp)
            </Label>
            <Input
              type="number"
              value={selectedNode.data.untilDate || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { untilDate: parseInt(e.target.value) || 0 })}
              className="border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-200"
              placeholder="0 (навсегда)"
            />
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              0 = постоянный бан, или Unix timestamp даты окончания
            </div>
          </div>
        </div>
      )}

      {/* Mute Settings Section */}
      {selectedNode.type === 'mute_user' && (
        <div className="space-y-6">
          {/* Duration */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/30 dark:border-indigo-800/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <i className="fas fa-hourglass text-indigo-600 dark:text-indigo-400 text-xs"></i>
              </div>
              <Label className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Длительность</Label>
            </div>

            <div>
              <Label className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 block">
                <i className="fas fa-timer mr-1"></i>
                Длительность (секунды)
              </Label>
              <Input
                type="number"
                value={selectedNode.data.muteDuration || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { muteDuration: parseInt(e.target.value) || 3600 })}
                className="border-indigo-200 dark:border-indigo-700 focus:border-indigo-500 focus:ring-indigo-200"
                placeholder="3600"
              />
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Количество секунд (3600 = 1 час)
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/20 dark:to-gray-950/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">
                <i className="fas fa-ban text-slate-600 dark:text-slate-400 text-xs"></i>
              </div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ограничения</Label>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'canSendMessages', label: 'Отправлять сообщения', icon: 'fas fa-comment' },
                { key: 'canSendMediaMessages', label: 'Отправлять медиа', icon: 'fas fa-image' },
                { key: 'canSendPolls', label: 'Создавать опросы', icon: 'fas fa-poll' },
                { key: 'canSendOtherMessages', label: 'Отправлять стикеры/GIF', icon: 'fas fa-laugh' },
                { key: 'canAddWebPagePreviews', label: 'Добавлять превью ссылок', icon: 'fas fa-link' },
                { key: 'canChangeGroupInfo', label: 'Изменять информацию группы', icon: 'fas fa-edit' },
                { key: 'canInviteUsers2', label: 'Приглашать пользователей', icon: 'fas fa-user-plus' },
                { key: 'canPinMessages2', label: 'Закреплять сообщения', icon: 'fas fa-thumbtack' }
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-slate-200/30 dark:border-slate-800/30">
                  <div className="flex items-center space-x-2">
                    <i className={`${icon} text-slate-600 dark:text-slate-400 text-xs`}></i>
                    <Label className="text-xs text-slate-700 dark:text-slate-300">{label}</Label>
                  </div>
                  <Switch
                    checked={(selectedNode.data as any)[key] ?? false}
                    onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { [key]: checked } as any)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Promote Settings Section */}
      {selectedNode.type === 'promote_user' && (
        <AdminRightsEditor selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
      )}

      {/* Synonyms Section */}
      <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/30 dark:border-green-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <i className="fas fa-tags text-green-600 dark:text-green-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-green-900 dark:text-green-100">Синонимы команды</Label>
        </div>

        <SynonymEditor
          synonyms={(() => {
            if (!selectedNode.data.synonyms || selectedNode.data.synonyms.length === 0) {
              const defaultSynonyms = getDefaultSynonyms();
              if (defaultSynonyms.length > 0) {
                setTimeout(() => onNodeUpdate(selectedNode.id, { synonyms: defaultSynonyms }), 0);
                return defaultSynonyms;
              }
            }
            return selectedNode.data.synonyms || [];
          })()}
          onUpdate={(synonyms) => onNodeUpdate(selectedNode.id, { synonyms })}
          title="Альтернативные команды"
          description={getSynonymDescription()}
          placeholder={getSynonymPlaceholder()}
        />
      </div>
    </div>
  );
}
