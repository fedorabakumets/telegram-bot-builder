/**
 * @fileoverview Галочка автосохранения рядом с кнопкой сохранения холста
 */

/** Свойства галочки автосохранения */
interface AutosaveToggleProps {
  /** Включено ли автосохранение */
  checked: boolean;
  /** Смена флага */
  onChange: (enabled: boolean) => void;
}

/**
 * Галочка «Автосохранение» в верхней панели холста.
 * Свой квадрат, потому что общие стили чекбоксов сливают его с фоном.
 * @param props - Свойства
 * @returns Подпись с чекбоксом
 */
export function AutosaveToggle({ checked, onChange }: AutosaveToggleProps) {
  return (
    <label className="flex shrink-0 items-center gap-1.5 h-9 px-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none whitespace-nowrap">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label="Автосохранение"
        onClick={() => onChange(!checked)}
        style={{
          width: 16,
          height: 16,
          padding: 0,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          border: '2px solid #7c3aed',
          background: checked ? '#7c3aed' : '#ffffff',
          boxShadow: 'none',
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.2 6.2 L4.8 8.8 L9.8 3.2" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      Автосохранение
    </label>
  );
}
