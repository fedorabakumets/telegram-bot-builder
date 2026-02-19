/**
 * @fileoverview Компонент настройки голосового сообщения
 * 
 * Блок управления настройками голосового сообщения: URL и длительность.
 * 
 * @module VoiceConfiguration
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaSelector } from '@/components/media/media-selector';

/**
 * Пропсы компонента настройки голосового сообщения
 */
interface VoiceConfigurationProps {
  /** ID проекта */
  projectId: number;
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки голосового сообщения
 * 
 * Позволяет указать:
 * - URL голосового сообщения (OGG с OPUS кодеком)
 * - Длительность в секундах
 * 
 * @param {VoiceConfigurationProps} props - Пропсы компонента
 * @returns {JSX.Element} Конфигурация голосового сообщения
 */
export function VoiceConfiguration({
  projectId,
  selectedNode,
  onNodeUpdate
}: VoiceConfigurationProps) {
  return (
    <div className="space-y-6">
      {/* Voice URL Section */}
      <div className="bg-gradient-to-br from-teal-50/50 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border border-teal-200/30 dark:border-teal-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
            <i className="fas fa-microphone text-teal-600 dark:text-teal-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-teal-900 dark:text-teal-100">Источник голосового сообщения</Label>
        </div>

        <MediaSelector
          projectId={projectId}
          value={selectedNode.data.voiceUrl || ''}
          onChange={(url) => onNodeUpdate(selectedNode.id, { voiceUrl: url })}
          fileType="audio"
          placeholder="https://example.com/voice-message.ogg"
          label="Источник голосового сообщения"
        />

        <div className="flex items-center space-x-2 text-xs text-teal-600 dark:text-teal-400 mt-3">
          <i className="fas fa-check-circle"></i>
          <span>OGG с OPUS кодеком • Макс. 20MB</span>
        </div>
      </div>

      {/* Voice Metadata Section */}
      <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-200/30 dark:border-purple-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <i className="fas fa-info-circle text-purple-600 dark:text-purple-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">Метаданные голосового сообщения</Label>
        </div>

        <div>
          <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
            <i className="fas fa-clock mr-1"></i>
            Длительность (секунды)
          </Label>
          <Input
            type="number"
            value={selectedNode.data.duration || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { duration: parseInt(e.target.value) || 0 })}
            className="border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-200"
            placeholder="30"
            min="0"
            max="3600"
          />
        </div>
      </div>
    </div>
  );
}
