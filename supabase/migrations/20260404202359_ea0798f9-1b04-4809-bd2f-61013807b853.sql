UPDATE public.products 
SET prices = '[{"people":1,"price":37990},{"people":1,"price":33253},{"people":6,"price":31421},{"people":18,"price":29538},{"people":42,"price":27325}]'::jsonb
WHERE id = '46d48965-88fa-405a-8cca-c194a29ade27';