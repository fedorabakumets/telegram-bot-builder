export interface CsvSafeTemplateParams {
  operation: 'write' | 'read';
  csvFileVar: string;
  dataVar?: string;
  resultVar?: string;
  indentLevel?: string;
}
