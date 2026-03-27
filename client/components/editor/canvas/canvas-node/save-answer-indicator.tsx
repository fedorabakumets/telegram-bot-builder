/**
 * @fileoverview Preview of the save-answer node.
 */

import { Node } from '@/types/bot';

interface SaveAnswerIndicatorProps {
  node: Node;
}

const SOURCE_LABELS: Record<string, string> = {
  any: 'Последний ответ',
  text: 'Текстовый ответ',
  photo: 'Фото',
  video: 'Видео',
  audio: 'Аудио',
  document: 'Документ',
  location: 'Геолокация',
  contact: 'Контакт',
};

export function SaveAnswerIndicator({ node }: SaveAnswerIndicatorProps) {
  const data = node.data as any;
  const source = SOURCE_LABELS[data.inputType] || data.inputType || 'Последний ответ';
  const targetVariable = data.inputVariable || 'не задана';
  const mode = data.appendVariable ? 'append' : 'replace';

  return (
    <div className="rounded-xl p-4 mb-4 bg-gradient-to-br from-cyan-50/80 to-sky-50/80 dark:from-cyan-900/20 dark:to-sky-900/20 border border-cyan-100 dark:border-cyan-800/30">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-save text-cyan-600 dark:text-cyan-400 text-sm" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
            Сохранение ответа
          </div>
          <div className="text-xs text-cyan-600 dark:text-cyan-400 space-y-1">
            <div className="flex items-center gap-1">
              <i className="fas fa-question-circle text-xs" />
              <span>Источник: {source}</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="fas fa-tag text-xs" />
              <span>Переменная: <code className="bg-cyan-100 dark:bg-cyan-900/50 px-1 py-0.5 rounded text-xs">{targetVariable}</code></span>
            </div>
            <div className="flex items-center gap-1">
              <i className="fas fa-sync-alt text-xs" />
              <span>Режим: {mode === 'append' ? 'добавление' : 'замена'}</span>
            </div>
            {data.saveToDatabase && (
              <div className="flex items-center gap-1">
                <i className="fas fa-database text-xs" />
                <span>Сохранение в БД включено</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
