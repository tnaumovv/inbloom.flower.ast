import 'server-only';
import { AdminError } from './errors';
import { allowedEmails, getAdminSetupIssues, type AdminEnvironment } from './setup';

export { allowedEmails, getAdminSetupIssues, type AdminEnvironment } from './setup';

export function getAdminConfig(env: AdminEnvironment = process.env) {
  if (getAdminSetupIssues(env).length) throw new AdminError(503, 'Админка ещё не подключена. Обратитесь к тому, кто настраивает сайт.');
  return {
    clientId: env.ADMIN_GOOGLE_CLIENT_ID!.trim(), emails: allowedEmails(env), secret: env.ADMIN_SESSION_SECRET!,
    origin: env.SITE_URL ? new URL(env.SITE_URL).origin : undefined,
    secure: env.NODE_ENV === 'production' || env.SITE_URL?.startsWith('https://') === true,
    sheetId: env.GOOGLE_SHEET_ID!.trim(), range: env.GOOGLE_SHEET_RANGE?.trim() || "'Каталог'!A1:I1001",
    serviceEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL!, privateKey: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    cloudName: env.CLOUDINARY_CLOUD_NAME!, cloudKey: env.CLOUDINARY_API_KEY!, cloudSecret: env.CLOUDINARY_API_SECRET!, preset: env.CLOUDINARY_UPLOAD_PRESET!,
  };
}
export function adminCookieName(kind: 'session' | 'nonce', env: AdminEnvironment = process.env) {
  return `${env.NODE_ENV === 'production' ? '__Host-' : ''}inbloom-admin-${kind}`;
}
