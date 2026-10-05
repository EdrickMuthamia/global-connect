-- Global Connect — demo seed data
-- psql "$DATABASE_URL" -v admin_hash="$ADMIN_HASH" -v member_hash="$MEMBER_HASH" -f src/db/seed.sql

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
   '["Swahili","English"]'::jsonb, '["Nature","Sports","Business"]'::jsonb, 'Weekday afternoons', now() - interval '1 day', now() - interval '1 day'),

  ('lucas.dupont@example.com', 'Lucas Dupont', :'member_hash', 'member', 'active', true, true,
   'French software engineer living in Paris. Learning English and Swahili. Big fan of African cinema and jazz.', 'France',
   '["French","English"]'::jsonb, '["Music","Technology","Art","Travel"]'::jsonb, 'Weekday evenings', now() - interval '10 minutes', now() - interval '50 days'),

  ('yuki.tanaka@example.com', 'Yuki Tanaka', :'member_hash', 'member', 'active', true, true,
   'Tokyo-based graphic designer. Passionate about English conversation and learning about African cultures. Anime and food lover.', 'Japan',
   '["Japanese","English"]'::jsonb, '["Art","Food","Culture","Travel"]'::jsonb, 'Weekend mornings', now() - interval '6 minutes', now() - interval '45 days'),

  ('omar.sheikh@example.com', 'Omar Sheikh', :'member_hash', 'member', 'active', true, false,
   'Dubai entrepreneur. Fluent Arabic and English, learning Swahili for business expansion into East Africa.', 'United Arab Emirates',
   '["Arabic","English"]'::jsonb, '["Business","Travel","Culture"]'::jsonb, 'Weekday mornings', now() - interval '15 minutes', now() - interval '33 days'),

  ('priya.sharma@example.com', 'Priya Sharma', :'member_hash', 'member', 'active', true, true,
   'Mumbai-based journalist. Covering global stories and learning languages along the way. English, Hindi and now Swahili!', 'India',
   '["Hindi","English"]'::jsonb, '["Reading","Culture","Travel","Education"]'::jsonb, 'Weekday afternoons', now() - interval '20 minutes', now() - interval '38 days'),

  ('marco.rossi@example.com', 'Marco Rossi', :'member_hash', 'member', 'active', true, false,
   'Chef from Rome obsessed with world cuisines. Learning English to expand my restaurant internationally. Lets talk food!', 'Italy',
   '["Italian","English","Spanish"]'::jsonb, '["Cooking","Food","Travel","Culture"]'::jsonb, 'Weekend evenings', now() - interval '45 minutes', now() - interval '22 days'),

  ('aisha.diallo@example.com', 'Aisha Diallo', :'member_hash', 'member', 'active', true, true,
   'Dakar-based fashion designer. French and Wolof native, improving English and curious about East African styles.', 'Senegal',
   '["French","English"]'::jsonb, '["Fashion","Art","Culture","Music"]'::jsonb, 'Weekday evenings', now() - interval '8 minutes', now() - interval '55 days'),

  ('hans.mueller@example.com', 'Hans Müller', :'member_hash', 'member', 'active', true, false,
   'Berlin mechanical engineer. Practicing English for international conferences. Interested in African tech startups.', 'Germany',
   '["German","English"]'::jsonb, '["Technology","Science","Sports","History"]'::jsonb, 'Weekday mornings', now() - interval '2 hours', now() - interval '29 days'),

  ('amara.diop@example.com', 'Amara Diop', :'member_hash', 'member', 'active', true, true,
   'Accra-based musician and music producer. English and Twi speaker, learning French to connect with West African francophone artists.', 'Ghana',
   '["English","French"]'::jsonb, '["Music","Art","Culture","Dance"]'::jsonb, 'Weekend afternoons', now() - interval '3 minutes', now() - interval '66 days'),

  ('elena.popova@example.com', 'Elena Popova', :'member_hash', 'member', 'active', true, false,
   'Moscow-based translator. Fluent Russian and English, learning Arabic and Swahili. Love poetry and long conversations.', 'Russia',
   '["Russian","English","Arabic"]'::jsonb, '["Reading","Languages","Culture","Art"]'::jsonb, 'Weekend evenings', now() - interval '1 hour', now() - interval '44 days'),

  ('kwame.asante@example.com', 'Kwame Asante', :'member_hash', 'member', 'active', true, true,
   'Kumasi entrepreneur building agri-tech solutions. English speaker looking to connect with global investors and learn French.', 'Ghana',
   '["English","French"]'::jsonb, '["Business","Technology","Nature","Education"]'::jsonb, 'Weekday afternoons', now() - interval '30 minutes', now() - interval '71 days'),

  ('mei.lin@example.com', 'Mei Lin', :'member_hash', 'member', 'active', true, false,
   'Shenzhen product manager. Polishing business English and curious about African markets. Hiking and photography enthusiast.', 'China',
   '["Mandarin","English"]'::jsonb, '["Business","Photography","Nature","Travel"]'::jsonb, 'Weekend mornings', now() - interval '50 minutes', now() - interval '18 days'),

  ('carlos.mendoza@example.com', 'Carlos Mendoza', :'member_hash', 'member', 'active', true, false,
   'Mexico City architect. Learning English and Swahili. Passionate about sustainable design and African architecture.', 'Mexico',
   '["Spanish","English"]'::jsonb, '["Art","Culture","Travel","History"]'::jsonb, 'Weekday evenings', now() - interval '5 minutes', now() - interval '37 days'),

  ('fatou.camara@example.com', 'Fatou Camara', :'member_hash', 'member', 'active', true, true,
   'Bamako teacher and community organizer. French and Bambara speaker, learning English to access global education resources.', 'Mali',
   '["French","English"]'::jsonb, '["Education","Volunteering","Culture","Languages"]'::jsonb, 'Weekend mornings', now() - interval '7 minutes', now() - interval '80 days'),

  ('ryan.oconnor@example.com', 'Ryan O''Connor', :'member_hash', 'member', 'active', true, false,
   'Dublin-based nurse. Traveled across Africa and fell in love with Swahili. Looking for conversation partners to keep improving.', 'Ireland',
   '["English"]'::jsonb, '["Travel","Culture","Volunteering","Nature"]'::jsonb, 'Weekend afternoons', now() - interval '4 hours', now() - interval '25 days'),

  ('nadia.benali@example.com', 'Nadia Benali', :'member_hash', 'member', 'active', true, true,
   'Casablanca marketing manager. Arabic, French and English speaker. Interested in East African business and Swahili culture.', 'Morocco',
   '["Arabic","French","English"]'::jsonb, '["Business","Fashion","Culture","Food"]'::jsonb, 'Weekday mornings', now() - interval '12 minutes', now() - interval '62 days'),

  ('sven.lindqvist@example.com', 'Sven Lindqvist', :'member_hash', 'member', 'active', true, false,
   'Stockholm environmental consultant. Learning Swahili for conservation work in Tanzania. Passionate about wildlife and sustainability.', 'Sweden',
   '["Swedish","English"]'::jsonb, '["Nature","Science","Travel","Volunteering"]'::jsonb, 'Weekday afternoons', now() - interval '2 hours', now() - interval '31 days'),

  ('blessing.okafor@example.com', 'Blessing Okafor', :'member_hash', 'member', 'active', true, true,
   'Lagos fintech founder. English and Yoruba speaker, learning French and Swahili to grow across Africa.', 'Nigeria',
   '["English","Yoruba","French"]'::jsonb, '["Business","Technology","Finance","Culture"]'::jsonb, 'Weekday evenings', now() - interval '18 minutes', now() - interval '58 days'),

  ('ana.silva@example.com', 'Ana Silva', :'member_hash', 'member', 'active', true, false,
   'São Paulo journalist and travel blogger. Portuguese and English speaker, learning Swahili for an East Africa series.', 'Brazil',
   '["Portuguese","English","Spanish"]'::jsonb, '["Travel","Reading","Photography","Culture"]'::jsonb, 'Weekend evenings', now() - interval '40 minutes', now() - interval '20 days'),

  ('tariq.al.rashid@example.com', 'Tariq Al-Rashid', :'member_hash', 'member', 'active', true, false,
   'Riyadh-based civil engineer. Arabic and English speaker, curious about Swahili and East African culture.', 'Saudi Arabia',
   '["Arabic","English"]'::jsonb, '["History","Culture","Sports","Technology"]'::jsonb, 'Weekday mornings', now() - interval '3 hours', now() - interval '15 days'),

  ('ingrid.hansen@example.com', 'Ingrid Hansen', :'member_hash', 'member', 'active', true, true,
   'Bergen-based marine biologist. Learning Swahili for a research project in Zanzibar. Loves ocean, hiking and Nordic food.', 'Norway',
   '["Norwegian","English"]'::jsonb, '["Science","Nature","Travel","Food"]'::jsonb, 'Weekend mornings', now() - interval '25 minutes', now() - interval '42 days'),

  ('kofi.mensah@example.com', 'Kofi Mensah', :'member_hash', 'member', 'active', true, true,
   'Accra-based doctor. English speaker learning French and Swahili. Passionate about pan-African healthcare and football.', 'Ghana',
   '["English","French"]'::jsonb, '["Education","Sports","Science","Volunteering"]'::jsonb, 'Weekday evenings', now() - interval '11 minutes', now() - interval '77 days'),

  ('hana.kim@example.com', 'Hana Kim', :'member_hash', 'member', 'active', true, false,
   'Seoul-based K-pop dance instructor. Learning English and curious about African dance styles. Very energetic and fun!', 'South Korea',
   '["Korean","English"]'::jsonb, '["Dance","Music","Fitness","Culture"]'::jsonb, 'Weekend afternoons', now() - interval '16 minutes', now() - interval '24 days'),

  ('ibrahim.traore@example.com', 'Ibrahim Traoré', :'member_hash', 'member', 'active', true, false,
   'Ouagadougou filmmaker documenting West African stories. French speaker improving English for international film festivals.', 'Burkina Faso',
   '["French","English"]'::jsonb, '["Art","Culture","History","Travel"]'::jsonb, 'Weekend evenings', now() - interval '1 hour', now() - interval '35 days'),

  ('sophie.martin@example.com', 'Sophie Martin', :'member_hash', 'member', 'active', true, true,
   'Lyon-based nurse volunteering in Uganda. French and English speaker, learning Swahili to better connect with patients.', 'France',
   '["French","English"]'::jsonb, '["Volunteering","Education","Culture","Nature"]'::jsonb, 'Weekday mornings', now() - interval '5 minutes', now() - interval '48 days'),

  ('emeka.nwosu@example.com', 'Emeka Nwosu', :'member_hash', 'member', 'active', true, true,
   'Abuja policy analyst. English and Igbo speaker, learning French and Swahili for AU summits. Loves chess and debate.', 'Nigeria',
   '["English","Igbo","French"]'::jsonb, '["Education","History","Business","Culture"]'::jsonb, 'Weekday afternoons', now() - interval '22 minutes', now() - interval '83 days'),

  ('lena.schmidt@example.com', 'Lena Schmidt', :'member_hash', 'member', 'active', true, false,
   'Hamburg fashion student. Learning English and Swahili. Obsessed with African textiles and sustainable fashion.', 'Germany',
   '["German","English"]'::jsonb, '["Fashion","Art","Culture","Travel"]'::jsonb, 'Weekend evenings', now() - interval '55 minutes', now() - interval '19 days'),

  ('ali.hassan@example.com', 'Ali Hassan', :'member_hash', 'member', 'active', true, false,
   'Mogadishu-based teacher rebuilding education in Somalia. Somali, Arabic and English speaker, eager to connect globally.', 'Somalia',
   '["Arabic","English"]'::jsonb, '["Education","Volunteering","Culture","Languages"]'::jsonb, 'Weekday mornings', now() - interval '6 hours', now() - interval '90 days'),

  ('camille.dubois@example.com', 'Camille Dubois', :'member_hash', 'member', 'active', true, true,
   'Montreal-based UX designer. French and English speaker, learning Swahili after a life-changing trip to Kenya.', 'Canada',
   '["French","English"]'::jsonb, '["Art","Technology","Travel","Culture"]'::jsonb, 'Weekday evenings', now() - interval '8 minutes', now() - interval '52 days'),

  ('rafael.santos@example.com', 'Rafael Santos', :'member_hash', 'member', 'active', true, false,
   'Rio de Janeiro football coach. Portuguese and Spanish speaker, learning English and Swahili. Loves music and beach life.', 'Brazil',
   '["Portuguese","Spanish","English"]'::jsonb, '["Sports","Music","Dance","Travel"]'::jsonb, 'Weekend afternoons', now() - interval '35 minutes', now() - interval '27 days'),

  ('zara.ahmed@example.com', 'Zara Ahmed', :'member_hash', 'member', 'active', true, true,
   'Nairobi-based lawyer and women''s rights advocate. Swahili and English speaker, connecting with global activists.', 'Kenya',
   '["Swahili","English"]'::jsonb, '["Education","Volunteering","Culture","Reading"]'::jsonb, 'Weekday afternoons', now() - interval '14 minutes', now() - interval '68 days'),

  ('takeshi.yamamoto@example.com', 'Takeshi Yamamoto', :'member_hash', 'member', 'active', true, false,
   'Osaka-based chef specializing in fusion cuisine. Learning English and Swahili to collaborate with African chefs.', 'Japan',
   '["Japanese","English"]'::jsonb, '["Cooking","Food","Culture","Travel"]'::jsonb, 'Weekend mornings', now() - interval '2 hours', now() - interval '16 days'),

  ('miriam.osei@example.com', 'Miriam Osei', :'member_hash', 'member', 'active', true, true,
   'Kumasi-based nurse and community health worker. English speaker learning French and Swahili to serve more communities.', 'Ghana',
   '["English","French"]'::jsonb, '["Education","Volunteering","Science","Culture"]'::jsonb, 'Weekday mornings', now() - interval '19 minutes', now() - interval '73 days')

ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------- Payments ----
INSERT INTO payments (user_id, amount, currency, method, reference, note, status, created_at)
SELECT id, 90, 'KES', 'mpesa_paybill', 'QK7H2XYZ91', 'Paid via Safaricom line ending 0712', 'pending', now() - interval '2 hours'
FROM users WHERE email = 'grace.wanjiku@example.com' ON CONFLICT DO NOTHING;

