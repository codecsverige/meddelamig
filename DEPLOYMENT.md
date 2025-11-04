# 🚀 MEDDELA - Deployment Guide

## 📋 Pre-Deployment Checklist

قبل البدء في الـ deployment، تأكد من إنشاء الحسابات التالية:

### 1. Supabase (Database + Auth)
- ✅ انتقل إلى: https://supabase.com
- ✅ أنشئ حساب مجاني
- ✅ أنشئ مشروع جديد (اختر Region: Stockholm - الأقرب للسويد)
- ✅ احفظ الـ credentials:
  - Project URL
  - Anon Key
  - Service Role Key

### 2. 46elks (SMS Gateway)
- ✅ انتقل إلى: https://46elks.com
- ✅ أنشئ حساب
- ✅ شحن الحساب بـ 100 SEK (للتجربة)
- ✅ احفظ الـ credentials:
  - API Username
  - API Password

### 3. Stripe (Payments - اختياري للبداية)
- ✅ انتقل إلى: https://stripe.com
- ✅ أنشئ حساب
- ✅ احفظ الـ Test Keys:
  - Publishable Key
  - Secret Key

### 4. Vercel (Hosting)
- ✅ انتقل إلى: https://vercel.com
- ✅ أنشئ حساب (استخدم GitHub للربط السريع)

---

## 🗄️ Step 1: Setup Supabase Database

### 1. قم بفتح Supabase Dashboard

### 2. انتقل إلى SQL Editor

```
Dashboard > SQL Editor > New Query
```

### 3. انسخ والصق محتوى الملف التالي:

```bash
# من المشروع:
supabase/migrations/001_initial_schema.sql
```

### 4. اضغط RUN لتشغيل الـ migration

✅ يجب أن يتم إنشاء كل الـ tables والـ policies بنجاح

### 5. (اختياري) Seed Database بالـ templates الجاهزة

انسخ والصق محتوى:
```bash
supabase/seed.sql
```

واضغط RUN

---

## 🔐 Step 2: Configure Supabase Authentication

### 1. في Supabase Dashboard، انتقل إلى:
```
Authentication > Providers
```

### 2. فعّل Email Provider:
- ✅ Enable Email provider
- ✅ Confirm email: OFF (للتطوير السريع) أو ON (للإنتاج)

### 3. فعّل Google OAuth (اختياري):
- ✅ Enable Google provider
- ✅ أضف Google OAuth credentials
  - انتقل إلى: https://console.cloud.google.com
  - أنشئ OAuth 2.0 Client ID
  - أضف Authorized redirect URIs:
    - `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`

### 4. أضف Site URLs:
```
Authentication > URL Configuration

Site URL: https://your-domain.vercel.app
Redirect URLs:
  - http://localhost:3000/auth/callback
  - https://your-domain.vercel.app/auth/callback
```

---

## 🌐 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (أسهل)

1. ✅ Push الكود إلى GitHub:
```bash
git add .
git commit -m "Initial MEDDELA deployment"
git push origin main
```

2. ✅ انتقل إلى Vercel Dashboard: https://vercel.com/new

3. ✅ Import repository من GitHub

4. ✅ أضف Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=MEDDELA

# 46elks
ELKS_API_USERNAME=your-46elks-username
ELKS_API_PASSWORD=your-46elks-password
ELKS_SENDER_NAME=MEDDELA

# Stripe (اختياري)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

5. ✅ اضغط Deploy

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... كرر لكل المتغيرات

# Deploy to production
vercel --prod
```

---

## ✅ Step 4: Post-Deployment Configuration

### 1. تحديث Supabase Site URLs

في Supabase Dashboard:
```
Authentication > URL Configuration

Site URL: https://your-app.vercel.app
Redirect URLs:
  - https://your-app.vercel.app/auth/callback
```

### 2. اختبر التطبيق

✅ افتح: `https://your-app.vercel.app`

✅ اختبر:
- [ ] Landing page يظهر بشكل صحيح
- [ ] التسجيل يعمل
- [ ] تسجيل الدخول يعمل
- [ ] Dashboard يظهر
- [ ] إضافة contact يعمل
- [ ] إرسال SMS يعمل (تأكد من credits في 46elks)

### 3. (اختياري) ربط Domain مخصص

في Vercel:
```
Settings > Domains > Add Domain
```

أدخل: `meddela.se` أو domain الخاص بك

---

## 🔧 Troubleshooting

### مشكلة: Build يفشل

**السبب:** Environment variables غير موجودة

**الحل:**
```bash
# تأكد من وجود كل المتغيرات في Vercel:
vercel env ls

# أو أضفها يدوياً في Dashboard:
Settings > Environment Variables
```

### مشكلة: Authentication لا يعمل

**السبب:** Redirect URLs غير صحيحة

**الحل:**
- تأكد من إضافة URL الصحيح في Supabase
- تأكد من `NEXT_PUBLIC_APP_URL` صحيح في Vercel

### مشكلة: SMS لا يُرسَل

**السبب:** 46elks credentials غير صحيحة أو لا يوجد رصيد

**الحل:**
```bash
# اختبر 46elks API:
curl -X POST https://api.46elks.com/a1/sms \
  -u YOUR_USERNAME:YOUR_PASSWORD \
  -d from=MEDDELA \
  -d to=+46701234567 \
  -d message="Test"
```

### مشكلة: Database connection errors

**السبب:** RLS policies تمنع الوصول

**الحل:**
- تأكد من تشغيل migration بشكل كامل
- تأكد من user له organization_id

---

## 📊 Monitoring

### Vercel Analytics
```
Dashboard > Analytics
```
- Page views
- Performance
- Errors

### Supabase Logs
```
Dashboard > Logs
```
- API requests
- Auth events
- Errors

### 46elks Usage
```
https://dashboard.46elks.com
```
- SMS sent
- Balance
- Delivery rates

---

## 🔒 Security Checklist

قبل الإطلاق للـ Production:

- [ ] تفعيل Email confirmation في Supabase
- [ ] إضافة Rate limiting (Upstash Redis)
- [ ] مراجعة RLS policies
- [ ] إعداد Backup schedule في Supabase
- [ ] تفعيل 2FA لحسابات Admin
- [ ] مراجعة GDPR compliance
- [ ] إضافة Privacy Policy و Terms of Service
- [ ] اختبار كل الـ user flows
- [ ] Load testing
- [ ] Security audit

---

## 💰 التكاليف المتوقعة

### Free Tier (للبداية):
- ✅ Vercel: مجاني (Hobby plan)
- ✅ Supabase: مجاني (حتى 500MB database)
- ✅ Stripe: مجاني (عمولة على المبيعات فقط)
- ❌ 46elks: 0.35 SEK/SMS

### عند النمو (100 عميل):
- Vercel Pro: $20/شهر
- Supabase Pro: $25/شهر
- 46elks: حسب الاستخدام
- **Total: ~$45-50/شهر**

---

## 📞 Support

إذا واجهت مشاكل:

1. اقرأ README.md
2. اقرأ الـ documentation
3. تحقق من Logs في Vercel و Supabase
4. افتح Issue في GitHub

---

**Good luck! 🚀 بالتوفيق!**
