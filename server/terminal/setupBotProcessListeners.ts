import { botProcesses } from 'server/routes/routes';
import { setupProcessOutputListener } from './setupProcessOutputListener';

/**
 * Настройка прослушивания вывода процессов ботов
 */
export function setupBotProcessListeners() {
    // При добавлении нового процесса в botProcesses, подписываемся на его вывод
    // Обертываем методы Map для отслеживания изменений
    const originalSet = botProcesses.set.bind(botProcesses);

    botProcesses.set = function (key: string, value: any) {
        // Подписываемся на вывод процесса
        setupProcessOutputListener(key, value);

        return originalSet(key, value);
    };

    // Также проверяем уже существующие процессы
    for (const [key, process] of botProcesses) {
        setupProcessOutputListener(key, process);
    }
}