INSERT INTO payments (user_id, amount, currency, method, reference, note, status, created_at)
SELECT id, 90, 'KES', 'mpesa_paybill', 'TL3M8BNA52', NULL, 'pending', now() - interval '45 minutes'
FROM users WHERE email = 'peter.kimani@example.com' ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------- Reviews ----
INSERT INTO reviews (author_id, target_id, rating, comment, created_at)
SELECT a.id, b.id, r.rating, r.comment, r.created_at
FROM (VALUES
  ('sarah.thompson@example.com',  'amina.juma@example.com',     5, 'Amina is the Swahili teacher everyone dreams of — patient, funny and so encouraging.', now() - interval '12 days'),
  ('james.wilson@example.com',    'amina.juma@example.com',     5, 'Great energy. We talked for an hour and it felt like ten minutes.', now() - interval '9 days'),
  ('sofia.martinez@example.com',  'amina.juma@example.com',     4, 'Very friendly and well prepared. Time zones are tricky but worth it!', now() - interval '6 days'),
  ('david.omondi@example.com',    'neema.mwangi@example.com',   5, 'Neema makes practicing feel like hanging out with a friend.', now() - interval '8 days'),
  ('sarah.thompson@example.com',  'neema.mwangi@example.com',   5, 'Wonderful cultural exchange — she even taught me a taarab song.', now() - interval '5 days'),
  ('amina.juma@example.com',      'david.omondi@example.com',   4, 'Sharp and curious. Our tech-in-Africa conversations are always a highlight.', now() - interval '4 days'),
  ('james.wilson@example.com',    'chen.wei@example.com',       5, 'Chen explains complex ideas clearly — perfect practice partner.', now() - interval '2 days'),
  ('lucas.dupont@example.com',    'amina.juma@example.com',     5, 'Amina helped me understand Swahili greetings in one session. Incredible teacher!', now() - interval '7 days'),
  ('yuki.tanaka@example.com',     'neema.mwangi@example.com',   5, 'Neema is so warm and patient. I learned so much about Tanzanian culture.', now() - interval '3 days'),
  ('priya.sharma@example.com',    'fatima.hassan@example.com',  5, 'Fatima is brilliant — her knowledge of history made our chat unforgettable.', now() - interval '10 days'),
  ('omar.sheikh@example.com',     'amara.diop@example.com',     4, 'Amara is a great conversationalist. His music knowledge is amazing.', now() - interval '5 days'),
  ('aisha.diallo@example.com',    'zara.ahmed@example.com',     5, 'Zara is inspiring. We talked about women in law across Africa for two hours!', now() - interval '4 days'),
  ('camille.dubois@example.com',  'amina.juma@example.com',     5, 'Best Swahili session I have had. Amina is a natural teacher.', now() - interval '6 days'),
  ('ryan.oconnor@example.com',    'neema.mwangi@example.com',   5, 'Neema is fantastic. She remembered details from our last chat — very thoughtful.', now() - interval '2 days'),
  ('nadia.benali@example.com',    'kwame.asante@example.com',   4, 'Kwame has great business insights. Our conversation about agri-tech was eye-opening.', now() - interval '3 days'),
  ('blessing.okafor@example.com', 'emeka.nwosu@example.com',    5, 'Emeka is sharp and articulate. Loved our debate on African policy.', now() - interval '1 day'),
  ('sophie.martin@example.com',   'amina.juma@example.com',     5, 'Amina is so encouraging. My Swahili improved noticeably after just two sessions.', now() - interval '8 days'),
  ('kofi.mensah@example.com',     'fatima.hassan@example.com',  4, 'Fatima knows so much about Egyptian history. Fascinating conversation.', now() - interval '6 days'),
  ('ingrid.hansen@example.com',   'david.omondi@example.com',   5, 'David gave me great tips on tech in East Africa. Very knowledgeable.', now() - interval '4 days'),
  ('hana.kim@example.com',        'neema.mwangi@example.com',   5, 'Neema and I talked about dance for hours. She is so passionate and fun!', now() - interval '2 days')
) AS r(author_email, target_email, rating, comment, created_at)
JOIN users a ON a.email = r.author_email
JOIN users b ON b.email = r.target_email
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------- Bookings ----
INSERT INTO bookings (requester_id, host_id, topic, note, scheduled_at, duration_min, status, responded_at, created_at)
SELECT s.id, a.id, 'Swahili conversation — market vocabulary', 'Looking forward to it! I prepared a word list.', now() + interval '2 days', 45, 'accepted', now() - interval '1 day', now() - interval '1 day'
FROM users s, users a WHERE s.email = 'sarah.thompson@example.com' AND a.email = 'amina.juma@example.com' ON CONFLICT DO NOTHING;

