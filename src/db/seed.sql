-- Global Connect — demo seed data
-- Bcrypt hashes are injected via psql variables:
--   psql "$DATABASE_URL" -v admin_hash="$ADMIN_HASH" -v member_hash="$MEMBER_HASH" -f src/db/seed.sql
-- Admin login:    admin@globalconnect.app / Admin@12345
-- Member logins:  *@example.com          / Member@12345

BEGIN;

-- ---------------------------------------------------------------- Users ----
INSERT INTO users (email, name, password_hash, role, status, email_verified, is_verified, bio, country, languages, interests, availability, last_active_at, created_at)
VALUES
  ('admin@globalconnect.app', 'Global Connect Admin', :'admin_hash', 'admin', 'active', true, true,
   'Platform administrator. Keeping Global Connect friendly, safe and spam-free.', 'Kenya',
   '["English","Swahili"]'::jsonb, '["Education","Culture"]'::jsonb, 'Flexible — anytime', now(), now() - interval '180 days'),

  ('amina.juma@example.com', 'Amina Juma', :'member_hash', 'member', 'active', true, true,
   'Swahili teacher from Nairobi helping the world speak Kiswahili like a local. I love long chats about travel, food and East African music.', 'Kenya',
   '["Swahili","English"]'::jsonb, '["Travel","Music","Cooking","Culture"]'::jsonb, 'Weekday evenings', now() - interval '2 minutes', now() - interval '92 days'),

  ('neema.mwangi@example.com', 'Neema Mwangi', :'member_hash', 'member', 'active', true, true,
   'Dar es Salaam based dancer and storyteller. Practicing my French — happy to trade for deep Swahili conversation.', 'Tanzania',
   '["Swahili","English","French"]'::jsonb, '["Dance","Culture","Food","Languages"]'::jsonb, 'Weekend mornings', now() - interval '4 minutes', now() - interval '120 days'),

  ('david.omondi@example.com', 'David Omondi', :'member_hash', 'member', 'active', true, false,
   'Software developer in Mombasa. Improving my business English and always down to talk football or code.', 'Kenya',
   '["English","Swahili"]'::jsonb, '["Sports","Technology","Business"]'::jsonb, 'Weekday evenings', now() - interval '22 minutes', now() - interval '75 days'),

  ('sarah.thompson@example.com', 'Sarah Thompson', :'member_hash', 'member', 'active', true, true,
   'London-based photographer learning Swahili for an upcoming East Africa project. Patient listener, enthusiastic beginner.', 'United Kingdom',
   '["English","French"]'::jsonb, '["Reading","Travel","Photography","Nature"]'::jsonb, 'Weekday afternoons', now() - interval '1 hour', now() - interval '60 days'),

  ('james.wilson@example.com', 'James Wilson', :'member_hash', 'member', 'active', true, false,
   'New Yorker, history nerd and amateur guitarist. Looking to practice conversational English with anyone, anywhere.', 'United States',
   '["English","Spanish"]'::jsonb, '["Music","Gaming","History"]'::jsonb, 'Weekend afternoons', now() - interval '3 hours', now() - interval '54 days'),

  ('sofia.martinez@example.com', 'Sofía Martínez', :'member_hash', 'member', 'active', true, false,
   'Madrid native, art historian. I can teach you Spanish while polishing my English — food conversations are my favorite.', 'Spain',
   '["Spanish","English"]'::jsonb, '["Art","Fashion","Food"]'::jsonb, 'Weekday evenings', now() - interval '9 minutes', now() - interval '41 days'),

  ('chen.wei@example.com', 'Chen Wei', :'member_hash', 'member', 'active', true, false,
   'Robotics engineer from Shanghai. Practicing technical English presentations — bring your best questions.', 'China',
   '["Mandarin","English"]'::jsonb, '["Technology","Science","Photography"]'::jsonb, 'Weekend evenings', now() - interval '35 minutes', now() - interval '28 days'),

  ('fatima.hassan@example.com', 'Fatima Hassan', :'member_hash', 'member', 'active', true, true,
   'Cairo tour guide who loves history and languages. Fluent Arabic, strong English, growing French and curious about Swahili.', 'Egypt',
   '["Arabic","English","French"]'::jsonb, '["Culture","History","Reading"]'::jsonb, 'Weekday mornings', now() - interval '4 hours', now() - interval '88 days'),

  ('grace.wanjiku@example.com', 'Grace Wanjiku', :'member_hash', 'member', 'pending_activation', true, false,
   'Primary school teacher from Nairobi. Joining to improve my English and help others with Swahili.', 'Kenya',
   '["Swahili","English"]'::jsonb, '["Education","Volunteering","Nature"]'::jsonb, 'Weekend mornings', now() - interval '2 days', now() - interval '3 days'),

  ('peter.kimani@example.com', 'Peter Kimani', :'member_hash', 'member', 'pending_activation', true, false,
   'Agripreneur from Nakuru. New here — excited to meet the world.', 'Kenya',
   '["Swahili","English"]'::jsonb, '["Nature","Sports","Business"]'::jsonb, 'Weekday afternoons', now() - interval '1 day', now() - interval '1 day')
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------- Payments ----
INSERT INTO payments (user_id, amount, currency, method, reference, note, status, created_at)
SELECT id, 90, 'KES', 'mpesa_paybill', 'QK7H2XYZ91', 'Paid via Safaricom line ending 0712', 'pending', now() - interval '2 hours'
FROM users WHERE email = 'grace.wanjiku@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO payments (user_id, amount, currency, method, reference, note, status, created_at)
SELECT id, 90, 'KES', 'mpesa_paybill', 'TL3M8BNA52', NULL, 'pending', now() - interval '45 minutes'
FROM users WHERE email = 'peter.kimani@example.com'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------- Reviews ----
INSERT INTO reviews (author_id, target_id, rating, comment, created_at)
SELECT a.id, b.id, r.rating, r.comment, r.created_at
FROM (VALUES
  ('sarah.thompson@example.com', 'amina.juma@example.com', 5, 'Amina is the Swahili teacher everyone dreams of — patient, funny and so encouraging. My confidence doubled in three sessions.', now() - interval '12 days'),
  ('james.wilson@example.com',    'amina.juma@example.com', 5, 'Great energy. We talked for an hour and it felt like ten minutes.', now() - interval '9 days'),
  ('sofia.martinez@example.com',  'amina.juma@example.com', 4, 'Very friendly and well prepared. Time zones are tricky but worth it!', now() - interval '6 days'),
  ('david.omondi@example.com',    'neema.mwangi@example.com', 5, 'Neema makes practicing feel like hanging out with a friend. Highly recommended.', now() - interval '8 days'),
  ('sarah.thompson@example.com',  'neema.mwangi@example.com', 5, 'Wonderful cultural exchange — she even taught me a taarab song.', now() - interval '5 days'),
  ('amina.juma@example.com',      'david.omondi@example.com', 4, 'Sharp and curious. Our tech-in-Africa conversations are always a highlight.', now() - interval '4 days'),
  ('james.wilson@example.com',    'chen.wei@example.com', 5, 'Chen explains complex ideas clearly — perfect practice partner for presentations.', now() - interval '2 days')
) AS r(author_email, target_email, rating, comment, created_at)
JOIN users a ON a.email = r.author_email
JOIN users b ON b.email = r.target_email
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------- Bookings ----
INSERT INTO bookings (requester_id, host_id, topic, note, scheduled_at, duration_min, status, responded_at, created_at)
SELECT s.id, a.id, 'Swahili conversation — market vocabulary', 'Looking forward to it! I prepared a word list.', now() + interval '2 days', 45, 'accepted', now() - interval '1 day', now() - interval '1 day'
FROM users s, users a
WHERE s.email = 'sarah.thompson@example.com' AND a.email = 'amina.juma@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO bookings (requester_id, host_id, topic, note, scheduled_at, duration_min, status, created_at)
SELECT j.id, n.id, 'English small talk practice', NULL, now() + interval '3 days', 30, 'pending', now() - interval '3 hours'
FROM users j, users n
WHERE j.email = 'james.wilson@example.com' AND n.email = 'neema.mwangi@example.com'
ON CONFLICT DO NOTHING;

