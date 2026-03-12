/**
 * @fileoverview Определение компонента геолокации
 * Отправка координат
 */
import { ComponentDefinition } from "@shared/schema";

/** Сообщение с геолокацией */
export const locationMessage: ComponentDefinition = {
  id: 'location-message',
  name: 'Геолокация',
  description: 'Отправка координат',
  icon: 'fas fa-map-marker',
  color: 'bg-green-100 text-green-600',
  type: 'location',
  defaultData: {
    messageText: 'Местоположение',
    latitude: 55.7558,
    longitude: 37.6176,
    title: 'Москва',
    address: 'Москва, Россия',
    foursquareId: '',
    foursquareType: '',
    keyboardType: 'none',
    buttons: [],
    markdown: false,
    oneTimeKeyboard: false,
    resizeKeyboard: true
  }
};
