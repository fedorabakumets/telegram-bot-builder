/**
 * @fileoverview Валюта счёта и токен провайдера (нода / env)
 * @module components/editor/properties/components/configuration/invoice-currency-provider-fields
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INVOICE_CURRENCY_OPTIONS, isStaticStarsCurrency, normalizeInvoiceCurrency } from './invoice-currency-utils';

export { normalizeInvoiceCurrency } from './invoice-currency-utils';
export type { InvoiceCurrencyCode } from './invoice-currency-utils';

/** Значение селекта «из переменной» */
const CURRENCY_FROM_VAR = '__VAR__';

/** Пропсы блока валюты и провайдера */
interface InvoiceCurrencyProviderFieldsProps {
  /** ID узла */
  nodeId: string;
  /** Data узла */
  data: any;
  /** Обновление data */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Env-ключи бота */
  envVariables?: Array<{ key: string; value: string }>;
}

/**
 * Селект валюты; при фиате — источник и значение provider_token
 * @param props - Пропсы
 * @returns JSX
 */
export function InvoiceCurrencyProviderFields({
  nodeId,
  data,
  onNodeUpdate,
  envVariables = [],
}: InvoiceCurrencyProviderFieldsProps) {
  const raw = String(data?.invoiceCurrency ?? 'XTR').trim() || 'XTR';
  const fromVar = raw.includes('{');
  const currency = fromVar ? CURRENCY_FROM_VAR : normalizeInvoiceCurrency(raw);
  const isStars = isStaticStarsCurrency(raw);
  const source = data?.invoiceProviderSource === 'env' ? 'env' : 'inline';
  const varInner = fromVar ? raw.replace(/^\{|\}$/g, '') : 'shop_currency';

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Валюта</Label>
        <Select
          value={currency}
          onValueChange={(next) => {
            if (next === CURRENCY_FROM_VAR) {
              onNodeUpdate(nodeId, {
                invoiceCurrency: `{${varInner || 'shop_currency'}}`,
                invoiceSubscription: false,
              });
              return;
            }
            const updates: Record<string, unknown> = { invoiceCurrency: next };
            if (next !== 'XTR') updates.invoiceSubscription = false;
            onNodeUpdate(nodeId, updates);
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={CURRENCY_FROM_VAR}>Из переменной…</SelectItem>
            {INVOICE_CURRENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.code} value={opt.code}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fromVar && (
          <Input
            value={varInner}
            onChange={(e) => {
              const name = e.target.value.trim().replace(/[{}]/g, '') || 'shop_currency';
              onNodeUpdate(nodeId, {
                invoiceCurrency: `{${name}}`,
                invoiceSubscription: false,
              });
            }}
            placeholder="shop_currency"
            className="h-8 text-xs font-mono"
          />
        )}
        {!isStars && (
          <p className="text-[10px] text-muted-foreground">
            Цена в минимальных единицах (100 = 1.00). Нужен токен из BotFather → Payments.
          </p>
        )}
      </div>

      {!isStars && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Токен провайдера</Label>
            <Select
              value={source}
              onValueChange={(v) => onNodeUpdate(nodeId, { invoiceProviderSource: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inline">В ноде</SelectItem>
                <SelectItem value="env">Из переменной окружения</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {source === 'inline' ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Значение токена</Label>
              <Input
                type="password"
                autoComplete="off"
                value={data?.invoiceProviderToken || ''}
                onChange={(e) =>
                  onNodeUpdate(nodeId, { invoiceProviderToken: e.target.value })
                }
                placeholder="2051…:TEST:…"
                className="h-8 text-xs font-mono"
              />
              <p className="text-[10px] text-amber-700/80 dark:text-amber-300/70">
                Токен сохранится в проекте. Для продакшена лучше env.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Переменная окружения</Label>
              {envVariables.length > 0 ? (
                <Select
                  value={data?.invoiceProviderTokenEnv || 'PAYMENT_PROVIDER_TOKEN'}
                  onValueChange={(v) =>
                    onNodeUpdate(nodeId, { invoiceProviderTokenEnv: v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {envVariables.map((v) => (
                      <SelectItem key={v.key} value={v.key}>
                        {v.key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={data?.invoiceProviderTokenEnv || ''}
                  onChange={(e) =>
                    onNodeUpdate(nodeId, { invoiceProviderTokenEnv: e.target.value })
                  }
                  placeholder="PAYMENT_PROVIDER_TOKEN"
                  className="h-8 text-xs font-mono"
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
