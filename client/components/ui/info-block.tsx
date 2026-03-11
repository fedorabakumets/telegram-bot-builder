/**
 * @fileoverview Информационный блок с рекомендацией
 *
 * @module InfoBlock
 */

import { Alert, AlertDescription } from '@/components/ui/alert';

/** Пропсы компонента InfoBlock */
interface InfoBlockProps {
  /** Заголовок блока */
  title: string;
  /** Описание рекомендации */
  description: string | React.ReactNode;
  /** Тип блока: info | warning | recommendation */
  variant?: 'info' | 'warning' | 'recommendation';
}

/**
 * Информационный блок с рекомендацией
 *
 * @param {InfoBlockProps} props - Пропсы компонента
 * @returns {JSX.Element} Информационный блок
 */
export function InfoBlock({ title, description, variant = 'info' }: InfoBlockProps) {
  const variantStyles = {
    info: 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700',
    warning: 'border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700',
    recommendation: 'border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-700',
  };

  const variantIcons = {
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
    recommendation: 'fa-lightbulb',
  };

  const variantColors = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-orange-600 dark:text-orange-400',
    recommendation: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <Alert className={`border ${variantStyles[variant]}`}>
      <i className={`fas ${variantIcons[variant]} ${variantColors[variant]}`}></i>
      <AlertDescription className="ml-2 text-sm">
        <strong>{title}</strong>
        <br />
        {description}
      </AlertDescription>
    </Alert>
  );
}
