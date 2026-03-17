export function navigateaftersave(code: string) {
    code += '        # РџРµСЂРµС…РѕРґРёРј Рє СЃР»РµРґСѓСЋС‰РµРјСѓ СѓР·Р»Сѓ РµСЃР»Рё СѓРєР°Р·Р°РЅ\n';
    code += '        if next_node_id:\n';
    code += '            try:\n';
    code += '                logging.info(f"рџљЂ РџРµСЂРµС…РѕРґРёРј Рє СЃР»РµРґСѓСЋС‰РµРјСѓ СѓР·Р»Сѓ: {next_node_id}")\n';
    code += '                \n';
    code += '                # РџСЂРѕРІРµСЂСЏРµРј, СЏРІР»СЏРµС‚СЃСЏ Р»Рё СЌС‚Рѕ РєРѕРјР°РЅРґРѕР№\n';
    code += '                if next_node_id == "profile_command":\n';
    code += '                    logging.info("РџРµСЂРµС…РѕРґ Рє РєРѕРјР°РЅРґРµ /profile")\n';
    code += '                    # РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ profile_handler РїРµСЂРµРґ РІС‹Р·РѕРІРѕРј\n';
    code += '                    profile_func = globals().get("profile_handler")\n';
    code += '                    if profile_func:\n';
    code += '                        await profile_func(message)\n';
    code += '                    else:\n';
    code += '                        logging.warning("profile_handler РЅРµ РЅР°Р№РґРµРЅ, РїСЂРѕРїСѓСЃРєР°РµРј РІС‹Р·РѕРІ")\n';
    code += '                        await message.answer("РљРѕРјР°РЅРґР° /profile РЅРµ РЅР°Р№РґРµРЅР°")\n';
    code += '                else:\n';
    code += '                    # РЎРѕР·РґР°РµРј С„РёРєС‚РёРІРЅС‹Р№ callback РґР»СЏ РЅР°РІРёРіР°С†РёРё Рє РѕР±С‹С‡РЅРѕРјСѓ СѓР·Р»Сѓ\n';
    code += '                    fake_callback = SimpleNamespace(\n';
    code += '                        id="conditional_nav",\n';
    code += '                        from_user=message.from_user,\n';
    code += '                        chat_instance="",\n';
    code += '                        data=next_node_id,\n';
    code += '                        message=message,\n';
    code += '                        answer=lambda *args, **kwargs: asyncio.sleep(0)\n';
    code += '                    )\n';
    code += '                    \n';
    return code;
}

