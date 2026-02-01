/**
 * Генерирует каркас основной функции с обработчиками сигналов
 * Создает Python функцию main() с обработчиками сигналов для корректного завершения работы бота
 */
export function generateMainFunctionScaffoldWithSignalHandlers(userDatabaseEnabled: boolean, code: string) {
  code += '\n\n# Запуск бота\n';
  code += 'async def main():\n';
  if (userDatabaseEnabled) {
    code += '    global db_pool\n';
  }
  code += '    \n';
  code += '    # Обработчик сигналов для корректного завершения\n';
  code += '    def signal_handler(signum, frame):\n';
  code += '        print(f"🛑 Получен сигнал {signum}, начинаем корректное завершение...")\n';
  code += '        raise KeyboardInterrupt()\n';
  code += '    \n';
  code += '    # Регистрируем обработчики сигналов\n';
  code += '    signal.signal(signal.SIGTERM, signal_handler)\n';
  code += '    signal.signal(signal.SIGINT, signal_handler)\n';
  code += '    \n';
  code += '    try:\n';
  
  return code;
}