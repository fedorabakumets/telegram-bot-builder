/**
 * @fileoverview Панель свойств для узла авторизации Client API
 *
 * Отображает информацию о сессии Client API из таблицы user_telegram_settings.
 * Credentials (API ID, API Hash) читаются из базы данных, а не из узла.
 *
 * @module editor/properties/components/client-auth/client-auth-properties
 */

import { Node } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComingSoonBadge } from '../conditional-message-card/coming-soon-badge';

/**
 * Свойства компонента панели настроек Client API
 */
interface ClientAuthPropertiesProps {
  /** Данные узла для редактирования */
  node: Node;
}

/**
 * Компонент панели свойств для узла авторизации Client API
 *
 * @param {ClientAuthPropertiesProps} props - Свойства компонента
 * @returns {JSX.Element} Панель свойств
 */
export function ClientAuthProperties({ node }: ClientAuthPropertiesProps) {
  const sessionName = node.data?.sessionName || 'user_session';
  const sessionCreated = node.data?.sessionCreated === true;

  return (
    <div className="w-full bg-gradient-to-br from-emerald-50/40 to-teal-50/20 dark:from-emerald-950/30 dark:to-teal-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-emerald-200/40 dark:border-emerald-800/40 backdrop-blur-sm space-y-4">
      {/* Info Card */}
      <Card className="bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <i className="fas fa-database text-emerald-600 dark:text-emerald-400"></i>
              Источник данных
            </h4>
            <div className="flex items-center gap-2">
              <ComingSoonBadge />
              <Badge variant={sessionCreated ? "default" : "secondary"} className={sessionCreated ? "bg-emerald-500" : "bg-gray-500"}>
                {sessionCreated ? "✅ Сессия активна" : "⏳ Нет сессии"}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
            <p className="flex items-center gap-2">
              <i className="fas fa-table w-5"></i>
              <span>Таблица: <code className="bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">user_telegram_settings</code></span>
            </p>
            <p className="flex items-center gap-2">
              <i className="fas fa-key w-5"></i>
              <span>API ID и API Hash читаются из базы данных</span>
            </p>
            <p className="flex items-center gap-2">
              <i className="fas fa-user w-5"></i>
              <span>Сессия: <code className="bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">{sessionName}</code></span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/50">
        <CardContent className="p-4 text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400"></i>
            Как это работает:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 ml-1">
            <li>Credentials хранятся в таблице <code className="text-xs bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">user_telegram_settings</code></li>
            <li>Узел автоматически читает активную сессию из БД</li>
            <li>API ID/API Hash подставляются в сгенерированный код</li>
            <li>Для настройки авторизации используйте панель "Настройки проекта"</li>
          </ol>
        </CardContent>
      </Card>

      {/* Warning */}
      {!sessionCreated && (
        <Card className="bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/50">
          <CardContent className="p-4 text-sm text-amber-700 dark:text-amber-300">
            <p className="font-semibold mb-1 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400"></i>
              Внимание!
            </p>
            <p>Сессия ещё не создана. При запуске бота потребуется авторизация.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