-- -------------------------------------------- Demo conversation + messages ----
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at)
  VALUES (false, now() - interval '18 minutes')
  RETURNING id
), amina AS (SELECT id FROM users WHERE email = 'amina.juma@example.com'),
sarah AS (SELECT id FROM users WHERE email = 'sarah.thompson@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, CASE WHEN x.role = 'sarah' THEN NULL ELSE now() - interval '15 minutes' END
  FROM conv,
       (SELECT id AS uid, 'amina' AS role FROM amina UNION ALL SELECT id, 'sarah' FROM sarah) x
  RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.sender, 'text', m.content, m.ts
FROM parts,
  (VALUES
    ((SELECT id FROM sarah), 'Habari Amina! Ready for our Swahili practice this week?', now() - interval '1 day'),
    ((SELECT id FROM amina), 'Habari Sarah! Nzuri sana. Did you review the greetings I sent?', now() - interval '23 hours'),
    ((SELECT id FROM sarah), 'Yes! Habari yako, habari za kazi, habari za nyumbani…', now() - interval '22 hours'),
    ((SELECT id FROM amina), 'Perfect! You are learning so fast. Hongera!', now() - interval '21 hours'),
    ((SELECT id FROM sarah), 'Asante! Can we do a video call this weekend to practice speaking?', now() - interval '30 minutes'),
    ((SELECT id FROM amina), 'Absolutely, Saturday morning works for me. Karibu sana!', now() - interval '18 minutes')
  ) AS m(sender, content, ts)
ORDER BY m.ts
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------- FAQs ----
INSERT INTO faqs (question, answer, sort_order, published) VALUES
  ('Is Global Connect free to join?', 'Yes. Creating an account, building your profile and browsing members is completely free. A one-time KSh 90 activation unlocks messaging, calls and bookings forever.', 1, true),
  ('How does the activation payment work?', 'Send KSh 90 via M-Pesa Paybill 542542, account number 01609490286150. Submit your confirmation code on the Activation page and an admin will verify it — usually within a few hours.', 2, true),
  ('Which languages can I practice?', 'The community focuses on English and Swahili, but members speak dozens of languages. Use the search filters to find partners by language.', 3, true),
  ('Are voice and video calls safe?', 'Calls happen peer-to-peer in your browser via WebRTC and are never recorded by us. Combined with verified badges, reports and blocking, you stay in control.', 4, true),
  ('How do bookings work?', 'Open any member profile, pick Book session, propose a time and topic, and they will accept or decline. Your schedule appears in the Bookings calendar.', 5, true),
  ('What if someone behaves badly?', 'Use the Report button on their profile. Our moderation team reviews every report and can suspend or ban accounts that break the community rules.', 6, true)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------- Announcements ----
INSERT INTO announcements (title, body, published, created_at) VALUES
  ('Welcome to Global Connect', 'Karibu! We are so glad you are here. Complete your profile, activate your account, and start your first conversation today.', true, now() - interval '14 days'),
  ('Weekend Swahili Conversation Club', 'Every Saturday our most active Swahili speakers host open practice sessions. Book early — spots fill fast!', true, now() - interval '3 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------- Admin notification ----
INSERT INTO notifications (user_id, type, title, body, link, created_at)
SELECT id, 'payment', 'New activation payment to verify', 'Grace Wanjiku submitted M-Pesa reference QK7H2XYZ91.', '/admin?tab=payments', now() - interval '2 hours'
FROM users WHERE email = 'admin@globalconnect.app'
ON CONFLICT DO NOTHING;

COMMIT;
