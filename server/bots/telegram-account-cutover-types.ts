/** @fileoverview Контракты миграции ботов на общий Telegram-аккаунт. */

/** Зафиксированная фаза миграции. */
export type TelegramAccountCutoverPhase =
  | 'prepared'
  | 'legacy-stopped'
  | 'shared-installed'
  | 'shared-ready'
  | 'rollback-started'
  | 'shared-stopped'
  | 'legacy-restored'
  | 'rolled-back';

/** Неизменяемый план одной миграции. Содержит только идентификаторы. */
export interface TelegramAccountCutoverPlan {
  /** Уникальный идентификатор операции, одинаковый при повторном запуске. */
  readonly id: string;
  /** Проект, которому принадлежат аккаунт и боты. */
  readonly projectId: number;
  /** Целевой аккаунт проекта. */
  readonly accountId: number;
  /** Идентификаторы токенов ботов. */
  readonly botIds: readonly number[];
}

/** Контекст исполнения для идемпотентных действий среды запуска. */
export interface TelegramAccountCutoverExecution {
  /** Неизменяемый план миграции. */
  readonly plan: TelegramAccountCutoverPlan;
  /** Уникальный маркер захвата журнала. Устаревший маркер не даёт права на мутации. */
  readonly fence: string;
}

/** Доступ к журналу на время эксклюзивного захвата. */
export interface TelegramAccountCutoverLease {
  /** Текущая зафиксированная фаза. */
  readonly phase: TelegramAccountCutoverPhase;
  /** Маркер эксклюзивного захвата. */
  readonly fence: string;
  /**
   * Записывает следующую фазу с проверкой захвата и предыдущей фазы.
   * @param next - Следующая фаза.
   * @returns Подтверждение долговременной записи.
   */
  advance(next: TelegramAccountCutoverPhase): Promise<void>;
}

/** Долговременный журнал операций. */
export interface TelegramAccountCutoverJournal {
  /**
   * Сериализует пересекающиеся операции и проверяет совпадение плана при повторе.
   * Для отката требует ранее созданную запись. Фаза сохраняется между процессами.
   * @param plan - Нормализованный план миграции.
   * @param mode - Запуск миграции или откат.
   * @param work - Действие, выполняемое только с захваченным журналом.
   * @returns Достигнутая фаза.
   */
  exclusive(
    plan: TelegramAccountCutoverPlan,
    mode: 'cutover' | 'rollback',
    work: (lease: TelegramAccountCutoverLease) => Promise<TelegramAccountCutoverPhase>,
  ): Promise<TelegramAccountCutoverPhase>;
}

/** Действия среды запуска. Каждое действие повторяемо и проверяет актуальный маркер захвата. */
export interface TelegramAccountCutoverRuntime {
  /**
   * Сохраняет исходные намерения запуска, блокирует автоматический запуск старых клиентов и подтверждает их остановку.
   * @param execution - План и актуальный маркер захвата.
   * @returns Идентификаторы ботов с доказанной остановкой старого клиента.
   */
  quiesceLegacy(execution: TelegramAccountCutoverExecution): Promise<readonly number[]>;
  /**
   * Атомарно устанавливает привязки, сохраняя исходные настройки для отката.
   * @param execution - План и актуальный маркер захвата.
   * @returns Подтверждение сохранения привязок.
   */
  installSharedBindings(execution: TelegramAccountCutoverExecution): Promise<void>;
  /**
   * Разрешает общее подключение и восстанавливает нужные запуски после миграции.
   * @param execution - План и актуальный маркер захвата.
   * @returns Признак готовности общего подключения.
   */
  startShared(execution: TelegramAccountCutoverExecution): Promise<boolean>;
  /**
   * Блокирует запуск общего клиента и проверяет его отключение.
   * @param execution - План и актуальный маркер захвата.
   * @returns Подтверждение отсутствия общего подключения с данным ключом.
   */
  quiesceShared(execution: TelegramAccountCutoverExecution): Promise<boolean>;
  /**
   * Атомарно восстанавливает только исходные привязки миграции.
   * @param execution - План и актуальный маркер захвата.
   * @returns Подтверждение восстановления привязок.
   */
  restoreLegacyBindings(execution: TelegramAccountCutoverExecution): Promise<void>;
  /**
   * Восстанавливает сохранённые намерения запуска с проверкой уникальности подключений.
   * @param execution - План и актуальный маркер захвата.
   * @returns Подтверждение безопасного восстановления.
   */
  restoreLegacyRuntime(execution: TelegramAccountCutoverExecution): Promise<boolean>;
}
