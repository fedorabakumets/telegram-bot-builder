/**
 * Логирование при наведении мышью на элементы
 */
export function setupHoverDebug() {
  document.addEventListener(
    'mouseover',
    (e) => {
      const target = e.target as HTMLElement;
      
      // Пропускаем некоторые элементы
      if (
        target.tagName === 'HTML' ||
        target.tagName === 'BODY' ||
        target.classList.contains('no-debug')
      ) {
        return;
      }

      const styles = window.getComputedStyle(target);
      const rect = target.getBoundingClientRect();

      console.group(`🖱️ Hover: ${target.tagName}.${target.className}`);
      console.log('Element:', target);
      console.log('ID:', target.id || 'нет');
      console.log('Classes:', target.className);
      console.log('Position:', {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
      console.log('Computed Styles:', {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        opacity: styles.opacity,
        display: styles.display,
        visibility: styles.visibility,
        pointerEvents: styles.pointerEvents,
        cursor: styles.cursor,
        transform: styles.transform,
        transition: styles.transition,
      });
      console.log('Data Attributes:', {
        testId: target.getAttribute('data-testid'),
        ...Object.fromEntries(
          Array.from(target.attributes)
            .filter((attr) => attr.name.startsWith('data-'))
            .map((attr) => [attr.name, attr.value])
        ),
      });
      console.groupEnd();
    },
    true
  );

  console.log('✅ Hover debug логирование активировано');
}

/**
 * Отключить дебаг логирование
 */
export function disableHoverDebug() {
  console.log('❌ Hover debug логирование отключено');
}
