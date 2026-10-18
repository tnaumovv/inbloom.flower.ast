# In Bloom Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать адаптивный сайт In Bloom по макету v3 с выбором букета и переходом в WhatsApp, сохранив возможность дальнейшего развития каталога и оформления заказов.

**Architecture:** Одно приложение Next.js с App Router: страница собирается на сервере, мобильная навигация и витрина используют локальные клиентские компоненты. Типизированные данные товаров, контакты и функции формирования ссылок отделены от отображения. Подключение базы, корзины и оплаты оставлено следующим этапам.

**Tech Stack:** Next.js, React, TypeScript strict, Tailwind CSS, CSS transforms / Scroll Snap, npm; Vitest для данных и ссылок, Playwright для пользовательских сценариев; Node.js 24 LTS.

**Spec:** [Утверждённая спецификация](../specs/2026-10-18-inbloom-website-design.md). Пользователь подтвердил документ 18 октября 2026 года. Читать вместе с этим планом.

## Global Constraints

- «Next.js с App Router и React.»
- «TypeScript со строгой проверкой типов.»
- «Tailwind CSS и собственный CSS для сложных растительных границ, теней и движения.»
- «npm и lockfile с зафиксированными совместимыми версиями зависимостей.»
- «Корзина, оплата на сайте, аккаунты, админка, сохранение заказов и управление остатками относятся к следующим этапам. В первой версии нет имитации этих возможностей.»
- «Весь текст, навигация, цены, кнопки и контакты реализуются настоящими HTML-элементами. Растровый скриншот всей страницы не используется как интерфейс.»
- «Основное содержание и ссылки заказа доступны без выполнения клиентского JavaScript.»
- «Русский язык документа, семантические области страницы и один основной h1.»
- «При `prefers-reduced-motion` отключаются наклоны, подъём, параллакс и плавная прокрутка; навигация и выбор товаров продолжают работать.»
- «В текстах нет неподтверждённых часов работы, скидок, отзывов, бесплатной доставки или обещаний времени доставки.»
- Сохранять исходные `design/` и `prototype/`. Первичный источник визуальных решений — три отдельных изображения v3; полный макет задаёт последовательность секций.

## Review Focus

1. Кириллица, кавычки и пробелы в цене не портят WhatsApp-сообщение; название и цена соответствуют выбранному букету. Проверка: задача 1, `whatsapp.test.ts`.
2. Открытое мобильное меню закрывается по Escape с возвратом фокуса; изменение ширины не оставляет страницу заблокированной. Проверка: задача 2, `header.spec.ts`.
3. Первая и последняя карточки, свайп и переход между 390 и 1440 px не ломают управление витриной и не создают общего горизонтального переполнения. Проверка: задача 3, `showcase.spec.ts`.
4. Уменьшенное движение, включая переключение настройки после загрузки, и отключённый JavaScript сохраняют выбор и доступность заказа. Проверка: задачи 3 и 5, `showcase.spec.ts` и `resilience.spec.ts`.
5. Не загрузившееся изображение не скрывает название, цену и ссылку заказа; высота композиции остаётся предсказуемой. Проверка: задача 5, `resilience.spec.ts`.

## Карта файлов и границы

Пути ниже указаны от корня checkout. Исходная папка имеет пробел в конце имени: `/Users/timurabishev/Downloads/bulvarflowers_astana `. Перед каждой командой задавать правильный `workdir`; не удалять пробел переименованием папки.

