import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { readAdminSession } from '@/features/admin/auth';
import { adminCookieName, getAdminSetupIssues } from '@/features/admin/config';
import { AdminHeader } from '@/features/admin/admin-parts';
import { AdminWorkspace } from '@/features/admin/admin-workspace';
import { GoogleLogin } from '@/features/admin/google-login';
import styles from '@/features/admin/admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Управление каталогом', robots: { index: false, follow: false } };
export default async function AdminPage() {
  const issues = getAdminSetupIssues();
  if (!issues.length) {
    const session = await readAdminSession((await cookies()).get(adminCookieName('session'))?.value || '');
    if (session) return <AdminWorkspace email={session.email} />;
  }
  return <div className={styles.root}><AdminHeader /><main id="main" className={styles.login}><div className={styles.loginMark} aria-hidden="true">✳</div><p className={styles.eyebrow}>Для команды In Bloom</p><h1>{issues.length ? 'Админка готовится к запуску' : 'Каталог под рукой'}</h1><p>{issues.length ? 'Доступ откроется после подключения входа, каталога и фотографий. Обратитесь к тому, кто настраивает сайт.' : 'Добавляйте букеты, меняйте цены и загружайте фото прямо с телефона.'}</p>{issues.length ? <div className={styles.setup}><span>Осталось подключить</span><ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div> : <><GoogleLogin /><p className={styles.loginNote}>Доступ есть только у приглашённых администраторов.</p></>}</main></div>;
}
