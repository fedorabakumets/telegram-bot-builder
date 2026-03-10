/**
 * @fileoverview Компонент бейджа версии приложения.
 * Отображает номер версии в виде стилизованного бейджа в цветах бренда.
 */

interface VersionBadgeProps {
  /** Номер версии для отображения (например, "2.0.0") */
  version: string;
}

/**
 * Компонент бейджа версии приложения.
 * @param props - Пропсы компонента
 * @param props.version - Номер версии для отображения
 */
export function VersionBadge({ version }: VersionBadgeProps) {
  return (
    <span className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-md shadow-lg shadow-blue-500/20">
      V {version}
    </span>
  );
}
