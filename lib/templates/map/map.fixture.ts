/**
 * @fileoverview Тестовые данные для шаблона геолокации
 * @module templates/map/map.fixture
 */

import type { MapTemplateParams } from './map.params';

/** Валидные параметры: базовая отправка геолокации */
export const validParamsBasic: MapTemplateParams = {
  nodeId: 'map_1',
  messageText: '📍 Наш офис находится здесь:',
  latitude: 55.7558,
  longitude: 37.6176,
  locationTitle: 'Офис',
  locationAddress: 'Москва, Красная площадь, 1',
  requestUserLocation: false,
  locationVariable: '',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  keyboardType: 'none',
  buttons: [],
  enableAutoTransition: false,
  autoTransitionTo: '',
  formatMode: 'none',
};

/** Валидные параметры: запрос геолокации у пользователя */
export const validParamsRequestLocation: MapTemplateParams = {
  nodeId: 'map_2',
  messageText: '📍 Поделитесь вашим местоположением:',
  requestUserLocation: true,
  locationVariable: 'user_location',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: true,
  keyboardType: 'reply',
  buttons: [
    { text: '📍 Отправить геолокацию', action: 'location', target: 'location', id: 'btn_location' },
  ],
  enableAutoTransition: false,
  autoTransitionTo: '',
  formatMode: 'none',
};

/** Валидные параметры: с проверками безопасности */
export const validParamsWithChecks: MapTemplateParams = {
  nodeId: 'map_3',
  messageText: '🔒 Геолокация для администраторов',
  latitude: 55.7558,
  longitude: 37.6176,
  locationTitle: 'Секретный офис',
  locationAddress: 'Москва',
  requestUserLocation: false,
  locationVariable: '',
  isPrivateOnly: true,
  adminOnly: true,
  requiresAuth: true,
  userDatabaseEnabled: true,
  keyboardType: 'none',
  buttons: [],
  enableAutoTransition: false,
  autoTransitionTo: '',
  formatMode: 'html',
};

/** Валидные параметры: с автопереходом */
export const validParamsWithAutoTransition: MapTemplateParams = {
  nodeId: 'map_4',
  messageText: '📍 Вот наш адрес!',
  latitude: 59.9343,
  longitude: 30.3351,
  locationTitle: 'Санкт-Петербург',
  locationAddress: 'Санкт-Петербург, Невский проспект, 1',
  requestUserLocation: false,
  locationVariable: '',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  keyboardType: 'none',
  buttons: [],
  enableAutoTransition: true,
  autoTransitionTo: 'main_menu',
  formatMode: 'none',
};

/** Валидные параметры: с inline клавиатурой */
export const validParamsWithInlineKeyboard: MapTemplateParams = {
  nodeId: 'map_5',
  messageText: '📍 Выберите действие:',
  latitude: 55.7558,
  longitude: 37.6176,
  locationTitle: 'Офис',
  locationAddress: 'Москва',
  requestUserLocation: false,
  locationVariable: '',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  keyboardType: 'inline',
  buttons: [
    { text: '🗺 Открыть в Яндекс.Картах', action: 'url', target: 'https://yandex.ru/maps', id: 'btn_yandex' },
    { text: '🗺 Открыть в Google Maps', action: 'url', target: 'https://maps.google.com', id: 'btn_google' },
  ],
  enableAutoTransition: false,
  autoTransitionTo: '',
  formatMode: 'none',
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123, // должно быть string
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  messageText: 'Геолокация',
  // отсутствует nodeId
};
