/**
 * @fileoverview Типы для операций GitHub
 *
 * Этот модуль предоставляет интерфейсы и типы для операций
 * с репозиторием GitHub.
 *
 * @module githubPush/types
 */

/** Результат операции push на GitHub */
export interface GithubPushResult {
    /** Успешность операции */
    success: boolean;
    /** Сообщение результата */
    message: string;
    /** Количество отправленных файлов */
    filesCount?: number;
    /** Сообщение об ошибке (если есть) */
    error?: string;
}

/** Данные для создания blob на GitHub */
export interface CreateBlobData {
    /** Содержимое файла */
    content: string;
    /** Кодировка содержимого */
    encoding: string;
}

/** Данные для создания коммита */
export interface CreateCommitData {
    /** Сообщение коммита */
    message: string;
    /** Хеш дерева */
    tree: string;
    /** Родительские коммиты */
    parents: string[];
}
