/**
 * @fileoverview Модуль для генерации кода обработки условных сообщений и клавиатуры в обработчике команды /start
 *
 * Этот модуль предоставляет функцию для генерации Python-кода, которая:
 * - Обрабатывает условные сообщения
 * - Генерирует клавиатуру (inline или reply) на основе настроек узла
 * - Обрабатывает прикрепленные медиафайлы
 * - Формирует сообщения с учетом медиа-контента и клавиатуры
 *
 * @module generateConditionalMessageLogicAndKeyboard
 */

import { generateButtonText, toPythonBoolean } from '../format';
import { generateAttachedMediaSendCode } from '../MediaHandler';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python-код для обработки условных сообщений и генерации клавиатуры
 *
 * Функция добавляет в массив codeLines Python-код, который:
 * - Создает клавиатуру (inline или reply) на основе настроек узла
 * - Обрабатывает прикрепленные медиафайлы
 * - Отправляет сообщение с учетом медиа-контента и клавиатуры
 *
 * @param node - Узел конфигурации, содержащий настройки и данные команды
 * @param codeLines - Массив строк кода, в который будет добавлен сгенерированный Python-код
 * @param mediaVariablesMap - Карта переменных медиафайлов
 * @param attachedMedia - Массив прикрепленных медиафайлов
 * @param formattedText - Отформатированный текст сообщения
 *
 * @example
 * const node = {
 *   id: "start-node",
 *   data: {
 *     keyboardType: "inline",
 *     buttons: [
 *       { text: "Кнопка 1", action: "goto", target: "next_node" },
 *       { text: "Ссылка", action: "url", url: "https://example.com" }
 *     ],
 *     attachedMedia: ["image1"]
 *   }
 * };
 * const codeLines: string[] = [];
 * const mediaVars = new Map();
 * mediaVars.set("image1", { type: "image", variable: "image_var" });
 * generateConditionalMessageLogicAndKeyboard(node, codeLines, mediaVars, ["image1"], "Привет!");
 * // codeLines теперь содержит Python-код для обработки условных сообщений и клавиатуры
 */