| Файлы | Назначение |
| --- | --- |
| `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore` | Зависимости, команды и локальное состояние |
| `next.config.ts`, `tsconfig.json`, `next-env.d.ts`, `postcss.config.mjs`, `eslint.config.mjs` | Конфигурация приложения и проверок |
| `vitest.config.ts`, `playwright.config.ts`, `tests/unit/`, `tests/e2e/` | Проверки данных и реальных сценариев |
| `src/app/layout.tsx`, `page.tsx`, `globals.css`, `fonts.ts` | Сборка страницы, язык, metadata, токены и шрифты |
| `src/config/site.ts` | Название, контакты, внешние назначения и якоря |
| `src/features/catalog/types.ts`, `data.ts`, `format-price.ts` | Модель товара, локальный источник и форматирование |
| `src/features/contact/whatsapp.ts` | Общие обращения и ссылки конкретного букета |
| `src/components/ui/container.tsx`, `link-button.tsx`, `icon.tsx`, `botanical-edge.tsx` | Повторяемые элементы оформления |
| `src/components/layout/site-header.tsx`, `mobile-nav.tsx`, `site-footer.tsx` | Навигация и контакты |
| `src/features/landing/hero.tsx`, `hero.module.css`, `custom-bouquet.tsx`, `order-steps.tsx` | Первый экран и нижние секции |
| `src/features/catalog/bouquet-card.tsx`, `showcase.tsx`, `showcase.module.css` | Карточки и адаптивная витрина |
| `public/images/`, `public/leaf-edge.svg`, `public/licenses/`, `docs/assets/inbloom-assets.json` | Готовые изображения и их происхождение |
| `README.md`, `.env.example`, `docs/qa/inbloom-runtime.md` | Запуск, настройки, фактическая проверка результата |

Последовательность: **1 → 2 → 3 → 4 → 5**. Один исполнитель последовательно завершает задачи; распределение по субагентам возможно только после выбора пользователем этого способа исполнения. Для этого небольшого приложения рекомендовано исполнение в текущем чате с итоговой независимой проверкой.

### Task 1: Рабочая основа, товары и WhatsApp-ссылки

**Files:** создать корневые конфигурации из карты, `src/app/{layout.tsx,page.tsx,globals.css}`, `src/config/site.ts`, `src/features/catalog/{types.ts,data.ts,format-price.ts}`, `src/features/contact/whatsapp.ts`, `tests/unit/{catalog.test.ts,whatsapp.test.ts}`.

**Interfaces:**

- `Bouquet = Readonly<{ id: string; slug: string; name: string; priceKzt: number; image: string; imageAlt: string }>`.
- `getFeaturedBouquets(): Promise<readonly Bouquet[]>` возвращает четыре товара из спецификации в исходном порядке.
- `formatPriceKzt(priceKzt: number): string` выдаёт цену с разделением тысяч и символом `₸`; неразрывные пробелы допустимы.
- `siteConfig` содержит `name`, `phoneDisplay`, `phoneE164`, `whatsappNumber`, `address`, `catalogueUrl`, `mapUrl`, `instagramUrl`, `instagramHandle`; `navItems: readonly { label: string; href: string }[]` задаёт `#bouquets`, `#studio`, `#contacts`.
- `buildWhatsAppLink(message?: string): string`; `buildBouquetWhatsAppLink(bouquet: Pick<Bouquet, 'name' | 'priceKzt'>): string`; константы `generalEnquiryMessage` и `customBouquetMessage`.

- [x] **1.1. Сохранить входные материалы и подготовить checkout.** Прочитать навык `using-git-worktrees`, проверить прикреплённые worktree и текущий Git root. Сейчас `design/` и `prototype/` не отслеживаются: до создания изолированного checkout добавить их неизменёнными отдельным коммитом `chore: preserve supplied design and prototype assets`. Убедиться, что в commit нет секретов и файлов вне проекта. Для worktree использовать явный существующий ref `codex/inbloom-site`: удалённая default-ветка у этого нового репозитория не настроена. Существующие спецификация и план должны попасть в выбранный checkout.
- [x] **1.2. Настроить минимальные инструменты проверки.** Использовать Node.js 24 LTS, записать `24` в `.nvmrc`; не заменять системный Node глобально. Вручную создать `package.json` с `name: "inbloom-web"`, `private: true`, чтобы непустая папка и пробел в её имени не мешали scaffolder. Установить совместимые стабильные пакеты командами ниже; при установке Next.js и `eslint-config-next` проверить совпадение major. Создать Vitest config с Node environment, alias `@/` на `src/`, include `tests/unit/**/*.test.ts`; браузерный runner пока настроить без тестов.

