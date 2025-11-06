# 📱 MEDDELA - SMS Platform för Sverige

En modern SaaS SMS-plattform byggd specifikt för svenska företag (restauranger, salonger, verkstäder, B2B).

## ✨ Funktioner

### Kärna
- ✅ **Automatiska SMS-påminnelser** - Minska no-shows med 35%
- ✅ **Kontakthantering** - Smart CRM med taggar och segmentering
- ✅ **SMS-mallar** - Branschspecifika mallar redo att användas
- ✅ **Kampanjer** - Skicka bulk SMS till specifika grupper
- ✅ **Analys** - Följ leveransfrekvens och ROI i realtid

### Säkerhet & Compliance
- ✅ **GDPR-kompatibel** - Row Level Security och samtycken inbyggda
- ✅ **Opt-in/Opt-out** - Automatisk hantering av STOP-kommandon
- ✅ **Audit logs** - Fullständig spårbarhet
- ✅ **Data encryption** - Krypterad datalagring

### Integrationer
- ✅ **46elks** - Svensk SMS-gateway (0.35 SEK/SMS)
- ✅ **Stripe** - Säkra betalningar
- ✅ **Supabase** - Real-time databas
- 🔜 **BokaBord, Google Calendar, Excel import**

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **SMS**: 46elks API
- **Payments**: Stripe
- **Deployment**: Vercel

## 📦 Installation

### 1. Klona projektet

\`\`\`bash
git clone [your-repo]
cd meddela
\`\`\`

### 2. Installera dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Konfigurera miljövariabler

Kopiera \`.env.example\` till \`.env.local\`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fyll i följande variabler:

\`\`\`env
# Supabase (skapa projekt på supabase.com)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 46elks (registrera på 46elks.com)
ELKS_API_USERNAME=your_username
ELKS_API_PASSWORD=your_password
ELKS_SENDER_NAME=MEDDELA

# Stripe (skapa konto på stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
\`\`\`

> 💡 Om någon av Supabase-variablerna saknas visas nu ett tydligt felmeddelande i appen och i byggloggen.

Valfria variabler för bootstrap-skriptet:

```env
# (valfritt) Ändra standarddata som seedas av bootstrap-skriptet
BOOTSTRAP_ORG_NAME=Demo Restaurang AB
BOOTSTRAP_ORG_SLUG=demo-restaurang
BOOTSTRAP_ORG_INDUSTRY=restaurant
BOOTSTRAP_ORG_PLAN=professional
BOOTSTRAP_SMS_CREDITS=350
BOOTSTRAP_SENDER_NAME=MEDDELA
BOOTSTRAP_OWNER_EMAIL=founder@demo.se
BOOTSTRAP_OWNER_PASSWORD=Demo1234!
BOOTSTRAP_OWNER_NAME=Demo Ägare
```

### 4. Setup Supabase Database

Kör migration filen i Supabase SQL Editor:

\`\`\`bash
# Kopiera innehållet från supabase/migrations/001_initial_schema.sql
# Klistra in i Supabase Dashboard > SQL Editor > New Query
# Kör queryn
\`\`\`

Seed database med mallar (valfritt):

\`\`\`bash
# Kopiera innehållet från supabase/seed.sql
# Klistra in i Supabase SQL Editor
# Kör queryn
\`\`\`

### 5. Kör bootstrap-skriptet (seed data)

Bootstrap-skriptet fyller Supabase med en demo-organisation, tre kontakter, SMS-mallar och provdata så att dashboardsen visar riktiga siffror direkt.

```bash
npm run bootstrap:supabase
```

Standardinloggning som skapas:

- E-post: `founder@demo.se`
- Lösenord: `Demo1234!`

> ⚠️ Ändra lösenordet omgående om du använder detta i en verklig miljö.

### 6. Konfigurera Supabase Authentication

I Supabase Dashboard:

1. Gå till **Authentication > Providers**
2. Aktivera **Email** provider
3. Aktivera **Google** provider (lägg till OAuth credentials)
4. Lägg till site URL: \`http://localhost:3000\`
5. Lägg till redirect URL: \`http://localhost:3000/auth/callback\`

### 7. Starta development server

\`\`\`bash
npm run dev
\`\`\`

Öppna [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Vercel (Rekommenderat)

1. Pusha kod till GitHub
2. Importera projekt i Vercel
3. Lägg till environment variables
4. Deploy!

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
\`\`\`

### Post-Deployment Checklist

- [ ] Uppdatera Supabase site URL till production URL
- [ ] Uppdatera Supabase redirect URLs
- [ ] Lägg till Stripe webhook endpoint
- [ ] Konfigurera 46elks webhook (för delivery status)
- [ ] Sätt \`NEXT_PUBLIC_APP_URL\` till production URL

## 📁 Projektstruktur

\`\`\`
meddela/
├── app/
│   ├── (auth)/          # Auth pages (login, register)
│   ├── (dashboard)/     # Dashboard pages
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/
│   └── ui/              # UI components (shadcn)
├── lib/
│   ├── supabase/        # Supabase clients
│   ├── 46elks/          # 46elks API client
│   └── utils/           # Utility functions
├── supabase/
│   ├── migrations/      # Database migrations
│   └── seed.sql         # Seed data
└── public/              # Static assets
\`\`\`

## 💰 Priser

- **Starter**: 299 SEK/mån (100 SMS)
- **Professional**: 599 SEK/mån (500 SMS) - Mest populär
- **Business**: 999 SEK/mån (2000 SMS)

## 🔐 Säkerhet

- Row Level Security (RLS) på alla tabeller
- GDPR-kompatibel från dag 1
- Encrypted data storage
- Secure authentication med Supabase
- Rate limiting på API routes
- Audit logging av alla åtgärder

## 📞 Support

För frågor och support, kontakta:
- Email: support@meddela.se
- Dokumentation: https://meddela.se/docs

## 📄 Licens

Proprietary - Alla rättigheter förbehållna

## 🇸🇪 Made in Sweden

Byggd med ❤️ för svenska företag
