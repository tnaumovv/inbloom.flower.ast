import nextEnv from '@next/env';
import { getAdminSetupIssues } from '../src/features/admin/setup.ts';

process.env.NODE_ENV = 'production';
nextEnv.loadEnvConfig(process.cwd(), false);
const issues = getAdminSetupIssues(process.env);
if (issues.length) {
  console.error(`Production пока не настроен:\n${issues.map(issue => `- ${issue}`).join('\n')}`);
  console.error('Для локальной работы используйте npm run dev. Для публикации настройте реальный HTTPS-origin в SITE_URL и добавьте его в Google OAuth.');
  process.exitCode = 1;
} else {
  console.log('Обязательные параметры production заданы. Перед публикацией отдельно проверьте HTTPS, Google-вход и загрузку фото на выбранном домене.');
}
