import type { FakeCallbackTemplateParams } from './fake-callback.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateFakeCallback(params: FakeCallbackTemplateParams): string {
  return renderPartialTemplate('fake-callback/fake-callback.py.jinja2', params);
}
