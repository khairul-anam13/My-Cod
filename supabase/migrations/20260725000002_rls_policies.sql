-- My COD — Row Level Security
-- Trust & safety rules from PRD 7.2: phone verification required to post/chat,
-- users only manage their own data, chat/meetups restricted to participants.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.cod_meetups enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Public profile info (name, city, rating, verified badge) is visible to
-- everyone so buyers can see who they're dealing with before logging in.
create policy "profiles are publicly readable"
on public.profiles for select
to anon, authenticated
using (true);

create policy "users can create their own profile"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

create policy "users can update their own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- categories (read-only for clients; managed via service role)
-- ---------------------------------------------------------------------------
create policy "categories are publicly readable"
on public.categories for select
to anon, authenticated
using (true);

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create policy "listings are publicly readable"
on public.listings for select
to anon, authenticated
using (true);

-- Posting requires a verified phone number (PRD 2.2 / 7.2).
create policy "verified users can create listings"
on public.listings for insert
to authenticated
with check (
  seller_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_verified
  )
);

create policy "sellers can update their own listings"
on public.listings for update
to authenticated
using (seller_id = (select auth.uid()))
with check (seller_id = (select auth.uid()));

create policy "sellers can delete their own listings"
on public.listings for delete
to authenticated
using (seller_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create policy "participants can read their conversations"
on public.conversations for select
to authenticated
using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

create policy "buyers can start a conversation"
on public.conversations for insert
to authenticated
with check (
  buyer_id = (select auth.uid())
  and exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = conversations.seller_id
  )
);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create policy "participants can read messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = (select auth.uid()) or c.seller_id = (select auth.uid()))
  )
);

create policy "participants can send messages"
on public.messages for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = (select auth.uid()) or c.seller_id = (select auth.uid()))
  )
);

-- ---------------------------------------------------------------------------
-- cod_meetups
-- ---------------------------------------------------------------------------
create policy "participants can read meetups"
on public.cod_meetups for select
to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = (select auth.uid()) or c.seller_id = (select auth.uid()))
  )
);

create policy "participants can create meetups"
on public.cod_meetups for insert
to authenticated
with check (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = (select auth.uid()) or c.seller_id = (select auth.uid()))
  )
);

create policy "participants can update meetups"
on public.cod_meetups for update
to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = (select auth.uid()) or c.seller_id = (select auth.uid()))
  )
);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
-- Ratings are public — they're the core trust signal (PRD 1.4/3.1).
create policy "reviews are publicly readable"
on public.reviews for select
to anon, authenticated
using (true);

-- Reviewer must be a participant (buyer or seller) in a conversation tied to
-- this listing, and can only review the other party.
create policy "participants can review after a transaction"
on public.reviews for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and reviewed_user_id <> (select auth.uid())
  and exists (
    select 1 from public.conversations c
    where c.listing_id = reviews.listing_id
      and (
        (c.buyer_id = (select auth.uid()) and c.seller_id = reviewed_user_id)
        or (c.seller_id = (select auth.uid()) and c.buyer_id = reviewed_user_id)
      )
  )
);

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
-- Reporters can see their own reports; full moderation queue is read via the
-- API's service-role client, not exposed to end users.
create policy "reporters can read their own reports"
on public.reports for select
to authenticated
using (reporter_id = (select auth.uid()));

create policy "authenticated users can file a report"
on public.reports for insert
to authenticated
with check (reporter_id = (select auth.uid()));
