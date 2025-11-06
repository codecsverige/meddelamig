# 🚀 دليل الإعداد - MEDDELA

## 📋 المتطلبات

- Node.js 18+ مثبت
- حساب Supabase (مجاني)
- حساب 46elks (يحتاج رصيد SMS)
- Git مثبت

---

## ⚡ الإعداد السريع (15 دقيقة)

### **الخطوة 1: إعداد المشروع**

```bash
# 1. انسخ المشروع
git clone [your-repo-url]
cd meddela

# 2. ثبت المكتبات
npm install

# 3. انسخ ملف البيئة
cp .env.example .env.local
```

---

### **الخطوة 2: إعداد Supabase** (5 دقائق)

#### أ. إنشاء Project جديد

1. اذهب إلى: https://app.supabase.com
2. اضغط "New Project"
3. اختر اسم مشروعك (مثلاً: meddela-prod)
4. اختار كلمة مرور قوية للDatabase
5. اختار Region: "West EU (Ireland)" - الأقرب للسويد
6. انتظر 2-3 دقائق حتى يُنشأ المشروع

#### ب. احصل على API Keys

1. في Dashboard، اذهب إلى: **Settings** → **API**
2. انسخ:
   - `Project URL` → ضعها في `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → ضعها في `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → ضعها في `SUPABASE_SERVICE_ROLE_KEY`

#### ج. شغّل Database Migrations

1. في Dashboard، اذهب إلى: **SQL Editor**
2. اضغط "New Query"
3. افتح ملف `supabase/migrations/001_initial_schema.sql`
4. انسخ المحتوى كاملاً والصقه في SQL Editor
5. اضغط **RUN** (انتظر 10-15 ثانية)
6. يجب أن ترى: ✅ "Success. No rows returned"

#### د. أضف Templates الجاهزة (اختياري)

1. في SQL Editor، اضغط "New Query"
2. افتح ملف `supabase/seed.sql`
3. انسخ والصق المحتوى
4. اضغط **RUN**

#### هـ. تفعيل Authentication

1. اذهب إلى: **Authentication** → **Providers**
2. فعّل **Email** provider
3. في **URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

---

### **الخطوة 3: إعداد 46elks** (3 دقائق)

#### أ. إنشاء حساب

1. اذهب إلى: https://46elks.com/create-account
2. سجل بإيميلك ورقم هاتف سويدي
3. فعّل الحساب من الإيميل

#### ب. شحن الرصيد

1. في Dashboard: https://dashboard.46elks.com
2. اذهب إلى **Billing**
3. اشحن الحد الأدنى (عادة 100-500 SEK)
4. سعر SMS: ~0.35 SEK للسويد

#### ج. احصل على API Keys

1. في Dashboard، اذهب إلى: **Settings** → **API credentials**
2. انسخ:
   - `Username` → ضعه في `ELKS_API_USERNAME`
   - `Password` → ضعه في `ELKS_API_PASSWORD`

---

### **الخطوة 4: تحديث ملف .env.local**

افتح `.env.local` وعبّئ القيم:

```env
# من Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# من 46elks
ELKS_API_USERNAME=u1234567890abcdef
ELKS_API_PASSWORD=ABCDEF1234567890
ELKS_SENDER_NAME=MEDDELA
```

---

### **الخطوة 5: شغّل التطبيق** 🚀

```bash
npm run dev
```

افتح المتصفح: http://localhost:3000

---

## ✅ اختبار التطبيق

### 1. التسجيل

1. اذهب إلى: http://localhost:3000/register
2. سجل بإيميل جديد
3. ستصلك إيميل تأكيد (تحقق من Spam)
4. افتح الرابط في الإيميل

### 2. Onboarding

1. بعد التسجيل، ستُحوّل لصفحة Onboarding
2. عبّئ معلومات المطعم:
   - اسم المطعم
   - الصناعة (Restaurant)
   - رقم الهاتف
   - اسم المُرسل (11 حرف كحد أقصى)
3. اختر باقة (Trial مجاناً)
4. اضغط "إنهاء"

