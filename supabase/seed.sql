-- ---------------------------------------------------------------------------
-- Seed Data for My COD - Urban Neo-Brutalism
-- ---------------------------------------------------------------------------

-- 1. Create Dummy Users (Auth & Profiles)
-- We insert into auth.users directly to simulate signed up users.
-- Note: In a real app, users sign up via Supabase Auth.
-- Password for every dummy account below is 'cod12345' — used by the
-- "Login sebagai Dummy User" quick-login on the /login page (dev only).
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token, phone)
VALUES
('a0000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'budi@test.com', crypt('cod12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '628111111111'),
('a0000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'siti@test.com', crypt('cod12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '628222222222'),
('a0000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'joko@test.com', crypt('cod12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '628333333333'),
('a0000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'andi@test.com', crypt('cod12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '628444444444');

INSERT INTO public.profiles (id, phone_number, name, profile_photo_url, city, lat, lng, is_verified, rating_avg)
VALUES
('a0000000-0000-4000-8000-000000000001', '628111111111', 'Budi Santoso', 'https://i.pravatar.cc/150?u=a0000000-0000-4000-8000-000000000001', 'Jakarta', -6.210000, 106.820000, true, 4.8),
('a0000000-0000-4000-8000-000000000002', '628222222222', 'Siti Rahma', 'https://i.pravatar.cc/150?u=a0000000-0000-4000-8000-000000000002', 'Jakarta', -6.220000, 106.810000, true, 4.9),
('a0000000-0000-4000-8000-000000000003', '628333333333', 'Joko Susilo', 'https://i.pravatar.cc/150?u=a0000000-0000-4000-8000-000000000003', 'Jakarta', -6.190000, 106.830000, false, 3.5),
('a0000000-0000-4000-8000-000000000004', '628444444444', 'Andi Pratama', 'https://i.pravatar.cc/150?u=a0000000-0000-4000-8000-000000000004', 'Jakarta', -6.205000, 106.805000, true, 5.0);

-- 2. Categories
INSERT INTO public.categories (id, name, icon)
VALUES
('c0000000-0000-4000-8000-000000000001', 'Makanan', 'Utensils'),
('c0000000-0000-4000-8000-000000000002', 'Elektronik', 'Laptop'),
('c0000000-0000-4000-8000-000000000003', 'Otomotif', 'Car'),
('c0000000-0000-4000-8000-000000000004', 'Pakaian', 'Shirt'),
('c0000000-0000-4000-8000-000000000005', 'Jasa', 'Wrench');

-- 3. Listings
-- We spread them around -6.200000, 106.816666
INSERT INTO public.listings (id, seller_id, title, description, price, category_id, photos, lat, lng, status)
VALUES
-- Budi's listings (Electronics & Automotive)
('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'iPhone 13 Pro 256GB Mulus', 'Dijual cepat iPhone 13 Pro warna Sierra Blue. COD sekitar Sudirman.', 12500000, 'c0000000-0000-4000-8000-000000000002', '["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500", "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500", "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500"]', -6.210000, 106.820000, 'available'),
('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Helm Bogo Retro Hitam Doff', 'Kondisi 95%, busa tebal.', 150000, 'c0000000-0000-4000-8000-000000000003', '["https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=500"]', -6.212000, 106.815000, 'available'),

-- Siti's listings (Food & Clothes)
('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'Nasi Goreng Gila Porsi Jumbo', 'PO Nasi Goreng Gila, COD malam ini jam 7 di Taman Menteng.', 35000, 'c0000000-0000-4000-8000-000000000001', '["https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500"]', -6.205000, 106.830000, 'available'),
('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'Kemeja Flannel Uniqlo Size L', 'Baru dipakai 2 kali, alasan jual kekecilan.', 120000, 'c0000000-0000-4000-8000-000000000004', '["https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=500"]', -6.200000, 106.825000, 'available'),
('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'Sepatu Sneakers Nike AF1', 'Original, Size 42, no box. Lecet pemakaian wajar.', 850000, 'c0000000-0000-4000-8000-000000000004', '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500"]', -6.208000, 106.821000, 'available'),

-- Joko's listings (Services)
('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'Jasa Servis AC Panggilan', 'Cuci AC dan tambah freon area Jakarta Selatan.', 100000, 'c0000000-0000-4000-8000-000000000005', '["https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500"]', -6.220000, 106.800000, 'available'),
('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'Jasa Pijat Refleksi Kebugaran', 'Panggilan pijat capek-capek untuk pria.', 150000, 'c0000000-0000-4000-8000-000000000005', '["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500"]', -6.225000, 106.795000, 'available'),

-- Andi's listings (Mix)
('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000004', 'MacBook Air M1 2020 Space Grey', 'Mulus 99%, CC baterai baru 50. Fullset original.', 10500000, 'c0000000-0000-4000-8000-000000000002', '["https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500", "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500"]', -6.195000, 106.815000, 'available'),
('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', 'Kopi Literan Arabica Gula Aren', 'Fresh brew, enak banget buat ngantor. Bisa COD sekitar Kuningan.', 65000, 'c0000000-0000-4000-8000-000000000001', '["https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500"]', -6.215000, 106.810000, 'available'),
('b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004', 'Sepeda Lipat Dahon K3 Plus', 'Jarang dipakai, lipatan aman. Tinggal gowes.', 3200000, 'c0000000-0000-4000-8000-000000000003', '["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500"]', -6.190000, 106.820000, 'available');

-- 4. Give Andi some reviews (since he has a 5.0 rating)
-- Budi reviews Andi
INSERT INTO public.reviews (listing_id, reviewer_id, reviewed_user_id, rating, comment)
SELECT id, 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 5, 'Barang mantap, seller ramah!'
FROM public.listings
WHERE seller_id = 'a0000000-0000-4000-8000-000000000004' LIMIT 1;

-- 5. Conversations, Messages & Meetups
-- Budi (buyer) chats with Siti (seller) for Nasi Goreng Gila (b0000000-0000-4000-8000-000000000003)
INSERT INTO public.conversations (id, listing_id, buyer_id, seller_id)
VALUES
('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');

INSERT INTO public.messages (conversation_id, sender_id, content)
VALUES
('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Halo Kak Siti, nasi gorengnya masih bisa PO buat malam ini?'),
('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'Halo Budi, masih kak. Mau COD di Taman Menteng jam 7 malam ya?'),
('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Siap, saya set jadwal COD-nya di aplikasi ya.');

INSERT INTO public.cod_meetups (id, conversation_id, meetup_location, meetup_time, status)
VALUES
('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Taman Menteng (Depan Patung)', now() + interval '1 day', 'scheduled');
