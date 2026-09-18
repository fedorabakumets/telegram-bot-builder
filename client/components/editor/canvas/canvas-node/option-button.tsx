/**
 * @fileoverview Кнопка опции multi-select на холсте (галочка или радио)
 * @module client/components/editor/canvas/canvas-node/option-button
 */

/** Символы отметки с ноды клавиатуры */
export interface SelectionMarkSymbols {
  /** Выбранная галочка (без группы) */
  checkmarkSymbol?: string;
  /** Выбранное радио */
  radioSelectedSymbol?: string;
  /** Невыбранное радио */
  radioUnselectedSymbol?: string;
}

/** Свойства OptionButton */
interface OptionButtonProps {
  /** Кнопка опции (может содержать selectionGroup) */
  button: any;
  /** Символы с data ноды */
  symbols?: SelectionMarkSymbols;
}

/**
 * Превью кнопки опции: радио или чекбокс
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки
 */
export function OptionButton({ button, symbols }: OptionButtonProps) {
  const isRadio =
    typeof button?.selectionGroup === 'string' && button.selectionGroup.trim().length > 0;
  const radioOff = (symbols?.radioUnselectedSymbol || '⚪️').trim() || '⚪️';
  const checkOn = (symbols?.checkmarkSymbol || '✅').trim() || '✅';

  return (
    <div className="group relative">
      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg text-xs font-medium text-green-700 dark:text-green-300 text-center border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-colors duration-200 shadow-sm relative">
        <div className="flex items-center justify-center space-x-1">
          {isRadio ? (
            <span className="opacity-70" title="Радиогруппа">
              {radioOff}
            </span>
          ) : (
            <span className="opacity-40" title="Не выбрано (галочка появится при выборе)">
              {checkOn}
            </span>
          )}
          <span className="break-words">{button.text}</span>
        </div>
        <div className="absolute inset-0 bg-green-500/10 dark:bg-green-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
      </div>
    </div>
  );
}
