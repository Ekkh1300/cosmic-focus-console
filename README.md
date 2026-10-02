# کیهان · Cosmic Focus Console

<div align="center">

**فارسی** · [English](README.en.md)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![three.js](https://img.shields.io/badge/three.js-r186-000000?style=flat-square&logo=three.js&logoColor=white)

</div>

> **[⬇ دانلود نسخه‌ی تک‌فایلی v1.0.0](https://github.com/Ekkh1300/cosmic-focus-console/releases/download/v1.0.0/keshan.html)** — یک فایل، بدون نصب و بدون اینترنت؛ فقط دابل‌کلیک.

یک اپلیکیشن بهره‌وری / تایمر متمرکز با رابط «شیشه‌ی مایع» کیهانی —
به‌صورت یک کنسول فضایی شناور که در پشت آن یک سیاره‌ی سه‌بعدی در حال چرخش است.

**رابط فارسی (RTL) به‌صورت پیش‌فرض**؛ انگلیسی هم از تنظیمات در دسترس است.

---

## نسخه‌ی تک‌فایل (برای اشتراک‌گذاری)

```bash
npm run build:single
```

خروجی: **`E:\ty\کیهان.html`** — یک فایل، حدود ۱٫۲ مگابایت (۳۹۰KB فشرده).

کافی است روی فایل **دابل‌کلیک** کنید تا در مرورگر باز شود. نیازی به سرور،
نصب یا اینترنت نیست:

- کل جاوااسکریپت (شامل three.js)، CSS و **فونت وزیرمتن** به‌صورت base64
  داخل خود HTML درج شده‌اند
- هیچ `src`/`href` خارجی، هیچ `import()` در زمان اجرا و هیچ فایل جانبی وجود ندارد
- اسکریپت‌ها `inline type="module"` هستند، پس محدودیت CORS مربوط به ماژول‌های
  `file://` هم اعمال نمی‌شود
- اگر مرورگری `localStorage` را روی `file://` مسدود کند، برنامه با یک پیام
  کوتاه بالا می‌آید و **همه‌چیز در همان نشست کار می‌کند** (فقط بین اجراها
  ذخیره نمی‌شود)

فایل تولیدشده با `npm run build` (حالت عادی، چندفایلی) هم تداخلی ندارد.

---

## اجرا

```bash
npm install
npm run dev           # سرور توسعه
npm run build         # بیلد چندفایلی در dist/
npm run build:single  # بیلد تک‌فایل → کیهان.html
npm run preview       # پیش‌نمایش بیلد تولید
npm run lint          # oxlint
```

بدون بک‌اند. تمام داده‌ها در `localStorage` ذخیره می‌شوند و برنامه بعد از
بارگذاری کاملاً آفلاین کار می‌کند.

---

## امکانات

**تایمر**
- پنج حالت بهره‌وری: پومودورو، کار عمیق، مطالعه، وظیفه‌ی سریع، سفارشی
- سه فاز: تمرکز / استراحت کوتاه / استراحت بلند با تقسیم‌بندی شناور
- **مدت دلخواه** کنار انتخاب‌گر فاز: استپر + چیپ‌های سریع، روی همان فاز و
  همان قالب اعمال می‌شود (و اگر تایمر در حال اجراست، با طول جدید صفر می‌شود)
- **ساعت زنده** در نوار بالا: `HH:MM:SS` + تاریخ شمسی (در حالت فارسی) یا
  میلادی (در حالت انگلیسی) — با `Intl` و بدون کتابخانه‌ی تاریخ؛ از تنظیمات
  (`نمایش ساعت`) قابل خاموش شدن است و فقط خودش هر ثانیه رندر می‌شود
- موتور زمان‌بندی مبتنی بر `timestamp` — با بستن تب یا throttle شدن مرورگر
  خراب نمی‌شود و زمان سپری‌شده هنگام باز شدن دوباره بازیابی می‌شود
- اجرای هم‌زمان با `requestAnimationFrame` **و** یک interval ۲۵۰ms پشتیبان،
  بنابراین حتی وقتی مرورگر rAF را متوقف می‌کند هم شمارش درست می‌ماند
- حلقه‌ی انرژی دایره‌ای، ذرات مداری، تنفس پنل هنگام اجرا، انیمیشن پایان جلسه

**وظایف**
- ایجاد / ویرایش / حذف / تیک زدن، زمان تخمینی، دسته‌بندی
- جستجو + فیلتر وضعیت و دسته
- کلیک روی وظیفه آن را به تایمر پیوند می‌زند؛ دکمه‌ی پخش شروع می‌کند
- دقایق واقعی تمرکز صرف‌شده روی هر وظیفه ثبت می‌شود

**آمار**
- تمرکز امروز/هفتگی، جلسات، وظایف تکمیل‌شده، رشته‌ی روزها، امتیاز تمرکز
- نمودار هفتگی، توزیع دسته‌ها، فهرست جلسات اخیر

**قالب‌ها**
- پنج قالب پیش‌فرض قابل ویرایش + ساخت قالب دلخواه (ماندگار بین رفرش‌ها)

**تنظیمات**
- پوسته (تیره/روشن/سیستم)، رنگ تأکید، شدت شیشه، حرکت (کامل/کاهش/خاموش)
- پس‌زمینه (سیاره/سحابی/حداقلی/ذرات)، زبان، صدا، اعلان مرورگر
- رفتار تایمر، هدف روزانه، میان‌برها، پاک‌سازی داده‌ها

**میان‌برها:** `Space` شروع/مکث · `R` بازنشانی · `N` جلسه‌ی بعدی ·
`T/S/P/G` رفتن به صفحات · `/` جستجو · `Esc` بستن پنجره

---

## معماری

```
src/
  components/
    glass/          سیستم ماده‌ی شیشه‌ای (GlassSurface, GlassButton, Segmented, Modal, Field, Toggle, EmptyState)
    background/     کیهان: Planet (Three.js + شیدر رویه‌ای), Starfield, CosmicBackground, SvgDefs
    timer/          TimerOrb, ProgressRing, EnergyRing, TimerControls, PhaseSegments, ModeSelector, CompletionOverlay
    tasks/          TaskItem, TaskPanel, TaskComposer
    statistics/     StatCard, WeekChart, ScoreRing, CategoryBars, SessionList
    navigation/     BottomNav
    common/         PageHeader, NoticeBanner
  pages/            TimerPage, TasksPage, StatisticsPage, PresetsPage, SettingsPage
  hooks/            useClock, useAppearance, useShortcuts, usePointer, useLocalStorage, useDocumentTitle, useCopy
  store/            appStore (useSyncExternalStore + localStorage), stats (اقتباس‌ها)
  utils/            timerEngine, format, storage, sound (WebAudio), notify, webgl, id
  i18n/             دوزبانه‌ی fa/en
  styles/           glass.css (ماده), animations.css (حرکت), components.css (چیدمان)
  types/
```

### سیستم شیشه‌ی مایع

هر سطح از پنج لایه‌ی نوری ساخته شده، نه صرفاً `rgba + blur`:

1. **زیرلایه‌ی رنگی** با گرادیان چندلایه + هاله‌ی سفید بالای پنل
2. **بازتاب ماوس** — `radial-gradient` که با `--gx/--gy` روی هر سطح حرکت می‌کند
3. **حلقه‌ی شکست (refraction)** — یک `::before` با `backdrop-filter` که با
   `mask-composite` فقط به لبه‌ی پنل محدود شده، پس لبه واقعاً دنیای پشت را می‌شکند
4. **حاشیه‌ی نورانی** — `::after` با گرادیان ماسک‌دار + انحراف رنگی (chromatic) در راس‌ها
5. **عمق** — سایه‌ی چندلایه‌ی `box-shadow` + درخشش داخلی

سه عمق ماده‌ای: `--primary` (کره‌ی تایمر)، `--panel`، `--control`، `--ghost`
که با `data-glass="subtle|balanced|strong"` مقیاس می‌گیرند.

### سیاره

کره‌ای با شیدر `ShaderMaterial` سفارشی (بدون تکسچر): fbm نویز برای توپوگرافی،
شبکه‌ی مداری محو، ترمینال روز/شب، فرنل بنفش جوّی، ذرات مداری و دو حلقه.
چرخش ~۷۰ ثانیه‌یک‌دور (تا ~۵۰ ثانیه هنگام اجرا)، با نور ملایم وابسته به ماوس.
اگر WebGL در دسترس نباشد، به‌صورت خودکار به یک کره‌ی CSS سقوط (fallback) می‌کند.

---

## دسترس‌پذیری و عملکرد

- HTML معنایی، `role`/`aria` کامل، ناوبری با کیبورد و حالت فوکوس دیداری
- `prefers-reduced-motion` به‌علاوه‌ی سطح کاربر «کاهش‌یافته/خاموش»
- کنتراست متن با توجه به WCAG تنظیم شده (`--text-2/3` روی پس‌زمینه‌ی تیره)
- به‌روزرسانی حلقه‌ی تایمر بدون رندر React (نوشتن مستقیم DOM در rAF)
- داده‌های متنی فقط در تغییر ثانیه رندر می‌شوند
- `three.js` به‌صورت `lazy` بارگذاری می‌شود و فقط وقتی پس‌زمینه‌ی «سیاره» انتخاب شده
- توقف انیمیشن‌ها و WebGL هنگام مخفی بودن تب
- تقسیم چانک: `three` (528KB) · `motion` (135KB) · `vendor` (210KB) · `index` (105KB)
