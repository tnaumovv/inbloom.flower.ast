import { AdminError } from './errors';

export type AdminEnvironment = Record<string, string | undefined>;
export function allowedEmails(env: AdminEnvironment = process.env) {
  return (env.ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}
export function getAdminSetupIssues(env: AdminEnvironment = process.env): string[] {
  const issues: string[] = [];
  if (!env.ADMIN_GOOGLE_CLIENT_ID?.trim()) issues.push('Вход через Google');
  if (!allowedEmails(env).length) issues.push('Доступ администраторов');
  if ((env.ADMIN_SESSION_SECRET || '').length < 32) issues.push('Защита входа');
  if (env.NODE_ENV === 'production' || env.SITE_URL) {
    try {
      const url = new URL(env.SITE_URL || '');
      if (url.username || url.password || url.pathname !== '/' || url.search || url.hash || (env.NODE_ENV === 'production' ? url.protocol !== 'https:' : !['http:', 'https:'].includes(url.protocol))) throw new Error();
    } catch { issues.push('Адрес сайта'); }
  }
  if (!env.GOOGLE_SHEET_ID || !env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) issues.push('Запись в Google Таблицу');
  if (!env.CLOUDINARY_CLOUD_NAME || !/^[\w-]+$/.test(env.CLOUDINARY_CLOUD_NAME) || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_UPLOAD_PRESET) issues.push('Загрузка фотографий');
  return issues;
}
export function getAdminConfig(env: AdminEnvironment = process.env) {
  if (getAdminSetupIssues(env).length) throw new AdminError(503, 'Админка ещё не подключена. Обратитесь к тому, кто настраивает сайт.');
  return {
    clientId: env.ADMIN_GOOGLE_CLIENT_ID!.trim(), emails: allowedEmails(env), secret: env.ADMIN_SESSION_SECRET!,
    origin: env.SITE_URL ? new URL(env.SITE_URL).origin : undefined,
    secure: env.NODE_ENV === 'production' || env.SITE_URL?.startsWith('https://') === true,
    sheetId: env.GOOGLE_SHEET_ID!, range: env.GOOGLE_SHEET_RANGE || "'Каталог'!A1:I1001",
    serviceEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL!, privateKey: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    cloudName: env.CLOUDINARY_CLOUD_NAME!, cloudKey: env.CLOUDINARY_API_KEY!, cloudSecret: env.CLOUDINARY_API_SECRET!, preset: env.CLOUDINARY_UPLOAD_PRESET!,
  };
}
export function adminCookieName(kind: 'session' | 'nonce', env: AdminEnvironment = process.env) {
  return `${env.NODE_ENV === 'production' ? '__Host-' : ''}inbloom-admin-${kind}`;
}
