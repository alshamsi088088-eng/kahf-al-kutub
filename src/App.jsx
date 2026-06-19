import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  BookOpen, Bookmark, Highlighter, Sticker, Flame, Clock, BookMarked,
  Sparkles, User, LogIn, UserPlus, X, ChevronLeft, ChevronRight,
  Globe, LayoutDashboard, Library, Plus, Search, Star, TrendingUp,
  Quote as QuoteIcon, Award, Upload, AlertCircle
} from "lucide-react";

// ----------------------------------------------------------------
// Supabase connection (real backend — Postgres + Auth)
// ----------------------------------------------------------------
const SUPABASE_URL = "https://abpgyqyghhydinhfuzgt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicGd5cXlnaGh5ZGluaGZ1emd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDg0OTYsImV4cCI6MjA5NzM4NDQ5Nn0.ANO_WnOLNi2PuxXBZsTAlsqAUnYhMRCCfoRml5FWcSI";

// Minimal Supabase client built on fetch — no extra packages required,
// so this code runs as-is here AND after you `npm install` it for real.
const sb = {
  async signUp(email, password, name) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password, data: { name } }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || data.error || "Sign up failed");
    return data; // { access_token, user, ... } (access_token may be null if email confirmation is required)
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Sign in failed");
    return data; // { access_token, user, ... }
  },
  async listBooks(token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/books?select=*&order=created_at.asc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load books");
    return res.json();
  },
  async insertBooks(token, rows) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/books`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error("Failed to add book");
    return res.json();
  },
  async updateBook(token, id, patch) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/books?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update book");
    return res.json();
  },
};

/* ============================================================
   كهف الكتب — Kahf Al-Kutub ("The Cave of Books")
   A bilingual (AR/EN) personal reading-tracker.

   DESIGN CONCEPT
   ---------------------------------------------------------------
   Subject: a private cave-library lit by lanterns — shelves carved
   into stone, parchment, amber lamplight, the hush of reading at
   night. The "cave" is the antidote to the noisy feed: a quiet,
   warm, personal place to keep your books.

   Palette
     --stone-950 #211C3D  deep cave stone (app background)
     --stone-800 rgba(255,255,255,0.08)  shelf wood/stone panels
     --parchment #F4F0FF  page / card surface
     --ember     #A78BFA  warm accent (progress, CTAs)
     --gold      #FFB199  lantern glow (highlights, stars)
     --moss      #7C8CFF  secondary accent (tags, success)

   Type
     Display: "Amiri" (serif, supports Arabic + Latin, carved-stone feel)
     Body:    "Tajawal" (humanist sans, excellent AR+EN harmony)
     Mono/UI: "Tajawal" tabular numerals for stats

   Layout signature
     The hero is a literal carved stone arch revealing a shelf of
     glowing spines. Library = wooden shelf rows instead of a grid
     of cover-cards. A hanging lantern card on the right holds the
     "Reader of the Week" + daily quote, swaying gently.
   =============================================================== */

// ---------------------------------------------------------------
// i18n
// ---------------------------------------------------------------
const STR = {
  en: {
    dir: "ltr",
    appName: "Kahf Al-Kutub",
    tagline: "The Cave of Books",
    heroTitle: "A quiet cave for everything you read",
    heroSub: "Carry your shelf, your bookmarks, your ink, and your streak — into one warm little cave.",
    getStarted: "Enter the cave",
    signIn: "Sign in",
    signUp: "Create account",
    name: "Name",
    email: "Email",
    password: "Password",
    welcomeBack: "Welcome back",
    joinCave: "Join the cave",
    haveAccount: "Already have an account?",
    noAccount: "New here?",
    library: "Library",
    dashboard: "Dashboard",
    reading: "Reading",
    quotes: "Quotes",
    profile: "Profile",
    logout: "Log out",
    myShelf: "My Shelf",
    addBook: "Add a book",
    uploadBook: "Upload a book",
    searchShelf: "Search your shelf…",
    continueReading: "Continue reading",
    currentlyReading: "Currently reading",
    finished: "Finished",
    wantToRead: "Want to read",
    pages: "pages",
    page: "page",
    of: "of",
    progress: "progress",
    readerOfWeek: "Reader of the Week",
    dailyQuote: "Today's Quote",
    newQuoteIn: "A new spark tomorrow",
    streak: "day streak",
    hoursRead: "Hours read",
    booksFinished: "Books finished",
    wordsRead: "Words read",
    topGenres: "Most-read genres",
    weeklyActivity: "This week's reading",
    recentHighlights: "Recent highlights",
    achievements: "Lantern badges",
    bookmarkSet: "Bookmark set on page",
    tools: "Tools",
    pen: "Pen — highlight",
    sticker: "Sticker",
    bookmarkTool: "Bookmark",
    note: "Note",
    save: "Save",
    cancel: "Cancel",
    pickColor: "Pick a color",
    addHighlight: "Add highlight",
    yourNote: "Your note…",
    backToShelf: "Back to shelf",
    genre: "Genre",
    author: "by",
    minutesToday: "minutes today",
    keepGoing: "Keep going — every page is a step deeper into the cave.",
    quoteCredit: "—",
    members: "in this cave",
    switchLang: "العربية",
    emptyShelf: "Your shelf is empty. Add your first book to light the cave.",
    title: "Title",
    coverColor: "Spine color",
    totalPagesField: "Total pages",
    create: "Add to shelf",
    close: "Close",
    stats: "Your numbers",
    rank: "Rank",
    booksRead: "books read",
    motivational: [
      "One page tonight is a torch lit for tomorrow.",
      "Readers don't finish books. Books finish readers.",
      "Every chapter is a room deeper in the cave.",
      "Small reading, repeated daily, becomes a library.",
      "Your bookmark remembers what your day forgets."
    ],
  },
  ar: {
    dir: "rtl",
    appName: "كهف الكتب",
    tagline: "Kahf Al-Kutub",
    heroTitle: "كهفٌ هادئ لكل ما تقرأ",
    heroSub: "احمل رفّك، وفواصلك، وحبرك، وسلسلة أيامك — في كهفٍ دافئ واحد.",
    getStarted: "ادخل الكهف",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    welcomeBack: "أهلاً بعودتك",
    joinCave: "انضم إلى الكهف",
    haveAccount: "لديك حساب بالفعل؟",
    noAccount: "جديد هنا؟",
    library: "المكتبة",
    dashboard: "لوحتي",
    reading: "القراءة",
    quotes: "اقتباسات",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    myShelf: "رفّي",
    addBook: "أضف كتاباً",
    uploadBook: "ارفع كتاباً",
    searchShelf: "ابحث في رفّك…",
    continueReading: "تابع القراءة",
    currentlyReading: "أقرأ الآن",
    finished: "منتهية",
    wantToRead: "أريد قراءتها",
    pages: "صفحة",
    page: "صفحة",
    of: "من",
    progress: "التقدم",
    readerOfWeek: "قارئ الأسبوع",
    dailyQuote: "اقتباس اليوم",
    newQuoteIn: "شرارة جديدة غداً",
    streak: "يوم متتالي",
    hoursRead: "ساعات القراءة",
    booksFinished: "كتب أنهيتها",
    wordsRead: "كلمات قرأتها",
    topGenres: "الأنواع الأكثر قراءة",
    weeklyActivity: "قراءة هذا الأسبوع",
    recentHighlights: "أحدث التحديدات",
    achievements: "أوسمة الفانوس",
    bookmarkSet: "تم وضع فاصلة عند صفحة",
    tools: "الأدوات",
    pen: "القلم — تحديد",
    sticker: "ستيكر",
    bookmarkTool: "فاصلة",
    note: "ملاحظة",
    save: "حفظ",
    cancel: "إلغاء",
    pickColor: "اختر لوناً",
    addHighlight: "إضافة تحديد",
    yourNote: "اكتب ملاحظتك…",
    backToShelf: "العودة للرف",
    genre: "النوع",
    author: "بقلم",
    minutesToday: "دقيقة اليوم",
    keepGoing: "استمر — كل صفحة خطوة أعمق في الكهف.",
    quoteCredit: "—",
    members: "في هذا الكهف",
    switchLang: "English",
    emptyShelf: "رفّك فارغ. أضف كتابك الأول لتضيء الكهف.",
    title: "العنوان",
    coverColor: "لون الغلاف",
    totalPagesField: "عدد الصفحات",
    create: "أضف للرف",
    close: "إغلاق",
    stats: "أرقامك",
    rank: "الترتيب",
    booksRead: "كتب مقروءة",
    motivational: [
      "صفحة واحدة الليلة شعلة تُضاء للغد.",
      "القرّاء لا ينهون الكتب، الكتب هي من تُنهي قرّاءها.",
      "كل فصل غرفة أعمق في الكهف.",
      "قراءة صغيرة، مكررة يومياً، تصبح مكتبة.",
      "فاصلتك تتذكر ما ينساه يومك."
    ],
  },
};

const QUOTES = [
  { en: "A reader lives a thousand lives before he dies.", ar: "القارئ يعيش ألف حياة قبل أن يموت.", by: "George R.R. Martin" },
  { en: "Once you learn to read, you will be forever free.", ar: "حين تتعلم القراءة، تصبح حراً إلى الأبد.", by: "Frederick Douglass" },
  { en: "Books are a uniquely portable magic.", ar: "الكتب سحرٌ محمول لا مثيل له.", by: "Stephen King" },
  { en: "There is no friend as loyal as a book.", ar: "لا صديق وفيّ كالكتاب.", by: "Ernest Hemingway" },
  { en: "Reading is dreaming with open eyes.", ar: "القراءة حلمٌ بعينين مفتوحتين.", by: "Anonymous" },
  { en: "I find television very educating. Every time someone turns it on, I go in the other room and read a book.", ar: "كلما رأيت أحداً يشغّل التلفاز، ذهبت إلى الغرفة الأخرى لأقرأ كتاباً.", by: "Groucho Marx" },
  { en: "A room without books is like a body without a soul.", ar: "غرفة بلا كتب كجسدٍ بلا روح.", by: "Cicero" },
];

const todaysQuote = () => {
  const day = new Date().getDate() + new Date().getMonth() * 31;
  return QUOTES[day % QUOTES.length];
};

const GENRES = {
  en: { novel: "Novels", philosophy: "Philosophy", history: "History", scifi: "Sci-Fi", selfhelp: "Self-Development", poetry: "Poetry" },
  ar: { novel: "روايات", philosophy: "فلسفة", history: "تاريخ", scifi: "خيال علمي", selfhelp: "تطوير ذات", poetry: "شعر" },
};

const SPINE_COLORS = ["#A78BFA", "#7C8CFF", "#C084FC", "#F472B6", "#60A5FA", "#FB7185", "#9381FF"];

const seedBooks = (t) => [
  { id: "b1", title: t === "ar" ? "ألف ليلة وليلة" : "One Thousand and One Nights", author: t === "ar" ? "مؤلف مجهول" : "Anonymous", genre: "novel", totalPages: 480, page: 312, status: "reading", color: "#A78BFA", words: 96000, sessions: [40, 35, 50, 20, 60, 30, 45] },
  { id: "b2", title: t === "ar" ? "هكذا تكلم زرادشت" : "Thus Spoke Zarathustra", author: "Friedrich Nietzsche", genre: "philosophy", totalPages: 327, page: 327, status: "finished", color: "#7C8CFF", words: 75000, sessions: [20, 0, 30, 25, 0, 40, 10] },
  { id: "b3", title: t === "ar" ? "مقدمة ابن خلدون" : "The Muqaddimah", author: "Ibn Khaldun", genre: "history", totalPages: 540, page: 540, status: "finished", color: "#C084FC", words: 140000, sessions: [0, 30, 0, 0, 45, 0, 0] },
  { id: "b4", title: t === "ar" ? "دلتا الزمن" : "Project Hail Mary", author: "Andy Weir", genre: "scifi", totalPages: 476, page: 120, status: "reading", color: "#60A5FA", words: 110000, sessions: [15, 20, 10, 35, 25, 0, 30] },
  { id: "b5", title: t === "ar" ? "عادات سبع للناس الأكثر فعالية" : "7 Habits of Highly Effective People", author: "Stephen Covey", genre: "selfhelp", totalPages: 372, page: 0, status: "want", color: "#FB7185", words: 0, sessions: [0,0,0,0,0,0,0] },
  { id: "b6", title: t === "ar" ? "ديوان المتنبي" : "Diwan of Al-Mutanabbi", author: "Al-Mutanabbi", genre: "poetry", totalPages: 210, page: 210, status: "finished", color: "#F472B6", words: 30000, sessions: [0,0,0,0,0,0,0] },
];

const READERS_OF_WEEK = {
  en: [{ name: "Layla A.", book: "Project Hail Mary", hours: 14 }],
  ar: [{ name: "ليلى أ.", book: "دلتا الزمن", hours: 14 }],
};

// ---------------------------------------------------------------
// Small UI atoms
// ---------------------------------------------------------------
function GoldDivider() {
  return <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #FFB19988, transparent)", margin: "1.5rem 0" }} />;
}

function StoneArchHero({ t, lang, onEnter }) {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem]" style={{
      background: "linear-gradient(160deg, #2D2A57 0%, #4A3D78 45%, #C97B6E 100%)",
      border: "1px solid rgba(255,255,255,0.18)",
      minHeight: 420,
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(1.5px 1.5px at 20% 20%, #fff8, transparent), radial-gradient(1.5px 1.5px at 70% 15%, #fff6, transparent), radial-gradient(1px 1px at 40% 30%, #fff5, transparent), radial-gradient(1.5px 1.5px at 85% 35%, #fff7, transparent), radial-gradient(1px 1px at 10% 45%, #fff5, transparent)"
      }} />
      <div className="grid md:grid-cols-2 items-center relative">
        <div className="relative px-8 py-14 md:px-14 md:py-20" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
          <div className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(6px)" }}>
            <Sparkles size={14} color="#FFD9CE" />
            <span style={{ color: "#FFD9CE", fontFamily: "Tajawal", fontSize: 13, letterSpacing: 1 }}>{t.tagline}</span>
          </div>
          <h1 style={{
            fontFamily: "Amiri, serif", color: "#FBF9FF", fontSize: "clamp(2rem, 4.2vw, 3rem)",
            lineHeight: 1.3, maxWidth: 460, fontWeight: 700
          }}>{t.heroTitle}</h1>
          <p style={{ color: "#E4DBFF", fontFamily: "Tajawal", fontSize: 16, maxWidth: 460, marginTop: 16 }}>{t.heroSub}</p>
          <button onClick={onEnter} className="mt-8 px-8 py-3.5 rounded-full transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg,#FF9E8F,#C9A6FF)", color: "#241F45", fontFamily: "Tajawal", fontWeight: 700, fontSize: 16, boxShadow: "0 10px 30px -8px rgba(201,166,255,0.5)" }}>
            {t.getStarted}
          </button>
        </div>

        <div className="relative flex justify-center px-6 pb-8 md:pb-0">
          <div className="relative" style={{
            width: "min(260px, 70vw)", height: 300,
            borderTopLeftRadius: 140, borderTopRightRadius: 140,
            overflow: "hidden", border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 0 60px -10px rgba(255,158,143,0.45)"
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, #2B2554 0%, #6E4E84 35%, #D98E76 60%, #F4B69B 75%, #C9A6FF 100%)"
            }} />
            <div style={{ position: "absolute", top: 28, right: 36, width: 26, height: 26, borderRadius: "50%", background: "#FFF6E8", boxShadow: "0 0 18px 4px rgba(255,246,232,0.6)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: "32%", height: 1, background: "rgba(255,255,255,0.25)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: "70%", background: "linear-gradient(180deg, rgba(255,200,180,0.25), rgba(43,37,84,0.6))" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Lantern({ t, lang, reader, quote }) {
  return (
    <div className="rounded-3xl p-6 relative" style={{
      background: "linear-gradient(160deg, #2D2A57, rgba(255,255,255,0.06))",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 0 60px -20px rgba(216,168,87,0.25)"
    }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FFB19922" }}>
          <Sparkles size={16} color="#FFB199" />
        </div>
        <span style={{ fontFamily: "Tajawal", color: "#FFB199", fontWeight: 700, fontSize: 14 }}>{t.readerOfWeek}</span>
      </div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#A78BFA33", color: "#F4F0FF", fontFamily: "Amiri", fontWeight: 700 }}>
          {reader.name.charAt(0)}
        </div>
        <div>
          <div style={{ color: "#F4F0FF", fontFamily: "Tajawal", fontWeight: 700 }}>{reader.name}</div>
          <div style={{ color: "#B6ACD6", fontFamily: "Tajawal", fontSize: 12 }}>{reader.hours}h · {reader.book}</div>
        </div>
      </div>

      <GoldDivider />

      <div className="flex items-center gap-2 mb-3">
        <QuoteIcon size={14} color="#FFB199" />
        <span style={{ fontFamily: "Tajawal", color: "#FFB199", fontWeight: 700, fontSize: 14 }}>{t.dailyQuote}</span>
      </div>
      <p style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 19, lineHeight: 1.7 }}>
        “{quote[lang]}”
      </p>
      <p style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13, marginTop: 8 }}>{t.quoteCredit} {quote.by}</p>
      <p style={{ fontFamily: "Tajawal", color: "#8D81B5", fontSize: 11, marginTop: 14, fontStyle: "italic" }}>{t.newQuoteIn}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#A78BFA22" }}>
        <Icon size={18} color="#FFB199" />
      </div>
      <div>
        <div style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</div>
        <div style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 12.5 }}>{label}</div>
        {sub && <div style={{ fontFamily: "Tajawal", color: "#8D81B5", fontSize: 11 }}>{sub}</div>}
      </div>
    </div>
  );
}

function BookSpine({ book, t, lang, onOpen }) {
  const pct = book.totalPages ? Math.round((book.page / book.totalPages) * 100) : 0;
  return (
    <button onClick={() => onOpen(book)} className="text-left group" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
      <div className="rounded-xl p-4 h-full flex flex-col justify-between transition-transform group-hover:-translate-y-1"
        style={{ background: `linear-gradient(160deg, ${book.color}cc, ${book.color}99)`, minHeight: 150, boxShadow: "0 8px 20px -10px rgba(0,0,0,0.6)" }}>
        <div>
          <div style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontWeight: 700, fontSize: 16, lineHeight: 1.35 }}>{book.title}</div>
          <div style={{ fontFamily: "Tajawal", color: "#F4F0FFcc", fontSize: 12, marginTop: 4, opacity: 0.85 }}>{t.author} {book.author}</div>
        </div>
        <div>
          {book.status !== "want" && (
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full" style={{ background: "#00000033" }}>
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "#F4F0FF" }} />
              </div>
              <div style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontSize: 11, marginTop: 4 }}>{pct}% · {t.page} {book.page}/{book.totalPages}</div>
            </div>
          )}
          {book.status === "want" && (
            <div style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontSize: 11, marginTop: 3, opacity: 0.8 }}>{t.wantToRead}</div>
          )}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------
// Auth screen
// ---------------------------------------------------------------
function AuthScreen({ t, lang, onAuth, onToggleLang }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!form.email || !form.password || (mode === "signup" && !form.name)) {
      setError(lang === "ar" ? "يرجى تعبئة كل الحقول" : "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await onAuth(mode, form);
    } catch (e) {
      setError(e.message || (lang === "ar" ? "حدث خطأ، حاول مجدداً" : "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #211C3D 0%, #3B2F66 55%, #6B4C72 100%)", backgroundAttachment: "fixed" }}>
      <button onClick={onToggleLang} className="fixed top-5 right-5 rtl:right-auto rtl:left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(14px)", color: "#FFB199", fontFamily: "Tajawal", fontSize: 13 }}>
        <Globe size={13} /> {t.switchLang}
      </button>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(160deg,#FFB199,#A78BFA)" }}>
            <BookOpen size={26} color="#241F45" />
          </div>
          <h1 style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 28, fontWeight: 700 }}>{t.appName}</h1>
          <p style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13, marginTop: 2 }}>{t.tagline}</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
          <h2 style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontWeight: 700, fontSize: 18, marginBottom: 18 }}>
            {mode === "signin" ? t.welcomeBack : t.joinCave}
          </h2>

          {mode === "signup" && (
            <Field label={t.name} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          )}
          <Field label={t.email} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <Field label={t.password} value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)" }}>
              <AlertCircle size={14} color="#FB7185" />
              <span style={{ fontFamily: "Tajawal", color: "#FECDD3", fontSize: 12.5 }}>{error}</span>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full mt-3 py-3 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(180deg,#FFB199,#A78BFA)", color: "#241F45", fontFamily: "Tajawal", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? (lang === "ar" ? "جارٍ التحقق…" : "Working…") : (
              <>
                {mode === "signin" ? <LogIn size={16} /> : <UserPlus size={16} />}
                {mode === "signin" ? t.signIn : t.signUp}
              </>
            )}
          </button>

          <p style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13, textAlign: "center", marginTop: 16 }}>
            {mode === "signin" ? t.noAccount : t.haveAccount}{" "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }} style={{ color: "#FFB199", fontWeight: 700 }}>
              {mode === "signin" ? t.signUp : t.signIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="mb-4">
      <label style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 12.5, display: "block", marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl outline-none"
        style={{ background: "#211C3D", border: "1px solid rgba(255,255,255,0.18)", color: "#F4F0FF", fontFamily: "Tajawal" }} />
    </div>
  );
}

// ---------------------------------------------------------------
// Reader (page view with pen / sticker / bookmark)
// ---------------------------------------------------------------
const PAGE_TEXT = {
  en: "The lantern light fell soft across the page, and for a moment the room beyond the page ceased to exist. There was only the next sentence, and the one after it, each a step further into the quiet dark of the story — a cave with no end, only deeper rooms, each warmer than the last, each holding something the reader did not know they were looking for until they found it, turned it over once in the lamplight, and kept walking.",
  ar: "سقط ضوء الفانوس ناعماً على الصفحة، وللحظة توقفت الغرفة خلف الصفحة عن الوجود. لم يكن هناك سوى الجملة التالية، ثم التي تليها، كل واحدة خطوة أعمق في عتمة القصة الهادئة — كهفٌ بلا نهاية، غرفٌ أعمق فقط، كل واحدة أدفأ من سابقتها، تحمل شيئاً لم يكن القارئ يعلم أنه يبحث عنه حتى وجده، قلّبه مرة في ضوء المصباح، ثم واصل السير.",
};

const STICKERS = ["⭐", "🔖", "❤️", "🪶", "🕯️"];
const HL_COLORS = ["#FFB19988", "#A78BFA66", "#7C8CFF77", "#F472B666"];

function ReaderView({ book, t, lang, onBack, onUpdatePage }) {
  const [tool, setTool] = useState(null); // 'pen' | 'sticker' | 'bookmark'
  const [hlColor, setHlColor] = useState(HL_COLORS[0]);
  const [highlights, setHighlights] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [bookmarkPage, setBookmarkPage] = useState(book.bookmark || null);
  const [selection, setSelection] = useState("");
  const containerRef = useRef(null);

  const handleMouseUp = () => {
    if (tool !== "pen") return;
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      setSelection(sel.toString());
      setHighlights((h) => [...h, { text: sel.toString(), color: hlColor }]);
      sel.removeAllRanges();
    }
  };

  const handleTextClick = (e) => {
    if (tool !== "sticker") return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStickers((s) => [...s, { x, y, emoji: STICKERS[s.length % STICKERS.length] }]);
  };

  const setBookmark = () => {
    setBookmarkPage(book.page);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #211C3D 0%, #3B2F66 55%, #6B4C72 100%)", backgroundAttachment: "fixed" }}>
      <div className="max-w-3xl mx-auto px-5 py-6">
        <button onClick={onBack} className="flex items-center gap-1.5 mb-5" style={{ color: "#B6ACD6", fontFamily: "Tajawal", fontSize: 13 }}>
          {lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} {t.backToShelf}
        </button>

        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 22, fontWeight: 700 }}>{book.title}</h2>
            <p style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13 }}>{t.page} {book.page} {t.of} {book.totalPages}</p>
          </div>
          {bookmarkPage != null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#A78BFA22", color: "#FFB199", fontFamily: "Tajawal", fontSize: 12 }}>
              <Bookmark size={13} /> {t.bookmarkSet} {bookmarkPage}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 p-2 rounded-2xl flex-wrap" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
          <ToolBtn icon={Highlighter} active={tool === "pen"} label={t.pen} onClick={() => setTool(tool === "pen" ? null : "pen")} />
          <ToolBtn icon={Sticker} active={tool === "sticker"} label={t.sticker} onClick={() => setTool(tool === "sticker" ? null : "sticker")} />
          <ToolBtn icon={Bookmark} active={false} label={t.bookmarkTool} onClick={setBookmark} />
          {tool === "pen" && (
            <div className="flex items-center gap-1.5 ms-2">
              {HL_COLORS.map((c) => (
                <button key={c} onClick={() => setHlColor(c)} className="w-5 h-5 rounded-full"
                  style={{ background: c, outline: hlColor === c ? "2px solid #FFB199" : "none", outlineOffset: 2 }} />
              ))}
            </div>
          )}
        </div>

        {/* Page */}
        <div
          ref={containerRef}
          onMouseUp={handleMouseUp}
          onClick={handleTextClick}
          className="relative rounded-3xl p-8 md:p-12"
          style={{ background: "#F4F0FF", minHeight: 380, cursor: tool === "sticker" ? "crosshair" : "text" }}
        >
          <p style={{ fontFamily: "Amiri, serif", color: "rgba(255,255,255,0.08)", fontSize: 19, lineHeight: 2, textAlign: lang === "ar" ? "right" : "left" }}>
            {PAGE_TEXT[lang]}
          </p>
          {stickers.map((s, i) => (
            <span key={i} style={{ position: "absolute", left: s.x - 10, top: s.y - 10, fontSize: 20 }}>{s.emoji}</span>
          ))}
        </div>

        {highlights.length > 0 && (
          <div className="mt-5">
            <h3 style={{ fontFamily: "Tajawal", color: "#FFB199", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{t.recentHighlights}</h3>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="px-3 py-2 rounded-lg" style={{ background: h.color, color: "rgba(255,255,255,0.08)", fontFamily: "Tajawal", fontSize: 13 }}>
                  “{h.text}”
                </div>
              ))}
            </div>
          </div>
        )}

        {/* page nav */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => onUpdatePage(Math.max(0, book.page - 1))} className="px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#B6ACD6", fontFamily: "Tajawal", fontSize: 13 }}>
            {lang === "ar" ? "→ السابقة" : "← Prev"}
          </button>
          <button onClick={() => onUpdatePage(Math.min(book.totalPages, book.page + 1))} className="px-4 py-2 rounded-full" style={{ background: "linear-gradient(180deg,#FFB199,#A78BFA)", color: "#241F45", fontFamily: "Tajawal", fontWeight: 700, fontSize: 13 }}>
            {lang === "ar" ? "التالية ←" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon: Icon, active, label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
      style={{ background: active ? "#A78BFA33" : "transparent", color: active ? "#FFB199" : "#B6ACD6", fontFamily: "Tajawal", fontSize: 13 }}>
      <Icon size={15} /> {label}
    </button>
  );
}

// ---------------------------------------------------------------
// Add Book Modal
// ---------------------------------------------------------------
function AddBookModal({ t, lang, onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", author: "", genre: "novel", totalPages: 200, color: SPINE_COLORS[0] });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "#00000099" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontWeight: 700, fontSize: 17 }}>{t.addBook}</h3>
          <button onClick={onClose}><X size={18} color="#B6ACD6" /></button>
        </div>
        <Field label={t.title} value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Field label={t.author} value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
        <div className="mb-4">
          <label style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 12.5, display: "block", marginBottom: 5 }}>{t.genre}</label>
          <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl outline-none" style={{ background: "#211C3D", border: "1px solid rgba(255,255,255,0.18)", color: "#F4F0FF", fontFamily: "Tajawal" }}>
            {Object.entries(GENRES[lang]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <Field label={t.totalPagesField} value={form.totalPages} onChange={(v) => setForm({ ...form, totalPages: v })} type="number" />
        <div className="mb-5">
          <label style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 12.5, display: "block", marginBottom: 5 }}>{t.coverColor}</label>
          <div className="flex gap-2">
            {SPINE_COLORS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-7 h-7 rounded-full"
                style={{ background: c, outline: form.color === c ? "2px solid #FFB199" : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl" style={{ background: "#211C3D", border: "1px dashed rgba(255,255,255,0.18)" }}>
          <Upload size={15} color="#B6ACD6" />
          <span style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 12.5 }}>{t.uploadBook} (.pdf / .epub)</span>
        </div>
        <button
          disabled={!form.title}
          onClick={() => { onAdd(form); onClose(); }}
          className="w-full py-3 rounded-xl"
          style={{ background: form.title ? "linear-gradient(180deg,#FFB199,#A78BFA)" : "rgba(255,255,255,0.18)", color: "#241F45", fontFamily: "Tajawal", fontWeight: 700, opacity: form.title ? 1 : 0.6 }}>
          {t.create}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Main App
// ---------------------------------------------------------------
// Map between DB rows (snake_case) and the app's book shape (camelCase)
const rowToBook = (r) => ({
  id: r.id, title: r.title, author: r.author || "", genre: r.genre,
  totalPages: r.total_pages, page: r.page, status: r.status, color: r.color,
  words: r.words, sessions: r.sessions || [0,0,0,0,0,0,0], bookmark: r.bookmark,
});
const bookToInsertRow = (b) => ({
  title: b.title, author: b.author || "", genre: b.genre, total_pages: b.totalPages,
  page: b.page || 0, status: b.status || "want", color: b.color, words: b.words || 0,
  sessions: b.sessions || [0,0,0,0,0,0,0],
});

export default function KahfAlKutub() {
  const [lang, setLang] = useState("ar");
  const t = STR[lang];
  const [user, setUser] = useState(null);     // { name, email }
  const [token, setToken] = useState(null);   // Supabase access_token
  const [authLoading, setAuthLoading] = useState(false);
  const [view, setView] = useState("library"); // library | dashboard
  const [books, setBooks] = useState([]);
  const [openBook, setOpenBook] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved

  // --- Auth: sign in or sign up against the real Supabase backend ------
  const handleAuth = async (mode, form) => {
    const data = mode === "signup"
      ? await sb.signUp(form.email, form.password, form.name)
      : await sb.signIn(form.email, form.password);

    if (!data.access_token) {
      // Supabase project has "confirm email" turned on — no session yet.
      throw new Error(lang === "ar"
        ? "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيده ثم سجّل الدخول."
        : "Account created. Check your email to confirm it, then sign in.");
    }

    setToken(data.access_token);
    setUser({ name: data.user?.user_metadata?.name || form.email.split("@")[0], email: data.user?.email });

    // Load this user's shelf; if empty (new account), seed a starter shelf.
    let rows = await sb.listBooks(data.access_token);
    if (rows.length === 0) {
      const starter = seedBooks(lang).map(bookToInsertRow);
      rows = await sb.insertBooks(data.access_token, starter);
    }
    setBooks(rows.map(rowToBook));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setBooks([]);
  };

  // --- Persist a single book change (page turn, add, status) to Postgres
  const persistBook = async (id, patch) => {
    if (!token) return;
    setSaveState("saving");
    try {
      await sb.updateBook(token, id, patch);
      setSaveState("saved");
    } catch (e) {
      setSaveState("idle");
    }
  };

  const addBook = async (form) => {
    if (!token) return;
    const row = bookToInsertRow({
      title: form.title,
      author: form.author || (lang === "ar" ? "غير معروف" : "Unknown"),
      genre: form.genre,
      totalPages: Number(form.totalPages) || 200,
      page: 0,
      status: "want",
      color: form.color,
      words: 0,
    });
    setSaveState("saving");
    try {
      const [inserted] = await sb.insertBooks(token, [row]);
      setBooks((bs) => [...bs, rowToBook(inserted)]);
      setSaveState("saved");
    } catch (e) {
      setSaveState("idle");
    }
  };

  const quote = useMemo(() => todaysQuote(), []);
  const reader = READERS_OF_WEEK[lang][0];

  const totalHours = useMemo(() => Math.round(books.reduce((a, b) => a + b.sessions.reduce((x, y) => x + y, 0), 0) / 60 * 10) / 10, [books]);
  const finishedCount = books.filter((b) => b.status === "finished").length;
  const totalWords = books.reduce((a, b) => a + (b.status === "finished" ? b.words : Math.round(b.words * (b.page / (b.totalPages || 1)))), 0);
  const genreCounts = useMemo(() => {
    const m = {};
    books.forEach((b) => { m[b.genre] = (m[b.genre] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [books]);
  const weekData = useMemo(() => {
    const days = lang === "ar" ? ["س", "ح", "ن", "ث", "ر", "خ", "ج"] : ["S", "S", "M", "T", "W", "T", "F"];
    const totals = [0,0,0,0,0,0,0];
    books.forEach((b) => b.sessions.forEach((m, i) => totals[i] += m));
    return totals.map((v, i) => ({ day: days[i], v }));
  }, [books, lang]);
  const maxWeek = Math.max(...weekData.map((d) => d.v), 1);

  const filteredBooks = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));
  const reading = filteredBooks.filter((b) => b.status === "reading");
  const want = filteredBooks.filter((b) => b.status === "want");
  const finished = filteredBooks.filter((b) => b.status === "finished");

  const dailyLine = t.motivational[new Date().getDate() % t.motivational.length];

  if (!user) {
    return (
      <div dir={t.dir} style={{ fontFamily: "Tajawal" }}>
        <style>{FONT_IMPORTS}</style>
        <AuthScreen t={t} lang={lang} onAuth={handleAuth} onToggleLang={() => setLang(lang === "ar" ? "en" : "ar")} />
      </div>
    );
  }

  if (openBook) {
    return (
      <div dir={t.dir}>
        <style>{FONT_IMPORTS}</style>
        <ReaderView
          book={openBook}
          t={t}
          lang={lang}
          onBack={() => setOpenBook(null)}
          onUpdatePage={(p) => {
            const status = p >= openBook.totalPages ? "finished" : "reading";
            setBooks((bs) => bs.map((b) => (b.id === openBook.id ? { ...b, page: p, status } : b)));
            setOpenBook((ob) => ({ ...ob, page: p }));
            persistBook(openBook.id, { page: p, status });
          }}
        />
      </div>
    );
  }

  return (
    <div dir={t.dir} className="min-h-screen" style={{ background: "linear-gradient(160deg, #211C3D 0%, #3B2F66 55%, #6B4C72 100%)", backgroundAttachment: "fixed" }}>
      <style>{FONT_IMPORTS}</style>

      {/* Nav */}
      <div className="sticky top-0 z-40" style={{ background: "rgba(33,28,61,0.55)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(160deg,#FFB199,#A78BFA)" }}>
              <BookOpen size={18} color="#241F45" />
            </div>
            <span style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 19, fontWeight: 700 }}>{t.appName}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 p-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <NavBtn icon={Library} label={t.library} active={view === "library"} onClick={() => setView("library")} />
            <NavBtn icon={LayoutDashboard} label={t.dashboard} active={view === "dashboard"} onClick={() => setView("dashboard")} />
          </div>

          <div className="flex items-center gap-2">
            {saveState !== "idle" && (
              <span className="hidden sm:inline" style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 11 }}>
                {saveState === "saving" ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…") : (lang === "ar" ? "تم الحفظ ✓" : "Saved ✓")}
              </span>
            )}
            <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", color: "#FFB199", fontFamily: "Tajawal", fontSize: 12.5 }}>
              <Globe size={13} /> {t.switchLang}
            </button>
            <button onClick={handleLogout} title={t.logout} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#A78BFA33", color: "#F4F0FF", fontFamily: "Amiri", fontWeight: 700 }}>
              {user.name.charAt(0)}
            </button>
          </div>
        </div>
        <div className="flex md:hidden items-center gap-1 p-1 mx-5 mb-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)", width: "fit-content" }}>
          <NavBtn icon={Library} label={t.library} active={view === "library"} onClick={() => setView("library")} />
          <NavBtn icon={LayoutDashboard} label={t.dashboard} active={view === "dashboard"} onClick={() => setView("dashboard")} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {view === "library" && (
          <>
            <StoneArchHero t={t} lang={lang} onEnter={() => {}} />

            <div className="grid lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 24, fontWeight: 700 }}>{t.myShelf}</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
                      <Search size={14} color="#B6ACD6" />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchShelf}
                        style={{ background: "transparent", outline: "none", color: "#F4F0FF", fontFamily: "Tajawal", fontSize: 13, width: 130 }} />
                    </div>
                    <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-full"
                      style={{ background: "linear-gradient(180deg,#FFB199,#A78BFA)", color: "#241F45", fontFamily: "Tajawal", fontWeight: 700, fontSize: 13 }}>
                      <Plus size={15} /> {t.addBook}
                    </button>
                  </div>
                </div>

                {filteredBooks.length === 0 && (
                  <p style={{ fontFamily: "Tajawal", color: "#B6ACD6" }}>{t.emptyShelf}</p>
                )}

                {reading.length > 0 && (
                  <ShelfRow label={t.currentlyReading} books={reading} t={t} lang={lang} onOpen={setOpenBook} />
                )}
                {want.length > 0 && (
                  <ShelfRow label={t.wantToRead} books={want} t={t} lang={lang} onOpen={setOpenBook} />
                )}
                {finished.length > 0 && (
                  <ShelfRow label={t.finished} books={finished} t={t} lang={lang} onOpen={setOpenBook} />
                )}
              </div>

              <div>
                <Lantern t={t} lang={lang} reader={reader} quote={quote} />
                <div className="mt-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
                  <p style={{ fontFamily: "Amiri, serif", color: "#FFB199", fontSize: 15, lineHeight: 1.7, textAlign: "center" }}>{dailyLine}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {view === "dashboard" && (
          <>
            <div className="flex items-center gap-4 mb-7">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(160deg,#FFB199,#A78BFA)" }}>
                <span style={{ fontFamily: "Amiri", fontWeight: 700, fontSize: 26, color: "#241F45" }}>{user.name.charAt(0)}</span>
              </div>
              <div>
                <h2 style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 26, fontWeight: 700 }}>{user.name}</h2>
                <p style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13 }}>{t.keepGoing}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Clock} label={t.hoursRead} value={totalHours} />
              <StatCard icon={BookMarked} label={t.booksFinished} value={finishedCount} />
              <StatCard icon={BookOpen} label={t.wordsRead} value={totalWords.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} />
              <StatCard icon={Flame} label={t.streak} value={9} sub={lang === "ar" ? "أيام متتالية" : "consecutive days"} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
                <h3 style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontWeight: 700, fontSize: 16, marginBottom: 18 }}>{t.weeklyActivity}</h3>
                <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
                  {weekData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-full rounded-t-lg" style={{ height: `${(d.v / maxWeek) * 100}%`, minHeight: 4, background: "linear-gradient(180deg,#FFB199,#A78BFA)" }} />
                      <span style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 11 }}>{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
                <h3 style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontWeight: 700, fontSize: 16, marginBottom: 14 }}>{t.topGenres}</h3>
                <div className="space-y-3">
                  {genreCounts.map(([g, count], i) => (
                    <div key={g}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontSize: 13 }}>{GENRES[lang][g]}</span>
                        <span style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 12 }}>{count} {t.booksRead}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(count / books.length) * 100}%`, background: SPINE_COLORS[i % SPINE_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 mt-6" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
              <h3 style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontWeight: 700, fontSize: 16, marginBottom: 14 }}>{t.achievements}</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Flame, label: lang === "ar" ? "٧ أيام متتالية" : "7-Day Streak" },
                  { icon: BookMarked, label: lang === "ar" ? "أول كتاب" : "First Book" },
                  { icon: Star, label: lang === "ar" ? "قارئ مجتهد" : "Avid Reader" },
                  { icon: TrendingUp, label: lang === "ar" ? "١٠٠ ألف كلمة" : "100k Words" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: "#211C3D", border: "1px solid rgba(255,255,255,0.14)" }}>
                    <a.icon size={14} color="#FFB199" />
                    <span style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontSize: 12.5 }}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {showAdd && (
        <AddBookModal
          t={t}
          lang={lang}
          onClose={() => setShowAdd(false)}
          onAdd={addBook}
        />
      )}
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors"
      style={{ background: active ? "linear-gradient(180deg,#FFB199,#A78BFA)" : "transparent", color: active ? "#241F45" : "#B6ACD6", fontFamily: "Tajawal", fontWeight: active ? 700 : 500, fontSize: 13.5 }}>
      <Icon size={15} /> {label}
    </button>
  );
}

function ShelfRow({ label, books, t, lang, onOpen }) {
  return (
    <div className="mb-7">
      <h3 style={{ fontFamily: "Tajawal", color: "#FFB199", fontSize: 13, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>{label}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {books.map((b) => <BookSpine key={b.id} book={b} t={t} lang={lang} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

const FONT_IMPORTS = `
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; }
`;
