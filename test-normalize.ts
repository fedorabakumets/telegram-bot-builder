import { normalizeProjectNameToFile } from './normalizeFileName';

// Тестируем нормализацию имени проекта
const testNames = [
  "проект 28",
  "My Test Project",
  "Project-123",
  "Project_123",
  "Special@#$%Project",
  "  Spaced   Name  ",
  "Very Long Project Name That Exceeds The Character Limit And Needs To Be Truncated Properly",
  ".HiddenFile",
  "_UnderscoreStart",
  "",
  "___",
  "Normal-Project_Name"
];

console.log("Тестирование нормализации имен проектов:");
testNames.forEach(name => {
  const normalized = normalizeProjectNameToFile(name);
  console.log(`"${name}" -> "${normalized}"`);
});