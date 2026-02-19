/**
 * @fileoverview Компонент редактирования синонимов
 * Для команд и узлов в Telegram Bot Builder.
 * @module synonym-editor
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Button as UIButton } from '@/components/ui/button';

/** Пропсы компонента SynonymEditor */
export interface SynonymEditorProps {
  synonyms: string[];
  onUpdate: (synonyms: string[]) => void;
  placeholder?: string;
  title?: string;
  description?: string;
  allNodesFromAllSheets?: Array<{ node: Node; sheetName: string }>;
  currentNodeId?: string;
}

/**
 * Компонент для редактирования синонимов.
 * Проверяет дубликаты в реальном времени.
 * @param {SynonymEditorProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент редактора синонимов
 */
export function SynonymEditor({
  synonyms, onUpdate,
  placeholder = 'Например: старт, привет, начать',
  title = 'Синонимы',
  description,
  allNodesFromAllSheets = [],
  currentNodeId
}: SynonymEditorProps): JSX.Element {
  const checkDuplicate = (value: string, currentIndex: number): boolean => {
    if (!value.trim()) return false;
    const normalizedValue = value.trim().toLowerCase();
    if (synonyms.some((syn, idx) => idx !== currentIndex && syn.trim().toLowerCase() === normalizedValue)) return true;
    return allNodesFromAllSheets.some(({ node }) =>
      node.id !== currentNodeId && (node.data.synonyms || []).some((syn: string) => syn.trim().toLowerCase() === normalizedValue)
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <i className="fas fa-signature text-slate-600 dark:text-slate-400 text-xs sm:text-sm"></i>
          {title}
        </label>
      </div>
      {description && (
        <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40">
          <i className="fas fa-circle-info text-purple-600 dark:text-purple-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
          <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 leading-relaxed">{description}</p>
        </div>
      )}
      <div className="space-y-2 sm:space-y-2.5">
        {synonyms.map((synonym, index) => {
          const isDuplicate = checkDuplicate(synonym, index);
          return (
            <div key={index} className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex-1">
                  <Input
                    value={synonym}
                    onChange={(e) => { const newSynonyms = [...synonyms]; newSynonyms[index] = e.target.value; onUpdate(newSynonyms); }}
                    placeholder={placeholder}
                    className={`h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-3.5 border transition-all ${isDuplicate ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200/50 dark:focus:ring-red-900/50 bg-red-50/30 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:ring-purple-200/50 dark:focus:ring-purple-900/50'}`}
                  />
                </div>
                <UIButton onClick={() => { const newSynonyms = [...synonyms]; newSynonyms.splice(index, 1); onUpdate(newSynonyms); }} variant="ghost" size="sm" className="h-9 sm:h-10 w-9 sm:w-10 p-0 hover:bg-red-100/50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Удалить синоним">
                  <i className="fas fa-trash text-xs sm:text-sm"></i>
                </UIButton>
              </div>
              {isDuplicate && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 pl-3 sm:pl-3.5">
                  <i className="fas fa-exclamation-circle text-xs"></i>
                  <span>Такой синоним уже существует</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <UIButton onClick={() => { const newSynonyms = [...synonyms, '']; onUpdate(newSynonyms); }} className="w-full h-9 sm:h-10 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700 shadow-md hover:shadow-lg transition-all text-white">
        <i className="fas fa-plus mr-2"></i>
        <span className="hidden sm:inline">Добавить синоним</span>
        <span className="sm:hidden">Добавить</span>
      </UIButton>
    </div>
  );
}
