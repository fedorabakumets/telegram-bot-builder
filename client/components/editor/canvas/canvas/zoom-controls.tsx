/**
 * @fileoverview Компонент кнопок управления масштабом холста
 * 
 * Содержит кнопки уменьшения/увеличения масштаба,
 * выпадающий список выбора масштаба и кнопку "Уместить всё".
 */

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Свойства компонента управления масштабом
 */
interface ZoomControlsProps {
  /** Текущий масштаб в процентах */
  zoom: number;
  /** Доступность уменьшения масштаба */
  canZoomOut: boolean;
  /** Доступность увеличения масштаба */
  canZoomIn: boolean;
  /** Доступность уместить всё */
  canFitToContent: boolean;
  /** Колбэк уменьшения масштаба */
  onZoomOut: () => void;
  /** Колбэк увеличения масштаба */
  onZoomIn: () => void;
  /** Колбэк сброса масштаба */
  onResetZoom: () => void;
  /** Колбэк уместить всё */
  onFitToContent: () => void;
  /** Колбэк установки уровня масштаба */
  onZoomLevelChange: (level: number) => void;
}

/**
 * Предустановленные уровни масштаба
 */
const ZOOM_LEVELS = [1, 5, 10, 25, 50, 75, 100, 125, 150, 200];

/**
 * Базовые классы для кнопок
 */
const BUTTON_BASE_CLASSES = 'flex-shrink-0 p-0 h-9 w-9 rounded-xl border transition-colors duration-200 group flex items-center justify-center';
const BUTTON_INACTIVE_CLASSES = 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70';
const BUTTON_DISABLED_CLASSES = 'opacity-30 cursor-not-allowed';
const ICON_CLASSES = 'text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors';

/**
 * Компонент кнопок управления масштабом холста
 * 
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками управления масштабом
 */
export function ZoomControls({
  zoom,
  canZoomOut,
  canZoomIn,
  canFitToContent,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onFitToContent,
  onZoomLevelChange
}: ZoomControlsProps) {
  return (
    <>
      {/* Кнопка уменьшения масштаба */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={`${BUTTON_BASE_CLASSES} ${BUTTON_INACTIVE_CLASSES} ${!canZoomOut ? BUTTON_DISABLED_CLASSES : ''}`}
        title="Уменьшить масштаб (Ctrl + -)"
      >
        <i className={`fas fa-search-minus ${ICON_CLASSES}`} />
      </button>

      {/* Выпадающий список выбора масштаба */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex-shrink-0 px-2 py-0 h-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 text-slate-700 dark:text-slate-300 font-mono text-xs group flex items-center gap-1"
            title="Выбрать масштаб"
          >
            <span className="flex items-center justify-center space-x-1">
              <span>{Math.round(zoom)}%</span>
              <i className="fas fa-chevron-down text-xs opacity-50 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="w-48 p-3">
          <div className="space-y-3">
            {/* Ползунок масштаба */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
                Точный масштаб
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={Math.round(zoom)}
                  onChange={(e) => onZoomLevelChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/50 px-2 py-1 rounded min-w-[45px] text-center">
                  {Math.round(zoom)}%
                </span>
              </div>
            </div>

            {/* Быстрый выбор масштаба */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2 py-1">
                Быстрый выбор
              </div>
              {ZOOM_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => onZoomLevelChange(level)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
                    Math.abs(zoom - level) < 1
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{level}%</span>
                    {level === 100 && <span className="text-xs opacity-60">По умолчанию</span>}
                    {level === 200 && <span className="text-xs opacity-60">Максимум</span>}
                    {level === 1 && <span className="text-xs opacity-60">Минимум</span>}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-slate-600 my-1" />

            {/* Кнопка сбросить вид */}
            <button
              onClick={onResetZoom}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-blue-600 dark:text-blue-400"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-home text-xs" />
                <span>Сбросить вид</span>
              </div>
            </button>

            {/* Кнопка уместить всё */}
            <button
              onClick={onFitToContent}
              disabled={!canFitToContent}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-green-600 dark:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-expand-arrows-alt text-xs" />
                <span>Уместить всё</span>
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Кнопка увеличения масштаба */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={`${BUTTON_BASE_CLASSES} ${BUTTON_INACTIVE_CLASSES} ${!canZoomIn ? BUTTON_DISABLED_CLASSES : ''} flex items-center justify-center`}
        title="Увеличить масштаб (Ctrl + +)"
      >
        <i className={`fas fa-search-plus ${ICON_CLASSES}`} />
      </button>

      {/* Кнопка уместить в экран */}
      <button
        onClick={onFitToContent}
        disabled={!canFitToContent}
        className={`${BUTTON_BASE_CLASSES} ${BUTTON_INACTIVE_CLASSES} ${!canFitToContent ? BUTTON_DISABLED_CLASSES : ''} flex items-center justify-center`}
        title="Уместить в экран (Ctrl + 1)"
      >
        <i className={`fas fa-expand-arrows-alt ${ICON_CLASSES}`} />
      </button>
    </>
  );
}
