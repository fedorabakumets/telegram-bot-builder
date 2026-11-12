/** @fileoverview Упорядочивает команды одного бота, сохраняя параллельность разных ботов. */
export class LifecycleOperations {
  /** Незавершённые цепочки команд по идентификатору бота. */
  private readonly operations = new Map<number, Promise<unknown>>();

  /** Выполняет команду после предыдущей команды того же бота, даже если та завершилась ошибкой. */
  run<T>(tokenId: number, operation: () => Promise<T>): Promise<T> {
    const previous = this.operations.get(tokenId) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(operation);
    this.operations.set(tokenId, next);
    /** Удаляет только последнюю команду, чтобы не потерять следующую в очереди. */
    const cleanup = () => { if (this.operations.get(tokenId) === next) this.operations.delete(tokenId); };
    void next.then(cleanup, cleanup);
    return next;
  }

  /** Возвращает ботов, для которых команда ещё не завершилась. */
  keys(): number[] { return [...this.operations.keys()]; }
}
