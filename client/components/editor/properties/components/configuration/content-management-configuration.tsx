/**
 * @fileoverview Компонент настройки управления контентом
 * 
 * Блок управления настройками закрепления/открепления/удаления сообщений.
 * 
 * @module ContentManagementConfiguration
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SynonymEditor } from '../synonym-editor';

/**
 * Пропсы компонента настройки управления контентом
 */
interface ContentManagementConfigurationProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки управления контентом
 * 
 * Поддерживает типы узлов:
 * - pin_message (закрепить сообщение)
 * - unpin_message (открепить сообщение)
 * - delete_message (удалить сообщение)
 * 
 * @param {ContentManagementConfigurationProps} props - Пропсы компонента
 * @returns {JSX.Element} Конфигурация управления контентом
 */
export function ContentManagementConfiguration({
  selectedNode,
  onNodeUpdate
}: ContentManagementConfigurationProps) {
  const getAutoMessage = () => {
    if (selectedNode.type === 'pin_message') {
      return ' Пользователь отвечает на сообщение со словом "закрепить" - сообщение закрепляется.';
    }
    if (selectedNode.type === 'unpin_message') {
      return ' Пользователь отвечает на сообщение со словом "открепить" - сообщение открепляется.';
    }
    if (selectedNode.type === 'delete_message') {
      return ' Пользователь отвечает на сообщение со словом "удалить" - сообщение удаляется.';
    }
    return '';
  };

  const getDefaultSynonyms = () => {
    if (selectedNode.type === 'pin_message') {
      return ['закрепить', 'прикрепить', 'зафиксировать'];
    }
    if (selectedNode.type === 'unpin_message') {
      return ['открепить', 'отцепить', 'убрать закрепление'];
    }
    if (selectedNode.type === 'delete_message') {
      return ['удалить', 'стереть', 'убрать сообщение'];
    }
    return [];
  };

  const getSynonymDescription = () => {
    if (selectedNode.type === 'pin_message') {
      return 'Команды для закрепления сообщения';
    }
    if (selectedNode.type === 'unpin_message') {
      return 'Команды для открепления сообщения';
    }
    if (selectedNode.type === 'delete_message') {
      return 'Команды для удаления сообщения';
    }
    return 'Альтернативные команды для этого действия';
  };

  const getSynonymPlaceholder = () => {
    if (selectedNode.type === 'pin_message') {
      return 'закрепить, прикрепить, зафиксировать';
    }
    if (selectedNode.type === 'unpin_message') {
      return 'открепить, отцепить, убрать';
    }
    if (selectedNode.type === 'delete_message') {
      return 'удалить, стереть, убрать';
    }
    return 'команда1, команда2, команда3';
  };

  return (
    <div className="space-y-6">
      {/* Automatic Message Handling Info */}
      <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <i className="fas fa-reply text-blue-600 dark:text-blue-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">Автоматическое управление</Label>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200/30 dark:border-blue-800/30">
          <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <i className="fas fa-info-circle mr-1"></i>
            Команда будет применена к сообщению, на которое отвечает пользователь.{getAutoMessage()}
          </div>
        </div>

        {selectedNode.type === 'pin_message' && (
          <div className="mt-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
              <div className="flex-1">
                <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  <i className="fas fa-bell-slash mr-1"></i>
                  Тихое закрепление
                </Label>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Закрепить без уведомления участников
                </div>
              </div>
              <div className="ml-4">
                <Switch
                  checked={selectedNode.data.disableNotification ?? false}
                  onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { disableNotification: checked })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Synonyms Section for Content Management */}
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
