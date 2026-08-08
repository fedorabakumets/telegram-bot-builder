/**
 * @fileoverview Примеры тел/ответов для OpenAPI тега templates.
 * @module server/swagger/paths/template-examples
 */

/** Минимальный data проекта в примерах (без секретов) */
export const TEMPLATE_DATA_EXAMPLE = {
  sheets: [
    {
      id: "main",
      name: "Основной",
      nodes: [
        {
          id: "start",
          type: "start",
          position: { x: 0, y: 0 },
          data: { messageText: "Привет!" },
        },
      ],
      edges: [],
    },
  ],
};

/** Пример системного сценария в списке (с flow_data) */
export const TEMPLATE_LIST_ITEM_EXAMPLE = {
  id: 1,
  ownerId: null,
  name: "FAQ-бот",
  description: "Ответы на частые вопросы",
  data: TEMPLATE_DATA_EXAMPLE,
  flow_data: TEMPLATE_DATA_EXAMPLE,
  category: "utility",
  tags: ["faq", "support"],
  isPublic: 1,
  difficulty: "easy",
  authorName: null,
  useCount: 120,
  rating: 0,
  ratingCount: 0,
  featured: 1,
  language: "ru",
  complexity: 2,
  estimatedTime: 10,
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-01-10T10:00:00.000Z",
};

/** Пример тела POST /api/templates из save-template-modal */
export const CREATE_TEMPLATE_EXAMPLE = {
  name: "Мой FAQ",
  description: "Сохранено из редактора",
  category: "custom",
  tags: [] as string[],
  isPublic: 0,
  difficulty: "easy",
  language: "ru",
  requiresToken: 1,
  complexity: 1,
  estimatedTime: 5,
  authorName: "ivan",
  data: TEMPLATE_DATA_EXAMPLE,
};

/** Пример ответа POST …/use (авторизованный) */
export const USE_TEMPLATE_AUTH_EXAMPLE = {
  message: "Template copied to your projects and collection",
  project: {
    id: 266,
    ownerId: 123456789,
    name: "FAQ-бот",
    description: "Ответы на частые вопросы",
    data: TEMPLATE_DATA_EXAMPLE,
    userDatabaseEnabled: 1,
  },
  copiedTemplate: {
    id: 88,
    ownerId: 123456789,
    name: "FAQ-бот",
    description: "Ответы на частые вопросы",
    data: TEMPLATE_DATA_EXAMPLE,
    category: "custom",
    isPublic: 0,
    difficulty: "easy",
    useCount: 0,
    rating: 0,
    ratingCount: 0,
    featured: 0,
    language: "ru",
    complexity: 2,
    estimatedTime: 10,
  },
};
