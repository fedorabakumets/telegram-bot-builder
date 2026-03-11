/**
 * @fileoverview Компонент переключателей типов ввода медиа
 *
 * Разделяет переключатели на группы: медиа (фото/видео/аудио),
 * документы и текстовый ввод. Показывает предупреждение при
 * смешивании документов с другими типами медиа.
 */

import { Node } from '@shared/schema';
import { TOGGLE_CONFIGS } from './media-input-config';
import { ToggleGroup } from './toggle-group';
import { InfoBlock } from '@/components/ui/info-block';

/** Пропсы компонента MediaInputToggles */
interface MediaInputTogglesProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/** Типы медиа для группы sendMediaGroup */
const MEDIA_GROUP_TYPES: (keyof Node['data'])[] = ['enablePhotoInput', 'enableVideoInput', 'enableAudioInput'];

/**
 * Компонент переключателей типов ввода медиа
 *
 * @param {MediaInputTogglesProps} props - Пропсы компонента
 * @returns {JSX.Element} Переключатели с группировкой по типам
 */
export function MediaInputToggles({ selectedNode, onNodeUpdate }: MediaInputTogglesProps) {
  const hasDocumentInput = selectedNode.data.enableDocumentInput ?? false;
  const hasMediaGroupInput = MEDIA_GROUP_TYPES.some(type => selectedNode.data[type] ?? false);
  const showMixedWarning = hasDocumentInput && hasMediaGroupInput;

  const mediaConfigs = TOGGLE_CONFIGS.filter(config =>
    MEDIA_GROUP_TYPES.includes(config.type as keyof Node['data'])
  );
  const documentConfigs = TOGGLE_CONFIGS.filter(config => config.type === 'enableDocumentInput');
  const textConfigs = TOGGLE_CONFIGS.filter(config => config.type === 'enableTextInput');

  return (
    <div className="space-y-4">
      <ToggleGroup
        title="Медиафайлы (группа)"
        icon="fa-images"
        colorClasses={{ title: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-600 dark:text-blue-400' }}
        configs={mediaConfigs}
        selectedNode={selectedNode}
        onNodeUpdate={onNodeUpdate}
      />

      <ToggleGroup
        title="Документы"
        icon="fa-file"
        colorClasses={{ title: 'text-orange-700 dark:text-orange-300', icon: 'text-orange-600 dark:text-orange-400' }}
        configs={documentConfigs}
        selectedNode={selectedNode}
        onNodeUpdate={onNodeUpdate}
      />

      {showMixedWarning && (
        <InfoBlock
          variant="warning"
          title="⚠️ Документы отправятся отдельным сообщением"
          description={
            <>
              Telegram не позволяет смешивать документы с фото/видео/аудио в одной группе.
              <br /><br />
              <strong>Рекомендация:</strong> используйте <strong>отдельный узел</strong> для отправки документов,
              чтобы пользователь получил всё в одном сообщении.
            </>
          }
        />
      )}

      {!showMixedWarning && hasDocumentInput && (
        <InfoBlock
          variant="info"
          title="📄 Документы будут отправлены группой"
          description="Если документов несколько, они отправятся вместе в одном сообщении"
        />
      )}

      <ToggleGroup
        title=""
        icon=""
        colorClasses={{ title: '', icon: '' }}
        configs={textConfigs}
        selectedNode={selectedNode}
        onNodeUpdate={onNodeUpdate}
      />
    </div>
  );
}
