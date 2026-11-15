/**
 * @fileoverview Безопасное отображение технических подробностей ошибки рассылки.
 */

/**
 * Удаляет секреты из диагностического текста перед показом в интерфейсе.
 * @param message - Сохранённая ошибка доставки
 * @returns Подробности без токенов, авторизации и параметров ссылок
 */
export function deliveryErrorDetails(message?: string | null): string {
  return (message ?? '').trim()
    .replace(/https?:\/\/[^\s<>"']+/gi, (value) => {
      try {
        const url = new URL(value);
        url.username = ''; url.password = ''; url.search = ''; url.hash = '';
        return url.toString();
      } catch { return '[адрес скрыт]'; }
    })
    .replace(/\b(?:bot)?\d{5,}:[A-Za-z0-9_-]{20,}/g, '[токен скрыт]')
    .replace(/(authorization\s*[:=]\s*)(?:bearer\s+)?[^\s,;]+/gi, '$1[скрыто]')
    .replace(/((?:token|secret|password|api[_-]?key)\s*[:=]\s*)[^\s,;]+/gi, '$1[скрыто]')
    .slice(0, 2000);
}
