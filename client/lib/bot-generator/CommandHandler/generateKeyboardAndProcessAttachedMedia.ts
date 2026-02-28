/**
 * @fileoverview Модуль для генерации кода клавиатуры и обработки прикрепленных медиафайлов в обработчике команды /start
 *
 * Этот модуль предоставляет функцию для генерации Python-кода, которая:
 * - Обрабатывает условные сообщения
 * - Форматирует текст сообщения
 * - Заменяет переменные в тексте сообщения
 * - Генерирует клавиатуру для взаимодействия с пользователем
 *
 * @module generateKeyboardAndProcessAttachedMedia
 */

import { generateConditionalMessageLogic } from '../Conditional';
import { formatTextForPython } from '../format';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python-код для обработки текста сообщения, условных сообщений и замены переменных
 *
 * Функция добавляет в массив codeLines Python-код, который:
 * - Форматирует текст сообщения для использования в Python
 * - Обрабатывает условные сообщения, если они включены
 * - Заменяет переменные в тексте сообщения данными пользователя
 *
 * @param node - Узел конфигурации, содержащий настройки и данные команды
 * @param codeLines - Массив строк кода, в который будет добавлен сгенерированный Python-код
 *
 * @returns Отформатированный текст сообщения
 *
 * @example
 * const node = {
 *   id: "start-node",
 *   data: {
 *     messageText: "Привет, {user_name}!",
 *     enableConditionalMessages: true,
 *     conditionalMessages: [...]
 *   }
 * };
 * const codeLines: string[] = [];
 * const result = generateKeyboardAndProcessAttachedMedia(node, codeLines);
 * // codeLines теперь содержит Python-код для обработки сообщения
 */