INSERT INTO bookings (requester_id, host_id, topic, note, scheduled_at, duration_min, status, created_at)
SELECT j.id, n.id, 'English small talk practice', NULL, now() + interval '3 days', 30, 'pending', now() - interval '3 hours'
FROM users j, users n WHERE j.email = 'james.wilson@example.com' AND n.email = 'neema.mwangi@example.com' ON CONFLICT DO NOTHING;

INSERT INTO bookings (requester_id, host_id, topic, note, scheduled_at, duration_min, status, responded_at, created_at)
SELECT r.id, a.id, 'French conversation for beginners', 'I know basic greetings, want to improve.', now() + interval '4 days', 45, 'accepted', now() - interval '2 hours', now() - interval '2 hours'
FROM users r, users a WHERE r.email = 'ryan.oconnor@example.com' AND a.email = 'aisha.diallo@example.com' ON CONFLICT DO NOTHING;

INSERT INTO bookings (requester_id, host_id, topic, note, scheduled_at, duration_min, status, created_at)
SELECT p.id, f.id, 'Arabic culture and language intro', NULL, now() + interval '5 days', 60, 'pending', now() - interval '1 hour'
FROM users p, users f WHERE p.email = 'priya.sharma@example.com' AND f.email = 'fatima.hassan@example.com' ON CONFLICT DO NOTHING;

