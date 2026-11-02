/** @fileoverview Безопасный возврат из диалога к тому же проектному отчёту. */
/** Принимает только относительный адрес аналитики текущего проекта. @returns Проверенный адрес возврата либо null. */
export function analyticsReturnHref(): string | null {
  const raw = new URLSearchParams(window.location.search).get('analyticsReturn');
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !/^\/projects\/\d+\/?$/.test(url.pathname) || url.searchParams.get('tab') !== 'analytics') return null;
    return url.pathname + url.search;
  } catch { return null; }
}
/** Возвращает к отчёту; фильтры сохраняются в настройках проекта. @returns Ссылка возврата либо отсутствие действия. */
export function AnalyticsDialogReturn() {
  const href = analyticsReturnHref();
  return href ? <a href={href} className="m-3 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Вернуться к аналитике</a> : null;
}
