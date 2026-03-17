import type { ParseModeTemplateParams } from './parse-mode.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateParseMode(params: ParseModeTemplateParams): string {
  return renderPartialTemplate('parse-mode/parse-mode.py.jinja2', params);
}

export function buildParseModeParams(node: any, indent?: string): ParseModeTemplateParams {
  return {
    formatMode: node.data.formatMode,
    markdown: node.data.markdown,
    indentLevel: indent,
  };
}
