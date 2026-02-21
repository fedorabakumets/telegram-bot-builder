/**
 * @fileoverview Компонент индикатора текстового ввода
 * 
 * Отображает визуальное представление режима текстового ввода
 * с информацией о переменной для сохранения данных.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента TextInputIndicator
 *
 * @interface TextInputIndicatorProps
 * @property {Node} node - Узел с настройками текстового ввода
 */
interface TextInputIndicatorProps {
  node: Node;
}

/**
 * Компонент индикатора текстового ввода
 *
 * @component
 * @description Отображает индикатор текстового ввода для узла
 *
 * @param {TextInputIndicatorProps} props - Свойства компонента
 * @param {Node} props.node - Узел с настройками ввода
 *
 * @returns {JSX.Element} Компонент индикатора текстового ввода
 */
export function TextInputIndicator({ node }: TextInputIndicatorProps) {
  return (
    <div className="bg-gradient-to-br from-cyan-50/70 to-blue-50/70 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-xl p-4 mb-4 border border-cyan-200 dark:border-cyan-800/30">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
          <i className="fas fa-keyboard text-cyan-600 dark:text-cyan-400 text-sm"></i>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-cyan-800 dark:text-cyan-200 mb-1">
            Текстовый ввод
          </div>
          <div className="text-xs text-cyan-600 dark:text-cyan-400 space-y-1">
            {(node.data as any).inputVariable && (
              <div className="flex items-center space-x-1">
                <i className="fas fa-tag text-xs"></i>
                <span>Сохранить в: <code className="bg-cyan-100 dark:bg-cyan-900/50 px-1 py-0.5 rounded text-xs">{(node.data as any).inputVariable}</code></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
