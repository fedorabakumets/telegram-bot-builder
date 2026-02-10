/**
 * @fileoverview Модуль для инициализации и восстановления состояния множественного выбора в обработчике команды /start
 *
 * Этот модуль предоставляет функцию для генерации Python-кода, которая:
 * - Восстанавливает состояние множественного выбора из базы данных или локального хранилища
 * - Инициализирует состояние множественного выбора для пользователя
 * - Создает клавиатуру с восстановленными галочками для уже выбранных элементов
 * - Обрабатывает кнопки интересов и другие типы кнопок
 *
 * @module initializeAndRestoreMultipleSelectionState
 */

import { generateButtonText } from '../format';

/**
 * Генерирует Python-код для инициализации и восстановления состояния множественного выбора
 *
 * Функция добавляет в массив codeLines Python-код, который:
 * - Восстанавливает ранее выбранные пользователем интересы из базы данных или локального хранилища
 * - Инициализирует состояние множественного выбора для текущего узла
 * - Создает inline-клавиатуру с восстановленными галочками для уже выбранных элементов
 * - Обрабатывает различные типы кнопок (выбор, команды, переходы, URL)
 *
 * @param node - Узел конфигурации, содержащий настройки и данные команды
 * @param codeLines - Массив строк кода, в который будет добавлен сгенерированный Python-код
 * @param userDatabaseEnabled - Флаг, указывающий на использование базы данных для хранения пользовательских данных
 *
 * @example
 * const node = {
 *   id: "start-node",
 *   data: {
 *     allowMultipleSelection: true,
 *     buttons: [
 *       { text: "Спорт", action: "selection", target: "sport" },
 *       { text: "Музыка", action: "selection", target: "music" },
 *       { text: "/help", action: "command", target: "/help" }
 *     ],
 *     continueButtonText: "Продолжить"
 *   }
 * };
 * const codeLines: string[] = [];
 * initializeAndRestoreMultipleSelectionState(node, codeLines, true);
 * // codeLines теперь содержит Python-код для обработки множественного выбора
 */
