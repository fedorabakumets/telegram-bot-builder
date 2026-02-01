/**
 * Генерирует основной цикл опроса с корректным завершением работы
 * Создает Python код для запуска polling бота и корректного закрытия всех соединений при завершении
 */
export function generateMainPollingLoopWithGracefulShutdown(userDatabaseEnabled: boolean, code: string) {
  code += '        print("🤖 Бот запущен и готов к работе!")\n';
  code += '        await dp.start_polling(bot)\n';
  code += '    except KeyboardInterrupt:\n';
  code += '        print("🛑 Получен сигнал остановки, завершаем работу...")\n';
  code += '    except SystemExit:\n';
  code += '        print("🛑 Системное завершение, завершаем работу...")\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Критическая ошибка: {e}")\n';
  code += '    finally:\n';
  code += '        # Правильно закрываем все соединения\n';
  if (userDatabaseEnabled) {
    code += '        if db_pool:\n';
    code += '            await db_pool.close()\n';
    code += '            print("🔌 Соединение с базой данных закрыто")\n';
  }
  code += '        \n';
  code += '        # Закрываем сессию бота\n';
  code += '        await bot.session.close()\n';
  code += '        print("🔌 Сессия бота закрыта")\n';
  code += '        print("✅ Бот корректно завершил работу")\n\n';
  
  return code;
}