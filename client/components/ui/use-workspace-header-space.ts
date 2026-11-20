/** @fileoverview Подписи действий рабочих вкладок зависят от места рядом с выбранными названиями. */
import { useLayoutEffect, useRef } from 'react';

/**
 * Измеряет естественную ширину элемента вне потока, не изменяя видимые элементы.
 * @param element - Названия области или группа действий
 * @param actions - Раскрывать подписи служебных кнопок
 * @param documentationOnly - Оставить подпись только у документации
 * @param extraLabels - Группы дополнительных подписей для пробного измерения
 * @returns Требуемая ширина в пикселях
 */
function naturalWidth(element: HTMLElement, actions = false, documentationOnly = false, extraLabels?: Set<string>): number {
  const copy = element.cloneNode(true) as HTMLElement;
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  copy.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;width:max-content;max-width:none;pointer-events:none';
  if (extraLabels) {
    copy.querySelectorAll<HTMLElement>('[data-workspace-label]').forEach(label => {
      label.style.setProperty('display', extraLabels.has(label.dataset.workspaceLabel ?? '') ? 'inline' : 'none', 'important');
    });
  }
  if (actions) {
    copy.querySelectorAll<HTMLElement>('.workspace-tab-actions > :is(a,button)').forEach(button => {
      button.style.setProperty('width', 'auto', 'important');
      button.style.setProperty('padding-inline', 'var(--workspace-action-padding, 8px)', 'important');
      button.style.setProperty('gap', 'var(--workspace-action-gap, 8px)', 'important');
    });
    copy.querySelectorAll<HTMLElement>('.workspace-tab-actions span').forEach(span => span.style.setProperty('display', 'inline', 'important'));
    if (documentationOnly) {
      copy.querySelectorAll<HTMLElement>('.workspace-tab-actions > button').forEach(button => {
        button.style.setProperty('width', '32px', 'important');
        button.style.setProperty('padding-inline', '0', 'important');
        button.querySelectorAll<HTMLElement>('span').forEach(span => span.style.setProperty('display', 'none', 'important'));
      });
    }
  }
  element.parentElement!.append(copy);
  const width = copy.getBoundingClientRect().width;
  copy.remove();
  return width;
}

/**
 * Сохраняет подписи, пока они помещаются вместе с названиями проекта и бота.
 * @param scopeSelector - Селекторы выбранной области вкладки
 * @param actionsSelector - Контейнер служебных действий вкладки
 * @returns Ссылка на строку шапки
 */
export function useWorkspaceHeaderSpace(scopeSelector = "[role='group']", actionsSelector = '.workspace-tab-actions') {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const header = ref.current;
    const scope = header?.querySelector<HTMLElement>(scopeSelector);
    const actions = header?.querySelector<HTMLElement>(actionsSelector);
    /** Измеряем только строку с иконкой и названием, без скрытого описания раздела. */
    const title = header?.querySelector<HTMLElement>('.workspace-tab-heading > div:first-child > div:first-child');
    if (!header || !actions || !title) return;
    let frame = 0;
    /** Обновляет режим без зависимости от уже скрытых подписей и сжатых селекторов. */
    const measure = () => {
      const gap = parseFloat(getComputedStyle(header).columnGap) || 12;
      const titleWidth = naturalWidth(title);
      /** Помещаем селекторы в первую строку, когда все основные подписи видны. */
      const scopeNaturalWidth = scope ? naturalWidth(scope, false, false, new Set()) : 0;
      /** Отдельное поле проекта может сократить длинное название в закрытом состоянии. */
      const inlineScopeWidth = scope?.classList.contains('workspace-project-scope')
        ? Math.min(scopeNaturalWidth, 88)
        : scopeNaturalWidth;
      const inlineRequired = scope
        ? titleWidth + inlineScopeWidth + naturalWidth(actions, true, false, new Set()) + gap * 2
        : Infinity;
      const fitsInline = inlineRequired <= header.clientWidth;
      header.dataset.scopeInline = String(fitsInline);
      /** Во второй строке область проекта не отнимает место у служебных действий. */
      const scopeInTitleRow = scope && getComputedStyle(scope).gridRowStart !== '2';
      const spacing = gap * (scopeInTitleRow ? 2 : 1);
      const extraLabels = new Set<string>();
      /** Сначала помещаем подписи смены вида, затем подключения и массовых действий. */
      for (const group of ['view', 'connect', 'bulk']) {
        if (!header.querySelector(`[data-workspace-label="${group}"]`)) continue;
        extraLabels.add(group);
        const available = scopeInTitleRow || group !== 'bulk'
          ? titleWidth + spacing + naturalWidth(actions, true, false, extraLabels)
            + (scopeInTitleRow ? naturalWidth(scope, false, false, extraLabels) : 0)
          : scope ? naturalWidth(scope, false, false, extraLabels) : 0;
        if (available > header.clientWidth) extraLabels.delete(group);
      }
      header.dataset.extraLabels = [...extraLabels].join(' ');
      const scopeWidth = scopeInTitleRow
        ? fitsInline && scope.classList.contains('workspace-project-scope')
          ? inlineScopeWidth
          : naturalWidth(scope, false, false, extraLabels)
        : 0;
      const required = titleWidth + scopeWidth + naturalWidth(actions, true, false, extraLabels) + spacing;
      header.dataset.compactActions = String(required > header.clientWidth);
      /** Документация получает подпись раньше обновления, когда обе подписи не помещаются. */
      const documentationWidth = titleWidth + scopeWidth + naturalWidth(actions, true, true, extraLabels) + spacing;
      header.dataset.documentationLabel = String(documentationWidth <= header.clientWidth);
    };
    /** Объединяет изменения размеров и текста в одно измерение за кадр. */
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(schedule);
    resize.observe(header);
    const mutation = new MutationObserver(schedule);
    if (scope) mutation.observe(scope, { subtree: true, childList: true, characterData: true });
    /** Подпись обновления меняет ширину при загрузке, не дожидаясь изменения панели. */
    mutation.observe(actions, { subtree: true, childList: true, characterData: true });
    measure();
    void document.fonts?.ready.then(schedule);
    return () => { resize.disconnect(); mutation.disconnect(); cancelAnimationFrame(frame); };
  }, [scopeSelector, actionsSelector]);
  return ref;
}
