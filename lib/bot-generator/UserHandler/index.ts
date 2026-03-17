// UserHandler Module
// ban/unban/kick/mute/unmute/promote/demote перенесены в lib/templates/user-handler (Jinja2)
// generateUserManagementSynonymHandler перенесён в lib/templates/synonyms (Jinja2)
// Здесь остаются только admin_rights до завершения его миграции

export { generateAdminRightsHandler } from './generateAdminRightsHandler';
export { generateAdminRightsToggleHandlers } from './generateAdminRightsToggleHandlers';
