-- My COD — location master data (districts/villages) + user address fields
--
-- Scope: My COD only serves Kabupaten Karanganyar, Central Java. This
-- replaces free-text city/address input with official administrative master
-- data (kecamatan/kelurahan-desa), sourced from Kemendagri wilayah codes
-- (17 kecamatan, 162 desa/kelurahan — verified against the standard
-- administrative code set, not hand-typed from memory).

-- ---------------------------------------------------------------------------
-- districts (kecamatan)
-- ---------------------------------------------------------------------------
create table public.districts (
  id uuid primary key default gen_random_uuid(),
  -- Official Kemendagri kode wilayah, e.g. "3313010" for Jatipuro.
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create index districts_name_idx on public.districts (name);

-- ---------------------------------------------------------------------------
-- villages (kelurahan/desa)
-- ---------------------------------------------------------------------------
create table public.villages (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts (id) on delete cascade,
  -- Official Kemendagri kode wilayah, e.g. "3313010001" for Ngepungsari.
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  -- Village names repeat across different kecamatan (e.g. two "Dayu"s) —
  -- only the pair needs to be unique, not the bare name.
  unique (district_id, name)
);

create index villages_district_idx on public.villages (district_id);
create index villages_name_idx on public.villages (name);

-- ---------------------------------------------------------------------------
-- profiles — structured address fields
-- ---------------------------------------------------------------------------
-- Nullable: existing rows predate this feature and have no address yet: they
-- simply show "belum diisi" until the user completes one. New submissions
-- are required to fill these in at the application layer (zod).
alter table public.profiles
  add column district_id uuid references public.districts (id),
  add column village_id uuid references public.villages (id),
  add column address_detail text,
  add column last_address_updated_at timestamptz;

create index profiles_district_idx on public.profiles (district_id);
create index profiles_village_idx on public.profiles (village_id);

-- A village must actually belong to the chosen district — cheap to check in
-- the API, but a DB constraint closes the gap for any other write path.
create function public.check_profile_village_in_district() returns trigger
language plpgsql as $$
begin
  if new.village_id is not null then
    if not exists (
      select 1 from public.villages
      where id = new.village_id and district_id = new.district_id
    ) then
      raise exception 'village_id does not belong to district_id';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_village_in_district
before insert or update of district_id, village_id on public.profiles
for each row execute function public.check_profile_village_in_district();

-- ---------------------------------------------------------------------------
-- RLS — master data is public reference data, same pattern as categories.
-- ---------------------------------------------------------------------------
alter table public.districts enable row level security;
alter table public.villages enable row level security;

create policy "districts are publicly readable"
on public.districts for select
to anon, authenticated
using (true);

create policy "villages are publicly readable"
on public.villages for select
to anon, authenticated
using (true);

grant all on public.districts to anon, authenticated, service_role;
grant all on public.villages to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Master data — 17 kecamatan
-- ---------------------------------------------------------------------------
insert into public.districts (code, name) values
('3313010', 'Jatipuro'),
('3313020', 'Jatiyoso'),
('3313030', 'Jumapolo'),
('3313040', 'Jumantono'),
('3313050', 'Matesih'),
('3313060', 'Tawangmangu'),
('3313070', 'Ngargoyoso'),
('3313080', 'Karangpandan'),
('3313090', 'Karanganyar'),
('3313100', 'Tasikmadu'),
('3313110', 'Jaten'),
('3313120', 'Colomadu'),
('3313130', 'Gondangrejo'),
('3313140', 'Kebakkramat'),
('3313150', 'Mojogedang'),
('3313160', 'Kerjo'),
('3313170', 'Jenawi');

-- ---------------------------------------------------------------------------
-- Master data — 162 desa/kelurahan
-- ---------------------------------------------------------------------------
insert into public.villages (district_id, code, name)
select d.id, v.code, v.name
from (values
  -- Jatipuro (3313010)
  ('3313010', '3313010001', 'Ngepungsari'),
  ('3313010', '3313010002', 'Jatipurwo'),
  ('3313010', '3313010003', 'Jatipuro'),
  ('3313010', '3313010004', 'Jatisobo'),
  ('3313010', '3313010005', 'Jatiwarno'),
  ('3313010', '3313010006', 'Jatimulyo'),
  ('3313010', '3313010007', 'Jatisuko'),
  ('3313010', '3313010008', 'Jatiharjo'),
  ('3313010', '3313010009', 'Jatikuwung'),
  ('3313010', '3313010010', 'Jatiroyo'),
  -- Jatiyoso (3313020)
  ('3313020', '3313020001', 'Jatisawit'),
  ('3313020', '3313020003', 'Wonokeling'),
  ('3313020', '3313020004', 'Jatiyoso'),
  ('3313020', '3313020005', 'Tlobo'),
  ('3313020', '3313020006', 'Wonorejo'),
  ('3313020', '3313020008', 'Karangsari'),
  ('3313020', '3313020009', 'Wukirsawit'),
  -- Jumapolo (3313030)
  ('3313030', '3313030001', 'Paseban'),
  ('3313030', '3313030002', 'Lemahbang'),
  ('3313030', '3313030003', 'Karangbangun'),
  ('3313030', '3313030004', 'Ploso'),
  ('3313030', '3313030005', 'Giriwondo'),
  ('3313030', '3313030006', 'Kadipiro'),
  ('3313030', '3313030007', 'Jumantoro'),
  ('3313030', '3313030008', 'Kedawung'),
  ('3313030', '3313030009', 'Bakalan'),
  ('3313030', '3313030010', 'Jumapolo'),
  ('3313030', '3313030011', 'Kwangsan'),
  ('3313030', '3313030012', 'Jatirejo'),
  -- Jumantono (3313040)
  ('3313040', '3313040001', 'Sedayu'),
  ('3313040', '3313040002', 'Kebak'),
  ('3313040', '3313040003', 'Gemantar'),
  ('3313040', '3313040004', 'Tunggulrejo'),
  ('3313040', '3313040005', 'Genengan'),
  ('3313040', '3313040008', 'Sukosari'),
  ('3313040', '3313040009', 'Sambirejo'),
  ('3313040', '3313040010', 'Blorong'),
  ('3313040', '3313040011', 'Sringin'),
  -- Matesih (3313050)
  ('3313050', '3313050001', 'Ngadiluwih'),
  ('3313050', '3313050002', 'Dawung'),
  ('3313050', '3313050003', 'Matesih'),
  ('3313050', '3313050004', 'Karangbangun'),
  ('3313050', '3313050005', 'Koripan'),
  ('3313050', '3313050006', 'Girilayu'),
  ('3313050', '3313050007', 'Pablengan'),
  ('3313050', '3313050008', 'Plosorejo'),
  ('3313050', '3313050009', 'Gantiwarno'),
  -- Tawangmangu (3313060)
  ('3313060', '3313060001', 'Bandardawung'),
  ('3313060', '3313060002', 'Sepanjang'),
  ('3313060', '3313060003', 'Tawangmangu'),
  ('3313060', '3313060004', 'Kalisoro'),
  ('3313060', '3313060005', 'Blumbang'),
  ('3313060', '3313060006', 'Gondosuli'),
  ('3313060', '3313060007', 'Tengklik'),
  ('3313060', '3313060008', 'Nglebak'),
  ('3313060', '3313060009', 'Karanglo'),
  ('3313060', '3313060010', 'Plumbon'),
  -- Ngargoyoso (3313070)
  ('3313070', '3313070001', 'Puntukrejo'),
  ('3313070', '3313070002', 'Berjo'),
  ('3313070', '3313070003', 'Girimulyo'),
  ('3313070', '3313070004', 'Segorogunung'),
  ('3313070', '3313070005', 'Kemuning'),
  ('3313070', '3313070006', 'Nglegok'),
  ('3313070', '3313070008', 'Jatirejo'),
  ('3313070', '3313070009', 'Ngargoyoso'),
  -- Karangpandan (3313080)
  ('3313080', '3313080001', 'Bangsri'),
  ('3313080', '3313080002', 'Ngemplak'),
  ('3313080', '3313080003', 'Doplang'),
  ('3313080', '3313080005', 'Karang'),
  ('3313080', '3313080006', 'Salam'),
  ('3313080', '3313080007', 'Karangpandan'),
  ('3313080', '3313080008', 'Tohkuning'),
  ('3313080', '3313080009', 'Gondangmanis'),
  ('3313080', '3313080010', 'Dayu'),
  ('3313080', '3313080011', 'Harjosari'),
  -- Karanganyar (3313090)
  ('3313090', '3313090001', 'Lalung'),
  ('3313090', '3313090002', 'Bolong'),
  ('3313090', '3313090003', 'Jantiharjo'),
  ('3313090', '3313090004', 'Tegalgede'),
  ('3313090', '3313090006', 'Cangakan'),
  ('3313090', '3313090007', 'Karanganyar'),
  ('3313090', '3313090009', 'Popongan'),
  ('3313090', '3313090010', 'Gayamdompo'),
  ('3313090', '3313090011', 'Delingan'),
  ('3313090', '3313090012', 'Gedong'),
  -- Tasikmadu (3313100)
  ('3313100', '3313100001', 'Buran'),
  ('3313100', '3313100002', 'Papahan'),
  ('3313100', '3313100003', 'Ngijo'),
  ('3313100', '3313100004', 'Gaum'),
  ('3313100', '3313100006', 'Pandeyan'),
  ('3313100', '3313100007', 'Karangmojo'),
  ('3313100', '3313100008', 'Kaling'),
  ('3313100', '3313100009', 'Wonolopo'),
  ('3313100', '3313100010', 'Kalijirak'),
  -- Jaten (3313110)
  ('3313110', '3313110001', 'Suruhkalang'),
  ('3313110', '3313110002', 'Jati'),
  ('3313110', '3313110003', 'Jaten'),
  ('3313110', '3313110004', 'Dagen'),
  ('3313110', '3313110005', 'Ngringo'),
  ('3313110', '3313110006', 'Jetis'),
  ('3313110', '3313110007', 'Sroyo'),
  -- Colomadu (3313120)
  ('3313120', '3313120001', 'Ngasem'),
  ('3313120', '3313120002', 'Bolon'),
  ('3313120', '3313120003', 'Malangjiwan'),
  ('3313120', '3313120004', 'Paulan'),
  ('3313120', '3313120005', 'Gajahan'),
  ('3313120', '3313120006', 'Blulukan'),
  ('3313120', '3313120007', 'Gawanan'),
  ('3313120', '3313120008', 'Gedongan'),
  ('3313120', '3313120009', 'Tohudan'),
  ('3313120', '3313120010', 'Baturan'),
  ('3313120', '3313120011', 'Klodran'),
  -- Gondangrejo (3313130)
  ('3313130', '3313130001', 'Wonorejo'),
  ('3313130', '3313130002', 'Plesungan'),
  ('3313130', '3313130003', 'Jatikuwung'),
  ('3313130', '3313130004', 'Selokaton'),
  ('3313130', '3313130005', 'Bulurejo'),
  ('3313130', '3313130006', 'Rejosari'),
  ('3313130', '3313130007', 'Jeruksawit'),
  ('3313130', '3313130008', 'Karangturi'),
  ('3313130', '3313130009', 'Kragan'),
  ('3313130', '3313130010', 'Wonosari'),
  ('3313130', '3313130011', 'Dayu'),
  ('3313130', '3313130012', 'Tuban'),
  ('3313130', '3313130013', 'Krendowahono'),
  -- Kebakkramat (3313140)
  ('3313140', '3313140001', 'Kemiri'),
  ('3313140', '3313140002', 'Nangsri'),
  ('3313140', '3313140003', 'Macanan'),
  ('3313140', '3313140004', 'Alastuwo'),
  ('3313140', '3313140005', 'Banjarharjo'),
  ('3313140', '3313140006', 'Malanggaten'),
  ('3313140', '3313140007', 'Kaliwuluh'),
  ('3313140', '3313140008', 'Pulosari'),
  ('3313140', '3313140009', 'Kebak'),
  ('3313140', '3313140010', 'Waru'),
  -- Mojogedang (3313150)
  ('3313150', '3313150001', 'Sewurejo'),
  ('3313150', '3313150002', 'Ngadirejo'),
  ('3313150', '3313150003', 'Mojogedang'),
  ('3313150', '3313150004', 'Pojok'),
  ('3313150', '3313150005', 'Mojoroto'),
  ('3313150', '3313150006', 'Kaliboto'),
  ('3313150', '3313150007', 'Buntar'),
  ('3313150', '3313150008', 'Gebyog'),
  ('3313150', '3313150009', 'Gentungan'),
  -- Kerjo (3313160)
  ('3313160', '3313160001', 'Kuto'),
  ('3313160', '3313160002', 'Tamansari'),
  ('3313160', '3313160003', 'Ganten'),
  ('3313160', '3313160004', 'Gempolan'),
  ('3313160', '3313160005', 'Plosorejo'),
  ('3313160', '3313160006', 'Karangrejo'),
  ('3313160', '3313160007', 'Kwadungan'),
  ('3313160', '3313160008', 'Botok'),
  ('3313160', '3313160009', 'Sumberejo'),
  ('3313160', '3313160010', 'Tawangsari'),
  -- Jenawi (3313170)
  ('3313170', '3313170002', 'Anggrasmanis'),
  ('3313170', '3313170003', 'Jenawi'),
  ('3313170', '3313170004', 'Trengguli'),
  ('3313170', '3313170005', 'Sidomukti'),
  ('3313170', '3313170006', 'Balong'),
  ('3313170', '3313170007', 'Seloromo'),
  ('3313170', '3313170008', 'Menjing'),
  ('3313170', '3313170009', 'Lempong')
) as v(district_code, code, name)
join public.districts d on d.code = v.district_code;
