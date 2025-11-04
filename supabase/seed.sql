-- Seed global SMS templates

-- Restaurant templates
INSERT INTO sms_templates (name, message, category, is_global, industry) VALUES
(
  'Restaurant - Booking Reminder',
  'Hej {{name}}! 👋 Påminnelse om din bokning imorgon kl {{time}} på {{restaurant_name}}. Vi ses! 🍽️

Svara STOP för att avsluta påminnelser.',
  'reminder',
  true,
  'restaurant'
),
(
  'Restaurant - Booking Confirmation',
  'Tack för din bokning hos {{restaurant_name}}! 🎉

📅 Datum: {{date}}
⏰ Tid: {{time}}
👥 Personer: {{guests}}

Vi ser fram emot ditt besök! 🍽️',
  'confirmation',
  true,
  'restaurant'
),
(
  'Restaurant - Thank You',
  'Tack för ditt besök hos oss på {{restaurant_name}}! 🙏

Vi hoppas du hade en trevlig upplevelse. Välkommen åter! ⭐',
  'thank_you',
  true,
  'restaurant'
);

-- Salon templates
INSERT INTO sms_templates (name, message, category, is_global, industry) VALUES
(
  'Salon - Appointment Reminder',
  'Hej {{name}}! 💇

Påminnelse om din tid imorgon kl {{time}} hos {{salon_name}}.

Se dig snart! ✨

Svara STOP för att avsluta.',
  'reminder',
  true,
  'salon'
),
(
  'Salon - Appointment Confirmation',
  'Din tid är bokad! 🎉

📅 {{date}}
⏰ {{time}}
💇 {{service}}

{{salon_name}}
Vi ser fram emot ditt besök! ✨',
  'confirmation',
  true,
  'salon'
),
(
  'Salon - Thank You',
  'Tack för ditt besök hos {{salon_name}}! 💖

Hoppas du är nöjd med resultatet! Vi ses nästa gång 💇✨',
  'thank_you',
  true,
  'salon'
);

-- Workshop templates
INSERT INTO sms_templates (name, message, category, is_global, industry) VALUES
(
  'Workshop - Car Ready',
  'Hej {{name}}! 🔧

Din {{car_brand}} är klar och redo för upphämtning!

⏰ Öppet: {{opening_hours}}
📍 {{workshop_name}}

Välkommen! 🚗',
  'confirmation',
  true,
  'workshop'
),
(
  'Workshop - Service Reminder',
  'Hej {{name}}! 🚗

Din {{car_brand}} är dags för service snart.

Ring oss på {{phone}} för att boka tid.

{{workshop_name}} 🔧',
  'reminder',
  true,
  'workshop'
);

-- B2B templates
INSERT INTO sms_templates (name, message, category, is_global, industry) VALUES
(
  'B2B - Order Ready',
  'Hej!

Din beställning (Order #{{order_id}}) är klar för upphämtning.

📍 {{company_name}}
⏰ {{opening_hours}}

Välkommen! 📦',
  'confirmation',
  true,
  'b2b'
),
(
  'B2B - Special Offer',
  'Special erbjudande för dig! 🎯

{{offer_details}}

Gäller till: {{valid_until}}

{{company_name}}
Kontakta oss: {{phone}}',
  'marketing',
  true,
  'b2b'
);
