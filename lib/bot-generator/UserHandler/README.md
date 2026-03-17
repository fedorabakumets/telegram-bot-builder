# UserHandler

Все обработчики управления пользователями перенесены в Jinja2 шаблоны.

| Что | Куда перенесено |
|---|---|
| `ban_user`, `unban_user`, `kick_user`, `mute_user`, `unmute_user`, `promote_user`, `demote_user` | `lib/templates/user-handler/` |
| `admin_rights` (command handler + toggle handlers) | `lib/templates/admin-rights/` |
| Синонимы для всех типов | `lib/templates/synonyms/` |

## Импорт

```typescript
import { generateUserHandlerFromNode } from 'lib/templates/user-handler';
import { generateAdminRightsFromNode } from 'lib/templates/admin-rights';
import { generateSynonymHandlers } from 'lib/templates/synonyms';
```