```sh
npm install --save-exact next react react-dom
npm install --save-dev --save-exact typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss postcss eslint eslint-config-next vitest @playwright/test
npx playwright install chromium
```

- [x] **1.3. Зафиксировать исполняемые команды.** Scripts: `dev = next dev`, `build = next build`, `start = next start`, `typecheck = next typegen && tsc --noEmit`, `lint = eslint .`, `test = vitest run`, `test:e2e = playwright test`. Tailwind подключить через `@tailwindcss/postcss` и `@import "tailwindcss"`. В ESLint исключить `prototype/` и служебные/build-каталоги. `.gitignore` должен игнорировать `/node_modules/`, `/.next/`, `/out/`, `/coverage/`, `/test-results/`, `/playwright-report/`, `/.frontend-workbench/`, `/.env*` с исключением `!/.env.example`, `*.tsbuildinfo` и `.DS_Store`; не игнорировать сохранённый `prototype/dist/`.
- [x] **1.4. Написать тесты контрактов до реализации модулей.** В `catalog.test.ts` проверить точные пары `Cloud/18700`, `White bloom/13200`, `Soft s/10700`, `Sophie basket S/12100`, четыре уникальных slug и отсутствие вымышленных остатков. Отдельный тест форматирования проверяет `formatPriceKzt(18700).replace(/[\u00a0\u202f]/g, ' ') === '18 700 ₸'`, чтобы ошибка форматирования не могла одновременно попасть в карточку и сообщение. В `whatsapp.test.ts` добавить проверки ниже, импортировав указанные Interfaces.

```ts
it('encodes the selected bouquet and its displayed price', async () => {
  for (const bouquet of await getFeaturedBouquets()) {
    const url = new URL(buildBouquetWhatsAppLink(bouquet));
    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/77082204675');
    expect(url.searchParams.get('text')).toContain(`«${bouquet.name}»`);
    expect(url.searchParams.get('text')).toContain(formatPriceKzt(bouquet.priceKzt));
    expect(url.searchParams.get('text')).toMatch(/наличие.*доставк/iu);
  }
});
it('round-trips Cyrillic, quotes and URL delimiters', () => {
  const message = 'Хочу «букет» & доставку + открытку?';
  expect(new URL(buildWhatsAppLink(message)).searchParams.get('text')).toBe(message);
});
```

