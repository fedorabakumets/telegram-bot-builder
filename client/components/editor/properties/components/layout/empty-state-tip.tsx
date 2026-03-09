/**
 * @fileoverview Компонент подсказки пустого состояния
 * 
 * Отображает одну подсказку с иконкой.
 */

interface EmptyStateTipProps {
  /** Тип иконки (Font Awesome) */
  icon: string;
  /** Текст подсказки */
  text: string;
}

/**
 * Компонент подсказки пустого состояния
 * 
 * @param {EmptyStateTipProps} props - Пропсы компонента
 * @returns {JSX.Element} Подсказка
 */
export function EmptyStateTip({ icon, text }: EmptyStateTipProps) {
  return (
    <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
      <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
        <i className={`fas fa-${icon} text-primary text-xs`}></i>
      </div>
      <span>{text}</span>
    </div>
  );
}
