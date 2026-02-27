/**
 * @fileoverview Типы для управления проектами
 *
 * Этот модуль предоставляет интерфейсы и типы для операций
 * с проектами ботов.
 *
 * @module projectManagement/types
 */

/** Результат операции удаления проекта */
export interface DeleteProjectResult {
    /** Успешность операции */
    success: boolean;
    /** Сообщение результата */
    message: string;
    /** Сообщение об ошибке (если есть) */
    error?: string;
}
