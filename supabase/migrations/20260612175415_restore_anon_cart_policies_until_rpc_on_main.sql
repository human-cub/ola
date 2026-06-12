-- Shared DB (stage+prod). The bearer-token RPCs (20260612174805) are additive, but the OLD
-- prod frontend (main) still writes cart_items directly as anon. Restore the scoped anon
-- policies so prod guest cart keeps working; drop them in a final migration AFTER the
-- RPC-based frontend reaches main. (Both paths coexist safely meanwhile.)

create policy "Anon can insert session cart items"
  on public.cart_items for insert to anon
  with check (user_id is null and session_id is not null);

create policy "Anon can view session cart items"
  on public.cart_items for select to anon
  using (user_id is null);

create policy "Anon can update session cart items"
  on public.cart_items for update to anon
  using (user_id is null)
  with check (user_id is null);

create policy "Anon can delete session cart items"
  on public.cart_items for delete to anon
  using (user_id is null);
