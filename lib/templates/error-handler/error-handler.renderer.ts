import type { ErrorHandlerTemplateParams } from './error-handler.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateErrorHandler(params: ErrorHandlerTemplateParams = {}): string {
  return renderPartialTemplate('error-handler/error-handler.py.jinja2', params);
}
