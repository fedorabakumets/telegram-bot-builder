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
 * @param req - Объект запроса Express
 * @returns Promise без значения
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
 * @param req - Объект запроса Express
 * @returns Promise без значения
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

/**
 * Промисифицирует метод destroy сессии
 *
 * @param req - Объект запроса Express
 * @returns Promise без значения
 */
export function destroySession(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            resolve();
            return;
        }
        req.session.destroy((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
