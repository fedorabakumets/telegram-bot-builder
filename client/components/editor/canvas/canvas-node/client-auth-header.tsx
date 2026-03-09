/**
 * @fileoverview Компонент заголовка узла авторизации Client API
 * 
 * Отображает заголовок для узла client_auth с иконкой и названием.
 * 
 * @module editor/canvas/canvas-node/client-auth-header
 */

/**
 * Пропсы компонента ClientAuthHeader
 */
interface ClientAuthHeaderProps {
  // Резерв для будущих свойств
}

/**
 * Компонент заголовка авторизации Client API
 * 
 * @returns {JSX.Element} Заголовок узла
 */
export function ClientAuthHeader({}: ClientAuthHeaderProps) {
  return (
    <span className="inline-flex items-center">
      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 mr-2">
        🔐 Client API
      </span>
    </span>
  );
}
