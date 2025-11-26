import { Octokit } from '@octokit/rest';

export async function pushToGitHub(token: string) {
  try {
    const octokit = new Octokit({ auth: token });
    
    console.log('📤 Получаем статус репозитория...');
    const repo = await octokit.repos.get({
      owner: 'fedorabakumets',
      repo: 'telegram-bot-builder'
    });
    
    console.log('✅ Репозиторий найден:', repo.data.full_name);
    return { success: true, message: 'Репозиторий доступен для пуша' };
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  }
}