- [x] **1.5. Подтвердить красное состояние.** `npm test -- tests/unit/catalog.test.ts tests/unit/whatsapp.test.ts` должен завершиться ошибкой отсутствующих модулей/экспортов до их реализации, а не из-за неверной настройки Vitest.
- [x] **1.6. Реализовать Interfaces и минимальную серверную страницу.** Значения конфигурации и alt взять из спецификации и прототипа. Пути товаров — `/images/bouquets/<исходное-имя>.png`. Формировать сообщение: `Здравствуйте! Хочу заказать букет «<name>» (<formatted price>). Подскажите, пожалуйста, наличие и варианты доставки.` Общая ссылка предлагает обсудить букет и доставку; отдельная — индивидуальную композицию. Добавить `<html lang="ru">`, базовый layout, серверный h1 и общие цветовые переменные из макета. Клиентское состояние для каталога данных не добавлять.
- [x] **1.7. Проверить результат и сохранить этап.** Выполнить `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; ожидается успешный exit code. Поднять dev preview на `127.0.0.1:3000`, убедиться, что `/` отдаёт HTML с h1. Просмотреть diff, добавить только файлы задачи и зафиксировать `feat: initialize typed In Bloom app and WhatsApp catalogue data`.

### Task 2: Изображения, шапка и первый экран по v3

**Files:** создать `src/app/fonts.ts`, перечисленные UI-компоненты, `src/components/layout/{site-header.tsx,mobile-nav.tsx}`, `src/features/landing/{hero.tsx,hero.module.css}`, `public/images/{logo.png,hero.png}`, `public/leaf-edge.svg`, `public/licenses/`, `docs/assets/inbloom-assets.json`, `tests/e2e/header.spec.ts`; изменить `src/app/{layout.tsx,page.tsx,globals.css}`, `playwright.config.ts`.

**Interfaces:**

- Consumes: `siteConfig`, `navItems`, `buildWhatsAppLink`, `generalEnquiryMessage` из задачи 1.
- Produces: `Container({ children, className? })`, `LinkButton({ href, children, variant?: 'primary' | 'outline', external?: boolean, className? })`, `Icon({ name, className? })`, `BotanicalEdge({ tone: 'cream' | 'olive', placement: 'top' | 'bottom' })`; React-компоненты возвращают `ReactElement`.
- `SiteHeader(): ReactElement`, `MobileNav({ items }: { items: typeof navItems }): ReactElement`, `Hero(): ReactElement`. Мобильное меню — раскрывающийся немодальный блок: сохраняет обычный Tab-порядок, Escape закрывает его и возвращает фокус на переключатель.

- [x] **2.1. Добавить браузерные acceptance-тесты до интерфейса.** Playwright использует Chromium и base URL `http://127.0.0.1:3000`. Если задан `PLAYWRIGHT_BASE_URL`, использовать его без запуска дополнительного сервера; иначе `webServer` запускает `npm run dev -- --hostname 127.0.0.1 --port 3000` с повторным использованием доступного сервера вне CI. `header.spec.ts`: при 1440 × 1000 ровно один h1 «Цветы в Астане», оба hero-действия и три пункта навигации; при 390 × 844 меню открывается с клавиатуры, Escape закрывает и возвращает фокус, переход на 1440 px не блокирует scroll. Нативный `<details>/<summary>` допустим и обеспечивает раскрытие без JS; использовать доступное имя «Меню».
- [x] **2.2. Подтвердить отсутствие реализации.** `npm run test:e2e -- tests/e2e/header.spec.ts` ожидаемо не находит навигацию/действия; root page и сервер при этом доступны.
- [x] **2.3. Подготовить отдельные графические материалы.** Прочитать `imagegen` перед редактированием. Из `01-hero.png` получить сцену без логотипа, надписей, меню и кнопок: сохранить крупный букет справа, оливковый фон и направление света. Прозрачный логотип подготовить из `design/inbloom-concept-v1/brand-logo-original.jpg`, сверить каждую букву с оригиналом. Скопировать исходный `leaf-edge.svg`. В receipt записать источник, способ получения, путь результата и статус демонстрационного изображения; не выдавать результат за фотографию доступного товара. Не подменять отдельные изображения целым скриншотом страницы.
- [x] **2.4. Подключить типографику и общие элементы.** Выбрать Cormorant Garamond для заголовков и Manrope для обычного текста через `next/font`; проверить кириллицу, доступные начертания и сохранить ссылки/тексты лицензий OFL. Экспортировать CSS-переменные `--font-display` и `--font-body`. Если выбранное семейство недоступно в текущей поставке, сначала зафиксировать обоснованную замену с кириллицей в плане и receipt. UI-компоненты строятся на семантических HTML-элементах; у декоративных иконок `aria-hidden`, у ссылок видимый focus.
- [x] **2.5. Реализовать шапку и Hero.** Desktop воспроизводит v3: логотип слева, навигация в центре, WhatsApp справа; крупный двухстрочный заголовок, подзаголовок и две кнопки поверх отдельной фоновой сцены. На мобильном текст и букет перестраиваются без наложения на действия. Использовать Next Image с заданной геометрией и `sizes`, приоритетом для hero; декоративные слои не перехватывают события. Меню содержит те же якоря, закрывается после выбора и при выходе в desktop-режим. Обновить серверную сборку страницы, не делая весь layout клиентским.
- [x] **2.6. Проверить и сохранить этап.** `npm run test:e2e -- tests/e2e/header.spec.ts`, затем `npm run typecheck` и `npm run lint` должны пройти. Сравнить снимки первого экрана при 1440 и 390 px с v3: масштаб букета, читаемость, положение кнопок и отсутствие прямоугольной подложки логотипа. Коммит: `feat: implement In Bloom hero and responsive navigation`.

