-- Guest (anonymous, session_id-based) cart access. The price curtain used to gate
-- guests, so the security lockdown left cart_items without anon policies; with the
-- curtain off, guests must be able to manage their session cart again.
-- Scope: only session rows (user_id IS NULL); logged-in carts keep their user_id policies.

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
