-- Restore pending collective orders to old tier prices (index 2 = old "50 people" tier)
-- and freeze them by setting participants_count in each item

-- Order 1: ENA Creatina Micronizada (count 71, qty 1) → old tier 3 price = 28710
UPDATE user_orders SET
  items = (
    SELECT jsonb_agg(
      item || '{"participants_count": 71, "price_per_unit": 28710}'::jsonb
    )
    FROM jsonb_array_elements(items) AS item
  ),
  subtotal = 28710,
  total_amount = 28710,
  discount_amount = 36300 - 28710
WHERE id = 'ddc46202-8e37-48d8-b96b-4a4be62b8a63';

-- Order 2: ENA Amino 4500 (count 60, qty 2) → old tier 3 price = 24920
UPDATE user_orders SET
  items = (
    SELECT jsonb_agg(
      item || '{"participants_count": 60, "price_per_unit": 24920}'::jsonb
    )
    FROM jsonb_array_elements(items) AS item
  ),
  subtotal = 2 * 24920,
  total_amount = 2 * 24920,
  discount_amount = 2 * 31508 - 2 * 24920
WHERE id = '17e4a1a1-02ea-4b1b-8c15-cfec3dd45aa7';

-- Order 3: Star Nutrition Creatina doypack (count 53, qty 2) → old tier 3 price = 33051
UPDATE user_orders SET
  items = (
    SELECT jsonb_agg(
      item || '{"participants_count": 53, "price_per_unit": 33051}'::jsonb
    )
    FROM jsonb_array_elements(items) AS item
  ),
  subtotal = 2 * 33051,
  total_amount = 2 * 33051,
  discount_amount = 2 * 41789 - 2 * 33051
WHERE id = 'fe88121a-d95d-4956-9fd4-cb47981b3411';

-- Order 4: Pulver Creatina Monohidratada (count 58, qty 1) → old tier 3 price = 19749
UPDATE user_orders SET
  items = (
    SELECT jsonb_agg(
      item || '{"participants_count": 58, "price_per_unit": 19749}'::jsonb
    )
    FROM jsonb_array_elements(items) AS item
  ),
  subtotal = 19749,
  total_amount = 19749,
  discount_amount = 24970 - 19749
WHERE id = 'c7134552-527c-4d22-ad39-4071af903f20';

-- Order 5: ENA TrueMade Whey Proteina 5Lb (count 61, qty 1) → old tier 3 price = 116543
UPDATE user_orders SET
  items = (
    SELECT jsonb_agg(
      item || '{"participants_count": 61, "price_per_unit": 116543}'::jsonb
    )
    FROM jsonb_array_elements(items) AS item
  ),
  subtotal = 116543,
  total_amount = 116543,
  discount_amount = 142296 - 116543
WHERE id = 'd4229cfc-c735-432a-969d-a7bcec015f10';