### Task 3: Адаптивная витрина и заказ выбранного букета

**Files:** создать `src/features/catalog/{bouquet-card.tsx,showcase.tsx,showcase.module.css}`, `public/images/bouquets/{cloud.png,white-bloom.png,soft-s.png,sophie-basket-s.png}`, `tests/e2e/showcase.spec.ts`; изменить `src/app/page.tsx`, `docs/assets/inbloom-assets.json`.

**Interfaces:**

- Consumes: `Bouquet`, `getFeaturedBouquets`, `formatPriceKzt`, `buildBouquetWhatsAppLink`, `siteConfig.catalogueUrl`, UI-компоненты.
- Produces: `BouquetCard({ bouquet }: { bouquet: Bouquet }): ReactElement`; `Showcase({ bouquets }: { bouquets: readonly Bouquet[] }): ReactElement` с `id="bouquets"`, заголовком h2 и article для каждого товара. У article доступное имя товара, у ссылки — `Заказать <name> в WhatsApp`.
- Данные загружает серверный `page.tsx` через `await getFeaturedBouquets()` и передаёт в витрину как props; карточки и настоящие href присутствуют в исходном HTML.

- [x] **3.1. Написать тесты поведения до реализации.** В `showcase.spec.ts` при 1440 px проверить четыре карточки в одном ряду, точные названия/цены и совпадение href с выбранным товаром. При 390 px сфокусировать ленту, пройти End → последний товар, Home → первый, ArrowRight → второй; проверить `aria-live` после завершения движения, доступность крайних карточек и отключённость стрелки у края. Проверить, что ручная горизонтальная прокрутка меняет активную карточку, а `document.documentElement.scrollWidth <= innerWidth + 1`. После изменения viewport 390 → 1440 → 390 лента остаётся управляемой.
- [x] **3.2. Зафиксировать исходное падение.** `npm run test:e2e -- tests/e2e/showcase.spec.ts` должен падать на отсутствующей витрине; предыдущие header-тесты продолжают проходить.
- [x] **3.3. Скопировать имеющиеся вырезки и реализовать витрину.** Изображения копировать из `prototype/dist/assets` без изменения исходников; receipt ссылается на `prototype/assets-receipt.json`. При ширине от 1024 px четыре карточки в ряд без подложек из прототипа; ниже — нативная горизонтальная лента со Scroll Snap, одной доминирующей карточкой на телефоне и частично видимыми соседними. Стрелки и клавиатура действуют только для прокручиваемой ленты. Названия и цены остаются читаемыми независимо от transform изображения. Добавить «Больше букетов ↗» и растительные переходы к соседним секциям.
- [x] **3.4. Реализовать ограниченное движение и его отключение.** Использовать подходы прототипа для hover/наклона и отслеживания ближайшей карточки, с очисткой listeners/observer при размонтировании. Активный индекс обновляется по фактической позиции; озвучивание откладывается до завершения прокрутки. Нативный touch-scroll не блокируется. При reduced motion до загрузки и при его изменении после загрузки transform изображения становится нейтральным, smooth-scroll отключается. Добавить в `showcase.spec.ts` проверку обеих смен настройки через `page.emulateMedia` и работоспособности Home/End после них. Таймер автоперелистывания не создаётся.
- [x] **3.5. Проверить и сохранить этап.** Выполнить `npm test`, `npm run test:e2e -- tests/e2e/showcase.spec.ts`, `npm run typecheck`, `npm run lint`. В доступном браузере дополнительно проверить реальный touch/свайп либо указать ограничение эмуляции; посмотреть ленту при 360, 390, 768 и 1440 px. Коммит: `feat: add responsive bouquet showcase and product enquiries`.

### Task 4: Индивидуальный заказ, шаги и контакты

