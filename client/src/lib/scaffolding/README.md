# Scaffolding Module

Модуль для генерации дополнительных файлов проекта и инфраструктуры.

## Файлы

- `generateConfigYaml.ts` - Генерация конфигурационных YAML файлов
- `generateDockerfile.ts` - Генерация Dockerfile для контейнеризации
- `generateReadme.ts` - Генерация README файла проекта
- `generateRequirementsTxt.ts` - Генерация requirements.txt для Python зависимостей

## Использование

```typescript
import { 
  generateConfigYaml,
  generateDockerfile,
  generateReadme,
  generateRequirementsTxt 
} from './scaffolding';

// Генерация файла зависимостей
const requirements = generateRequirementsTxt(botFeatures);

// Генерация Dockerfile
const dockerfile = generateDockerfile(projectConfig);

// Генерация README
const readme = generateReadme(botData, projectInfo);
```

## Генерируемые файлы

### Python проект
- **requirements.txt** - список Python зависимостей
- **README.md** - документация проекта
- **config.yaml** - конфигурационные файлы

### Контейнеризация
- **Dockerfile** - образ для Docker контейнера
- **docker-compose.yml** - оркестрация сервисов

## Особенности

- Автоматическое определение необходимых зависимостей
- Настройка под различные среды развертывания
- Генерация документации на основе структуры бота
- Поддержка различных конфигураций проекта