export function initializeAndRestoreMultipleSelectionState(node: { id: string; type: "message" | "start" | "command" | "sticker" | "voice" | "animation" | "location" | "contact" | "pin_message" | "unpin_message" | "delete_message" | "ban_user" | "unban_user" | "mute_user" | "unmute_user" | "kick_user" | "promote_user" | "demote_user" | "admin_rights"; position: { x: number; y: number; }; data: { options: string[]; keyboardType: "reply" | "inline" | "none"; buttons: { id: string; text: string; action: "command" | "location" | "contact" | "goto" | "url" | "selection" | "default"; buttonType: "normal" | "option" | "complete"; skipDataCollection: boolean; hideAfterClick: boolean; url?: string | undefined; target?: string | undefined; requestContact?: boolean | undefined; requestLocation?: boolean | undefined; }[]; oneTimeKeyboard: boolean; resizeKeyboard: boolean; markdown: boolean; formatMode: "none" | "markdown" | "html"; synonyms: string[]; isPrivateOnly: boolean; adminOnly: boolean; requiresAuth: boolean; showInMenu: boolean; enableStatistics: boolean; customParameters: string[]; messageIdSource: "manual" | "variable" | "last_message"; disableNotification: boolean; userIdSource: "manual" | "variable" | "last_message"; mapService: "custom" | "yandex" | "google" | "2gis"; mapZoom: number; showDirections: boolean; generateMapPreview: boolean; allowsMultipleAnswers: boolean; anonymousVoting: boolean; inputType: "number" | "location" | "contact" | "text" | "email" | "phone" | "photo" | "video" | "audio" | "document" | "any"; responseType: "text" | "buttons"; responseOptions: { id: string; text: string; action: "command" | "goto" | "url"; value?: string | undefined; url?: string | undefined; target?: string | undefined; }[]; allowMultipleSelection: boolean; inputRequired: boolean; enableConditionalMessages: boolean; collectUserInput: boolean; conditionalMessages: { id: string; messageText: string; keyboardType: "reply" | "inline" | "none"; buttons: { id: string; text: string; action: "command" | "location" | "contact" | "goto" | "url" | "selection" | "default"; buttonType: "normal" | "option" | "complete"; skipDataCollection: boolean; hideAfterClick: boolean; url?: string | undefined; target?: string | undefined; requestContact?: boolean | undefined; requestLocation?: boolean | undefined; }[]; formatMode: "text" | "markdown" | "html"; condition: "user_data_exists" | "user_data_equals" | "user_data_not_exists" | "user_data_contains" | "first_time" | "returning_user"; variableNames: string[]; logicOperator: "AND" | "OR"; collectUserInput: boolean; enableTextInput: boolean; enablePhotoInput: boolean; enableVideoInput: boolean; enableAudioInput: boolean; enableDocumentInput: boolean; waitForTextInput: boolean; priority: number; oneTimeKeyboard?: boolean | undefined; resizeKeyboard?: boolean | undefined; variableName?: string | undefined; inputVariable?: string | undefined; expectedValue?: string | undefined; photoInputVariable?: string | undefined; videoInputVariable?: string | undefined; audioInputVariable?: string | undefined; documentInputVariable?: string | undefined; textInputVariable?: string | undefined; nextNodeAfterInput?: string | undefined; }[]; saveToDatabase: boolean; allowSkip: boolean; inputButtonType: "reply" | "inline"; enableAutoTransition: boolean; enableUserActions: boolean; silentAction: boolean; canChangeInfo: boolean; canDeleteMessages: boolean; canBanUsers: boolean; canInviteUsers: boolean; canPinMessages: boolean; canAddAdmins: boolean; canRestrictMembers: boolean; canPromoteMembers: boolean; canManageVideoChats: boolean; canManageTopics: boolean; isAnonymous: boolean; canSendMessages: boolean; canSendMediaMessages: boolean; canSendPolls: boolean; canSendOtherMessages: boolean; canAddWebPagePreviews: boolean; canChangeGroupInfo: boolean; canInviteUsers2: boolean; canPinMessages2: boolean; adminUserIdSource: "manual" | "variable" | "last_message"; can_manage_chat: boolean; can_post_messages: boolean; can_edit_messages: boolean; can_delete_messages: boolean; can_post_stories: boolean; can_edit_stories: boolean; can_delete_stories: boolean; can_manage_video_chats: boolean; can_restrict_members: boolean; can_promote_members: boolean; can_change_info: boolean; can_invite_users: boolean; can_pin_messages: boolean; can_manage_topics: boolean; is_anonymous: boolean; adminChatIdSource: "manual" | "variable" | "current_chat"; attachedMedia: string[]; command?: string | undefined; description?: string | undefined; messageText?: string | undefined; imageUrl?: string | undefined; videoUrl?: string | undefined; audioUrl?: string | undefined; documentUrl?: string | undefined; documentName?: string | undefined; mediaCaption?: string | undefined; text?: string | undefined; action?: string | undefined; commandTimeout?: number | undefined; cooldownTime?: number | undefined; maxUsagesPerDay?: number | undefined; targetMessageId?: string | undefined; variableName?: string | undefined; targetUserId?: string | undefined; userVariableName?: string | undefined; targetGroupId?: string | undefined; stickerUrl?: string | undefined; stickerFileId?: string | undefined; voiceUrl?: string | undefined; animationUrl?: string | undefined; latitude?: number | undefined; longitude?: number | undefined; title?: string | undefined; address?: string | undefined; foursquareId?: string | undefined; foursquareType?: string | undefined; yandexMapUrl?: string | undefined; googleMapUrl?: string | undefined; gisMapUrl?: string | undefined; phoneNumber?: string | undefined; firstName?: string | undefined; lastName?: string | undefined; userId?: number | undefined; vcard?: string | undefined; question?: string | undefined; emoji?: string | undefined; mediaDuration?: number | undefined; width?: number | undefined; height?: number | undefined; performer?: string | undefined; fileSize?: number | undefined; filename?: string | undefined; multiSelectVariable?: string | undefined; continueButtonText?: string | undefined; continueButtonTarget?: string | undefined; inputVariable?: string | undefined; inputPrompt?: string | undefined; inputValidation?: string | undefined; inputTimeout?: number | undefined; inputRetryMessage?: string | undefined; inputSuccessMessage?: string | undefined; enableTextInput?: boolean | undefined; enablePhotoInput?: boolean | undefined; enableVideoInput?: boolean | undefined; enableAudioInput?: boolean | undefined; enableDocumentInput?: boolean | undefined; photoInputVariable?: string | undefined; videoInputVariable?: string | undefined; audioInputVariable?: string | undefined; documentInputVariable?: string | undefined; waitForTextInput?: boolean | undefined; fallbackMessage?: string | undefined; inputTargetNodeId?: string | undefined; autoTransitionTo?: string | undefined; minLength?: number | undefined; maxLength?: number | undefined; placeholder?: string | undefined; defaultValue?: string | undefined; actionTrigger?: "join" | "message" | "custom" | "leave" | "button_click" | undefined; triggerText?: string | undefined; userActionType?: "message" | "command" | "button" | "media" | undefined; actionTag?: string | undefined; actionMessage?: string | undefined; mimeType?: string | undefined; stickerSetName?: string | undefined; fileName?: string | undefined; city?: string | undefined; country?: string | undefined; name?: string | undefined; label?: string | undefined; checkmarkSymbol?: string | undefined; multiSelectCheckmark?: string | undefined; duration?: number | undefined; muteDuration?: number | undefined; reason?: string | undefined; untilDate?: number | undefined; adminTargetUserId?: string | undefined; adminUserVariableName?: string | undefined; adminChatId?: string | undefined; adminChatVariableName?: string | undefined; }; }, codeLines: string[], userDatabaseEnabled: boolean) {
    if (node && node.data && node.data.allowMultipleSelection) {
        codeLines.push('');
        codeLines.push('    saved_interests = []');
        codeLines.push('');

        if (userDatabaseEnabled) {
            codeLines.push('    # Восстанавливаем состояние множественного выбора из БД');
            codeLines.push('    user_record = await get_user_from_db(user_id)');
            codeLines.push('');
            codeLines.push('    if user_record and isinstance(user_record, dict):');
            codeLines.push('        user_data_field = user_record.get("user_data", {})');
            codeLines.push('        if isinstance(user_data_field, str):');
            codeLines.push('            try:');
            codeLines.push('                user_vars = json.loads(user_data_field)');
            codeLines.push('            except:');
            codeLines.push('                user_vars = {}');
            codeLines.push('        elif isinstance(user_data_field, dict):');
            codeLines.push('            user_vars = user_data_field');
            codeLines.push('        else:');
            codeLines.push('            user_vars = {}');
            codeLines.push('        ');
            codeLines.push('        # Ищем сохраненные интересы');
            codeLines.push('        for var_name, var_data in user_vars.items():');
            codeLines.push('            if "интерес" in var_name.lower() or var_name == "user_interests":');
            codeLines.push('                if isinstance(var_data, str) and var_data:');
            codeLines.push('                    saved_interests = [interest.strip() for interest in var_data.split(",")]');
            codeLines.push('                    logging.info(f"Восстановлены интересы из переменной {var_name}: {saved_interests}")');
            codeLines.push('                    break');
        } else {
            codeLines.push('    # Восстанавливаем состояние из локального хранилища');
            codeLines.push('    if user_id in user_data:');
            codeLines.push('        for var_name, var_data in user_data[user_id].items():');
            codeLines.push('            if "интерес" in var_name.lower() or var_name == "user_interests":');
            codeLines.push('                if isinstance(var_data, str) and var_data:');
            codeLines.push('                    saved_interests = [interest.strip() for interest in var_data.split(",")]');
            codeLines.push('                    logging.info(f"Восстановлены интересы: {saved_interests}")');
            codeLines.push('                    break');
            codeLines.push('                elif isinstance(var_data, list):');
            codeLines.push('                    saved_interests = var_data');
            codeLines.push('                    logging.info(f"Восстановлены интересы: {saved_interests}")');
            codeLines.push('                    break');
        }

        codeLines.push('');
        codeLines.push('    # Инициализируем состояние множественного выбора');
        codeLines.push('    if user_id not in user_data:');
        codeLines.push('        user_data[user_id] = {}');
        codeLines.push(`    user_data[user_id]["multi_select_${node.id || 'unknown'}"] = saved_interests.copy() if saved_interests else []`);
        codeLines.push(`    user_data[user_id]["multi_select_node"] = "${node.id || 'unknown'}"`);
        codeLines.push('    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")');
        codeLines.push('');
    }

    // Создаем клавиатуру с восстановленными галочками для множественного выбора
    if (node && node.data && node.data.allowMultipleSelection) {
        codeLines.push('    # Создаем клавиатуру с восстановленными галочками');
        codeLines.push('    builder = InlineKeyboardBuilder()');
        codeLines.push('');
        codeLines.push('    # Функция для проверки совпадения интересов');
        codeLines.push('    def check_interest_match(button_text, saved_list):');
        codeLines.push('        """Проверяет, есть ли интерес в сохраненном списке"""');
        codeLines.push('        if not saved_list:');
        codeLines.push('            return False');
        codeLines.push('        # Убираем эмодзи и галочки для сравнения');
        codeLines.push('        clean_button = button_text.replace("✅ ", "").replace("⬜ ", "").strip()');
        codeLines.push('        for saved_interest in saved_list:');
        codeLines.push('            clean_saved = saved_interest.replace("✅ ", "").replace("⬜ ", "").strip()');
        codeLines.push('            if clean_button == clean_saved or clean_button in clean_saved or clean_saved in clean_button:');
        codeLines.push('                return True');
        codeLines.push('        return False');
        codeLines.push('');

        // Добавляем кнопки интересов с галочками
        const buttons = (node && node.data && node.data.buttons) ? node.data.buttons : [];
        const interestButtons = buttons.filter(btn => btn.action === 'selection');

        interestButtons.forEach(button => {
            const buttonText = button.text || 'Неизвестно';
            const buttonTarget = button.target || button.id;
            codeLines.push(`    ${buttonTarget}_selected = check_interest_match("${buttonText}", saved_interests)`);
            codeLines.push(`    ${buttonTarget}_text = "✅ ${buttonText}" if ${buttonTarget}_selected else "${buttonText}"`);
            codeLines.push(`    builder.add(InlineKeyboardButton(text=${buttonTarget}_text, callback_data="multi_select_${node.id || 'unknown'}_${buttonTarget}"))`);
            codeLines.push('');
        });

        // Добавляем кнопки команд и другие кнопки ПЕРЕД кнопкой "Готово"
        const allButtons = (node && node.data && node.data.buttons) ? node.data.buttons : [];
        const nonSelectionButtons = allButtons.filter(btn => btn.action !== 'selection');

        nonSelectionButtons.forEach(button => {
            if (button.action === 'command') {
                const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
                codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))`);
            } else if (button.action === 'goto') {
                const callbackData = button.target || button.id || 'no_action';
                codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))`);
            } else if (button.action === 'url') {
                codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))`);
            }
        });

        // Добавляем кнопку "Готово"
        const continueText = (node && node.data && node.data.continueButtonText) ? node.data.continueButtonText : 'Готово';
        codeLines.push(`    builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id || 'unknown'}"))`);
        codeLines.push('    builder.adjust(2)  # Используем 2 колонки для консистентности');
        codeLines.push('    keyboard = builder.as_markup()');
        codeLines.push('');
    }
}
