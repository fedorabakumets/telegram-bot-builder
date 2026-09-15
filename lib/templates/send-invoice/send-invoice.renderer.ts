/**
 * @fileoverview Рендерер шаблона send_invoice + create_invoice_link (+ роутер оплаты)
 * @module templates/send-invoice/send-invoice.renderer
 */

import type { Node } from '@shared/schema';
import type {
  CreateInvoiceLinkEntry,
  InvoiceProviderSource,
  SendInvoiceEntry,
} from './send-invoice.params';
import {
  normalizeInvoiceCurrency,
} from '@shared/invoice-currencies';
import { renderPartialTemplate } from '../template-renderer';
import { sortButtonsByLayout, computeAdjustStr } from '../keyboard/keyboard.renderer';
import { collectSuccessfulPaymentTriggerEntries } from '../successful-payment-trigger';

/**
 * Нормализует валюту, токен и флаги need_* из data узла
 * @param data - Data узла счёта / ссылки
 * @returns Поля currency / provider* / need*
 */
function resolveInvoicePaymentFields(data: any): {
  currency: string;
  providerSource: InvoiceProviderSource;
  providerToken: string;
  providerTokenEnv: string;
  needName: boolean;
  needEmail: boolean;
  needPhone: boolean;
} {
  const rawCurrency = String(data?.invoiceCurrency ?? 'XTR').trim() || 'XTR';
  const currencyDynamic = rawCurrency.includes('{');
  const currency = currencyDynamic ? rawCurrency : normalizeInvoiceCurrency(rawCurrency);
  const isStars = !currencyDynamic && currency === 'XTR';
  if (isStars) {
    return {
      currency: 'XTR',
      providerSource: 'inline',
      providerToken: '',
      providerTokenEnv: 'PAYMENT_PROVIDER_TOKEN',
      needName: false,
      needEmail: false,
      needPhone: false,
    };
  }
  const providerSource: InvoiceProviderSource =
    data?.invoiceProviderSource === 'env' ? 'env' : 'inline';
  const envKey = String(data?.invoiceProviderTokenEnv || 'PAYMENT_PROVIDER_TOKEN').trim();
  return {
    currency,
    providerSource,
    providerToken: String(data?.invoiceProviderToken || ''),
    providerTokenEnv: envKey || 'PAYMENT_PROVIDER_TOKEN',
    needName: data?.invoiceNeedName === true,
    needEmail: data?.invoiceNeedEmail === true,
    needPhone: data?.invoiceNeedPhone === true,
  };
}

/**
 * Собирает SendInvoiceEntry[] из узлов холста
 * @param nodes - Массив узлов
 * @returns Массив записей счетов в чат
 */
export function collectSendInvoiceEntries(nodes: Node[]): SendInvoiceEntry[] {
  const validNodes = nodes.filter(n => n != null);
  return validNodes
    .filter(n => (n.type as string) === 'send_invoice')
    .map(node => {
      const data = node.data as any;
      const customPayload = typeof data?.invoicePayload === 'string' ? data.invoicePayload.trim() : '';
      const targetId = data?.autoTransitionTo || '';
      const targetNode = validNodes.find(n => n.id === targetId);
      const rawButtons = Array.isArray(data?.buttons) ? data.buttons : [];
      const hasKeyboard = rawButtons.length > 0 && data?.keyboardType === 'inline';
      const sortedButtons = hasKeyboard
        ? sortButtonsByLayout(rawButtons, data?.keyboardLayout)
        : [];
      const payment = resolveInvoicePaymentFields(data);
      return {
        nodeId: node.id,
        title: data?.invoiceTitle || 'Товар',
        description: data?.invoiceDescription || 'Описание',
        amount: data?.invoiceAmount || '1',
        ...payment,
        photoUrl: data?.invoicePhotoUrl || '',
        payload: customPayload || node.id,
        savePaymentAmountTo: data?.savePaymentAmountTo || '',
        savePaymentChargeIdTo: data?.savePaymentChargeIdTo || '',
        saveOrderNameTo: data?.saveOrderNameTo || '',
        saveOrderEmailTo: data?.saveOrderEmailTo || '',
        saveOrderPhoneTo: data?.saveOrderPhoneTo || '',
        autoTransitionTo: targetId,
        targetNodeType: targetNode?.type || 'message',
        hasKeyboard,
        buttons: sortedButtons,
        keyboardLayout: data?.keyboardLayout,
      };
    });
}

/**
 * Собирает CreateInvoiceLinkEntry[] из узлов холста
 * @param nodes - Массив узлов
 * @returns Массив записей ссылок на счёт
 */
export function collectCreateInvoiceLinkEntries(nodes: Node[]): CreateInvoiceLinkEntry[] {
  const validNodes = nodes.filter(n => n != null);
  return validNodes
    .filter(n => (n.type as string) === 'create_invoice_link')
    .map(node => {
      const data = node.data as any;
      const customPayload = typeof data?.invoicePayload === 'string' ? data.invoicePayload.trim() : '';
      const payment = resolveInvoicePaymentFields(data);
      return {
        nodeId: node.id,
        title: data?.invoiceTitle || 'Товар',
        description: data?.invoiceDescription || 'Описание',
        amount: data?.invoiceAmount || '1',
        ...payment,
        photoUrl: data?.invoicePhotoUrl || '',
        payload: customPayload || node.id,
        saveInvoiceLinkTo: data?.saveInvoiceLinkTo || 'invoice_url',
        savePaymentAmountTo: data?.savePaymentAmountTo || '',
        savePaymentChargeIdTo: data?.savePaymentChargeIdTo || '',
        saveOrderNameTo: data?.saveOrderNameTo || '',
        saveOrderEmailTo: data?.saveOrderEmailTo || '',
        saveOrderPhoneTo: data?.saveOrderPhoneTo || '',
        autoTransitionTo: data?.autoTransitionTo || '',
        afterPaymentTo: data?.afterPaymentTo || '',
        subscription:
          data?.invoiceSubscription === true
          && (payment.currency === 'XTR' || String(payment.currency).includes('{')),
      };
    });
}

/**
 * Генерирует Python: счета, ссылки, pre_checkout и successful_payment
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateSendInvoiceHandlers(nodes: Node[]): string {
  const entries = collectSendInvoiceEntries(nodes);
  const linkEntries = collectCreateInvoiceLinkEntries(nodes);
  const triggerEntries = collectSuccessfulPaymentTriggerEntries(nodes);
  if (entries.length === 0 && linkEntries.length === 0 && triggerEntries.length === 0) {
    return '';
  }

  return renderPartialTemplate('send-invoice/send-invoice.py.jinja2', {
    sendInvoiceEntries: entries.map((entry) => ({
      ...entry,
      adjustStr: computeAdjustStr(entry.keyboardLayout as any),
    })),
    createInvoiceLinkEntries: linkEntries,
    successfulPaymentTriggerEntries: triggerEntries,
  });
}
