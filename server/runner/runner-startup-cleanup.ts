/** @fileoverview Обратное закрытие уже созданных ресурсов при незавершённом запуске исполнителя. */

/**
 * Собирает действия остановки в обратном порядке создания ресурсов.
 * @returns Регистрация действий и однократное закрытие всех ресурсов.
 */
export function createRunnerStartupCleanup() {
  const actions: Array<() => Promise<unknown> | unknown> = [];
  let closing: Promise<void> | undefined;
  return {
    /** Регистрирует созданный ресурс; потребители регистрируются после брокера. */
    add(action: () => Promise<unknown> | unknown): void { actions.push(action); },
    /** Закрывает все ресурсы даже при ошибке отдельного действия. */
    close(): Promise<void> {
      closing ??= (async () => {
        const errors: unknown[] = [];
        for (const action of actions.reverse()) {
          try { await action(); } catch (error) { errors.push(error); }
        }
        if (errors.length) throw new AggregateError(errors, 'Не все ресурсы исполнителя закрылись');
      })();
      return closing;
    },
  };
}