export function generateConditionalMessageLogicAndKeyboard(node: { id: string; type: "message" | "start" | "command" | "sticker" | "voice" | "animation" | "location" | "contact" | "pin_message" | "unpin_message" | "delete_message" | "ban_user" | "unban_user" | "mute_user" | "unmute_user" | "kick_user" | "promote_user" | "demote_user" | "admin_rights"; position: { x: number; y: number; }; data: { options: string[]; keyboardType: "reply" | "inline" | "none"; buttons: { id: string; text: string; action: "command" | "location" | "contact" | "goto" | "url" | "selection" | "default"; buttonType: "normal" | "option" | "complete"; skipDataCollection: boolean; hideAfterClick: boolean; url?: string | undefined; target?: string | undefined; requestContact?: boolean | undefined; requestLocation?: boolean | undefined; }[]; oneTimeKeyboard: boolean; resizeKeyboard: boolean; markdown: boolean; formatMode: "none" | "markdown" | "html"; synonyms: string[]; isPrivateOnly: boolean; adminOnly: boolean; requiresAuth: boolean; showInMenu: boolean; enableStatistics: boolean; customParameters: string[]; messageIdSource: "manual" | "variable" | "last_message"; disableNotification: boolean; userIdSource: "manual" | "variable" | "last_message"; mapService: "custom" | "yandex" | "google" | "2gis"; mapZoom: number; showDirections: boolean; generateMapPreview: boolean; allowsMultipleAnswers: boolean; anonymousVoting: boolean; inputType: "number" | "location" | "contact" | "text" | "email" | "phone" | "photo" | "video" | "audio" | "document" | "any"; responseType: "text" | "buttons"; responseOptions: { id: string; text: string; action: "command" | "goto" | "url"; value?: string | undefined; url?: string | undefined; target?: string | undefined; }[]; allowMultipleSelection: boolean; inputRequired: boolean; enableConditionalMessages: boolean; collectUserInput: boolean; conditionalMessages: { id: string; messageText: string; keyboardType: "reply" | "inline" | "none"; buttons: { id: string; text: string; action: "command" | "location" | "contact" | "goto" | "url" | "selection" | "default"; buttonType: "normal" | "option" | "complete"; skipDataCollection: boolean; hideAfterClick: boolean; url?: string | undefined; target?: string | undefined; requestContact?: boolean | undefined; requestLocation?: boolean | undefined; }[]; formatMode: "text" | "markdown" | "html"; condition: "user_data_exists" | "user_data_equals" | "user_data_not_exists" | "user_data_contains" | "first_time" | "returning_user"; variableNames: string[]; logicOperator: "AND" | "OR"; collectUserInput: boolean; enableTextInput: boolean; enablePhotoInput: boolean; enableVideoInput: boolean; enableAudioInput: boolean; enableDocumentInput: boolean; waitForTextInput: boolean; priority: number; oneTimeKeyboard?: boolean | undefined; resizeKeyboard?: boolean | undefined; variableName?: string | undefined; inputVariable?: string | undefined; expectedValue?: string | undefined; photoInputVariable?: string | undefined; videoInputVariable?: string | undefined; audioInputVariable?: string | undefined; documentInputVariable?: string | undefined; textInputVariable?: string | undefined; nextNodeAfterInput?: string | undefined; }[]; saveToDatabase: boolean; allowSkip: boolean; inputButtonType: "reply" | "inline"; enableAutoTransition: boolean; enableUserActions: boolean; silentAction: boolean; canChangeInfo: boolean; canDeleteMessages: boolean; canBanUsers: boolean; canInviteUsers: boolean; canPinMessages: boolean; canAddAdmins: boolean; canRestrictMembers: boolean; canPromoteMembers: boolean; canManageVideoChats: boolean; canManageTopics: boolean; isAnonymous: boolean; canSendMessages: boolean; canSendMediaMessages: boolean; canSendPolls: boolean; canSendOtherMessages: boolean; canAddWebPagePreviews: boolean; canChangeGroupInfo: boolean; canInviteUsers2: boolean; canPinMessages2: boolean; adminUserIdSource: "manual" | "variable" | "last_message"; can_manage_chat: boolean; can_post_messages: boolean; can_edit_messages: boolean; can_delete_messages: boolean; can_post_stories: boolean; can_edit_stories: boolean; can_delete_stories: boolean; can_manage_video_chats: boolean; can_restrict_members: boolean; can_promote_members: boolean; can_change_info: boolean; can_invite_users: boolean; can_pin_messages: boolean; can_manage_topics: boolean; is_anonymous: boolean; adminChatIdSource: "manual" | "variable" | "current_chat"; attachedMedia: string[]; command?: string | undefined; description?: string | undefined; messageText?: string | undefined; imageUrl?: string | undefined; videoUrl?: string | undefined; audioUrl?: string | undefined; documentUrl?: string | undefined; documentName?: string | undefined; mediaCaption?: string | undefined; text?: string | undefined; action?: string | undefined; commandTimeout?: number | undefined; cooldownTime?: number | undefined; maxUsagesPerDay?: number | undefined; targetMessageId?: string | undefined; variableName?: string | undefined; targetUserId?: string | undefined; userVariableName?: string | undefined; targetGroupId?: string | undefined; stickerUrl?: string | undefined; stickerFileId?: string | undefined; voiceUrl?: string | undefined; animationUrl?: string | undefined; latitude?: number | undefined; longitude?: number | undefined; title?: string | undefined; address?: string | undefined; foursquareId?: string | undefined; foursquareType?: string | undefined; yandexMapUrl?: string | undefined; googleMapUrl?: string | undefined; gisMapUrl?: string | undefined; phoneNumber?: string | undefined; firstName?: string | undefined; lastName?: string | undefined; userId?: number | undefined; vcard?: string | undefined; question?: string | undefined; emoji?: string | undefined; mediaDuration?: number | undefined; width?: number | undefined; height?: number | undefined; performer?: string | undefined; fileSize?: number | undefined; filename?: string | undefined; multiSelectVariable?: string | undefined; continueButtonText?: string | undefined; continueButtonTarget?: string | undefined; inputVariable?: string | undefined; inputPrompt?: string | undefined; inputValidation?: string | undefined; inputTimeout?: number | undefined; inputRetryMessage?: string | undefined; inputSuccessMessage?: string | undefined; enableTextInput?: boolean | undefined; enablePhotoInput?: boolean | undefined; enableVideoInput?: boolean | undefined; enableAudioInput?: boolean | undefined; enableDocumentInput?: boolean | undefined; photoInputVariable?: string | undefined; videoInputVariable?: string | undefined; audioInputVariable?: string | undefined; documentInputVariable?: string | undefined; waitForTextInput?: boolean | undefined; fallbackMessage?: string | undefined; inputTargetNodeId?: string | undefined; autoTransitionTo?: string | undefined; minLength?: number | undefined; maxLength?: number | undefined; placeholder?: string | undefined; defaultValue?: string | undefined; actionTrigger?: "join" | "message" | "custom" | "leave" | "button_click" | undefined; triggerText?: string | undefined; userActionType?: "message" | "command" | "button" | "media" | undefined; actionTag?: string | undefined; actionMessage?: string | undefined; mimeType?: string | undefined; stickerSetName?: string | undefined; fileName?: string | undefined; city?: string | undefined; country?: string | undefined; name?: string | undefined; label?: string | undefined; checkmarkSymbol?: string | undefined; multiSelectCheckmark?: string | undefined; duration?: number | undefined; muteDuration?: number | undefined; reason?: string | undefined; untilDate?: number | undefined; adminTargetUserId?: string | undefined; adminUserVariableName?: string | undefined; adminChatId?: string | undefined; adminChatVariableName?: string | undefined; }; }, codeLines: string[], mediaVariablesMap: Map<string, { type: string; variable: string; }> | undefined, attachedMedia: string[], formattedText: string) {
    let keyboardCode = '';

    // Определяем тип клавиатуры и генерируем соответствующий код
    if (node && node.data && node.data.keyboardType === "inline" && node.data.buttons && node.data.buttons.length > 0) {
        keyboardCode += '    # Создаем inline клавиатуру\n';
        keyboardCode += '    builder = InlineKeyboardBuilder()\n';

        if (node && node.data && node.data.buttons) {
            node.data.buttons.forEach(button => {
                if (button.action === "url") {
                    keyboardCode += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
                } else if (button.action === 'goto') {
                    const callbackData = button.target || button.id || 'no_action';
                    keyboardCode += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
                } else if (button.action === 'command') {
                    const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
                    keyboardCode += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
                }
            });
        }

        keyboardCode += '    builder.adjust(2)  # Используем 2 колонки для консистентности\n';
        keyboardCode += '    keyboard = builder.as_markup()\n';
    } else if (node && node.data && node.data.keyboardType === "reply" && node.data.buttons && node.data.buttons.length > 0) {
        keyboardCode += '    # Создаем reply клавиатуру\n';
        keyboardCode += '    builder = ReplyKeyboardBuilder()\n';

        if (node && node.data && node.data.buttons) {
            node.data.buttons.forEach(button => {
                if (button.action === "contact" && button.requestContact) {
                    keyboardCode += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
                } else if (button.action === "location" && button.requestLocation) {
                    keyboardCode += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
                } else {
                    keyboardCode += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
                }
            });
        }

        let resizeKeyboardValue: any;
        if (node && node.data && node.data.resizeKeyboard !== undefined) {
            resizeKeyboardValue = node.data.resizeKeyboard;
        } else {
            resizeKeyboardValue = undefined;
        }

        let oneTimeKeyboardValue: any;
        if (node && node.data && node.data.oneTimeKeyboard !== undefined) {
            oneTimeKeyboardValue = node.data.oneTimeKeyboard;
        } else {
            oneTimeKeyboardValue = undefined;
        }

        const resizeKeyboard = toPythonBoolean(resizeKeyboardValue);
        const oneTimeKeyboard = toPythonBoolean(oneTimeKeyboardValue);
        keyboardCode += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
    } else if (node && node.data && node.data.keyboardType === "none") {
        // Если тип клавиатуры "none", все равно создаем переменную keyboard, но без клавиатуры
        keyboardCode += '    keyboard = None\n';
    } else {
        // По умолчанию создаем пустую клавиатуру
        keyboardCode += '    keyboard = None\n';
    }

    // Добавляем код создания клавиатуры
    const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
    codeLines.push(...keyboardLines);

    // Используем переданный mediaVariablesMap
    if (mediaVariablesMap) {
        // Фильтруем mediaVariablesMap, чтобы получить только те переменные, которые связаны с этим узлом
        const filteredMediaVariablesMap = new Map<string, { type: string; variable: string; }>();

        attachedMedia.forEach((mediaVar: string) => {
            if (mediaVariablesMap.has(mediaVar)) {
                filteredMediaVariablesMap.set(mediaVar, mediaVariablesMap.get(mediaVar)!);
            }
        });

        // Генерируем код для отправки прикрепленных медиа
        let formatModeValue: any;
        if (node && node.data) {
            formatModeValue = node.data.formatMode;
        } else {
            formatModeValue = 'HTML';
        }

        let autoTransitionToValue: any;
        if (node && node.data) {
            autoTransitionToValue = node.data.autoTransitionTo;
        } else {
            autoTransitionToValue = undefined;
        }

        let collectUserInputValue: any;
        if (node && node.data && node.data.collectUserInput !== undefined) {
            collectUserInputValue = node.data.collectUserInput;
        } else {
            collectUserInputValue = true;
        }

        const mediaCode = generateAttachedMediaSendCode(
            attachedMedia,
            filteredMediaVariablesMap,
            formattedText, // текст сообщения
            formatModeValue, // режим парсинга
            'keyboard', // клавиатура
            node.id || 'unknown', // ID узла
            '    ', // отступ
            autoTransitionToValue, // автопереход
            collectUserInputValue, // собирать пользовательский ввод
            node, // nodeData - передаем весь узел для доступа к imageUrl
            'message' // контекст обработчика
        );

        if (mediaCode.trim()) {
            // Используем код медиа вместо обычной отправки сообщения
            const mediaLines = mediaCode.split('\n');
            codeLines.push(...mediaLines);
        } else {
            // Если код медиа не сгенерирован, используем обычную логику
            if (node && node.data && node.data.allowMultipleSelection) {
                codeLines.push('    await message.answer(text, reply_markup=keyboard)');
            } else {
                const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
                codeLines.push(`    await message.answer(text${keyboardParam})`);
            }
        }
    } else {
        // Если mediaVariablesMap не передан, используем обычную логику
        if (node && node.data && node.data.allowMultipleSelection) {
            codeLines.push('    await message.answer(text, reply_markup=keyboard)');
        } else {
            const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
            codeLines.push(`    await message.answer(text${keyboardParam})`);
        }
    }

    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCodeLines = processCodeWithAutoComments(codeLines, 'generateConditionalMessageLogicAndKeyboard.ts');

    // Обновляем оригинальный массив
    codeLines.length = 0;
    codeLines.push(...processedCodeLines);
}
