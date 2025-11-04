# ⚡ MEDDELA - Quick Start Guide

## 🎯 الهدف: تشغيل المشروع محلياً في 10 دقائق

---

## 📋 المتطلبات

- Node.js 18+ مثبت
- npm أو yarn
- Git
- حساب Supabase (مجاني)
- حساب 46elks (100 SEK للتجربة)

---

## 🚀 الخطوات

### 1️⃣ Clone المشروع

```bash
git clone [your-repo-url]
cd meddela
```

### 2️⃣ تثبيت Dependencies

```bash
npm install
```

### 3️⃣ إنشاء حساب Supabase

1. اذهب إلى: https://supabase.com
2. Sign up
3. Create new project
4. انتظر 2 دقيقة حتى يتم إنشاء المشروع

### 4️⃣ Setup Database

في Supabase Dashboard:

1. اذهب إلى: **SQL Editor** > **New Query**
2. انسخ محتوى ملف: `supabase/migrations/001_initial_schema.sql`
3. الصق في SQL Editor
4. اضغط **RUN**

✅ يجب أن ترى "Success" message

### 5️⃣ Seed Database (اختياري - templates جاهزة)

1. نفس الخطوات
2. انسخ محتوى: `supabase/seed.sql`
3. الصق واضغط RUN

### 6️⃣ Configure Environment Variables

```bash
# انسخ ملف المثال
cp .env.example .env.local

# افتح .env.local وعدّل:
nano .env.local
```

أضف:
```env
# من Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MEDDELA

# من 46elks Dashboard
ELKS_API_USERNAME=uxxxxx
ELKS_API_PASSWORD=xxxxx
ELKS_SENDER_NAME=MEDDELA

# اتركها فارغة للبداية
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
```

### 7️⃣ Configure Supabase Auth

في Supabase Dashboard:

1. **Authentication** > **URL Configuration**
2. أضف:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

3. **Authentication** > **Providers**
4. فعّل: **Email**

### 8️⃣ شغّل المشروع!

```bash
npm run dev
```

✅ افتح المتصفح: http://localhost:3000

---

## ✅ اختبار سريع

### 1. تسجيل حساب جديد

1. اضغط "Kom igång gratis"
2. املأ البيانات:
   - الاسم: Test User
   - Email: test@test.com
   - Password: test1234
   - اسم الشركة: Test Restaurant
   - الصناعة: Restaurang
3. اضغط "Skapa konto"

✅ يجب أن يتم تحويلك للـ Dashboard

### 2. إضافة أول contact

1. Sidebar > Kontakter
2. اضغط "Ny kontakt"
3. املأ:
   - Namn: Test Contact
   - Telefon: 0701234567 (رقم سويدي تجريبي)
   - SMS-godkännande: ✓
4. اضغط "Spara"

✅ Contact تمت إضافته

### 3. إرسال أول SMS (تجريبي)

**⚠️ ملاحظة:** لإرسال SMS حقيقي، تحتاج:
- رصيد في 46elks (100 SEK minimum)
- رقم سويدي حقيقي (+467...)

```bash
# اختبار بدون إرسال فعلي:
# في lib/46elks/client.ts، أضف dryrun: 'yes' للاختبار
```

1. Sidebar > Meddelanden
2. اضغط "Skicka SMS"
3. اختر Contact
4. اكتب رسالة
5. اضغط "Skicka SMS"

---

## 🎨 الخطوة التالية

الآن يمكنك:

✅ **Explore Dashboard**: اكتشف كل الميزات

✅ **Customize**: عدّل الألوان، النصوص، إلخ

✅ **Add Features**: أضف ميزات جديدة

✅ **Deploy**: اتبع DEPLOYMENT.md للنشر على Vercel

---

## 🐛 مشاكل شائعة

### المشروع لا يشتغل

```bash
# احذف node_modules وأعد التثبيت
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Build errors

```bash
# تأكد من Node version
node -v  # يجب أن يكون 18+

# Update Next.js
npm install next@latest
```

### Supabase connection errors

- تأكد من `.env.local` موجود
- تأكد من الـ credentials صحيحة
- تأكد من تشغيل migrations

### Authentication لا يعمل

- تأكد من Redirect URLs صحيحة في Supabase
- تأكد من Email provider مفعّل

---

## 📚 موارد مفيدة

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [46elks API Docs](https://46elks.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 💡 Tips

### Development سريع:

```bash
# Hot reload يعمل تلقائياً
# اي تعديل في الكود سيظهر مباشرة

# لرؤية الأخطاء:
# افتح Console في المتصفح (F12)
# أو Terminal حيث يعمل npm run dev
```

### Database changes:

```bash
# إذا عدلت على Database schema:
# 1. عدّل في supabase/migrations/...
# 2. Run في Supabase SQL Editor
# 3. عدّل Types في lib/supabase/types.ts
```

---

**Happy coding! 🚀**

**أي سؤال؟ افتح Issue في GitHub**
