import { Pill } from './shell';
export function NotFoundView() {
  return <main id="main" className="container error-page"><h1 className="display">Страница не найдена</h1><p>Возможно, букет снят с витрины. Посмотрите другие композиции.</p><Pill href="/catalog">Выбрать букет</Pill></main>;
}