**Files:** создать `src/features/landing/{custom-bouquet.tsx,order-steps.tsx}`, `src/components/layout/site-footer.tsx`, `public/images/contact-flower.png`, `tests/e2e/contact.spec.ts`; изменить `src/app/{page.tsx,globals.css}`, `docs/assets/inbloom-assets.json`.

**Interfaces:**

- Consumes: `siteConfig`, `customBouquetMessage`, `buildWhatsAppLink`, `Container`, `LinkButton`, `Icon`, `BotanicalEdge`.
- Produces: `CustomBouquet(): ReactElement` с `id="studio"`, `OrderSteps(): ReactElement`, `SiteFooter(): ReactElement` с `id="contacts"`. Компоненты серверные; контактные поля используют только общий config.

- [x] **4.1. Добавить тест точного сценария.** `contact.spec.ts` проверяет «Не нашли свой букет?», заданное спецификацией описание, «Обсудить букет» с отдельным сообщением и три шага в правильном порядке. Контакты содержат точный адрес, телефон `tel:+77082204675`, 2ГИС, Instagram и полный каталог с правильными href; внешние ссылки в новой вкладке имеют `noopener noreferrer`. Клик по якорям переводит к реальной видимой секции; WhatsApp-ссылки проверяются чтением URL без отправки сообщения.
- [x] **4.2. Проверить красное состояние.** `npm run test:e2e -- tests/e2e/contact.spec.ts` должен падать на отсутствующих секциях, а существующие сценарии оставаться рабочими.
- [x] **4.3. Подготовить нижний цветочный акцент и собрать секции.** Через разрешённый ImageGen workflow получить из `03-order-contact.png` отдельный цветок с конвертом без надписей; сохранить прозрачность и добавить запись receipt. Воспроизвести спокойный оливковый блок, коралловое действие, шаги и трёхчастный footer; на телефоне части располагаются вертикально. Взять весь текст из спецификации; вместо бумажного самолётика использовать Instagram-иконку или обычную подпись профиля. Собрать страницу: header → hero → showcase → custom bouquet → order steps → footer, с единственной шапкой и единственным footer.
- [x] **4.4. Проверить и сохранить этап.** `npm run test:e2e -- tests/e2e/contact.spec.ts`, `npm run typecheck`, `npm run lint`. Сравнить всю страницу с `04-complete-landing.png`, затем детализацию с отдельными полосами v3: порядок, растительные границы, ритм и контраст. Коммит: `feat: complete custom bouquet enquiry and studio contacts`.

### Task 5: Проверка всей страницы и подготовка к передаче

**Files:** создать `tests/e2e/resilience.spec.ts`, `README.md`, `.env.example`, `docs/qa/inbloom-runtime.md`; изменить `src/app/layout.tsx`, `docs/assets/inbloom-assets.json` и только файлы с выявленными дефектами.

**Interfaces:**

- Consumes: готовая `/`, все публичные действия и компоненты задач 1–4.
- Produces: metadata `title`, `description`, Open Graph `title/description/type/siteName/locale`; `.env.example` с необязательным `SITE_URL` для реального абсолютного URL сайта. `metadataBase`, canonical и абсолютный OG URL задаются только при корректно настроенном публичном домене; localhost или вымышленный адрес не объявляются canonical.
- README содержит Node.js/runtime, `npm ci`, запуск, build/start, все проверки, расположение данных/контактов, происхождение изображений и границы текущей версии.

