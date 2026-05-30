## Цель
Добавить в админку механику «целей сбора» по маркам и алгоритм виртуальной накрутки. Пользователям ничего не показываем, существующую логику цен/корзин/заказов не трогаем.

## 1. UI админки (BrandsTable)
Скрываю колонки **Slug**, **SEO Title**, **SEO Description**. Вместо них добавляю:

| Колонка | Что внутри |
|---|---|
| Target | Поле ввода суммы в ARS (целевая сумма сбора по марке). Сохраняется при потере фокуса |
| Score | Текущая сумма сбора = реальные + виртуальные (read-only, в формате `$X / $Target` + %) |
| Mayorista | Сумма заказов реальных людей по продуктам марки (read-only) |
| Boost | Select из 3 режимов: `Inactivo`, `Activo`, `Activo primeras 24h` |

Drag-handle, Logo, Nombre, Productos, Activa — остаются.

## 2. Хранилище
Расширяю существующую таблицу `brand_overrides` (она уже привязана к slug):
- `target_amount numeric default 0`
- `booster_mode text default 'off'` (`off` | `active` | `first_24h`)
- `booster_started_at timestamptz` — момент включения буста (для расчёта окна 24h и недельных фаз)
- `virtual_score numeric default 0` — накрученная сумма (сбрасывается при смене режима/новом цикле)

`mayorista_score` не храним — считаем по запросу: сумма `total_amount` по `user_orders` со статусом `pending` за текущую неделю, где есть item с `product_id` принадлежащим марке (через локальную таблицу `products.brand_id`).

## 3. Edge-функция `brand-scores`
Новая read-only функция (вызывается из админки) — возвращает по каждому slug:
- `mayorista` (реальная сумма по неделе)
- `virtual` (из `brand_overrides.virtual_score`)
- `score = mayorista + virtual`

## 4. Алгоритм накрутки `boost-brand-targets`
Cron каждые 15 минут (pg_cron + pg_net). Для каждой марки с `booster_mode != 'off'`:

**Фазы недели (ART, Buenos Aires):**
```
Пн 10:00 – Вт 10:00   → цель прогресса 25–30% target
Вт 10:00 – Пт 22:00   → плавно до 70–80%
Сб 10:00 – Вс 22:00   → дотягиваем до 100% (с вероятностью ~90%)
```

Логика тика:
1. Считаем `expected_progress(now)` по фазе (с небольшим рандомом ±2%)
2. `current_progress = (mayorista + virtual) / target`
3. Если `current < expected` → добавляем к `virtual_score` инкремент, чтобы догнать до `expected` (но не больше)
4. Для финальной фазы: на каждом тике с вероятностью, рассчитанной так, чтобы суммарно за фазу было ~90% шанс достичь 100% — толкаем к 100%
5. Режим `first_24h` работает только первые 24ч от `booster_started_at`, потом стоп
6. Цикл сбрасывается понедельник 10:00 ART (`virtual_score = 0`, `booster_started_at = now()` если режим `active`)

## 5. Что НЕ трогаем
- Существующие цены, тиры, `collectivePricing.ts`, корзина, чекаут, публичные страницы марок — без изменений
- Никаких новых публичных компонентов
- Никаких изменений в `fetch-external-brands` для пользовательского сайта

## Технические детали
- Миграция: `ALTER TABLE brand_overrides ADD COLUMN ...`
- `fetch-external-brands` дополняется чтением новых полей из `brand_overrides` и отдачей в `MergedBrand` (только для админки)
- `hooks/useBrands.ts` — добавить новые поля в интерфейс `Brand`
- Новые edge functions: `brand-scores` (GET-like, admin-only через JWT + has_role), `boost-brand-targets` (cron, защищена `CRON_SECRET`)
- Cron job настраивается через `supabase--insert` (SQL c pg_cron)

## Открытый вопрос
Считать `mayorista` как **сумму заказов** (`total_amount`) или **сумму по позициям именно этой марки** (точнее, но дороже)? По умолчанию беру второй вариант — сумма `quantity * price_per_unit` по items, чей `product_id` принадлежит марке.