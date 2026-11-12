/**
 * @fileoverview Проверка итогового режима пакета настроек до записи изменений.
 */
import { parseRuntimeMode, resolveRuntimeModeSettings, validateRuntimeMode } from './runtimeModePolicy';

/** Изменение переменной в пакете настроек. */
export interface RuntimeModeChange {
  /** Выполняемое действие. */
  action: string;
  /** Имя переменной. */
  key?: string;
  /** Новое значение. */
  value?: string;
  /** Идентификатор существующей переменной. */
  id?: number;
}

/** Сохранённая переменная, доступная текущему токену. */
interface RuntimeVariable {
  /** Идентификатор переменной. */
  id: number;
  /** Имя переменной. */
  key: string;
  /** Сохранённое значение. */
  value: string;
}

/**
 * Проверяет принадлежность строк и конечное сочетание режимов всего пакета.
 * @param changes - Изменения клиента.
 * @param variables - Переменные текущего токена.
 * @param launchMode - Сохранённый способ получения обновлений.
 * @param inheritedMode - Режим общего окружения при удалении индивидуального.
 * @param tokenId - Идентификатор для списка пробного включения общего режима.
 * @returns Признак изменения настройки выполнения.
 */
export function validateRuntimeModeBatch(
  changes: RuntimeModeChange[], variables: RuntimeVariable[],
  launchMode: string | null | undefined, inheritedMode?: string, tokenId?: number,
): boolean {
  inheritedMode ??= resolveRuntimeModeSettings([], launchMode, process.env, tokenId).mode;
  let finalLaunch = launchMode || 'polling';
  /** Последняя сохранённая настройка сохраняет приоритет при наличии дубликатов. */
  const ownModes = variables.filter(row => row.key === 'BOT_POLLING_MODE');
  let mode = ownModes[ownModes.length - 1]?.value ?? inheritedMode;
  let touched = false;
  let launchTouched = false;
  for (const change of changes) {
    const row = change.id ? variables.find(item => item.id === change.id) : undefined;
    if (change.id && !row) throw Object.assign(new Error('Переменная не принадлежит этому боту'), { status: 400 });
    if (change.key === 'LAUNCH_MODE' && change.action === 'update') {
      if (!['polling', 'webhook'].includes(change.value || '')) {
        throw Object.assign(new Error('Неизвестный способ получения обновлений'), { status: 400 });
      }
      finalLaunch = change.value!;
      launchTouched = true;
    }
    const key = change.key || row?.key;
    if (row?.key === 'BOT_POLLING_MODE' && key !== row.key) {
      throw Object.assign(new Error('Нельзя переименовать настройку режима выполнения'), { status: 400 });
    }
    if (row && row.key !== 'BOT_POLLING_MODE' && key === 'BOT_POLLING_MODE') {
      throw Object.assign(new Error('Режим выполнения нужно сохранить отдельной настройкой'), { status: 400 });
    }
    if (key !== 'BOT_POLLING_MODE') continue;
    if (touched) throw Object.assign(new Error('Режим выполнения можно изменить только один раз в пакете'), { status: 400 });
    if (!['create', 'update', 'delete'].includes(change.action)) {
      throw Object.assign(new Error('Неизвестное действие настройки режима'), { status: 400 });
    }
    mode = change.action === 'delete' ? inheritedMode : parseRuntimeMode(change.value);
    touched = true;
  }
  if (touched || launchTouched) validateRuntimeMode(parseRuntimeMode(mode), finalLaunch);
  return touched;
}