### 3. إضافة Contact

1. اذهب إلى **Contacts** → **Add Contact**
2. أضف معلومات:
   - الاسم
   - رقم الهاتف (+46701234567)
   - الإيميل (اختياري)
   - Tags (مثلاً: VIP)
3. **مهم:** فعّل "SMS Consent" ✅
4. احفظ

### 4. إرسال أول SMS

1. اذهب إلى **Messages** → **Send SMS**
2. اختر Contact من القائمة
3. اكتب الرسالة (أو اختر قالب)
4. اضغط **Send**
5. انتظر 5-10 ثواني
6. تحقق من Dashboard - يجب أن ترى الرسالة في الإحصائيات

### 5. تحقق من 46elks

1. اذهب إلى: https://dashboard.46elks.com/history
2. يجب أن ترى الرسالة المُرسلة
3. تحقق من التكلفة

---

## 🐛 حل المشاكل الشائعة

### **مشكلة: "Failed to fetch"**
```
السبب: Supabase URL غير صحيح
الحل: تحقق من .env.local
```

### **مشكلة: "Invalid API key"**
```
السبب: API keys غير صحيحة
الحل: انسخ Keys مرة أخرى من Supabase Dashboard
```

### **مشكلة: "SMS failed to send"**
```
الأسباب المحتملة:
1. رصيد 46elks منتهي → اشحن الرصيد
2. رقم الهاتف غير صحيح → استخدم صيغة +46XXXXXXXXX
3. API credentials خاطئة → تحقق من .env.local
```

### **مشكلة: "Organization not found"**
```
السبب: لم تكمل Onboarding
الحل: اذهب إلى /onboarding وأكمل الخطوات
```

### **مشكلة: "Table doesn't exist"**
```
السبب: لم تشغل Migrations
الحل: ارجع للخطوة 2ج وشغل SQL file
```

---

## 🔐 الأمان

### **تحذيرات مهمة:**

1. ❌ **لا تشارك `.env.local` أبداً**
2. ❌ **لا ترفع `.env.local` على Git**
3. ✅ **استخدم `.env.local` للتطوير فقط**
4. ✅ **استخدم Vercel Environment Variables للإنتاج**

### **لحماية SUPABASE_SERVICE_ROLE_KEY:**
- استخدمه فقط في API routes
- لا تستخدمه في client-side code
- لا تعرضه في console.log

---

## 🚀 النشر على Vercel

### الخطوة 1: ارفع على GitHub

```bash
git add .
git commit -m "Setup complete"
git push origin main
```

### الخطوة 2: انشر على Vercel

1. اذهب إلى: https://vercel.com
2. سجل دخول بحساب GitHub
3. **Import Project**
4. اختر repository
5. أضف Environment Variables:
   - انسخ كل شيء من `.env.local`
   - الصقه في Vercel Environment Variables
   - غيّر `NEXT_PUBLIC_APP_URL` إلى domain Vercel الخاص بك

### الخطوة 3: حدّث Supabase URLs

1. في Supabase Dashboard → **Authentication** → **URL Configuration**
2. أضف:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### الخطوة 4: حدّث 46elks Webhook (لاحقاً)

عندما تُفعّل Webhooks:
1. في 46elks Dashboard
2. Webhook URL: `https://your-app.vercel.app/api/webhooks/46elks`

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. تحقق من Console في المتصفح (F12)
2. تحقق من Supabase Logs
3. تحقق من 46elks History

---

## ✅ Checklist قبل الإطلاق

- [ ] Migrations شُغلت بنجاح
- [ ] يمكنني التسجيل والدخول
- [ ] يمكنني إنشاء Organization
- [ ] يمكنني إضافة Contact
- [ ] يمكنني إرسال SMS
- [ ] الـ SMS وصل فعلاً
- [ ] Dashboard يعرض الإحصائيات
- [ ] Environment Variables في Vercel
- [ ] Supabase URLs محدّثة للإنتاج

---

**🎉 مبروك! التطبيق جاهز للعمل!**
