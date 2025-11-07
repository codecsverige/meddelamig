-- Restaurant-specific SMS Templates
-- These are pre-made templates that restaurants can use immediately
-- No typing needed - just select and send!

-- Clear existing templates (optional)
DELETE FROM sms_templates WHERE is_global = true AND industry = 'restaurant';

-- BOOKING CONFIRMATIONS (5 templates)
INSERT INTO sms_templates (name, message, category, is_global, industry, usage_count) VALUES
('Bokningsbekräftelse - Standard', 
'Hej {{name}}! Din bokning hos {{organization}} är bekräftad för {{date}} kl {{time}}. Antal personer: {{guests}}. Välkommen! /Avboka: svara AVBOKA', 
'confirmation', true, 'restaurant', 0),

('Bokningsbekräftelse - Elegant', 
'Tack för din bokning {{name}}! Vi ser fram emot ditt besök {{date}} kl {{time}}. Bord för {{guests}} personer är reserverat. Med vänliga hälsningar, {{organization}}', 
'confirmation', true, 'restaurant', 0),

('Bokningsbekräftelse - Kort', 
'✅ Bokad! {{organization}}, {{date}} kl {{time}}, {{guests}} personer. Vi ses snart {{name}}!', 
'confirmation', true, 'restaurant', 0),

('Bokningsbekräftelse - Med meny', 
'Hej {{name}}! Din bokning {{date}} kl {{time}} är klar. Har du allergier eller specialönskemål? Svara här så ordnar vi det. Välkommen till {{organization}}!', 
'confirmation', true, 'restaurant', 0),

('Bokningsbekräftelse - VIP', 
'Kära {{name}}, ditt VIP-bord är reserverat {{date}} kl {{time}}. Vi har förberett allt för en minnesstund. Hälsningar, {{organization}} 🌟', 
'confirmation', true, 'restaurant', 0);

-- REMINDERS (4 templates)
INSERT INTO sms_templates (name, message, category, is_global, industry, usage_count) VALUES
('Påminnelse - 24h innan', 
'Hej {{name}}! Påminnelse: Du har bokat bord hos {{organization}} imorgon {{date}} kl {{time}}. Ser fram emot ditt besök! Svara JA för att bekräfta.', 
'reminder', true, 'restaurant', 0),

('Påminnelse - 2h innan', 
'Hej {{name}}! Om 2 timmar ses vi på {{organization}} ({{time}}). Ditt bord är redo. Vi ses snart! 🍽️', 
'reminder', true, 'restaurant', 0),

('Påminnelse - Med bekräftelse', 
'{{name}}, din bokning hos {{organization}} är {{date}} kl {{time}}. Kommer du? Svara JA eller NEJ. Avbokning inom 2h annars debiteras 200 SEK.', 
'reminder', true, 'restaurant', 0),

('Påminnelse - Vänlig', 
'Hej {{name}} 👋 Glöm inte din bokning imorgon {{date}} kl {{time}} hos {{organization}}. Kan inte komma? Svara AVBOKA så hjälper vi dig!', 
'reminder', true, 'restaurant', 0);

-- THANK YOU MESSAGES (3 templates)
INSERT INTO sms_templates (name, message, category, is_global, industry, usage_count) VALUES
('Tack för besöket', 
'Tack för ditt besök hos {{organization}} idag {{name}}! Vi hoppas du hade en fantastisk upplevelse. Välkommen åter! 🙏', 
'thank_you', true, 'restaurant', 0),

('Tack + Review Request', 
'Tack {{name}} för besöket! Vi hoppas du trivdes hos {{organization}}. Berätta gärna hur det var: [Google Review Link]. Din feedback betyder mycket! ⭐', 
'thank_you', true, 'restaurant', 0),

('Tack + Nästa bokning', 
'Tack {{name}}! Vi älskade att ha dig hos {{organization}}. Boka nästa gång redan nu och få 10% rabatt: [Bokningslänk]', 
'thank_you', true, 'restaurant', 0);

-- MARKETING CAMPAIGNS (6 templates)
INSERT INTO sms_templates (name, message, category, is_global, industry, usage_count) VALUES
('Veckoslutserbjudande', 
'Hej {{name}}! 🎉 Detta veckoslutet: 20% på alla huvudrätter hos {{organization}}. Boka nu: [länk] eller ring {{phone}}. Gäller fre-sön!', 
'marketing', true, 'restaurant', 0),

('Sista minuten-bord', 
'SISTA MINUTEN {{name}}! Lediga bord ikväll kl 19:00 hos {{organization}}. Första att svara JA får 15% rabatt! 🍽️', 
'marketing', true, 'restaurant', 0),

('Ny meny', 
'{{name}}, ny säsongsmeny lanserad hos {{organization}}! Lokala råvaror, nya smaker. Boka din smakupplevelse: {{phone}} 🍴', 
'marketing', true, 'restaurant', 0),

('Happy Hour', 
'HAPPY HOUR hos {{organization}}! 17-19 idag: alla drycker 2-för-1. Ta med en vän {{name}}! Välkommen! 🍹', 
'marketing', true, 'restaurant', 0),

('Event-inbjudan', 
'{{name}}, du är inbjuden till vår Wine & Dine-kväll {{date}} hos {{organization}}. Begränsat antal platser. Boka: {{phone}} 🍷', 
'marketing', true, 'restaurant', 0),

('Återkommande kund', 
'Vi saknar dig {{name}}! 😊 Kom tillbaka till {{organization}} denna månad och få gratis dessert. Boka: {{phone}}', 
'marketing', true, 'restaurant', 0);

-- SPECIAL OCCASIONS (3 templates)
INSERT INTO sms_templates (name, message, category, is_global, industry, usage_count) VALUES
('Födelsedagshälsning', 
'🎂 Grattis på födelsedagen {{name}}! Fira med oss på {{organization}} - vi bjuder på desserten! Boka: {{phone}}', 
'marketing', true, 'restaurant', 0),

('Jubileum', 
'{{name}}, det är ett år sedan ditt första besök hos {{organization}}! Tack för din lojalitet. Här är 20% rabatt på nästa besök: [kod: LOYAL20]', 
'marketing', true, 'restaurant', 0),

('VIP-erbjudande', 
'Exklusivt för dig {{name}} 🌟: Förhandsbokning till vår nya meny innan alla andra. Ring {{phone}} idag!', 
'marketing', true, 'restaurant', 0);

-- Update count for global templates
UPDATE sms_templates SET usage_count = 0 WHERE is_global = true;

-- Success message
SELECT 'SUCCESS: 21 restaurant templates created!' as message;