export function generateKeyboardAndProcessAttachedMedia(node: { id: string; type: "message" | "start" | "command" | "sticker" | "voice" | "animation" | "location" | "contact" | "pin_message" | "unpin_message" | "delete_message" | "ban_user" | "unban_user" | "mute_user" | "unmute_user" | "kick_user" | "promote_user" | "demote_user" | "admin_rights"; position: { x: number; y: number; }; data: { options: string[]; keyboardType: "reply" | "inline" | "none"; buttons: { id: string; text: string; action: "command" | "location" | "contact" | "goto" | "url" | "selection" | "default"; buttonType: "normal" | "option" | "complete"; skipDataCollection: boolean; hideAfterClick: boolean; url?: string | undefined; target?: string | undefined; requestContact?: boolean | undefined; requestLocation?: boolean | undefined; }[]; oneTimeKeyboard: boolean; resizeKeyboard: boolean; markdown: boolean; formatMode: "none" | "markdown" | "html"; synonyms: string[]; isPrivateOnly: boolean; adminOnly: boolean; requiresAuth: boolean; showInMenu: boolean; enableStatistics: boolean; customParameters: string[]; messageIdSource: "manual" | "variable" | "last_message"; disableNotification: boolean; userIdSource: "manual" | "variable" | "last_message"; mapService: "custom" | "yandex" | "google" | "2gis"; mapZoom: number; showDirections: boolean; generateMapPreview: boolean; allowsMultipleAnswers: boolean; anonymousVoting: boolean; inputType: "number" | "location" | "contact" | "text" | "email" | "phone" | "photo" | "video" | "audio" | "document" | "any"; responseType: "text" | "buttons"; responseOptions: { id: string; text: string; action: "command" | "goto" | "url"; value?: string | undefined; url?: string | undefined; target?: string | undefined; }[]; allowMultipleSelection: boolean; inputRequired: boolean; enableConditionalMessages: boolean; collectUserInput: boolean; conditionalMessages: { id: string; messageText: string; keyboardType: "reply" | "inline" | "none"; buttons: { id: string; text: string; action: "command" | "location" | "contact" | "goto" | "url" | "selection" | "default"; buttonType: "normal" | "option" | "complete"; skipDataCollection: boolean; hideAfterClick: boolean; url?: string | undefined; target?: string | undefined; requestContact?: boolean | undefined; requestLocation?: boolean | undefined; }[]; formatMode: "text" | "markdown" | "html"; condition: "user_data_exists" | "user_data_equals" | "user_data_not_exists" | "user_data_contains" | "first_time" | "returning_user"; variableNames: string[]; logicOperator: "AND" | "OR"; collectUserInput: boolean; enableTextInput: boolean; enablePhotoInput: boolean; enableVideoInput: boolean; enableAudioInput: boolean; enableDocumentInput: boolean; waitForTextInput: boolean; priority: number; oneTimeKeyboard?: boolean | undefined; resizeKeyboard?: boolean | undefined; variableName?: string | undefined; inputVariable?: string | undefined; expectedValue?: string | undefined; photoInputVariable?: string | undefined; videoInputVariable?: string | undefined; audioInputVariable?: string | undefined; documentInputVariable?: string | undefined; textInputVariable?: string | undefined; nextNodeAfterInput?: string | undefined; }[]; saveToDatabase: boolean; allowSkip: boolean; inputButtonType: "reply" | "inline"; enableAutoTransition: boolean; enableUserActions: boolean; silentAction: boolean; canChangeInfo: boolean; canDeleteMessages: boolean; canBanUsers: boolean; canInviteUsers: boolean; canPinMessages: boolean; canAddAdmins: boolean; canRestrictMembers: boolean; canPromoteMembers: boolean; canManageVideoChats: boolean; canManageTopics: boolean; isAnonymous: boolean; canSendMessages: boolean; canSendMediaMessages: boolean; canSendPolls: boolean; canSendOtherMessages: boolean; canAddWebPagePreviews: boolean; canChangeGroupInfo: boolean; canInviteUsers2: boolean; canPinMessages2: boolean; adminUserIdSource: "manual" | "variable" | "last_message"; can_manage_chat: boolean; can_post_messages: boolean; can_edit_messages: boolean; can_delete_messages: boolean; can_post_stories: boolean; can_edit_stories: boolean; can_delete_stories: boolean; can_manage_video_chats: boolean; can_restrict_members: boolean; can_promote_members: boolean; can_change_info: boolean; can_invite_users: boolean; can_pin_messages: boolean; can_manage_topics: boolean; is_anonymous: boolean; adminChatIdSource: "manual" | "variable" | "current_chat"; attachedMedia: string[]; command?: string | undefined; description?: string | undefined; messageText?: string | undefined; imageUrl?: string | undefined; videoUrl?: string | undefined; audioUrl?: string | undefined; documentUrl?: string | undefined; documentName?: string | undefined; mediaCaption?: string | undefined; text?: string | undefined; action?: string | undefined; commandTimeout?: number | undefined; cooldownTime?: number | undefined; maxUsagesPerDay?: number | undefined; targetMessageId?: string | undefined; variableName?: string | undefined; targetUserId?: string | undefined; userVariableName?: string | undefined; targetGroupId?: string | undefined; stickerUrl?: string | undefined; stickerFileId?: string | undefined; voiceUrl?: string | undefined; animationUrl?: string | undefined; latitude?: number | undefined; longitude?: number | undefined; title?: string | undefined; address?: string | undefined; foursquareId?: string | undefined; foursquareType?: string | undefined; yandexMapUrl?: string | undefined; googleMapUrl?: string | undefined; gisMapUrl?: string | undefined; phoneNumber?: string | undefined; firstName?: string | undefined; lastName?: string | undefined; userId?: number | undefined; vcard?: string | undefined; question?: string | undefined; emoji?: string | undefined; mediaDuration?: number | undefined; width?: number | undefined; height?: number | undefined; performer?: string | undefined; fileSize?: number | undefined; filename?: string | undefined; multiSelectVariable?: string | undefined; continueButtonText?: string | undefined; continueButtonTarget?: string | undefined; inputVariable?: string | undefined; inputPrompt?: string | undefined; inputValidation?: string | undefined; inputTimeout?: number | undefined; inputRetryMessage?: string | undefined; inputSuccessMessage?: string | undefined; enableTextInput?: boolean | undefined; enablePhotoInput?: boolean | undefined; enableVideoInput?: boolean | undefined; enableAudioInput?: boolean | undefined; enableDocumentInput?: boolean | undefined; photoInputVariable?: string | undefined; videoInputVariable?: string | undefined; audioInputVariable?: string | undefined; documentInputVariable?: string | undefined; waitForTextInput?: boolean | undefined; fallbackMessage?: string | undefined; inputTargetNodeId?: string | undefined; autoTransitionTo?: string | undefined; minLength?: number | undefined; maxLength?: number | undefined; placeholder?: string | undefined; defaultValue?: string | undefined; actionTrigger?: "join" | "message" | "custom" | "leave" | "button_click" | undefined; triggerText?: string | undefined; userActionType?: "message" | "command" | "button" | "media" | undefined; actionTag?: string | undefined; actionMessage?: string | undefined; mimeType?: string | undefined; stickerSetName?: string | undefined; fileName?: string | undefined; city?: string | undefined; country?: string | undefined; name?: string | undefined; label?: string | undefined; checkmarkSymbol?: string | undefined; multiSelectCheckmark?: string | undefined; duration?: number | undefined; muteDuration?: number | undefined; reason?: string | undefined; untilDate?: number | undefined; adminTargetUserId?: string | undefined; adminUserVariableName?: string | undefined; adminChatId?: string | undefined; adminChatVariableName?: string | undefined; }; }, codeLines: string[]) {
    const messageText = (node && node.data && node.data.messageText) ? node.data.messageText : "Привет! Добро пожаловать!";
    const formattedText = formatTextForPython(messageText);

    if (node && node.data && node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
        // Инициализируем text основным сообщением ПЕРЕД проверкой условий
        codeLines.push('    # Проверяем условные сообщения');
        codeLines.push(`    text = ${formattedText}  # Основной текст узла как fallback`);
        codeLines.push('    conditional_parse_mode = None');
        codeLines.push('    conditional_keyboard = None');
        codeLines.push('');
        codeLines.push('    # Получаем данные пользователя для проверки условий');
        codeLines.push('    user_record = await get_user_from_db(user_id)');
        codeLines.push('    if not user_record:');
        codeLines.push('        user_record = user_data.get(user_id, {})');
        codeLines.push('');
        codeLines.push('    # Безопасно извлекаем user_data');
        codeLines.push('    if isinstance(user_record, dict):');
        codeLines.push('        if "user_data" in user_record and isinstance(user_record["user_data"], dict):');
        codeLines.push('            user_data_dict = user_record["user_data"]');
        codeLines.push('        else:');
        codeLines.push('            user_data_dict = user_record');
        codeLines.push('    else:');
        codeLines.push('        user_data_dict = {}');
        codeLines.push('');

        // Generate conditional logic using helper function - условия теперь переопределят text если нужно
        let conditionalMessagesValue: any;
        if (node && node.data) {
            conditionalMessagesValue = node.data.conditionalMessages;
        } else {
            conditionalMessagesValue = [];
        }

        let nodeDataValue: any;
        if (node && node.data) {
            nodeDataValue = node.data;
        } else {
            nodeDataValue = {};
        }

        const conditionalCode = generateConditionalMessageLogic(conditionalMessagesValue, '    ', nodeDataValue);
        const conditionalLines = conditionalCode.split('\n').filter(line => line.trim());
        codeLines.push(...conditionalLines);

        // Не нужен else блок - text уже инициализирован основным сообщением
        codeLines.push('');

        // Добавляем замену переменных в тексте для условных сообщений
        codeLines.push('');
        codeLines.push('    # Подставляем все доступные переменные пользователя в текст');
        codeLines.push('    user_vars = await get_user_from_db(user_id)');
        codeLines.push('    if not user_vars:');
        codeLines.push('        user_vars = user_data.get(user_id, {})');
        codeLines.push('');
        codeLines.push('    # get_user_from_db теперь возвращает уже обработанные user_data');
        codeLines.push('    if not isinstance(user_vars, dict):');
        codeLines.push('        user_vars = user_data.get(user_id, {})');
        codeLines.push('');
        codeLines.push('    # Заменяем все переменные в тексте');
        codeLines.push('    text = replace_variables_in_text(text, all_user_vars)');
    } else {
        codeLines.push(`    text = ${formattedText}`);

        // Добавляем замену переменных в тексте ПОСЛЕ определения переменной text
        codeLines.push('');
        codeLines.push('    # Подставляем все доступные переменные пользователя в текст');
        codeLines.push('    user_vars = await get_user_from_db(user_id)');
        codeLines.push('    if not user_vars:');
        codeLines.push('        user_vars = user_data.get(user_id, {})');
        codeLines.push('');
        codeLines.push('    # get_user_from_db теперь возвращает уже обработанные user_data');
        codeLines.push('    if not isinstance(user_vars, dict):');
        codeLines.push('        user_vars = user_data.get(user_id, {})');
        codeLines.push('');
        codeLines.push('    # Заменяем все переменные в тексте');
        codeLines.push('    text = replace_variables_in_text(text, all_user_vars)');
    }

    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCodeLines = processCodeWithAutoComments(codeLines, 'generateKeyboardAndProcessAttachedMedia.ts');

    // Обновляем оригинальный массив
    codeLines.length = 0;
    codeLines.push(...processedCodeLines);

    return formattedText;
}
