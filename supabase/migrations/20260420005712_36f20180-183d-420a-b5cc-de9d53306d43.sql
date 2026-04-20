UPDATE public.products
SET prices = jsonb_build_array(
  jsonb_build_object('people', 1,  'price', (prices->0->>'price')::numeric),
  jsonb_build_object('people', 1,  'price', (prices->1->>'price')::numeric),
  jsonb_build_object('people', 6,  'price', (prices->2->>'price')::numeric),
  jsonb_build_object('people', 18, 'price', (prices->3->>'price')::numeric),
  jsonb_build_object('people', 42, 'price', (prices->4->>'price')::numeric)
)
WHERE jsonb_array_length(prices) = 5
  AND (prices->1->>'people')::int = 25
  AND (prices->2->>'people')::int = 50
  AND (prices->3->>'people')::int = 75
  AND (prices->4->>'people')::int = 100;