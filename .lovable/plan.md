## Что я обнаружил во внешней БД

Таблица `products`:
- `sku`, `name`, `name_short`, `flavor`, `size`, `category_slug`, `url_slug`, `brand_id`
- `image_urls`, `description_html`, `tags`, `seo_title`, `seo_description`
- `price_retail`, `price_retail_display`, `price_t1`, `price_t2`, `price_t3`, `price_t4`
- `active`, `sort_order`

Таблица `brands`: `id`, `name`, `seo_title`, `seo_description`, `logo_url`
Таблица `categories`: `slug`, `name`, `active`, `seo_title`, `seo_description`

Варианты вкусов = строки с одинаковым `url_slug` и разными `flavor` (так же продукт собирается в опте).

## Стратегия — параллельные роуты (старый сайт работает до понедельника)

Новый каталог поднимается на префиксе `/v2/*`, старый код (`/catalogo`, `/marca/:slug`, `/categoria/:slug`, `/producto/:slug`, `/:slug`) не трогается. В понедельник вы просто переключите роуты (одна правка в `App.tsx`) — старые файлы и таблица `products` удалятся отдельной миграцией позже.

### Новые роуты
- `/v2/catalogo` — список активных категорий
- `/v2/categoria/:slug` — активные продукты активных марок в категории
- `/v2/marca/:slug` — продукты марки + блок группового сбора
- `/v2/p/:urlSlug` — страница продукта (вкусы переключаются прямо на странице)

### Бэкенд

1. **`fetch-external-products` (обновить)** — отдаёт все нужные поля: `t1/t2/t3/t4`, `price_retail_display`, `description_html`, `seo_title`, `seo_description`, `url_slug`, `name_short`, `tags`, `flavor`, `size`, `brand_slug` (резолвится из `brands.name → slugify`). Фильтр `active = true`.
2. **`fetch-external-categories`** — без изменений (уже отдаёт `seo_title/seo_description` и `active`).
3. **`fetch-external-brands`** — без изменений (то же).
4. **Активность категорий** — на фронте: категория видна, только если в ней есть ≥1 активный продукт активной марки (брак из `brand_overrides.is_active`).

### Фронтенд

1. **`src/hooks/useCatalogProducts.ts`** — новый хук:
   - вызывает `fetch-external-products`, фильтрует по активным маркам (`brand_overrides.is_active`),
   - группирует по `url_slug` в объект `CatalogProduct`:
     ```ts
     { urlSlug, name, nameShort, size, description, images, brandSlug, brandName,
       categorySlug, seoTitle, seoDescription, tags,
       priceRetailDisplay, priceT1, priceT2, priceT3, priceT4,
       variants: [{ sku, flavor, images, t1..t4 }] }
     ```
2. **`src/hooks/useActiveCategories.ts`** — обёртка над `useCategories` + `useCatalogProducts`, скрывает категории без активных продуктов.

3. **Страницы**:
   - `src/pages/v2/Catalogo.tsx` — копирует разметку текущего `Catalog.tsx`, кормится из `useActiveCategories` + `useBrands` (только активные).
   - `src/pages/v2/Categoria.tsx` — список продуктов категории.
   - `src/pages/v2/Marca.tsx` — продукты марки + переиспользуем `GroupBuyPriceBlock` (как сейчас).
   - `src/pages/v2/Producto.tsx` — фото-карусель, переключатель вкусов (segmented chips, обновляет `selectedVariant`), цена-блок (Retail = `price_retail_display`, Precio Garantizado = `t2`, Súper-Precio = `t3`), кнопка «Comprar Ahora» с ценой `t1`, кнопка «Sumate al grupo» (открывает `AddToCartDialog`).
   - SEO: `<Helmet>` берёт `seoTitle`/`seoDescription` из продукта/категории/марки.

4. **`AddToCartDialog`** — добавляю prop `preselectedFlavor`, скрываю внутренний переключатель вкусов когда он пришёл с страницы продукта. Логика цен/таймера/сбора без изменений.

### Что НЕ трогаем сейчас
- Старые `Catalog.tsx`, `Category.tsx`, `Brand.tsx`, `DynamicProduct.tsx`, `useProducts`, таблица `products`, триггеры `waiting_for_discount_count`, `boost-brand-targets`, `reset-weekly-orders` — всё остаётся в проде до понедельника.
- Удаление старых таблиц и cron-логики — отдельная миграция «cleanup-legacy», запускаем после переключения роутов в понедельник.

### Открытые вопросы
- Цена «Súper-Precio» = `price_t3` или `price_t4`? Вы сказали T3, но во внешней БД есть и t3 и t4 — подтвердите. По умолчанию беру **T3**.
- Категория автоматически становится активной если в ней есть активный продукт активной марки — это уже работает в админке через `category_overrides.is_active` дефолт `true`, плюс фильтр на фронте «есть активные продукты». Так?

Если ОК — стартую с обновления `fetch-external-products`, потом хук, потом 4 страницы и роуты.