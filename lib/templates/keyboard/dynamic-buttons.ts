/**
 * @fileoverview Shared helpers and types for dynamic inline keyboards.
 * @module templates/keyboard/dynamic-buttons
 */

export type DynamicButtonsStyleMode = 'field' | 'template' | 'none';

export interface DynamicButtonsConfig {
  sourceVariable: string;
  arrayPath: string;
  textTemplate: string;
  callbackTemplate: string;
  styleMode: DynamicButtonsStyleMode;
  styleField: string;
  styleTemplate: string;
  columns: number;
}

const DEFAULT_DYNAMIC_BUTTONS_CONFIG: DynamicButtonsConfig = {
  sourceVariable: '',
  arrayPath: '',
  textTemplate: '',
  callbackTemplate: '',
  styleMode: 'none',
  styleField: '',
  styleTemplate: '',
  columns: 2,
};

function toNonEmptyString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function toColumns(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_DYNAMIC_BUTTONS_CONFIG.columns;
  }
  const rounded = Math.trunc(value);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

function toStyleMode(value: unknown): DynamicButtonsStyleMode {
  return value === 'field' || value === 'template' || value === 'none' ? value : 'none';
}

/**
 * Normalizes a dynamic buttons config and supports legacy field names.
 */
export function normalizeDynamicButtonsConfig(value: unknown): DynamicButtonsConfig | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const config = value as Record<string, unknown>;
  const normalized: DynamicButtonsConfig = {
    sourceVariable: toNonEmptyString(config.sourceVariable ?? config.variable),
    arrayPath: toNonEmptyString(config.arrayPath ?? config.arrayField),
    textTemplate: toNonEmptyString(config.textTemplate ?? config.textField),
    callbackTemplate: toNonEmptyString(config.callbackTemplate ?? config.callbackField),
    styleMode: toStyleMode(config.styleMode),
    styleField: toNonEmptyString(config.styleField),
    styleTemplate: toNonEmptyString(config.styleTemplate),
    columns: toColumns(config.columns),
  };

  if (
    !normalized.sourceVariable &&
    !normalized.arrayPath &&
    !normalized.textTemplate &&
    !normalized.callbackTemplate &&
    !normalized.styleField &&
    !normalized.styleTemplate &&
    normalized.styleMode === 'none' &&
    normalized.columns === DEFAULT_DYNAMIC_BUTTONS_CONFIG.columns
  ) {
    return null;
  }

  return normalized;
}

export function hasDynamicButtonsConfig(value: unknown): value is DynamicButtonsConfig {
  return normalizeDynamicButtonsConfig(value) !== null;
}

export function shouldUseDynamicButtons(
  params: { enableDynamicButtons?: boolean; dynamicButtons?: unknown; keyboardType?: string } | null | undefined
): boolean {
  if (!params?.enableDynamicButtons) {
    return false;
  }
  if (params.keyboardType && params.keyboardType !== 'inline') {
    return true;
  }
  return hasDynamicButtonsConfig(params.dynamicButtons);
}

