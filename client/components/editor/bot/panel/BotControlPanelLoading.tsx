/**
 * @fileoverview Состояние загрузки панели управления ботами
 *
 * Компонент отображает скелетон загрузки.
 *
 * @module BotControlPanelLoading
 */

import { Card, CardContent } from '@/components/ui/card';

/**
 * Состояние загрузки панели управления ботами
 */
export function BotControlPanelLoading() {
  return (
    <div className="grid gap-4">
      {[1, 2].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-muted rounded-lg" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
