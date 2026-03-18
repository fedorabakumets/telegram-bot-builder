/**
 * @fileoverview Renderers для узлов contact и location (command-based)
 * Перенесено из lib/bot-generator/MediaHandler/generateContactHandler.ts
 * и generateLocationHandler.ts
 */

import { generateButtonText } from '../../bot-generator/format/generateButtonText';
import { Node } from '@shared/schema';

export function generateContactHandler(node: Node): string {
  let code = `\n# Обработчик контакта для узла ${node.id}\n`;

  if (!node.data.command) return code;

  const command = node.data.command.replace('/', '');
  const functionName = `contact_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');

  code += `@dp.message(Command("${command}"))\n`;
  code += `async def ${functionName}(message: types.Message):\n`;
  code += `    logging.info(f"Команда контакта ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;

  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }
  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  const phoneNumber = node.data.phoneNumber || "+7 (999) 123-45-67";
  const firstName = node.data.firstName || "Имя";
  const lastName = node.data.lastName || "";
  const userId = node.data.userId || 0;
  const vcard = node.data.vcard || "";

  code += `    phone_number = "${phoneNumber}"\n`;
  code += `    first_name = "${firstName}"\n`;
  if (lastName) code += `    last_name = "${lastName}"\n`;
  if (userId > 0) code += `    user_id = ${userId}\n`;
  if (vcard) code += `    vcard = "${vcard.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"\n`;
  code += '    try:\n';
  code += '        await message.answer_contact(\n';
  code += '            phone_number=phone_number,\n';
  code += '            first_name=first_name';
  if (lastName) code += ',\n            last_name=last_name';
  if (userId > 0) code += ',\n            user_id=user_id';
  if (vcard) code += ',\n            vcard=vcard';
  code += '\n        )\n';

  if (node.data.keyboardType === "inline" && node.data.buttons?.length > 0) {
    code += '        builder = InlineKeyboardBuilder()\n';
    node.data.buttons.forEach((button: any) => {
      if (button.action === "url") {
        code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
      } else if (button.action === 'goto') {
        code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${button.target || button.id || 'no_action'}"))\n`;
      }
    });
    code += '        keyboard = builder.as_markup()\n';
    code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
  }

  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
  code += '        await message.answer("❌ Не удалось отправить контакт")\n';

  return code;
}

export function generateLocationHandler(node: Node): string {
  let code = `\n# Обработчик геолокации для узла ${node.id}\n`;

  if (!node.data.command) return code;

  const command = node.data.command.replace('/', '');
  const functionName = `location_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');

  code += `@dp.message(Command("${command}"))\n`;
  code += `async def ${functionName}(message: types.Message):\n`;
  code += `    logging.info(f"Команда геолокации ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;

  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }
  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  const latitude = node.data.latitude !== undefined ? node.data.latitude : 55.7558;
  const longitude = node.data.longitude !== undefined ? node.data.longitude : 37.6176;
  const title = node.data.title || "";
  const address = node.data.address || "";
  const foursquareId = node.data.foursquareId || "";
  const foursquareType = node.data.foursquareType || "";
  const mapService = node.data.mapService || 'custom';
  const generateMapPreview = node.data.generateMapPreview !== false;

  code += '    # Определяем координаты на основе выбранного сервиса карт\n';

  if (mapService === 'yandex' && node.data.yandexMapUrl) {
    code += `    yandex_url = "${node.data.yandexMapUrl}"\n`;
    code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
    code += '    if extracted_lat and extracted_lon:\n';
    code += '        latitude, longitude = extracted_lat, extracted_lon\n';
    code += '    else:\n';
    code += `        latitude, longitude = ${latitude}, ${longitude}\n`;
  } else if (mapService === 'google' && node.data.googleMapUrl) {
    code += `    google_url = "${node.data.googleMapUrl}"\n`;
    code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
    code += '    if extracted_lat and extracted_lon:\n';
    code += '        latitude, longitude = extracted_lat, extracted_lon\n';
    code += '    else:\n';
    code += `        latitude, longitude = ${latitude}, ${longitude}\n`;
  } else if (mapService === '2gis' && node.data.gisMapUrl) {
    code += `    gis_url = "${node.data.gisMapUrl}"\n`;
    code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
    code += '    if extracted_lat and extracted_lon:\n';
    code += '        latitude, longitude = extracted_lat, extracted_lon\n';
    code += '    else:\n';
    code += `        latitude, longitude = ${latitude}, ${longitude}\n`;
  } else {
    code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
  }

  if (title) code += `    title = "${title}"\n`;
  if (address) code += `    address = "${address}"\n`;
  if (foursquareId) code += `    foursquare_id = "${foursquareId}"\n`;
  if (foursquareType) code += `    foursquare_type = "${foursquareType}"\n`;

  code += '    try:\n';
  if (title || address) {
    code += '        await message.answer_venue(\n';
    code += '            latitude=latitude,\n';
    code += '            longitude=longitude,\n';
    code += '            title=title,\n';
    code += '            address=address';
    if (foursquareId) code += ',\n            foursquare_id=foursquare_id';
    if (foursquareType) code += ',\n            foursquare_type=foursquare_type';
    code += '\n        )\n';
  } else {
    code += '        await message.answer_location(latitude=latitude, longitude=longitude)\n';
  }
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
  code += '        await message.answer(f"❌ Не удалось отправить геолокацию")\n';

  if (generateMapPreview) {
    code += '    try:\n';
    code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
    code += '        map_builder = InlineKeyboardBuilder()\n';
    code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
    code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
    code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
    code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';
    if (node.data.showDirections) {
      code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
    }
    code += '        map_builder.adjust(2)\n';
    code += '        map_keyboard = map_builder.as_markup()\n';
    code += `        await message.answer("🗺️ Откройте местоположение в удобном картографическом сервисе${node.data.showDirections ? ' или постройте маршрут' : ''}:", reply_markup=map_keyboard)\n`;
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки карты: {e}")\n';
  }

  if (node.data.keyboardType === "inline" && node.data.buttons?.length > 0) {
    code += '    try:\n';
    code += '        builder = InlineKeyboardBuilder()\n';
    node.data.buttons.forEach((button: any) => {
      if (button.action === "url") {
        code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
      } else if (button.action === 'goto') {
        code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${button.target || button.id || 'no_action'}"))\n`;
      }
    });
    code += '        keyboard = builder.as_markup()\n';
    code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки клавиатуры: {e}")\n';
  }

  return code;
}
