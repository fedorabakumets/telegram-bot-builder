/**
 * @fileoverview Типы пропсов компонентов telegram-client
 *
 * Централизованный импорт типов из компонентов для удобного экспорта.
 *
 * @module types/components-props
 */

// Тип из отдельного файла
export type { QrCodeGeneratorProps } from './qr-code-generator-props';

// Типы из компонентов
export type { QrCodeDisplayProps } from '../components/qr-code-display';
export type { QrCountdownBadgeProps } from '../components/qr-countdown-badge';
export type { QrStatusHeaderProps } from '../components/qr-status-header';
export type { QrInfoTextProps } from '../components/qr-info-text';
export type { QrStatusButtonProps } from '../components/qr-status-button';
export type { QrActionButtonsProps } from '../components/qr-action-buttons';
export type { StartStepViewProps } from '../components/start-step-view';
export type { QrStepViewProps } from '../components/qr-step-view';
export type { QrPasswordStepViewProps } from '../components/qr-password-step-view';
