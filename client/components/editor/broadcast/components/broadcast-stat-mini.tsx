/**
 * @fileoverview Компактная карточка одной метрики для детальной панели рассылки
 * @module client/components/editor/broadcast/components/broadcast-stat-mini
 */

import { Card, CardContent } from '@/components/ui/card';

/**
 * Пропсы компонента StatMini
 */
export interface StatMiniProps {
  /** Иконка из lucide-react */
  icon: React.ElementType;
  /** Подпись метрики */
  label: string;
  /** Значение (число или строка) */
  value: number | string;
  /** CSS-класс цвета иконки */
  color: string;
  /** CSS-класс фона иконки */
  bg: string;
}

/**
 * Компактная карточка одной метрики с иконкой и значением.
 * @param props - Свойства карточки
 * @returns JSX элемент карточки
 */
export function StatMini({ icon: Icon, label, value, color, bg }: StatMiniProps) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-2">
        <div className={`rounded-md p-1.5 ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <div className="text-base font-bold leading-none">
            {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
