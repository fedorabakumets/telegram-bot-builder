/**
 * @fileoverview Обработка узлов геолокации и контактов
 * 
 * Модуль создаёт Python-код для отправки геолокации, карт
 * и контактной информации через callback query.
 * 
 * @module bot-generator/node-handlers/generate-location-contact-handlers
 */

import { Button } from '../../bot-generator';
import { generateButtonText } from '../format';

/**
 * Генерирует Python-код для отправки геолокации
 */
export function generateLocationHandler(
  targetNode: any,
  indent: string = '    '
): string {
  let latitude = targetNode.data.latitude || 55.7558;
  let longitude = targetNode.data.longitude || 37.6176;
  const title = targetNode.data.title || "";
  const address = targetNode.data.address || "";
  const mapService = targetNode.data.mapService || 'custom';
  const generateMapPreview = targetNode.data.generateMapPreview !== false;

  let code = '';
  code += `${indent}# Определяем координаты на основе выбранного сервиса карт\n`;

  if (mapService === 'yandex' && targetNode.data.yandexMapUrl) {
    code += `${indent}yandex_url = "${targetNode.data.yandexMapUrl}"\n`;
    code += `${indent}extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n`;
    code += `${indent}if extracted_lat and extracted_lon:\n`;
    code += `${indent}    latitude, longitude = extracted_lat, extracted_lon\n`;
    code += `${indent}else:\n`;
    code += `${indent}    latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
  } else if (mapService === 'google' && targetNode.data.googleMapUrl) {
    code += `${indent}google_url = "${targetNode.data.googleMapUrl}"\n`;
    code += `${indent}extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n`;
    code += `${indent}if extracted_lat and extracted_lon:\n`;
    code += `${indent}    latitude, longitude = extracted_lat, extracted_lon\n`;
    code += `${indent}else:\n`;
    code += `${indent}    latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
  } else if (mapService === '2gis' && targetNode.data.gisMapUrl) {
    code += `${indent}gis_url = "${targetNode.data.gisMapUrl}"\n`;
    code += `${indent}extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n`;
    code += `${indent}if extracted_lat and extracted_lon:\n`;
    code += `${indent}    latitude, longitude = extracted_lat, extracted_lon\n`;
    code += `${indent}else:\n`;
    code += `${indent}    latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
  } else {
    code += `${indent}latitude, longitude = ${latitude}, ${longitude}\n`;
  }

  if (title) code += `${indent}title = "${title}"\n`;
  if (address) code += `${indent}address = "${address}"\n`;

  code += `${indent}try:\n`;
  code += `${indent}    # Удаляем старое сообщение\n`;
  code += `${indent}    # ятправляем геолокацию\n`;
  
  if (title || address) {
    code += `${indent}    await bot.send_venue(\n`;
    code += `${indent}        callback_query.from_user.id,\n`;
    code += `${indent}        latitude=latitude,\n`;
    code += `${indent}        longitude=longitude,\n`;
    code += `${indent}        title=title,\n`;
    code += `${indent}        address=address\n`;
    code += `${indent}    )\n`;
  } else {
    code += `${indent}    await bot.send_location(\n`;
    code += `${indent}        callback_query.from_user.id,\n`;
    code += `${indent}        latitude=latitude,\n`;
    code += `${indent}        longitude=longitude\n`;
    code += `${indent}    )\n`;
  }

  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошибка отправки геолокации: {e}")\n`;
  code += `${indent}    await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить геолокацию")\n`;

  // Генерируем кнопки для картографических сервисов
  if (generateMapPreview) {
    code += generateMapButtons(targetNode, indent);
  }

  // Дополнительные кнопки
  if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons?.length > 0) {
    code += `${indent}\n`;
    code += `${indent}# Отправляем дополнительные кнопки\n`;
    code += generateInlineButtons(targetNode.data.buttons, indent);
    code += `${indent}await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)\n`;
  }

  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошябка отправки местоположения: {e}")\n`;
  code += `${indent}    await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")\n`;

  return code;
}

/**
 * Генерирует Python-код для отправки контакта
 */
export function generateContactHandler(
  targetNode: any,
  indent: string = '    '
): string {
  const phoneNumber = targetNode.data.phoneNumber || "+7 999 123 45 67";
  const firstName = targetNode.data.firstName || "Контакт";
  const lastName = targetNode.data.lastName || "";
  const userId = targetNode.data.userId || null;
  const vcard = targetNode.data.vcard || "";

  let code = '';
  code += `${indent}phone_number = "${phoneNumber}"\n`;
  code += `${indent}first_name = "${firstName}"\n`;
  if (lastName) code += `${indent}last_name = "${lastName}"\n`;
  if (userId) code += `${indent}user_id = ${userId}\n`;
  if (vcard) code += `${indent}vcard = """${vcard}"""\n`;

  code += `${indent}try:\n`;

  if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons?.length > 0) {
    code += generateInlineButtons(targetNode.data.buttons, indent);
    
    if (lastName && userId && vcard) {
      code += `${indent}    await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard, reply_markup=keyboard)\n`;
    } else if (lastName) {
      code += `${indent}    await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, reply_markup=keyboard)\n`;
    } else {
      code += `${indent}    await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, reply_markup=keyboard)\n`;
    }
  } else {
    if (lastName && userId && vcard) {
      code += `${indent}    await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard)\n`;
    } else if (lastName) {
      code += `${indent}    await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name)\n`;
    } else {
      code += `${indent}    await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name)\n`;
    }
  }

  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошибка отправки контакта: {e}")\n`;
  code += `${indent}    await safe_edit_or_send(callback_query, f"❌ Не удалось отправить контакт")\n`;

  return code;
}

/**
 * Генерирует кнопки для картографических сервисов
 */
function generateMapButtons(targetNode: any, indent: string): string {
  let code = '';
  code += `${indent}\n`;
  code += `${indent}# Генерируем ссылки на картографические сервисы\n`;
  code += `${indent}map_urls = generate_map_urls(latitude, longitude, title)\n`;
  code += `${indent}\n`;
  code += `${indent}# Создаем кнопки для различных карт\n`;
  code += `${indent}map_builder = InlineKeyboardBuilder()\n`;
  code += `${indent}map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n`;
  code += `${indent}map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n`;
  code += `${indent}map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n`;
  code += `${indent}map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n`;

  if (targetNode.data.showDirections) {
    code += `${indent}# Добавляем кнопки для построения маршрута\n`;
    code += `${indent}map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n`;
    code += `${indent}map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n`;
  }

  code += `${indent}map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n`;
  code += `${indent}map_keyboard = map_builder.as_markup()\n`;
  code += `${indent}\n`;
  code += `${indent}await bot.send_message(\n`;
  code += `${indent}    callback_query.from_user.id,\n`;
  if (targetNode.data.showDirections) {
    code += `${indent}    "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n`;
  } else {
    code += `${indent}    "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n`;
  }
  code += `${indent}    reply_markup=map_keyboard\n`;
  code += `${indent})\n`;

  return code;
}

/**
 * Вспомогательная функция для генерации inline кнопок
 */
function generateInlineButtons(buttons: Button[], indent: string): string {
  let code = '';
  code += `${indent}builder = InlineKeyboardBuilder()\n`;
  buttons.forEach((btn: Button, index: number) => {
    if (btn.action === "url") {
      code += `${indent}    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
    } else if (btn.action === 'goto') {
      const baseCallbackData = btn.target || btn.id || 'no_action';
      const callbackData = `${baseCallbackData}_btn_${index}`;
      code += `${indent}    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
    }
  });
  code += `${indent}keyboard = builder.as_markup()\n`;
  return code;
}
