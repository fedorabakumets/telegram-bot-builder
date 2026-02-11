export function skipDataCollectionnavigate(nodes: any[], code: string) {
    if (nodes.length > 0) {
        nodes.forEach((targetNode, idx) => {
            const cond = idx === 0 ? 'if' : 'elif';
            const safeFnName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
            code += `                ${cond} skip_button_target == "${targetNode.id}":\n`;
            code += `                    await handle_callback_${safeFnName}(fake_callback)\n`;
        });
        code += '                else:\n';
        code += '                    logging.warning(f"Неизвестный целевой узел кнопки skipDataCollection: {skip_button_target}")\n';
    }
    return code;
}
export function skip_button_target(code: string) {
    code += '        # Если нажата кнопка пропуска - переходим к её target без сохранения\n';
    code += '        if skip_button_target:\n';
    code += '            # Очищаем состояние ожидания\n';
    code += '            del user_data[user_id]["waiting_for_conditional_input"]\n';
    code += '            \n';
    code += '            # Переходим к целевому узлу кнопки\n';
    code += '            try:\n';
    code += '                logging.info(f"🚀 Переходим к узлу кнопки skipDataCollection: {skip_button_target}")\n';
    code += '                import types as aiogram_types\n';
    code += '                fake_callback = aiogram_types.SimpleNamespace(\n';
    code += '                    id="skip_button_nav",\n';
    code += '                    from_user=message.from_user,\n';
    code += '                    chat_instance="",\n';
    code += '                    data=skip_button_target,\n';
    code += '                    message=message,\n';
    code += '                    answer=lambda *args, **kwargs: asyncio.sleep(0)\n';
    code += '                )\n';
    return code;
}
export function skipDataCollection(code: string) {
    code += '        # ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true\n';
    code += '        skip_buttons = config.get("skip_buttons", [])\n';
    code += '        skip_button_target = None\n';
    code += '        for skip_btn in skip_buttons:\n';
    code += '            if skip_btn.get("text") == user_text:\n';
    code += '                skip_button_target = skip_btn.get("target")\n';
    code += '                logging.info(f"⏭️ Нажата кнопка с skipDataCollection: {user_text} -> {skip_button_target}")\n';
    code += '                break\n';
    code += '        \n';
    return code;
}
