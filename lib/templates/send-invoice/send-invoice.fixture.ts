/**
 * @fileoverview Тестовые данные для шаблона send_invoice
 * @module templates/send-invoice/send-invoice.fixture
 */

/** Пустой список */
export const validParamsEmpty = { sendInvoiceEntries: [] };

/** Один счёт с переходом после оплаты */
export const validParamsSingle = {
  sendInvoiceEntries: [{
    nodeId: 'inv_1',
    title: 'Доступ',
    description: 'Месяц подписки',
    amount: '100',
    photoUrl: '',
    payload: 'inv_1',
    savePaymentAmountTo: 'payment_amount',
    savePaymentChargeIdTo: 'payment_charge_id',
    autoTransitionTo: 'msg_thanks',
    targetNodeType: 'message',
  }],
};

/** Узлы для collectSendInvoiceEntries */
export const nodesWithInvoice: any[] = [
  {
    id: 'inv_1',
    type: 'send_invoice',
    position: { x: 0, y: 0 },
    data: {
      invoiceTitle: 'Товар',
      invoiceDescription: 'Описание',
      invoiceAmount: '50',
      invoicePhotoUrl: '/uploads/1/product.jpg',
      invoicePayload: '',
      savePaymentAmountTo: 'amt',
      savePaymentChargeIdTo: 'chg',
      autoTransitionTo: 'msg_1',
      enableAutoTransition: true,
      keyboardType: 'none',
      buttons: [],
    },
  },
  {
    id: 'msg_1',
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: 'Спасибо', buttons: [], keyboardType: 'none' },
  },
];

/** Узлы без счетов */
export const nodesWithoutInvoice: any[] = [
  {
    id: 'msg_1',
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: 'Hello', buttons: [], keyboardType: 'none' },
  },
];
