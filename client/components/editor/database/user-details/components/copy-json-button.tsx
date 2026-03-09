/**
 * @fileoverview Кнопка копирования JSON данных
 * @description Лаконичная кнопка для копирования JSON в буфер обмена
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

/**
 * Пропсы компонента CopyJsonButton
 */
interface CopyJsonButtonProps {
  /** Данные для копирования */
  data: unknown;
}

/**
 * Компонент кнопки копирования JSON
 * @param props - Пропсы компонента
 * @returns JSX компонент кнопки
 */
export function CopyJsonButton({ data }: CopyJsonButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 hover:bg-muted"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
