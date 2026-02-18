/**
 * @file main.tsx
 * @brief Главный файл точки входа для клиентского приложения Telegram Bot Builder
 *
 * Этот файл является точкой входа для React-приложения. Он отвечает за:
 * - Импорт необходимых зависимостей из React DOM
 * - Подключение главного компонента приложения
 * - Подключение глобальных стилей
 * - Монтирование приложения в DOM-элемент
 *
 * @author Telegram Bot Builder Team
 * @version 1.0
 * @date 2026
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * @brief Функция монтирования React-приложения в DOM
 *
 * Создает корневой элемент React DOM, используя элемент с ID "root" из HTML-документа,
 * и рендерит в него главный компонент приложения <App />.
 *
 * @note Используется восклицательный знак (!) при обращении к getElementById,
 *       потому что мы предполагаем, что элемент "root" всегда существует в DOM.
 */
createRoot(document.getElementById("root")!).render(<App />);
