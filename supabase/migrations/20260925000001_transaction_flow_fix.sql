-- Fase 0 audit fix: close the gap between "COD meetup completed" and
-- "listing sold", and require a completed meetup before a review can be
-- posted. Previously these were fully independent (see alur.md discussion) —
-- a listing could stay "available" forever after the deal was done, and a
-- review could be posted the moment a conversation existed, with no meetup
-- ever scheduled.

alter table public.cod_meetups
  add column updated_at timestamptz not null default now();

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger cod_meetups_touch_updated_at
before update on public.cod_meetups
for each row execute function public.touch_updated_at();

-- Marking a meetup "completed" is the signal that the COD deal happened —
-- automatically sell the associated listing so sellers don't have to
-- separately remember to flip its status.
create function public.mark_listing_sold_on_meetup_completed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.listings
  set status = 'sold'
  where id = (select listing_id from public.conversations where id = new.conversation_id)
    and status <> 'sold';
  return new;
end;
$$;

create trigger cod_meetups_completed_sets_listing_sold
after update of status on public.cod_meetups
for each row
when (new.status = 'completed' and old.status is distinct from 'completed')
execute function public.mark_listing_sold_on_meetup_completed();

-- A review should only be possible once a transaction actually completed,
-- not merely because a conversation exists between the two parties.
drop policy if exists "participants can review after a transaction" on public.reviews;

create policy "participants can review after a completed transaction"
on public.reviews for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and reviewed_user_id <> (select auth.uid())
  and exists (
    select 1
    from public.conversations c
    join public.cod_meetups m on m.conversation_id = c.id
    where c.listing_id = reviews.listing_id
      and m.status = 'completed'
      and (
        (c.buyer_id = (select auth.uid()) and c.seller_id = reviewed_user_id)
        or (c.seller_id = (select auth.uid()) and c.buyer_id = reviewed_user_id)
      )
  )
);
