/**
 * @fileoverview Утилиты для работы с сессией
 *
 * Этот модуль предоставляет функции для промисификации
 * методов сессии Express.
 *
 * @module auth/utils/sessionUtils
 */

import type { Request } from "express";

/**
 * Промисифицирует метод regenerate сессии
 *
 * @function regenerateSession
 * @param {Request} req - Объект запроса Express
 * @returns {Promise<void>}
 */
export function regenerateSession(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
        req.session!.regenerate((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Промисифицирует метод save сессии
 *
 * @function saveSession
 * @param {Request} req - Объект запроса Express
 * @returns {Promise<void>}
 */
export function saveSession(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
        req.session!.save((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
