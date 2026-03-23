/**
 * @fileoverview Тестовые данные для шаблона обработчиков узлов условия
 * @module templates/condition/condition.fixture
 */

import type { ConditionTemplateParams } from './condition.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (ConditionTemplateParams) ───────────────────────

/** Пустой массив узлов условия */
export const validParamsEmpty: ConditionTemplateParams = {
  entries: [],
};

/**
 * Узел условия с ветками filled / empty / else
 * Проверяет, заполнено ли имя пользователя
 */
export const validParamsFilledEmpty: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_name',
      variable: 'user_name',
      branches: [
        { id: 'b1', operator: 'filled', value: '', target: 'msg_greet' },
        { id: 'b2', operator: 'empty', value: '', target: 'msg_ask_name' },
        { id: 'b3', operator: 'else', value: '', target: 'msg_fallback' },
      ],
    },
  ],
};

/**
 * Узел условия с ветками equals / else
 * Проверяет роль пользователя
 */
export const validParamsEquals: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_role',
      variable: 'user_role',
      branches: [
        { id: 'b1', operator: 'equals', value: 'admin', target: 'msg_admin_panel' },
        { id: 'b2', operator: 'equals', value: 'moderator', target: 'msg_mod_panel' },
        { id: 'b3', operator: 'else', value: '', target: 'msg_user_panel' },
      ],
    },
  ],
};

/**
 * Узел условия с ветками contains / else
 * Проверяет, содержит ли email домен
 */
