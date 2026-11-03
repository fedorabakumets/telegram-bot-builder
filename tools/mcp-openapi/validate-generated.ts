/** @fileoverview Отклонение устаревшего generated-клиента до исполнения его кода и открытия stdio. */
import ts from 'typescript';
import { mayExposeOperation } from './exposure.mjs';

/**
 * Проверяет литеральные определения текущего генератора, не выполняя сгенерированный файл.
 * @param sourceText - Исходник generated/src/index.ts.
 * @returns Число разрешённых инструментов; неподдерживаемый формат закрыт.
 */
export function validateGeneratedClient(sourceText: string): number {
  const source = ts.createSourceFile('generated.ts', sourceText, ts.ScriptTarget.Latest, true);
  const routes = new Set<string>();
  let count = 0;
  /** Читает только строковые литералы, не вычисляя выражения. */
  function literal(node: ts.Expression | undefined): string | undefined {
    return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
  }
  /** Проверяет определения инструментов старого и нового generated-клиента. */
  function visit(node: ts.Node): void {
    if (ts.isObjectLiteralExpression(node)) {
      const properties = new Map(node.properties.filter(ts.isPropertyAssignment).map(property =>
        [ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : '', property.initializer]));
      if (properties.has('pathTemplate')) {
        const path = literal(properties.get('pathTemplate'));
        const method = literal(properties.get('method'));
        const tagNode = properties.get('tags');
        const tags = tagNode && ts.isArrayLiteralExpression(tagNode) ? tagNode.elements.map(element => literal(element as ts.Expression)) : [];
        const key = `${method} ${path}`;
        if (!path || !method || tags.some(tag => tag === undefined) || !mayExposeOperation(path, { tags }, method) || routes.has(key)) {
          throw new Error('Generated OpenAPI MCP не соответствует закрытой политике. Пересоберите через npm run mcp:openapi:generate; старый клиент не будет запущен.');
        }
        routes.add(key); count++;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (count !== 5) throw new Error('Generated OpenAPI MCP должен содержать ровно пять проверенных GET-операций. Пересоберите клиент.');
  return count;
}
