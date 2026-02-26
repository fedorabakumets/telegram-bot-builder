/**
 * @fileoverview Компонент сообщения о ненайденном файле
 * @description Лаконичное сообщение об ошибке загрузки файла
 */

/**
 * Пропсы компонента FileNotFound
 */
interface FileNotFoundProps {
  /** Дополнительный CSS-класс */
  className?: string;
}

/**
 * Компонент сообщения о ненайденном файле
 * @param props - Пропсы компонента
 * @returns JSX компонент сообщения
 */
export function FileNotFound({ className = '' }: FileNotFoundProps): React.JSX.Element {
  return (
    <div className={`text-xs text-muted-foreground italic ${className}`}>
      Файл не найден
    </div>
  );
}
