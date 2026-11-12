/** @fileoverview Настройки группировки воркеров и поведения ботов при простое. */
import type { RuntimeField } from "./runtime-field";

/** Настройки запуска; сохранение не перезапускает уже работающих ботов. */
export const WORKER_RUNTIME_FIELDS: RuntimeField[] = [
  { env: "USE_WORKER_POOL", label: "Пул воркеров", kind: "bool", hint: "Объединяет ботов по выбранной группировке. Изменение применяется при следующем запуске бота." },
  { env: "WORKER_GROUPING", label: "Группировка", kind: "text", hint: "Отдельно по проектам, владельцам или общая группа. Работающие боты сохраняют прежнюю группу до перезапуска." },
  { env: "BOT_POLLING_MODE", label: "Режим ботов по умолчанию", kind: "text", hint: "Для ботов без собственного режима. Постоянная работа, сон или освобождение памяти. Режимы со сном доступны только для polling." },
  { env: "BOT_ON_DEMAND_IDLE_SECONDS", label: "Засыпать через, секунд", kind: "number", hint: "От 0,1 до 86400. Без настройки — 30 секунд. Применяется при следующем запуске бота." },
  { env: "BOT_ON_DEMAND_MAX_ACTIVE", label: "Лимит отдельных обработчиков", kind: "number", hint: "0 — без ограничений, значение по умолчанию. Для ondemand и отдельных process-обработчиков можно задать предел от 1 до 64. Общий process-обработчик не ограничивает число загруженных ботов. Изменение лимита требует пересоздания группы." },
  { env: "WORKER_RUNTIME", label: "Среда", kind: "text", hint: "Локальный процесс, Docker или удалённый исполнитель. Сохранение не меняет окружение запущенного исполнителя." },
  { env: "WORKER_DOCKER_IMAGE", label: "Образ Docker", kind: "text" },
  { env: "WORKER_DOCKER_NETWORK", label: "Сеть Docker", kind: "text" },
  { env: "WORKER_DOCKER_ISOLATE", label: "Изоляция сети и uploads", kind: "bool" },
  { env: "WORKER_DOCKER_BRIDGE_NAME", label: "Имя сети площадки", kind: "text" },
  { env: "WORKER_DOCKER_UPLOADS_READONLY", label: "Uploads только чтение", kind: "bool" },
  { env: "WORKER_MEMORY_LIMIT", label: "Память", kind: "text" },
  { env: "WORKER_CPUS", label: "CPU", kind: "text" },
  { env: "WORKER_ENV_PASSTHROUGH", label: "Переменные для ботов", kind: "text" },
  { env: "WORKER_DOCKER_HOST_ROOT", label: "Корень на хосте", kind: "text" },
];
