import { Button, isLoggingEnabled } from './bot-generator';
import { generateCommandNodeHandlerWithKeyboardAndImageSupport } from './CommandHandler/generateCommandNodeHandlerWithKeyboardAndImageSupport';
import { generateStartNodeHandlerWithConditionalLogicAndImages } from './CommandHandler/generateStartNodeHandlerWithConditionalLogicAndImages';
import { generateMessageNodeHandlerWithConditionalLogicAndMediaSupport } from './Conditional/generateMessageNodeHandlerWithConditionalLogicAndMediaSupport';
import { generateButtonText } from './format';
import { createFakeMessageEditForCallback } from './Keyboard/createFakeMessageEditForCallback';
import { generateCommandButtonCallbackHandler } from './Keyboard/generateCommandButtonCallbackHandler';
import { generateMultiSelectButtonHandlerWithVariableSaving } from './Keyboard/generateMultiSelectButtonHandlerWithVariableSaving';
import { generateMessageNodeHandlerWithKeyboardAndInputCollection } from './MessageHandlers/generateMessageNodeHandlerWithKeyboardAndInputCollection';

export function newprocessNodeButtonsAndGenerateHandlers(inlineNodes: any[], processedCallbacks: Set<string>, nodes: any[], code: string, allNodeIds: any[], connections: any[], mediaVariablesMap: Map<string, { type: string; variable: string; }>) {
  inlineNodes.forEach(node => {
    node.data.buttons.forEach((button: { action: string; id: any; target: string; text: any; skipDataCollection: boolean; }) => {
      if (button.action === 'goto' && button.id) {
        const callbackData = button.id; // Используем идентификатор кнопки как callback_data

        /**
         * БЛОК 1: Обработка кнопов с действием 'goto'
         * Создает обработчики для навигации между узлами бота
         * Проверяет дублирование callback_data для оптимизации
         */
        // Избегаем дублирования обработчиков для идентификаторов кнопок (не целевых идентификаторов)
        if (processedCallbacks.has(`cb_${callbackData}`)) return;

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Избегаем дублированных обработчиков для target узлов
        // Но только для callback обработчиков, не для команд
        if (button.target && processedCallbacks.has(`cb_${button.target}`)) {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
          return;
        }

        // Находим целевой узел (может быть null если нет target)
        // ИСПРАВЛЕНИЕ: Ищем узел сначала по id, затем по команде
        let targetNode = button.target ? nodes.find(n => n.id === button.target) : null;

        // Если узел не найден по id, пробуем найти по команде
        if (!targetNode && button.target) {
          targetNode = nodes.find(n => n.data.command === `/${button.target}` || n.data.command === button.target);
          if (targetNode && isLoggingEnabled()) {
            console.log(`🔧 ГЕНЕРАТОР: Узел найден по команде ${button.target} -> ${targetNode.id}`);
          }
        }

        // Создаем обработчик для каждой кнопки используя target как callback_data
        const actualCallbackData = button.target || callbackData;
        const actualNodeId = targetNode ? targetNode.id : button.target;

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Больше не пропускаем обработчики для кнопок с goto
        // Даже если узел уже был обработан как команда, нам нужен обработчик для перехода по кнопке
        // if (button.target && processedCallbacks.has(button.target)) {
        //   if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
        //   return;
        // }

        // Отмечаем этот идентификатор кнопки как обработанный
        processedCallbacks.add(`cb_${callbackData}`);

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем target в processedCallbacks с префиксом для избежания дублирования callback обработчиков
        if (button.target) {
          processedCallbacks.add(`cb_${button.target}`);
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${button.target} добавлен в processedCallbacks ДО создания обработчика`);
        }



        /**
         * БЛОК 2: Обработка множественного выбора
         * Определяет необходимость создания обработчика для кнопки "Готово"
         * при множественном выборе опций пользователем
         */
        // Если целевой узел имеет множественный выбор, добавляем обработку кнопки "done_"
        code = generateMultiSelectButtonHandlerWithVariableSaving(targetNode, actualCallbackData, code, nodes, button, node);

        if (targetNode) {

          /**
           * БЛОК 3: Обработка различных типов целевых узлов
           * Генерирует специфичный код для каждого типа узла:
           * - message: текстовые сообщения с кнопками
           * - sticker: отправка стикеров
           * - voice: голосовые сообщения
           * - animation: анимации/GIF
           * - location: геолокация
           * - contact: контактная информация
           * - user-input: сбор пользовательского ввода
           * - start: начальное сообщение
           * - command: выполнение команд
           */
          // Обрабатываем узла сообщений с действием сохранения переменной
          if (targetNode.type === 'message' && targetNode.data.action === 'save_variable') {
            const action = targetNode.data.action || 'none';
            const variableName = targetNode.data.variableName || '';
            const variableValue = targetNode.data.variableValue || '';
            const successMessage = targetNode.data.successMessage || 'Успешно сохранено!';

            if (action === 'save_variable' && variableName && variableValue) {
              code += `    # Сохраняем переменную "${variableName}" = "${variableValue}"\n`;
              code += `    user_data[user_id]["${variableName}"] = "${variableValue}"\n`;
              code += `    await update_user_variable_in_db(user_id, "${variableName}", "${variableValue}")\n`;
              code += `    logging.info(f"Переменная сохранена: ${variableName} = ${variableValue} (пользователь {user_id})")\n`;
              code += '    \n';

              if (successMessage.includes('\n')) {
                code += `    success_text = """${successMessage}"""\n`;
              } else {
                const escapedMessage = successMessage.replace(/"/g, '\\"');
                code += `    success_text = "${escapedMessage}"\n`;
              }

              // Добавляем замену переменных в сообщении об успехе
              code += `    # Подставляем значения переменных в текст сообщения\n`;
              code += `    if "{${variableName}}" in success_text:\n`;
              code += `        success_text = success_text.replace("{${variableName}}", "${variableValue}")\n`;

              code += '    await callback_query.message.edit_text(success_text)\n';
            }
          }



          // Обрабатываем обычные узла сообщений (например, source_friends, source_search и т.д.)
          else if (targetNode.type === 'message') {
            code = generateMessageNodeHandlerWithConditionalLogicAndMediaSupport(targetNode, code, allNodeIds, connections, mediaVariablesMap, actualNodeId);
          }
          /**
           * БЛОК 7: Обработка специальных типов медиа-узлов
           * Генерирует код для отправки различных типов медиа:
           * - sticker: стикеры Telegram
           * - voice: голосовые сообщения
           * - animation: анимации/GIF
           * - location: геолокация и карты
           * - contact: контактная информация
           */

          // Обрабатываем различные типы целевых узлов
          else if (targetNode.type === 'sticker') {
            const stickerUrl = targetNode.data.stickerUrl || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";

            code += `    sticker_url = "${stickerUrl}"\n`;
            code += '    try:\n';
            code += '        # Проверяем, является ли это локальным файлом\n';
            code += '        if is_local_file(sticker_url):\n';
            code += '            # Отправляем локальный файл\n';
            code += '            file_path = get_local_file_path(sticker_url)\n';
            code += '            if os.path.exists(file_path):\n';
            code += '                sticker_file = FSInputFile(file_path)\n';
            code += '            else:\n';
            code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
            code += '        else:\n';
            code += '            # Используяям URL или file_id для стикеров\n';
            code += '            sticker_file = sticker_url\n';
            code += '        \n';

            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command' && btn.target) {
                  // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для sticker nodes
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file, reply_markup=keyboard)\n';
            } else {
              code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file)\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
            code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить стикер")\n';

          } else if (targetNode.type === 'voice') {
            const voiceUrl = targetNode.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
            const duration = targetNode.data.duration || 30;

            code += `    voice_url = "${voiceUrl}"\n`;
            code += `    duration = ${duration}\n`;
            code += '    try:\n';
            code += '        # Проверяем, является ли это локальным файлом\n';
            code += '        if is_local_file(voice_url):\n';
            code += '            # Отправляем локальный файл\n';
            code += '            file_path = get_local_file_path(voice_url)\n';
            code += '            if os.path.exists(file_path):\n';
            code += '                voice_file = FSInputFile(file_path)\n';
            code += '            else:\n';
            code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
            code += '        else:\n';
            code += '            # Используем URL для внешних файлов\n';
            code += '            voice_file = voice_url\n';
            code += '        \n';

            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command' && btn.target) {
                  // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для voice nodes
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration, reply_markup=keyboard)\n';
            } else {
              code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration)\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
            code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить голосовое сообщение")\n';

          } else if (targetNode.type === 'animation') {
            const caption = targetNode.data.mediaCaption || "🎬 Анимация";
            const animationUrl = targetNode.data.animationUrl || "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";

            if (caption.includes('\n')) {
              code += `    caption = """${caption}"""\n`;
            } else {
              const escapedCaption = caption.replace(/"/g, '\\"');
              code += `    caption = "${escapedCaption}"\n`;
            }

            code += `    animation_url = "${animationUrl}"\n`;
            code += '    try:\n';
            code += '        # Проверяем, является ли это локальным файлом\n';
            code += '        if is_local_file(animation_url):\n';
            code += '            # Отпяяяяавляем локальный файл\n';
            code += '            file_path = get_local_file_path(animation_url)\n';
            code += '            if os.path.exists(file_path):\n';
            code += '                animation_file = FSInputFile(file_path)\n';
            code += '            else:\n';
            code += '                raise FileNotFoundError(f"Локальный файл не наяден: {file_path}")\n';
            code += '        else:\n';
            code += '            # Используем URL для внешних файлов\n';
            code += '            animation_file = animation_url\n';
            code += '        \n';

            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command' && btn.target) {
                  // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для animation nodes
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption, reply_markup=keyboard)\n';
            } else {
              code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption)\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
            code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить анимацию\\n{caption}")\n';

          } else if (targetNode.type === 'location') {
            let latitude = targetNode.data.latitude || 55.7558;
            let longitude = targetNode.data.longitude || 37.6176;
            const title = targetNode.data.title || "";
            const address = targetNode.data.address || "";
            const mapService = targetNode.data.mapService || 'custom';
            const generateMapPreview = targetNode.data.generateMapPreview !== false;

            code += '    # Определяем координаты на основе выбранного сервиса карт\n';

            if (mapService === 'yandex' && targetNode.data.yandexMapUrl) {
              code += `    yandex_url = "${targetNode.data.yandexMapUrl}"\n`;
              code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
              code += '    if extracted_lat and extracted_lon:\n';
              code += '        latitude, longitude = extracted_lat, extracted_lon\n';
              code += '    else:\n';
              code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
            } else if (mapService === 'google' && targetNode.data.googleMapUrl) {
              code += `    google_url = "${targetNode.data.googleMapUrl}"\n`;
              code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
              code += '    if extracted_lat and extracted_lon:\n';
              code += '        latitude, longitude = extracted_lat, extracted_lon\n';
              code += '    else:\n';
              code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
            } else if (mapService === '2gis' && targetNode.data.gisMapUrl) {
              code += `    gis_url = "${targetNode.data.gisMapUrl}"\n`;
              code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
              code += '    if extracted_lat and extracted_lon:\n';
              code += '        latitude, longitude = extracted_lat, extracted_lon\n';
              code += '    else:\n';
              code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
            } else {
              code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
            }

            if (title) code += `    title = "${title}"\n`;
            if (address) code += `    address = "${address}"\n`;

            code += '    try:\n';
            code += '        # Удаляем старое сообщение\n';

            code += '        # ятправляем геолокацию\n';
            if (title || address) {
              code += '        await bot.send_venue(\n';
              code += '            callback_query.from_user.id,\n';
              code += '            latitude=latitude,\n';
              code += '            longitude=longitude,\n';
              code += '            title=title,\n';
              code += '            address=address\n';
              code += '        )\n';
            } else {
              code += '        await bot.send_location(\n';
              code += '            callback_query.from_user.id,\n';
              code += '            latitude=latitude,\n';
              code += '            longitude=longitude\n';
              code += '        )\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
            code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить геолокацию")\n';

            // Генерируем кнопки для картографических сервисов если включено
            if (generateMapPreview) {
              code += '        \n';
              code += '        # Генерируем ссылки на картографические сервисы\n';
              code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
              code += '        \n';
              code += '        # Создаем кнопки для различных карт\n';
              code += '        map_builder = InlineKeyboardBuilder()\n';
              code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
              code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
              code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
              code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';

              if (targetNode.data.showDirections) {
                code += '        # Добавляем кнопки для построения маршрута\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
              }

              code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
              code += '        map_keyboard = map_builder.as_markup()\n';
              code += '        \n';
              code += '        await bot.send_message(\n';
              code += '            callback_query.from_user.id,\n';
              if (targetNode.data.showDirections) {
                code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
              } else {
                code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
              }
              code += '            reply_markup=map_keyboard\n';
              code += '        )\n';
            }

            // Добавляем дополнительные кнопки если они есть
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        \n';
              code += '        # Отправляем дополнительные кнопки\n';
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошябка отправки местоположения: {e}")\n';
            code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")\n';

          } else if (targetNode.type === 'contact') {
            const phoneNumber = targetNode.data.phoneNumber || "+7 999 123 45 67";
            const firstName = targetNode.data.firstName || "Контакт";
            const lastName = targetNode.data.lastName || "";
            const userId = targetNode.data.userId || null;
            const vcard = targetNode.data.vcard || "";

            code += `    phone_number = "${phoneNumber}"\n`;
            code += `    first_name = "${firstName}"\n`;
            if (lastName) code += `    last_name = "${lastName}"\n`;
            if (userId) code += `    user_id = ${userId}\n`;
            if (vcard) code += `    vcard = """${vcard}"""\n`;

            code += '    try:\n';

            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              if (lastName && userId && vcard) {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard, reply_markup=keyboard)\n';
              } else if (lastName) {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, reply_markup=keyboard)\n';
              }
            } else {
              if (lastName && userId && vcard) {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard)\n';
              } else if (lastName) {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name)\n';
              } else {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name)\n';
              }
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
            code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить контакт")\n';

            /**
             * БЛОК 8: Обработка узлов пользовательского ввода
             * Специализированные узлы для сбора данных от пользователя
             * Поддерживают различные типы ввода:
             * - Текстовый ввод с валидацией
             * - Кнопочный выбор (inline/reply)
             * - Множественный выбор с кнопкой "Готово"
             * - Настройки валидации и таймаутов
             */
          } else if (targetNode.type === 'start') {
            // Обрабатываем узла начала в запросах обратного вызова - показываем начальное сообщение с кнопками
            code = generateStartNodeHandlerWithConditionalLogicAndImages(targetNode, code, actualNodeId).join('\n');

            /**
             * БЛОК 10: Обработка command узлов
             * Специальные узлы для выполнения команд бота
             * Могут содержать текстовые сообщения и кнопки
             * Поддерживают различные форматы сообщений (Markdown, HTML)
             */
          } else if (targetNode.type === 'command') {
            // Обрабатываем узла команд в запросах обратного вызова
            code = generateCommandNodeHandlerWithKeyboardAndImageSupport(targetNode, code, actualNodeId);

            /**
             * БЛОК 11: Универсальный обработчик для остальных типов узлов
             * Обрабатывает текстовые сообщения и другие неспециализированные узлы
             * Поддерживает условные сообщения и сбор пользовательского ввода
             * Создает соответствующие клавиатуры (inline/reply) при необходимости
             */
          } else {
            // Универсальный обработчик для узлов сообщений и других текстовых узлов
            code = generateMessageNodeHandlerWithKeyboardAndInputCollection(code, targetNode, actualNodeId, allNodeIds); // Закрываем else блок для обычного отображения (основной цикл)
          } // Закрываем else блок для обычных текстовых сообщений (основной цикл)
        } else {
          /**
           * БЛОК 12: Обработка кнопки без цели
           * Fallback обработчик для кнопок без настроенного target
           * Показывает уведомление пользователю о том, что кнопка не настроена
           */
          // Кнопка без цели - просто уведомляем пользователя
          code += '    # Кнопка пока никуда не ведет\n';
          code += '    await callback_query.answer("⚠️ Эта кнопка яока не настроена", show_alert=True)\n';
        }
      } else if (button.action === 'command' && button.id) {
        /**
         * БЛОК 13: Обработка кнопок с действием 'command'
         * Создает обработчики для выполнения команд бота через callback кнопки
         * Формирует специальную callback_data с префиксом 'cmd_'
         */
        // Обработка кнопок с действием "command"
        const callbackData = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;

        // Избегаем дублирования обработчиков
        if (processedCallbacks.has(callbackData)) return;
        processedCallbacks.add(callbackData);

        code = generateCommandButtonCallbackHandler(code, callbackData, button);

        // Создаем правильный вызов команды для callback кнопок
        code = createFakeMessageEditForCallback(button, code);
      }
    });
  });
  return code;
}
/**
 * Обрабатывает кнопки узлов и генерирует обработчики callback-запросов для Telegram бота.
 *
 * Эта функция является ключевым компонентом генератора ботов, который:
 * - Перебирает все inline узлы и их кнопки
 * - Создает уникальные обработчики для callback-запросов кнопок
 * - Избегает дублирования обработчиков для одинаковых callback_data
 * - Генерирует Python код для обработки различных типов кнопок и узлов
 * - Поддерживает множественные типы узлов (message, sticker, voice, animation, location, contact, user-input, start, command)
 * - Реализует логику множественного выбора с кнопкой "Готово"
 * - Обрабатывает условные сообщения и клавиатуры
 * - Управляет состоянием ожидания пользовательского ввода
 *
 * @param processedCallbacks - Set для отслеживания уже обработанных callback_data,
 *                             предотвращает создание дублирующих обработчиков
 *
 * Основные блоки логики:
 * 1. Обработка кнопок с действием 'goto' - создание обработчиков для навигации между узлами
 * 2. Обработка множественного выбора - логика кнопки "Готово" при выборе нескольких опций
 * 3. Генерация обработчиков для различных типов целевых узлов (message, sticker, voice, etc.)
 * 4. Поддержка условных сообщений на основе данных пользователя
 * 5. Обработка прикрепленных медиа и различных типов контента
 * 6. Управление состоянием ожидания пользовательского ввода
 * 7. Обработка специальных медиа-узлов (стикеры, голос, анимации, локация, контакты)
 * 8. Обработка узлов пользовательского ввода с валидацией
 * 9. Обработка start узлов - начальные сообщения
 * 10. Обработка command узлов - выполнение команд
 * 11. Универсальный обработчик для остальных типов узлов
 * 12. Fallback обработка кнопок без настроенной цели
 * 13. Обработка кнопок с действием 'command' - создание обработчиков для выполнения команд
 */

export function createProcessNodeButtonsFunction(
  inlineNodes: any[],
  nodes: any[],
  code: string,
  allNodeIds: any[],
  connections: any[],
  mediaVariablesMap: Map<string, { type: string; variable: string; }>
) {
  return function processNodeButtonsAndGenerateHandlers(processedCallbacks: Set<string>): string {
    return newprocessNodeButtonsAndGenerateHandlers(
      inlineNodes,
      processedCallbacks,
      nodes,
      code,
      allNodeIds,
      connections,
      mediaVariablesMap
    );
  };
}


