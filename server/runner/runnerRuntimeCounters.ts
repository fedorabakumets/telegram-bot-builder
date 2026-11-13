/** @fileoverview Ограниченный снимок числовых счётчиков Python без произвольных полей и журналирования. */

/** Имена разрешённых контейнеров без пользовательских ключей и значений. */
const containers = new Set(["_user_var_locks", "_code_node_locks", "_bot_tables_cache", "_content_cache",
  "_media_file_id_cache", "_input_timeout_tasks", "_schedule_tasks", "_analytics_persistence_tasks",
  "_api_pending_responses", "_media_download_locks", "_media_task_leases", "_media_cache_directories",
  "_media_path_leases", "user_data", "all_user_vars", "_rate_counter_deques", "_user_last_seen"]);

/** Проверяет объект JSON без массивов. */
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Копирует разрешённые числа, сохраняя имена полей и возможность отсутствия измерения. */
function numbers<Key extends string>(value: unknown, keys: readonly Key[]): Partial<Record<Key, number>> {
  const source = record(value), result: Partial<Record<Key, number>> = {};
  for (const key of keys) {
    const number = source[key];
    if (typeof number === "number" && Number.isFinite(number) && number >= 0 && number <= Number.MAX_SAFE_INTEGER) result[key] = number;
  }
  return result;
}

/** Проверяет и копирует ограниченную выборку; содержимое данных никогда не сохраняется. */
function sanitize(value: unknown) {
  const source = record(value);
  const bots = (Array.isArray(source.bots) ? source.bots : []).slice(0, 100).flatMap(value => {
    const row = record(value), numeric = numbers(row, ["tokenId", "moduleCount", "rootTaskPending"]);
    if (typeof numeric.tokenId !== "number" || !Number.isSafeInteger(numeric.tokenId) || numeric.tokenId <= 0) return [];
    /** Отсутствующее или отклонённое измерение не подменяется нулём. */
    const measured: Record<string, Partial<Record<"count" | "shallowBytes", number>>> = {};
    const original = record(row.containers);
    for (const key of containers) if (Object.prototype.hasOwnProperty.call(original, key)) measured[key] = numbers(original[key], ["count", "shallowBytes"]);
    return [{ ...numeric, containers: measured, pools: numbers(row.pools, ["count", "size", "idle"]) }];
  });
  return { schemaVersion: 1, scope: "known_module_containers_shallow", bots,
    ...numbers(source, ["botsTotal", "exportedAiogramModels", "builtExportedAiogramModels", "modelScanLimit", "durationMs"]),
    botsTruncated: source.botsTruncated === true || Array.isArray(source.bots) && source.bots.length > 100,
    modulesTruncated: source.modulesTruncated === true, modelsTruncated: source.modelsTruncated === true };
}

/** Сохраняет один последний снимок с возрастом; новый экземпляр воркера получает пустое хранилище. */
export class RunnerRuntimeCounters {
  /** Последний проверенный снимок; история и исходные сообщения не удерживаются. */
  private latest: ReturnType<typeof sanitize> | null = null;
  /** Время получения по часам Node, которому нельзя подменить время из Python. */
  private receivedAt = 0;

  /** Поглощает служебные кадры, включая повреждённые: они не должны попадать в терминалы. */
  ingest(value: unknown, now = Date.now(), frameLength = 0): boolean {
    const source = record(value);
    if (source.type !== "worker_runtime_counters") return false;
    if (frameLength <= 262_144 && source.schemaVersion === 1 && Array.isArray(source.bots)) {
      this.latest = sanitize(source);
      this.receivedAt = now;
    }
    return true;
  }

  /** Возвращает независимую копию с явной устарелостью спустя тридцать секунд. */
  snapshot(now = Date.now()) {
    if (!this.latest) return null;
    return { ...structuredClone(this.latest), receivedAt: this.receivedAt,
      ageMs: Math.max(0, now - this.receivedAt), stale: now - this.receivedAt > 30_000 };
  }
}
