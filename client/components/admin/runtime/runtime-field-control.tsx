/**
 * @fileoverview Одно поле формы настроек рантайма по метаданным API
 * @module components/admin/runtime/runtime-field-control
 */

import type { UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RuntimeFieldView, RuntimeStorageOption } from './runtime-types';

/** Значения формы: словарь по имени переменной */
export interface RuntimeFormShape {
  /** Поля раздела */
  values: Record<string, string>;
}

/** Свойства одного поля */
interface RuntimeFieldControlProps {
  /** Описание поля */
  field: RuntimeFieldView;
  /** Хранилища для kind=storage */
  storages: RuntimeStorageOption[];
  /** Регистрация react-hook-form */
  register: UseFormRegister<RuntimeFormShape>;
}

/**
 * Текст placeholder: у заданного секрета напоминание, иначе пример из API
 * @param field - Поле формы
 * @returns Строка placeholder или undefined
 */
function inputPlaceholder(field: RuntimeFieldView): string | undefined {
  if (field.kind === 'secret' && field.configured) return 'уже задан, пустое поле не стирает';
  return field.placeholder;
}

/**
 * Рисует input, список или секрет
 * @param props - Поле, хранилища и регистрация формы
 * @returns JSX элемент поля
 */
export function RuntimeFieldControl({ field, storages, register }: RuntimeFieldControlProps) {
  const name = `values.${field.env}` as const;
  const descriptionId = field.hint ? `${field.env}-hint` : undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={field.env}>{field.label}</Label>
      {field.env === 'TELEGRAM_BOT_API_MODE' ? (
        <select id={field.env} aria-describedby={descriptionId} className={selectClass} {...register(name)}>
          <option value="official">Официальный</option>
          <option value="local">Локальный</option>
        </select>
      ) : null}
      {field.env === 'TELEGRAM_CONNECTION_MODE' ? (
        <select id={field.env} aria-describedby={descriptionId} className={selectClass} {...register(name)}>
          <option value="">По прежним настройкам</option>
          <option value="direct">Напрямую</option>
          <option value="proxy">Через прокси</option>
          <option value="auto">Авто</option>
        </select>
      ) : null}
      {field.env === 'WORKER_GROUPING' ? (
        <select id={field.env} aria-describedby={descriptionId} className={selectClass} {...register(name)}>
          <option value="">По умолчанию — по проекту</option>
          <option value="project">По проекту — отдельный воркер</option>
          <option value="owner">По владельцу — проекты вместе</option>
          <option value="shared">Общий — все проекты вместе</option>
        </select>
      ) : null}
      {field.kind === 'bool' ? (
        <select id={field.env} className={selectClass} {...register(name)}>
          <option value="">не задано</option>
          <option value="true">включено</option>
          <option value="false">выключено</option>
        </select>
      ) : null}
      {field.kind === 'storage' ? (
        <select id={field.env} className={selectClass} {...register(name)}>
          <option value="">не выбрано</option>
          {storages.map((item) => (
            <option key={item.id} value={item.id} disabled={item.public}>
              {item.name} ({item.backend}){item.public ? ' — публичное' : ''}
            </option>
          ))}
        </select>
      ) : null}
      {field.env !== 'TELEGRAM_BOT_API_MODE' && field.env !== 'TELEGRAM_CONNECTION_MODE' && field.env !== 'WORKER_GROUPING' && field.kind !== 'bool' && field.kind !== 'storage' ? (
        <Input
          id={field.env}
          aria-describedby={descriptionId}
          type={field.kind === 'secret' ? 'password' : field.kind === 'number' ? 'number' : 'text'}
          autoComplete={field.kind === 'secret' ? 'new-password' : undefined}
          placeholder={inputPlaceholder(field)}
          {...register(name)}
        />
      ) : null}
      {field.kind === 'secret' && field.configured ? (
        <p className="text-xs text-muted-foreground">уже задан — пустое поле не стирает</p>
      ) : null}
      {field.hint ? <p id={descriptionId} className="text-xs text-muted-foreground">{field.hint}</p> : null}
    </div>
  );
}

/** Классы нативного списка в тон Input */
const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
