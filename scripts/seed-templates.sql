-- Insert global SMS templates for all industries

-- Restaurant templates
INSERT INTO sms_templates (name, message, category, is_global, industry) VALUES
(
  'Restaurant - Bokningspåminnelse',
  'Hej {{name}}! 👋

Din bokning hos oss är imorgon kl {{time}}. Vi ser fram emot ditt besök! 🍽️

{{restaurant_name}}
Svara STOP för att avsluta påminnelser.',
  'reminder',
  true,
  'restaurant'
),
(
  'Restaurant - Bokningsbekräftelse',
  'Tack för din bokning hos {{restaurant_name}}! 🎉

📅 Datum: {{date}}
⏰ Tid: {{time}}
👥 Personer: {{guests}}

Vi ser fram emot att ta emot er! 🍽️',
  'confirmation',
  true,
  'restaurant'
),
(
  'Restaurant - Tack för besöket',
  'Tack för att ni besökte oss på {{restaurant_name}}! 🙏

Vi hoppas ni hade en fantastisk upplevelse. Välkommen tillbaka snart! ⭐

Boka bord: {{phone}}',
  'thank_you',
  true,
  'restaurant'
),
(
  'Restaurant - Veckoslutserbjudande',
  '🎉 Specialerbjudande denna helg!

{{offer_details}}

Boka bord nu: {{phone}}
Gäller t.o.m {{valid_until}}

{{restaurant_name}}
Svara STOP för att avregistrera dig.',
  'marketing',
  true,
  'restaurant'
);

-- Salon templates
INSERT INTO sms_templates (name, message, category, is_global, industry) VALUES
(
  'Salong - Tidspåminnelse',
  'Hej {{name}}! 💇

Påminnelse om din tid imorgon kl {{time}} hos {{salon_name}}.

Ser fram emot att träffa dig! ✨
Svara STOP för att avsluta.',
  'reminder',
  true,
  'salon'
),
(
  'Salong - Tidsbekräftelse',
  'Din tid är bokad! 🎉

📅 {{date}}
⏰ {{time}}
💇 {{service}}

{{salon_name}}
{{address}}

Vi ses snart! ✨',
  'confirmation',
  true,
  'salon'
),
(
  'Salong - Tack för besöket',
  'Tack för ditt besök hos {{salon_name}}! 💖

Hoppas du är nöjd med resultatet! 

Boka nästa tid: {{phone}}
Vi ses snart igen! 💇✨',
  'thank_you',
  true,
  'salon'
),
(
  'Salong - Månadens erbjudande',
  '✨ Specialerbjudande denna månad!

{{offer_details}}

Boka nu: {{phone}}
Gäller t.o.m {{valid_until}}

{{salon_name}}
Svara STOP för att avregistrera dig.',
  'marketing',
  true,
  'salon'
);

-- Workshop templates
INSERT INTO sms_templates (name, message, category, is_global, industry) VALUES
(
  'Verkstad - Bil Klar',
  'Hej {{name}}! 🔧

Din {{car_brand}} är klar och redo för upphämtning!

⏰ Öppettider: {{opening_hours}}
📍 {{workshop_name}}
📞 {{phone}}

Välkommen! 🚗',
  'confirmation',
  true,
  'workshop'
),
(
  'Verkstad - Servicepåminnelse',
  'Hej {{name}}! 🚗

Din {{car_brand}} är dags för service snart.

Boka tid hos oss:
📞 {{phone}}
⏰ {{opening_hours}}

{{workshop_name}} 🔧',
  'reminder',
  true,
  'workshop'
),
(
  'Verkstad - Orderbekräftelse',
  'Order mottagen! ✅

Arbete: {{service_type}}
Bil: {{car_brand}}
Estimerad klar: {{estimated_date}}

Vi kontaktar dig när bilen är klar.

{{workshop_name}}
{{phone}} 🔧',
  'confirmation',
  true,
  'workshop'
),
(
  'Verkstad - Kampanj',
  '🔧 Servicekampanj!

{{offer_details}}

Boka tid: {{phone}}
Gäller t.o.m {{valid_until}}

{{workshop_name}}
Svara STOP för att avregistrera dig.',
  'marketing',
  true,
  'workshop'
);

-- B2B templates
INSERT INTO sms_templates (name, message, category, is_global, industry) VALUES
(
  'B2B - Order Redo',
  'Hej!

Din beställning (Order #{{order_id}}) är klar för upphämtning.

📍 {{company_name}}
⏰ {{opening_hours}}
📞 {{phone}}

Välkommen! 📦',
  'confirmation',
  true,
  'b2b'
),
(
  'B2B - Leveransbekräftelse',
  'Leverans bekräftad! ✅

Order #{{order_id}}
Leveransdatum: {{delivery_date}}
Plats: {{delivery_address}}

{{company_name}}
Frågor? Ring {{phone}} 📦',
  'confirmation',
  true,
  'b2b'
),
(
  'B2B - Betalningspåminnelse',
  'Påminnelse om betalning

Faktura: {{invoice_number}}
Belopp: {{amount}} SEK
Förfallodatum: {{due_date}}

Betala här: {{payment_link}}

{{company_name}}
{{phone}}',
  'reminder',
  true,
  'b2b'
),
(
  'B2B - Specialerbjudande',
  '🎯 Exklusivt erbjudande!

{{offer_details}}

Gäller till: {{valid_until}}

{{company_name}}
Kontakta oss: {{phone}}
Svara STOP för att avregistrera dig.',
  'marketing',
  true,
  'b2b'
);