export const validParamsContains: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_email',
      variable: 'user_email',
      branches: [
        { id: 'b1', operator: 'contains', value: 'gmail', target: 'msg_gmail' },
        { id: 'b2', operator: 'contains', value: 'yahoo', target: 'msg_yahoo' },
        { id: 'b3', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/** Несколько узлов условия */
export const validParamsMultiple: ConditionTemplateParams = {
  entries: [
    ...validParamsFilledEmpty.entries,
    ...validParamsEquals.entries,
    ...validParamsContains.entries,
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectConditionEntries ────────────

/** Один condition-узел с ветками filled / empty / else */
export const nodesWithConditionFilledEmpty: Node[] = [
  makeNode('condition_check_name', 'condition', {
    variable: 'user_name',
    branches: [
      { id: 'b1', label: 'Заполнено', operator: 'filled', value: '', target: 'msg_greet' },
      { id: 'b2', label: 'Пусто', operator: 'empty', value: '', target: 'msg_ask_name' },
      { id: 'b3', label: 'Иначе', operator: 'else', value: '' },
    ],
  }),
  makeNode('msg_greet', 'message', { messageText: 'Привет!' }),
  makeNode('msg_ask_name', 'message', { messageText: 'Как тебя зовут?' }),
];

/** Один condition-узел с ветками equals / else */
export const nodesWithConditionEquals: Node[] = [
  makeNode('condition_check_role', 'condition', {
    variable: 'user_role',
    branches: [
      { id: 'b1', label: 'Админ', operator: 'equals', value: 'admin', target: 'msg_admin_panel' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_user_panel' },
    ],
  }),
  makeNode('msg_admin_panel', 'message', {}),
  makeNode('msg_user_panel', 'message', {}),
];

/** condition-узел без variable — должен быть пропущен */
export const nodesWithMissingVariable: Node[] = [
  makeNode('condition_bad', 'condition', {
    variable: '',
    branches: [{ id: 'b1', label: 'Иначе', operator: 'else', value: '' }],
  }),
];

/** condition-узел без веток — должен быть пропущен */
export const nodesWithNoBranches: Node[] = [
  makeNode('condition_empty', 'condition', {
    variable: 'user_name',
    branches: [],
  }),
];

/** Узлы без condition — должны быть пропущены */
export const nodesWithoutCondition: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('condition_check_name', 'condition', {
    variable: 'user_name',
    branches: [
      { id: 'b1', label: 'Заполнено', operator: 'filled', value: '', target: 'msg_greet' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '' },
    ],
  }),
  makeNode('msg_greet', 'message', {}),
];

/** Один condition-узел с ветками contains / else */
export const nodesWithConditionContains: Node[] = [
  makeNode('condition_check_email', 'condition', {
    variable: 'user_email',
    branches: [
      { id: 'b1', label: 'Gmail', operator: 'contains', value: 'gmail', target: 'msg_gmail' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_gmail', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

// ─── Фикстуры для числовых операторов ────────────────────────────────────────

/**
 * Узел условия с ветками greater_than / else
 */
export const validParamsGreaterThan: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_age_gt',
      variable: 'user_age',
      branches: [
        { id: 'b1', operator: 'greater_than', value: '18', target: 'msg_adult' },
        { id: 'b2', operator: 'else', value: '', target: 'msg_child' },
      ],
    },
  ],
};

/**
 * Узел условия с ветками less_than / else
 */
export const validParamsLessThan: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_age_lt',
      variable: 'user_age',
      branches: [
        { id: 'b1', operator: 'less_than', value: '18', target: 'msg_child' },
        { id: 'b2', operator: 'else', value: '', target: 'msg_adult' },
      ],
    },
  ],
};

/**
 * Узел условия с ветками between / else
 */
export const validParamsBetween: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_age_between',
      variable: 'user_age',
      branches: [
        { id: 'b1', operator: 'between', value: '18', value2: '65', target: 'msg_working' },
        { id: 'b2', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/** Один condition-узел с ветками greater_than / else */
export const nodesWithConditionGreaterThan: Node[] = [
  makeNode('condition_check_age_gt', 'condition', {
    variable: 'user_age',
    branches: [
      { id: 'b1', label: 'Больше 18', operator: 'greater_than', value: '18', target: 'msg_adult' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_child' },
    ],
  }),
  makeNode('msg_adult', 'message', {}),
  makeNode('msg_child', 'message', {}),
];

/** Один condition-узел с ветками less_than / else */
export const nodesWithConditionLessThan: Node[] = [
  makeNode('condition_check_age_lt', 'condition', {
    variable: 'user_age',
    branches: [
      { id: 'b1', label: 'Меньше 18', operator: 'less_than', value: '18', target: 'msg_child' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_adult' },
    ],
  }),
  makeNode('msg_child', 'message', {}),
  makeNode('msg_adult', 'message', {}),
];

/** Один condition-узел с ветками between / else */
export const nodesWithConditionBetween: Node[] = [
  makeNode('condition_check_age_between', 'condition', {
    variable: 'user_age',
    branches: [
      { id: 'b1', label: 'Рабочий возраст', operator: 'between', value: '18', value2: '65', target: 'msg_working' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_working', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

/** Несколько узлов условия — все 6 типов */
export const validParamsMultipleAll: ConditionTemplateParams = {
  entries: [
    ...validParamsFilledEmpty.entries,
    ...validParamsEquals.entries,
    ...validParamsContains.entries,
    ...validParamsGreaterThan.entries,
    ...validParamsLessThan.entries,
    ...validParamsBetween.entries,
  ],
};

// ─── Фикстуры для системных операторов ───────────────────────────────────────

/**
 * Узел условия только с веткой is_private (без переменной)
 */
export const validParamsIsPrivate: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_private',
      variable: '',
      branches: [
        { id: 'b1', operator: 'is_private', value: '', target: 'msg_private' },
      ],
    },
  ],
};

/**
 * Узел условия с is_private + is_group + else
 */
export const validParamsSystemMultiple: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_chat_type',
      variable: '',
      branches: [
        { id: 'b1', operator: 'is_private', value: '', target: 'msg_private' },
        { id: 'b2', operator: 'is_group', value: '', target: 'msg_group' },
        { id: 'b3', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/**
 * Узел условия с is_channel
 */
export const validParamsIsChannel: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_channel',
      variable: '',
      branches: [
        { id: 'b1', operator: 'is_channel', value: '', target: 'msg_channel' },
        { id: 'b2', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/**
 * Узел условия с is_group
 */
export const validParamsIsGroup: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_group',
      variable: '',
      branches: [
        { id: 'b1', operator: 'is_group', value: '', target: 'msg_group' },
        { id: 'b2', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/**
 * Смешанный узел: is_private + equals (переменная задана)
 */
export const validParamsMixedSystemAndVar: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_mixed',
      variable: 'user_role',
      branches: [
        { id: 'b1', operator: 'is_private', value: '', target: 'msg_private' },
        { id: 'b2', operator: 'equals', value: 'admin', target: 'msg_admin' },
        { id: 'b3', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/** Node-фикстура: только is_private без переменной */
export const nodesWithConditionIsPrivate: Node[] = [
  makeNode('condition_check_private', 'condition', {
    variable: '',
    branches: [
      { id: 'b1', label: 'Приватный', operator: 'is_private', value: '', target: 'msg_private' },
    ],
  }),
  makeNode('msg_private', 'message', {}),
];

/** Node-фикстура: is_private + is_group + else */
export const nodesWithConditionSystemMultiple: Node[] = [
  makeNode('condition_check_chat_type', 'condition', {
    variable: '',
    branches: [
      { id: 'b1', label: 'Приватный', operator: 'is_private', value: '', target: 'msg_private' },
      { id: 'b2', label: 'Группа', operator: 'is_group', value: '', target: 'msg_group' },
      { id: 'b3', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_private', 'message', {}),
  makeNode('msg_group', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

/** Node-фикстура: is_channel */
export const nodesWithConditionIsChannel: Node[] = [
  makeNode('condition_check_channel', 'condition', {
    variable: '',
    branches: [
      { id: 'b1', label: 'Канал', operator: 'is_channel', value: '', target: 'msg_channel' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_channel', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

/** Node-фикстура: смешанный is_private + filled + else */
export const nodesWithConditionMixedSystem: Node[] = [
  makeNode('condition_mixed', 'condition', {
    variable: 'user_role',
    branches: [
      { id: 'b1', label: 'Приватный', operator: 'is_private', value: '', target: 'msg_private' },
      { id: 'b2', label: 'Заполнено', operator: 'filled', value: '', target: 'msg_filled' },
      { id: 'b3', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_private', 'message', {}),
  makeNode('msg_filled', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

// ─── Фикстуры для is_admin, is_premium, is_bot ───────────────────────────────

/**
 * Узел условия только с веткой is_admin (без переменной)
 */
export const validParamsIsAdmin: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_admin',
      variable: '',
      branches: [
        { id: 'b1', operator: 'is_admin', value: '', target: 'msg_admin' },
        { id: 'b2', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/**
 * Узел условия только с веткой is_premium (без переменной)
 */
export const validParamsIsPremium: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_premium',
      variable: '',
      branches: [
        { id: 'b1', operator: 'is_premium', value: '', target: 'msg_premium' },
        { id: 'b2', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/**
 * Узел условия только с веткой is_bot (без переменной)
 */
export const validParamsIsBot: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_bot',
      variable: '',
      branches: [
        { id: 'b1', operator: 'is_bot', value: '', target: 'msg_bot' },
        { id: 'b2', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/**
 * Узел условия с is_admin + is_premium + is_bot + else
 */
export const validParamsUserFlagsAll: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_user_flags',
      variable: '',
      branches: [
        { id: 'b1', operator: 'is_admin', value: '', target: 'msg_admin' },
        { id: 'b2', operator: 'is_premium', value: '', target: 'msg_premium' },
        { id: 'b3', operator: 'is_bot', value: '', target: 'msg_bot' },
        { id: 'b4', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/**
 * Смешанный: is_admin + equals (переменная задана)
 */
export const validParamsMixedAdminAndVar: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_mixed_admin',
      variable: 'user_role',
      branches: [
        { id: 'b1', operator: 'is_admin', value: '', target: 'msg_admin' },
        { id: 'b2', operator: 'equals', value: 'vip', target: 'msg_vip' },
        { id: 'b3', operator: 'else', value: '', target: 'msg_other' },
      ],
    },
  ],
};

/** Node-фикстура: только is_admin без переменной */
export const nodesWithConditionIsAdmin: Node[] = [
  makeNode('condition_check_admin', 'condition', {
    variable: '',
    branches: [
      { id: 'b1', label: 'Администратор', operator: 'is_admin', value: '', target: 'msg_admin' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_admin', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

/** Node-фикстура: только is_premium без переменной */
export const nodesWithConditionIsPremium: Node[] = [
  makeNode('condition_check_premium', 'condition', {
    variable: '',
    branches: [
      { id: 'b1', label: 'Premium', operator: 'is_premium', value: '', target: 'msg_premium' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_premium', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

/** Node-фикстура: только is_bot без переменной */
export const nodesWithConditionIsBot: Node[] = [
  makeNode('condition_check_bot', 'condition', {
    variable: '',
    branches: [
      { id: 'b1', label: 'Бот', operator: 'is_bot', value: '', target: 'msg_bot' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_bot', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

/** Node-фикстура: is_admin + is_premium + is_bot + else */
export const nodesWithConditionUserFlagsAll: Node[] = [
  makeNode('condition_check_user_flags', 'condition', {
    variable: '',
    branches: [
      { id: 'b1', label: 'Администратор', operator: 'is_admin', value: '', target: 'msg_admin' },
      { id: 'b2', label: 'Premium', operator: 'is_premium', value: '', target: 'msg_premium' },
      { id: 'b3', label: 'Бот', operator: 'is_bot', value: '', target: 'msg_bot' },
      { id: 'b4', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_admin', 'message', {}),
  makeNode('msg_premium', 'message', {}),
  makeNode('msg_bot', 'message', {}),
  makeNode('msg_other', 'message', {}),
];

/** Node-фикстура: is_admin + filled + else (смешанный) */
export const nodesWithConditionMixedAdmin: Node[] = [
  makeNode('condition_mixed_admin', 'condition', {
    variable: 'user_role',
    branches: [
      { id: 'b1', label: 'Администратор', operator: 'is_admin', value: '', target: 'msg_admin' },
      { id: 'b2', label: 'Заполнено', operator: 'filled', value: '', target: 'msg_filled' },
      { id: 'b3', label: 'Иначе', operator: 'else', value: '', target: 'msg_other' },
    ],
  }),
  makeNode('msg_admin', 'message', {}),
  makeNode('msg_filled', 'message', {}),
  makeNode('msg_other', 'message', {}),
];
