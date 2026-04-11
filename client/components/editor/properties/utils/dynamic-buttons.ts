import type { DynamicButtonsConfig } from '../types/keyboard-layout';

type LegacyDynamicButtonsConfig = Partial<DynamicButtonsConfig> & {
  variable?: string;
  arrayField?: string;
  textField?: string;
  callbackField?: string;
};

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function clampColumns(value: number | undefined): number {
  const normalized = Number.isFinite(value) ? Math.trunc(value as number) : 2;
  return Math.min(6, Math.max(1, normalized || 2));
}

function sampleValue(token: string, index: number): string {
  const lower = token.toLowerCase();

  if (lower === 'id' || lower.endsWith('_id') || lower.includes('id')) {
    return String(100 + index);
  }

  if (lower.includes('name') || lower.includes('title') || lower.includes('text') || lower.includes('label')) {
    return `Project ${index + 1}`;
  }

  if (lower.includes('callback')) {
    return `project_${100 + index}`;
  }

  if (lower.includes('style') || lower.includes('status')) {
    return index % 2 === 0 ? 'success' : 'danger';
  }

  if (lower.includes('count') || lower.includes('total')) {
    return String((index + 1) * 3);
  }

  return token;
}

function renderTemplate(template: string, index: number): string {
  const trimmed = cleanString(template);
  if (!trimmed) return '';

  const rendered = trimmed.replace(/\{([^{}]+)\}/g, (_match, token: string) => sampleValue(token, index));
  return rendered.trim() || trimmed;
}

export function normalizeDynamicButtonsConfig(config?: LegacyDynamicButtonsConfig | null): DynamicButtonsConfig {
  const sourceVariable = cleanString(config?.sourceVariable ?? config?.variable);
  const arrayPath = cleanString(config?.arrayPath ?? config?.arrayField);
  const textTemplate = cleanString(config?.textTemplate ?? config?.textField);
  const callbackTemplate = cleanString(config?.callbackTemplate ?? config?.callbackField);
  const styleField = cleanString(config?.styleField);
  const styleTemplate = cleanString(config?.styleTemplate);
  const styleMode = config?.styleMode === 'field' || config?.styleMode === 'template' ? config.styleMode : 'none';

  return {
    sourceVariable,
    arrayPath,
    textTemplate,
    callbackTemplate,
    styleMode,
    styleField,
    styleTemplate,
    columns: clampColumns(config?.columns),
    variable: cleanString(config?.variable),
    arrayField: cleanString(config?.arrayField),
    textField: cleanString(config?.textField),
    callbackField: cleanString(config?.callbackField),
  };
}

export function getDynamicButtonsSummary(config?: LegacyDynamicButtonsConfig | null): string {
  const normalized = normalizeDynamicButtonsConfig(config);
  const source = normalized.sourceVariable || 'response';
  const path = normalized.arrayPath ? `.${normalized.arrayPath}` : '';
  const text = normalized.textTemplate || '{name}';
  const callback = normalized.callbackTemplate || 'callback_{id}';
  const style =
    normalized.styleMode === 'field' && normalized.styleField
      ? `style: ${normalized.styleField}`
      : normalized.styleMode === 'template' && normalized.styleTemplate
        ? `style: ${normalized.styleTemplate}`
        : 'style: none';

  return `${source}${path} | text: ${text} | callback: ${callback} | ${style}`;
}

export interface DynamicButtonsPreviewItem {
  id: string;
  text: string;
  customCallbackData: string;
  action: 'default';
  style?: 'primary' | 'success' | 'danger';
}

export function buildDynamicButtonsPreviewItems(config?: LegacyDynamicButtonsConfig | null): DynamicButtonsPreviewItem[] {
  const normalized = normalizeDynamicButtonsConfig(config);
  const count = Math.max(2, Math.min(6, normalized.columns * 2));
  const items: DynamicButtonsPreviewItem[] = [];

  for (let index = 0; index < count; index += 1) {
    const text = renderTemplate(normalized.textTemplate || '{name}', index) || `Project ${index + 1}`;
    const customCallbackData = renderTemplate(normalized.callbackTemplate || 'project_{id}', index) || `project_${100 + index}`;
    const styleFromMode =
      normalized.styleMode === 'field'
        ? sampleValue(normalized.styleField || 'style', index)
        : normalized.styleMode === 'template'
          ? renderTemplate(normalized.styleTemplate || '{style}', index)
          : '';

    const style = styleFromMode === 'success' || styleFromMode === 'danger' || styleFromMode === 'primary'
      ? styleFromMode
      : normalized.styleMode === 'field'
        ? (index % 2 === 0 ? 'success' : 'danger')
        : undefined;

    items.push({
      id: `dynamic-preview-${index}`,
      text,
      customCallbackData,
      action: 'default',
      style,
    });
  }

  return items;
}