- [ ] **5.1. Добавить проверки устойчивости.** `resilience.spec.ts`: на 360, 390, 768, 1440 px нет общего горизонтального переполнения; при обычной загрузке отсутствуют pageerror, console.error, console.warn и ошибки гидратации. В контексте `javaScriptEnabled: false` видны основной контент, все четыре товара и правильные WhatsApp href, мобильная навигация доступна нативно. Блокировка всех запросов изображений сохраняет название, цену, ссылку заказа и структуру карточки; в этом отдельном сценарии ожидаемые сетевые ошибки заблокированных ресурсов не смешивать с ошибками JavaScript. Проверить один h1, язык `ru`, title/description/Open Graph, видимый фокус и клавиатурную достижимость главных действий. Источники ошибок отслеживать до `page.goto`, иначе проверка не считается полной.
- [ ] **5.2. Реализовать metadata и устранить найденные дефекты.** Проверить переходы при отключённом движении и поздней смене настройки, оптимизацию hero, `sizes`, размеры изображений и заголовки секций. При отсутствии домена сохранять доступные Open Graph поля и описать настройку домена в README. Не добавлять новые продуктовые возможности при исправлении дефектов.
- [ ] **5.3. Выполнить итоговые автоматические проверки на неизменённой версии.** `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` должны завершиться успешно. Запустить production: `npm run start -- --hostname 127.0.0.1 --port 3001`; в отдельном процессе выполнить `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:e2e`. Ожидается прохождение всех четырёх e2e-файлов на production-сервере. После исправления дефекта повторять затронутые проверки и финальный build, не повторять неизменные проверки без причины.
- [ ] **5.4. Провести визуальный просмотр и заполнить отчёт.** Сохранить фактические снимки всей страницы при 1440 и 390 px и проблемных размеров, если найдены. В `docs/qa/inbloom-runtime.md` указать browser, реальные размеры viewport, URL/режим, проверенные сценарии, результаты, ограничения и пути снимков. Проверить контраст, зоны нажатия около 44 px, читаемость на 360 px, масштаб цветочных сцен и отсутствие зашитого текста в изображениях. Если браузерная проверка недоступна, явно оставить её непроверенной; один build не заменяет визуальную проверку.
- [ ] **5.5. Дополнить README и провести итоговую независимую проверку.** README прямо говорит, что товарные изображения демонстрационные, а цены/контакты нужно подтвердить перед коммерческим запуском; отдельно перечисляет будущие корзину и оплату. Если выбранный пользователем способ исполнения предусматривает независимого ревьюера, передать ему весь diff, спецификацию, этот план и фактические результаты проверок. Исправить подтверждённые замечания, проверить затронутые сценарии, затем сохранить `feat: verify and document In Bloom landing`.
- [ ] **5.6. Передать работающий результат.** Открыть доступный preview, сообщить фактически пройденные проверки и ограничения. Отдельно указать, локальная это версия или опубликованная. Публикация выполняется только средствами хостинга с подтверждённой поддержкой выбранного Next.js runtime; неизвестный домен или отсутствующие доступы не заменять вымышленным URL.

## Самопроверка плана

- Цель/границы спецификации → задачи 1–5; будущий функционал не включён в зависимости и UI.
- Источники/сохранение материалов → 1.1, 2.3, 3.3, 4.3 и receipts.
- Архитектура/данные → Interfaces задачи 1 и серверная сборка в 2–4.
- Все секции и действия → задачи 2–4; якоря и ссылки закреплены в e2e.
- Графика и типографика → задача 2; нижний акцент → задача 4; полный визуальный просмотр → 5.4.
- Доступность, ошибки и отсутствие JS → задачи 2, 3 и 5; каждому пункту Review Focus соответствует названный тест.
- Проверки и документация → задача 5. Ни один результат проверки в этом документе не заявлен уже выполненным.

## Официальные справочные материалы

Проверены при подготовке плана 18 октября 2026 года; совместимость конкретных установленных пакетов повторно проверяется на этапе 1.

- [Next.js: установка вручную, scripts и требования](https://nextjs.org/docs/app/getting-started/installation).
- [Tailwind CSS: PostCSS-интеграция с Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs).
- [Next.js: Vitest](https://nextjs.org/docs/app/guides/testing/vitest), [Playwright](https://nextjs.org/docs/app/guides/testing/playwright).
- [Node.js: поддерживаемые релизы LTS](https://nodejs.org/en/about/previous-releases).
- [Google Fonts: Cormorant Garamond, кириллица и OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/METADATA.pb), [Manrope, кириллица и OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/METADATA.pb).
