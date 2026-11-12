/** @fileoverview Подписанное поле настроек воркеров с доступной проверкой ввода. */
import type { UseFormReturn } from 'react-hook-form';
import type { RuntimeFieldView } from './runtime-types';
import type { RuntimeFormShape } from './runtime-field-control';
import { validateWorkerNumber } from './workers-settings-values';

/** Понятные названия поддерживаемых значений. */
const choices: Record<string, [string, string][]> = {
  USE_WORKER_POOL: [['true', 'Объединять в группы'], ['false', 'Отдельный процесс для каждого бота']],
  WORKER_GROUPING: [['project', 'По проекту'], ['owner', 'По владельцу'], ['shared', 'Все проекты вместе']],
  WORKER_RUNTIME: [['process', 'Процесс на сервере панели'], ['docker', 'Контейнер Docker'], ['remote', 'Удалённый исполнитель']],
  BOT_POLLING_MODE: [['direct', 'Постоянная работа'], ['ondemand', 'Сон при простое'], ['process', 'Освобождение памяти при простое']],
};

/** Свойства поля настроек. */
interface Props {
  /** Метаданные API. */
  field: RuntimeFieldView;
  /** Состояние и регистрация формы. */
  form: UseFormReturn<RuntimeFormShape>;
}

/** Отображает выбор режима или ввод с ошибкой непосредственно под полем. */
export function WorkersSettingsField({ field, form }: Props) {
  const error = form.formState.errors.values?.[field.env]?.message;
  const options = choices[field.env] ?? (field.kind === 'bool' ? [['true', 'Включено'], ['false', 'Выключено']] : undefined);
  const registration = form.register(`values.${field.env}`, field.kind === 'number' ? {
    validate: (value) => validateWorkerNumber(field.env, value),
  } : {});
  const common = { id: field.env, 'aria-invalid': Boolean(error), 'aria-describedby': `${field.env}-hint${error ? ` ${field.env}-error` : ''}` };
  const className = 'h-10 w-full min-w-0 rounded-md border border-neutral-700 bg-[#09090b] px-3 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50';
  const sourceLabel = field.source === 'environment' ? 'из окружения' : field.source === 'default' ? 'по умолчанию' : 'из админки';
  const effective = options?.find(([value]) => value === field.effectiveValue)?.[1] ?? field.effectiveValue;
  return <div className="min-w-0 space-y-2">
    <label className="block text-sm font-medium text-neutral-100" htmlFor={field.env}>{field.env === 'BOT_ON_DEMAND_MAX_ACTIVE' ? 'Лимит отдельных обработчиков' : field.label}</label>
    {options ? <select {...common} {...registration} className={className}>
      <option value="">Из окружения или по умолчанию</option>
      {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select> : <input {...common} {...registration} className={className} type={field.kind === 'secret' ? 'password' : field.kind === 'number' ? 'number' : 'text'}
      step={field.env === 'BOT_ON_DEMAND_IDLE_SECONDS' ? 'any' : undefined}
      autoComplete={field.kind === 'secret' ? 'new-password' : undefined}
      placeholder={field.kind === 'secret' && field.configured ? 'Уже задан; пустое поле сохраняет значение' : field.placeholder} />}
    <p id={`${field.env}-hint`} className="text-xs leading-relaxed text-neutral-400">{field.env === 'BOT_ON_DEMAND_MAX_ACTIVE'
      ? '0 — без ограничений, значение по умолчанию. Число от 1 до 64 ограничивает режим сна ondemand и отдельные Python процессы. Общий обработчик новой версии не применяет этот лимит.'
      : field.hint || 'Пустое поле использует окружение или стандартное значение.'}</p>
    {field.source && field.kind !== 'secret' ? <p className="text-xs text-neutral-500">Действующее значение: {effective || 'не задано'} · {sourceLabel}</p> : null}
    {error ? <p role="alert" id={`${field.env}-error`} className="text-xs text-red-400">{String(error)}</p> : null}
  </div>;
}
