## Архитектура

- Поддомен `socios.alaola.com.ar` подключается к существующему Vercel-проекту вторым доменом (CNAME `cname.vercel-dns.com`). DNS вы настраиваете руками после деплоя.
- В `App.tsx` детектим `window.location.hostname.startsWith('socios.')` → рендерим отдельный роутер `SociosApp` со своими страницами, хедером и футером. Обычные роуты не пересекаются.
- На локалке для разработки работает префикс `/socios/*` (без поддомена), чтобы можно было превьюить.

## База данных (миграция)

1. Новая роль: `ALTER TYPE app_role ADD VALUE 'mayorista'`.
2. `wholesale_invite_tokens` — таблица токенов приглашений:
   - `token` (uuid, PK), `lead_id` (uuid → wholesale_leads.id), `created_at`, `used_at`, `used_by_user_id`.
   - RLS: только admin SELECT/INSERT/UPDATE. Анонимная валидация — через SECURITY DEFINER функцию `validate_wholesale_invite(_token uuid)` возвращающую `{valid, lead_id, phone, full_name}`.
3. `app_settings` уже содержит конфиг минимума (ключ из текущей «Configuración Mayorista» — посмотрю в коде и переиспользую).
4. Триггер `handle_new_user`: если пользователь регистрируется с meta `{registration_method: 'mayorista', invite_token: xxx}` → автоматически вставить `user_roles(role='mayorista')` и пометить токен использованным. Реализую через RPC `claim_wholesale_invite(_token, _user_id)` вызываемую из фронта сразу после signUp.

## Каталог /socios

Источник: та же таблица `products`. Цены берём из `prices` JSONB:
- «display retail» — Tier 0 (зачёркнутая).
- «T4 buy price» — Tier 4 (последний tier, оптовая).
- Скидка % = `(t0 - t4) / t0 * 100`.

Компонент `SociosProductRow`: фото (с переключателем по вкусу), название, счётчик +/- (как в обычной корзине), справа три цены.

## Хедер Socios

- Лого слева (тот же), поиск по центру (фильтр по name/brand), справа корзина и аватар-меню.
- Под ними строка: `Hola, {firstName} • Mínimo: $200.000` или, если в корзине что-то есть и сумма < минимума: `Faltan: $XX.XXX`.
- Внизу sticky-бар с брендами: горизонтальный скролл логотипов из `brands` (только `is_active=true && products_count>0`), клик — фильтр каталога по бренду.

## Корзина /socios/carrito

Отдельная страница (не путать с обычной `/cart`, чтобы не смешивать tier 1 и tier 4). Использует те же `cart_items` с новым полем `mode='mayorista'`:

- Миграция: `ALTER TABLE cart_items ADD COLUMN mode TEXT NOT NULL DEFAULT 'retail'`.
- При добавлении в Socios → `mode='mayorista'`, `price_per_unit` = Tier 4.
- В обычной корзине фильтруем `mode='retail'`, в оптовой — `mode='mayorista'`.

Sticky-блок снизу: `Faltan: $X` (или пусто если ≥ минимума), `Confirmar pedido` (disabled пока < минимума), `Total: $Y`.

## Чекаут /socios/finalizar

Копия `Checkout.tsx` без блока промокода и без расчёта tier-сюрпризов. `order_type = 'mayorista'` (новое значение enum), `participants_count = 1`, цены сразу финальные.

- Миграция: `ALTER TYPE order_type ADD VALUE 'mayorista'`.
- Заказ падает в `user_orders` → отображается в существующем «Mis Pedidos» автоматически.

## ЛК

Полное переиспользование текущего `Profile.tsx` под `/socios/perfil` — данные те же.

## Admin: Solicitudes Mayoristas

В `WholesaleLeadsTable.tsx` к каждой строке добавляю кнопку **«Generar enlace»** (если токена ещё нет) и **«Copiar enlace»** (если есть). Линк: `https://socios.alaola.com.ar/registro?token=UUID`.

## Технические детали

- Файлы:
  - `src/socios/SociosApp.tsx`, `src/socios/SociosHeader.tsx`, `src/socios/BrandBar.tsx`
  - `src/socios/pages/Catalogo.tsx`, `Carrito.tsx`, `Finalizar.tsx`, `Registro.tsx`, `Login.tsx`
  - `src/socios/hooks/useSociosCart.ts`, `useMayoristaMinOrder.ts`
  - Edge function `claim-wholesale-invite` для серверной выдачи роли (SECURITY DEFINER миграция тоже подойдёт; выберу RPC).
- В `App.tsx` ранний switch: `if (isSociosHost) return <SociosApp />`.
- Защита: все `/socios/*` (кроме `/registro?token=`, `/login`) требуют `mayorista` или `admin` роль. Обычные пользователи без роли → редирект на лендинг с сообщением.

## Очерёдность работ

1. Миграция (роль, токены, cart_items.mode, order_type enum, RPC).
2. Edge-функция/RPC `claim_wholesale_invite`.
3. Каркас `SociosApp` + хост-роутинг.
4. Регистрация по токену + Login.
5. Каталог + корзина + закреплённый брендбар.
6. Чекаут + создание заказа.
7. Кнопка генерации/копирования ссылки в админке.
8. Vercel: добавление домена `socios.alaola.com.ar`.

После approve начну с миграции БД.