INSERT INTO bookings (requester_id, host_id, topic, note, scheduled_at, duration_min, status, responded_at, created_at)
SELECT c.id, a.id, 'Swahili basics for a Kenya trip', 'Visiting Nairobi next month, want survival phrases.', now() + interval '1 day', 30, 'accepted', now() - interval '5 hours', now() - interval '6 hours'
FROM users c, users a WHERE c.email = 'camille.dubois@example.com' AND a.email = 'amina.juma@example.com' ON CONFLICT DO NOTHING;

-- ----------------------------------------- Conversations + messages --------

-- Conv 1: Amina <-> Sarah (existing)
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at) VALUES (false, now() - interval '18 minutes') RETURNING id
), amina AS (SELECT id FROM users WHERE email = 'amina.juma@example.com'),
sarah AS (SELECT id FROM users WHERE email = 'sarah.thompson@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, CASE WHEN x.r = 'sarah' THEN NULL ELSE now() - interval '15 minutes' END
  FROM conv, (SELECT id AS uid, 'amina' AS r FROM amina UNION ALL SELECT id, 'sarah' FROM sarah) x
  RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.sender, 'text', m.content, m.ts FROM parts,
(VALUES
  ((SELECT id FROM sarah), 'Habari Amina! Ready for our Swahili practice this week?', now() - interval '1 day'),
  ((SELECT id FROM amina), 'Habari Sarah! Nzuri sana. Did you review the greetings I sent?', now() - interval '23 hours'),
  ((SELECT id FROM sarah), 'Yes! Habari yako, habari za kazi, habari za nyumbani…', now() - interval '22 hours'),
  ((SELECT id FROM amina), 'Perfect! You are learning so fast. Hongera!', now() - interval '21 hours'),
  ((SELECT id FROM sarah), 'Asante! Can we do a video call this weekend to practice speaking?', now() - interval '30 minutes'),
  ((SELECT id FROM amina), 'Absolutely, Saturday morning works for me. Karibu sana!', now() - interval '18 minutes')
) AS m(sender, content, ts) ORDER BY m.ts ON CONFLICT DO NOTHING;

-- Conv 2: Lucas <-> Amina
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at) VALUES (false, now() - interval '1 hour') RETURNING id
), u1 AS (SELECT id FROM users WHERE email = 'lucas.dupont@example.com'),
u2 AS (SELECT id FROM users WHERE email = 'amina.juma@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, now() - interval '55 minutes' FROM conv,
  (SELECT id AS uid FROM u1 UNION ALL SELECT id FROM u2) x RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.s, 'text', m.c, m.t FROM parts,
(VALUES
  ((SELECT id FROM u1), 'Bonjour Amina! I am Lucas from Paris. I want to learn Swahili — can you help?', now() - interval '3 hours'),
  ((SELECT id FROM u2), 'Karibu Lucas! Of course. Let us start with greetings. Say: Habari yako?', now() - interval '2 hours 50 minutes'),
  ((SELECT id FROM u1), 'Habari yako! Did I say it right?', now() - interval '2 hours 40 minutes'),
  ((SELECT id FROM u2), 'Perfect! It means "How are you?" The reply is "Nzuri" — I am fine.', now() - interval '2 hours 30 minutes'),
  ((SELECT id FROM u1), 'Nzuri! This is so fun. Can we book a proper session this week?', now() - interval '1 hour 10 minutes'),
  ((SELECT id FROM u2), 'Absolutely! Check my profile for availability. Tutaonana!', now() - interval '1 hour')
) AS m(s, c, t) ORDER BY m.t ON CONFLICT DO NOTHING;

-- Conv 3: Yuki <-> Neema
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at) VALUES (false, now() - interval '2 hours') RETURNING id
), u1 AS (SELECT id FROM users WHERE email = 'yuki.tanaka@example.com'),
u2 AS (SELECT id FROM users WHERE email = 'neema.mwangi@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, now() - interval '1 hour 50 minutes' FROM conv,
  (SELECT id AS uid FROM u1 UNION ALL SELECT id FROM u2) x RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.s, 'text', m.c, m.t FROM parts,
(VALUES
  ((SELECT id FROM u1), 'Hello Neema! I am Yuki from Tokyo. I love African dance — can we talk about it?', now() - interval '5 hours'),
  ((SELECT id FROM u2), 'Hello Yuki! Yes! I teach traditional Tanzanian dance. What styles interest you?', now() - interval '4 hours 45 minutes'),
  ((SELECT id FROM u1), 'I saw a video of Chakacha dance and it was amazing! Is it hard to learn?', now() - interval '4 hours 30 minutes'),
  ((SELECT id FROM u2), 'Chakacha is beautiful! It takes practice but the rhythm is very natural. I can teach you basics over video call!', now() - interval '4 hours'),
  ((SELECT id FROM u1), 'That would be a dream! I will book a session with you this weekend.', now() - interval '2 hours 30 minutes'),
  ((SELECT id FROM u2), 'Wonderful! I will prepare some music for you. See you soon!', now() - interval '2 hours')
) AS m(s, c, t) ORDER BY m.t ON CONFLICT DO NOTHING;

-- Conv 4: Priya <-> Fatima
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at) VALUES (false, now() - interval '3 hours') RETURNING id
), u1 AS (SELECT id FROM users WHERE email = 'priya.sharma@example.com'),
u2 AS (SELECT id FROM users WHERE email = 'fatima.hassan@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, now() - interval '2 hours 50 minutes' FROM conv,
  (SELECT id AS uid FROM u1 UNION ALL SELECT id FROM u2) x RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.s, 'text', m.c, m.t FROM parts,
(VALUES
  ((SELECT id FROM u1), 'Hi Fatima! I am a journalist from Mumbai writing about ancient trade routes. Can we chat?', now() - interval '6 hours'),
  ((SELECT id FROM u2), 'Hello Priya! Of course — the Silk Road and Indian Ocean trade are my favorite topics!', now() - interval '5 hours 50 minutes'),
  ((SELECT id FROM u1), 'Amazing! How did Egypt connect with East Africa historically?', now() - interval '5 hours 30 minutes'),
  ((SELECT id FROM u2), 'Through the Red Sea and Swahili Coast. Merchants traded gold, ivory and spices for centuries.', now() - interval '5 hours'),
  ((SELECT id FROM u1), 'This is gold for my article! Can I quote you? And can we do a longer call?', now() - interval '3 hours 30 minutes'),
  ((SELECT id FROM u2), 'Of course! I would love that. Book a session and we can go deep into the history.', now() - interval '3 hours')
) AS m(s, c, t) ORDER BY m.t ON CONFLICT DO NOTHING;

-- Conv 5: Hana <-> Neema
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at) VALUES (false, now() - interval '30 minutes') RETURNING id
), u1 AS (SELECT id FROM users WHERE email = 'hana.kim@example.com'),
u2 AS (SELECT id FROM users WHERE email = 'neema.mwangi@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, now() - interval '25 minutes' FROM conv,
  (SELECT id AS uid FROM u1 UNION ALL SELECT id FROM u2) x RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.s, 'text', m.c, m.t FROM parts,
(VALUES
  ((SELECT id FROM u1), 'Annyeong! I am Hana from Seoul. I teach K-pop dance and I am obsessed with African dance!', now() - interval '2 hours'),
  ((SELECT id FROM u2), 'Hello Hana! That is so cool! K-pop dance is huge here too. What African styles do you know?', now() - interval '1 hour 50 minutes'),
  ((SELECT id FROM u1), 'I know a little Afrobeats but I want to learn proper East African styles. Can you teach me?', now() - interval '1 hour 30 minutes'),
  ((SELECT id FROM u2), 'Yes! And you can teach me some K-pop moves — deal?', now() - interval '1 hour'),
  ((SELECT id FROM u1), 'Deal!! This is the best exchange ever 😄', now() - interval '45 minutes'),
  ((SELECT id FROM u2), 'Haha agreed! Let us book a video call this weekend!', now() - interval '30 minutes')
) AS m(s, c, t) ORDER BY m.t ON CONFLICT DO NOTHING;

-- Conv 6: Blessing <-> Emeka
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at) VALUES (false, now() - interval '4 hours') RETURNING id
), u1 AS (SELECT id FROM users WHERE email = 'blessing.okafor@example.com'),
u2 AS (SELECT id FROM users WHERE email = 'emeka.nwosu@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, now() - interval '3 hours 50 minutes' FROM conv,
  (SELECT id AS uid FROM u1 UNION ALL SELECT id FROM u2) x RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.s, 'text', m.c, m.t FROM parts,
(VALUES
  ((SELECT id FROM u1), 'Emeka! Fellow Nigerian here. I am building a fintech startup — would love your policy perspective.', now() - interval '8 hours'),
  ((SELECT id FROM u2), 'Blessing! Great to connect. What regulatory challenges are you facing?', now() - interval '7 hours 45 minutes'),
  ((SELECT id FROM u1), 'CBN regulations on cross-border payments are the biggest hurdle. Any insights?', now() - interval '7 hours 30 minutes'),
  ((SELECT id FROM u2), 'I have worked on that exact policy area. The new framework coming in Q3 should help significantly.', now() - interval '7 hours'),
  ((SELECT id FROM u1), 'This is exactly what I needed. Can we do a proper call this week?', now() - interval '4 hours 30 minutes'),
  ((SELECT id FROM u2), 'Absolutely. Book a session — I will share some documents too.', now() - interval '4 hours')
) AS m(s, c, t) ORDER BY m.t ON CONFLICT DO NOTHING;

-- Conv 7: Sven <-> David
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at) VALUES (false, now() - interval '5 hours') RETURNING id
), u1 AS (SELECT id FROM users WHERE email = 'sven.lindqvist@example.com'),
u2 AS (SELECT id FROM users WHERE email = 'david.omondi@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, now() - interval '4 hours 50 minutes' FROM conv,
  (SELECT id AS uid FROM u1 UNION ALL SELECT id FROM u2) x RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.s, 'text', m.c, m.t FROM parts,
(VALUES
  ((SELECT id FROM u1), 'Hi David! I am Sven from Sweden, working on conservation tech in Tanzania. Any Swahili tips?', now() - interval '10 hours'),
  ((SELECT id FROM u2), 'Karibu Sven! Happy to help. What kind of work are you doing in Tanzania?', now() - interval '9 hours 45 minutes'),
  ((SELECT id FROM u1), 'Marine conservation — tracking coral reef health near Zanzibar. We need local community engagement.', now() - interval '9 hours 30 minutes'),
  ((SELECT id FROM u2), 'That is amazing work. Learning basic Swahili will make a huge difference with communities there.', now() - interval '9 hours'),
  ((SELECT id FROM u1), 'Exactly. Can you teach me some key phrases for community meetings?', now() - interval '5 hours 30 minutes'),
  ((SELECT id FROM u2), 'Of course! Let us start: "Habari za kazi?" means "How is work?" — very useful opener.', now() - interval '5 hours')
) AS m(s, c, t) ORDER BY m.t ON CONFLICT DO NOTHING;

-- Conv 8: Camille <-> Amina
WITH conv AS (
  INSERT INTO conversations (is_group, last_message_at) VALUES (false, now() - interval '20 minutes') RETURNING id
), u1 AS (SELECT id FROM users WHERE email = 'camille.dubois@example.com'),
u2 AS (SELECT id FROM users WHERE email = 'amina.juma@example.com'),
parts AS (
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  SELECT conv.id, x.uid, now() - interval '15 minutes' FROM conv,
  (SELECT id AS uid FROM u1 UNION ALL SELECT id FROM u2) x RETURNING conversation_id
)
INSERT INTO messages (conversation_id, sender_id, kind, content, created_at)
SELECT parts.conversation_id, m.s, 'text', m.c, m.t FROM parts,
(VALUES
  ((SELECT id FROM u1), 'Amina! I just booked a trip to Nairobi next month. So excited and a little nervous!', now() - interval '2 hours'),
  ((SELECT id FROM u2), 'Camille! Nairobi will blow your mind. What are you most excited about?', now() - interval '1 hour 50 minutes'),
  ((SELECT id FROM u1), 'The food markets and the Maasai Market! And obviously practicing my Swahili with real people.', now() - interval '1 hour 30 minutes'),
  ((SELECT id FROM u2), 'You will love it. Your Swahili is already good enough to get around. I am so proud of your progress!', now() - interval '1 hour'),
  ((SELECT id FROM u1), 'All thanks to you! Can we do one more session before I fly?', now() - interval '35 minutes'),
  ((SELECT id FROM u2), 'Of course! I will teach you market bargaining phrases — very important! 😄', now() - interval '20 minutes')
) AS m(s, c, t) ORDER BY m.t ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------- FAQs ----
INSERT INTO faqs (question, answer, sort_order, published) VALUES
  ('Is Global Connect free to join?', 'Yes. Creating an account, building your profile and browsing members is completely free. A one-time KSh 90 activation unlocks messaging, calls and bookings forever.', 1, true),
  ('How does the activation payment work?', 'Send KSh 90 via M-Pesa Paybill 542542, account number 01609490286150. Submit your confirmation code on the Activation page and an admin will verify it — usually within a few hours.', 2, true),
  ('Which languages can I practice?', 'The community focuses on English and Swahili, but members speak dozens of languages including French, Arabic, Spanish, Mandarin, Hindi, Japanese and more. Use the search filters to find partners by language.', 3, true),
  ('Are voice and video calls safe?', 'Calls happen peer-to-peer in your browser via WebRTC and are never recorded by us. Combined with verified badges, reports and blocking, you stay in control.', 4, true),
  ('How do bookings work?', 'Open any member profile, pick Book session, propose a time and topic, and they will accept or decline. Your schedule appears in the Bookings calendar.', 5, true),
  ('What if someone behaves badly?', 'Use the Report button on their profile. Our moderation team reviews every report and can suspend or ban accounts that break the community rules.', 6, true)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------- Announcements ----
INSERT INTO announcements (title, body, published, created_at) VALUES
  ('Welcome to Global Connect', 'Karibu! We are so glad you are here. Complete your profile, activate your account, and start your first conversation today.', true, now() - interval '14 days'),
  ('Weekend Swahili Conversation Club', 'Every Saturday our most active Swahili speakers host open practice sessions. Book early — spots fill fast!', true, now() - interval '3 days'),
  ('New members from 20+ countries this week!', 'Global Connect is growing fast. We now have active members from Japan, France, Brazil, Norway, South Korea, Canada and many more. Find your perfect language partner today.', true, now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------- Notifications -------
INSERT INTO notifications (user_id, type, title, body, link, created_at)
SELECT id, 'payment', 'New activation payment to verify', 'Grace Wanjiku submitted M-Pesa reference QK7H2XYZ91.', '/admin?tab=payments', now() - interval '2 hours'
FROM users WHERE email = 'admin@globalconnect.app' ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, type, title, body, link, created_at)
SELECT id, 'payment', 'New activation payment to verify', 'Peter Kimani submitted M-Pesa reference TL3M8BNA52.', '/admin?tab=payments', now() - interval '45 minutes'
FROM users WHERE email = 'admin@globalconnect.app' ON CONFLICT DO NOTHING;

COMMIT;
