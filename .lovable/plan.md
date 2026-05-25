## План: Бренды и категории в боковом меню

### 1. База данных (миграция)

Создаём две таблицы с одинаковой структурой:

**`categories`**
- `id` uuid PK
- `name` text — отображаемое имя
- `slug` text unique — для URL `/categoria/:slug`
- `emoji` text — настраивается в админке
- `sort_order` int — порядок в меню
- `is_active` boolean default true
- `created_at`, `updated_at`

**`brands`**
- те же поля + `logo_url` text (опционально)
- slug используется в `/marca/:slug`

**Изменения в `products`:**
- добавляем `brand_id uuid` (FK → brands, ON DELETE SET NULL, индекс)
- существующее текстовое поле `category` мигрируем: создаём `category_id uuid` (FK → categories), заполняем по совпадению slug, старое `category` оставляем для обратной совместимости (можно удалить позже)

**RLS:**
- SELECT для `public` (анонимы видят активные бренды/категории)
- INSERT/UPDATE/DELETE только для admin (`has_role(auth.uid(), 'admin')`)

**Сидинг categories:** мигрируем 8 текущих категорий из хардкода (`proteinas`, `creatinas`, `aminoacidos`, `aumentadores`, `barras`, `pre-entrenos`, `colageno`, `vitaminas`) с их emoji и текущим порядком.

### 2. Хуки (фронт)

- `src/hooks/useCategories.ts` — React Query + realtime subscription к `categories`, возвращает активные отсортированные по `sort_order`
- `src/hooks/useBrands.ts` — то же для `brands`

### 3. Боковое меню (`BurgerMenu.tsx`)

- Удалить хардкод `catalogCategories`
- Использовать `useCategories()` и `useBrands()`
- Добавить новый раздел "Marcas" рядом с "Catálogo", разворачиваемый аккордеоном
- Клик по бренду → `/marca/:slug`
- Скелетон во время загрузки

### 4. Страница бренда

- Новый роут `/marca/:slug` в `src/App.tsx`
- Новый компонент `src/pages/Brand.tsx` (по образцу `Category.tsx`): хедер, хлебные крошки, сетка товаров, фильтрующая по `brand_id`
- Динамические SEO-теги (title/description/canonical) по es-AR стандарту проекта
- Добавить в `sitemap.xml` записи `/marca/<slug>` для каждого активного бренда

### 5. Админка

**Новая вкладка "Marcas y categorías"** в `src/pages/Admin.tsx`:
- Две таблицы (`BrandsTable`, `CategoriesTable`) по образцу `PromoCodesTable`
- Диалоги создания/редактирования с полями: nombre, slug (авто из имени, редактируемый), emoji (picker или текст), sort_order (drag-and-drop или число), is_active, logo_url (только бренды)
- Удаление с подтверждением (`ConfirmDeleteDialog`)

**В `EditProductDialog` / `AddProductDialog`:**
- Селект `brand_id` со списком всех брендов
- Селект `category_id` со списком всех категорий (заменяет текущее текстовое `category`)

### 6. Карточка товара

- При наличии `brand`: показывать имя бренда на карточке/странице товара со ссылкой на `/marca/:slug` (мелкая опциональная правка — подтвердить визуально позже)

### Технические детали

- Все цены текстов на испанском (Rioplatense): "Marcas", "Sumate", без точек в конце пунктов меню
- Realtime подписка на обе таблицы, чтобы изменения в БД сразу появлялись в меню
- Slug-валидация: `^[a-z0-9-]+$`
- Миграция: один файл с обеими таблицами, FK, индексами, RLS, триггерами `updated_at` и сидингом категорий

### Что НЕ входит

- Фильтр по бренду внутри страницы категории (можно добавить позже)
- Подкатегории/иерархия
- Многобрендовые товары (один товар = один бренд)

Подтверди — и иду делать миграцию первым шагом.