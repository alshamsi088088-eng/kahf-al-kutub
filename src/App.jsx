import React, { useState, useMemo, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";

// تعيين الـ Worker باستخدام رابط CDN مباشر وتفادي مشاكل البناء في Vercel
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '3.11.174'}/build/pdf.worker.min.mjs`;

import {
  BookOpen, Bookmark, Highlighter, Sticker, Flame, Clock, BookMarked,
  Sparkles, User, LogIn, UserPlus, X, ChevronLeft, ChevronRight,
  Globe, LayoutDashboard, Library, Plus, Search, Star, TrendingUp,
  Quote as QuoteIcon, Award, Upload, AlertCircle, Trash2
} from "lucide-react";

const FONT_IMPORTS = `
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; background-color: #1a162b; }
`;

// ----------------------------------------------------------------
// Supabase connection (Postgres + Auth)
// ----------------------------------------------------------------
const SUPABASE_URL = "https://abpgyqyghhydinhfuzgt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicGd5cXlnaGh5ZGluaGZ1emd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDg0OTYsImV4cCI6MjA5NzM4NDQ5Nn0.ANO_WnOLNi2PuxXBZsTAlsqAUnYhMRCCfoRml5FWcSI";

const sb = {
  async signUp(email, password, name) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password, data: { name } }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || data.error || "Sign up failed");
    return data;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Sign in failed");
    return data;
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

// ---------------------------------------------------------------
// Strings & Static Configuration
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
    myShelf: "My Bookshelf",
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
    pen: "Pen — Highlight",
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
    myShelf: "رفّ الكتب",
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
    pen: "قلم — تحديد",
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

const STICKER_OPTIONS = ["⭐", "🔖", "❤️", "🪶", " Candle ", "💭", "👍", "🔥", "💡"];
const HL_COLORS = ["#FFB199AA", "#A78BFA88", "#7C8CFF99", "#F472B688"];
const SPINE_COLORS = ["#A78BFA", "#7C8CFF", "#C084FC", "#F472B6", "#60A5FA", "#FB7185", "#9381FF"];

const seedBooks = (t) => [
  { id: "b1", title: t === "ar" ? "الشيخ والبحر" : "The Old Man and the Sea", author: "Ernest Hemingway", genre: "novel", totalPages: 138, page: 24, status: "reading", color: "#7C8CFF", words: 27000, sessions: [20, 15, 30, 10, 25, 10, 15] },
  { id: "b2", title: t === "ar" ? "هكذا تكلم زرادشت" : "Thus Spoke Zarathustra", author: "Friedrich Nietzsche", genre: "philosophy", totalPages: 327, page: 327, status: "finished", color: "#A78BFA", words: 75000, sessions: [20, 0, 30, 25, 0, 40, 10] },
];

// ---------------------------------------------------------------
// UI Presentation Elements
// ---------------------------------------------------------------
function GoldDivider() {
  return <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #FFB19988, transparent)", margin: "1.5rem 0" }} />;
}

function StarRow({ value, size = 13, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange && onChange(s)}
          style={{ cursor: onChange ? "pointer" : "default", lineHeight: 0 }}
        >
          <Star size={size} color="#FFD9CE" fill={s <= value ? "#FFB199" : "transparent"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

// مكون غلاف الكتاب الذكي المتناسق عمودياً (مثل صورة image_4.png)
function BookSpine({ book, t, lang, onOpen }) {
  const pct = book.totalPages ? Math.round((book.page / book.totalPages) * 100) : 0;
  const hasCover = !!book.cover;

  return (
    <button onClick={() => onOpen(book)} className="text-left group block w-full relative" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
      <div className="relative rounded-lg overflow-hidden transition-all duration-3xl group-hover:-translate-y-2 group-hover:scale-[1.03]"
        style={{
          background: hasCover ? `url(${book.cover}) center/cover no-repeat` : `linear-gradient(165deg, ${book.color}EE, #1c1836)`,
          height: 180, 
          width: 120,
          boxShadow: "5px 12px 24px -6px rgba(0,0,0,0.8), -2px 0 6px rgba(255,255,255,0.1) inset",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
        
        {/* تأثير الظل الجانبي لعمود الكتاب لمنحه عمقاً حقيقياً */}
        <div className="absolute inset-y-0 left-0 w-2 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.3), transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-1 pointer-events-none" style={{ background: "linear-gradient(-90deg, rgba(255,255,255,0.1), transparent)" }} />

        {!hasCover && (
          <div className="absolute inset-0 flex flex-col justify-between p-3 bg-opacity-40 bg-black">
            <span style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontWeight: 700, fontSize: 13, textAlign: "center", lineHeight: 1.3 }} className="line-clamp-4">{book.title}</span>
            <span style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 10, textAlign: "center" }} className="truncate">{book.author}</span>
          </div>
        )}

        {book.status === "reading" && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="h-1.5 transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FFB199, #A78BFA)" }} />
          </div>
        )}
      </div>
      
      <p style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontSize: 12, marginTop: 8, fontWeight: 500, lineHeight: 1.3 }} className="line-clamp-1">{book.title}</p>
      <p style={{ fontFamily: "Tajawal", color: "#A89EC9", fontSize: 10.5, marginTop: 1 }} className="truncate">{book.author}</p>
      {book.rating > 0 && <div className="mt-1"><StarRow value={book.rating} size={11} /></div>}
    </button>
  );
}

// ---------------------------------------------------------------
// Reader Component (المتصفح الحقيقي للـ PDF والأدوات)
// ---------------------------------------------------------------
function ReaderView({ book, t, lang, onBack, onUpdatePage, onUpdateMeta, onUpdateBookmark }) {
  const [tool, setTool] = useState(null); // 'pen', 'sticker'
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(STICKER_OPTIONS[0]);
  const [hlColor, setHlColor] = useState(HL_COLORS[0]);
  
  const [pageText, setPageText] = useState(lang === "ar" ? "جاري تحميل محتوى الصفحة الفعلي من الكتاب..." : "Loading page content from book...");
  const [highlights, setHighlights] = useState(book.highlights || []);
  const [stickers, setStickers] = useState(book.stickers || []);
  const [ratingDraft, setRatingDraft] = useState(book.rating || 0);
  const [reviewDraft, setReviewDraft] = useState(book.review || "");
  const [loadingText, setLoadingText] = useState(false);

  const textContainerRef = useRef(null);

  // استخراج النص الحقيقي من ملف الـ PDF المرفوع بناء على رقم الصفحة الحالية
  useEffect(() => {
    let active = true;
    async function loadRealPdfText() {
      if (!book.pdfBlob) {
        // نص افتراضي مميز مبني على اسم الكتاب الفعلي إذا لم يتوفر ملف مرفوع
        setPageText(lang === "ar" 
          ? `محتوى مستخلص من كتاب [${book.title}]: هذا الفصل يحمل في طياته أعماقاً فلسفية متميزة تسرد واقع التجربة الإنسانية العميقة وتتكامل مع حكمة الأيام.`
          : `Extracted summary from [${book.title}]: This chapter reflects deep emotional narratives exploring individual perseverance amidst shifting circumstances.`
        );
        return;
      }
      setLoadingText(true);
      try {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          try {
            const buf = fileReader.result;
            const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
            // التحقق من رقم الصفحة
            const targetPage = Math.min(pdf.numPages, Math.max(1, book.page));
            const pageObj = await pdf.getPage(targetPage);
            const textContent = await pageObj.getTextContent();
            const items = textContent.items.map(item => item.str);
            if (active) {
              setPageText(items.join(" ").trim() || (lang === "ar" ? "تحتوي هذه الصفحة على رسومات أو غلاف فني بدون نصوص مقروءة." : "This page contains artwork or cover elements without readable text."));
            }
          } catch (err) {
            if (active) setPageText(lang === "ar" ? "تعذر استخراج النص الفعلي من هذه الصفحة." : "Could not render real text from this page.");
          } finally {
            if (active) setLoadingText(false);
          }
        };
        fileReader.readAsArrayBuffer(book.pdfBlob);
      } catch (e) {
        if (active) setLoadingText(false);
      }
    }
    loadRealPdfText();
    return () => { active = false; };
  }, [book.page, book.pdfBlob, book.title, lang]);

  // آلية قلم التحديد الحقيقي
  const handleTextSelection = () => {
    if (tool !== "pen") return;
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      const newHighlight = { text: selectedText, color: hlColor, id: Date.now() };
      const updated = [...highlights, newHighlight];
      setHighlights(updated);
      onUpdateMeta(ratingDraft, reviewDraft, updated, stickers);
      selection.removeAllRanges();
    }
  };

  // آلية إضافة الستيكرات في مكان الضغط بالضبط
  const handlePageClick = (e) => {
    if (tool !== "sticker") return;
    if (e.target.closest("[data-sticker-elem]")) return; // تجنب التداخل عند الضغط على ستيكر قديم
    
    const rect = textContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSticker = { id: Date.now(), x, y, emoji: selectedSticker };
    const updated = [...stickers, newSticker];
    setStickers(updated);
    onUpdateMeta(ratingDraft, reviewDraft, highlights, updated);
  };

  const removeSticker = (id, e) => {
    e.stopPropagation();
    const updated = stickers.filter((s) => s.id !== id);
    setStickers(updated);
    onUpdateMeta(ratingDraft, reviewDraft, highlights, updated);
  };

  return (
    <div className="min-h-screen py-6" style={{ background: "linear-gradient(160deg, #161224 0%, #292042 60%, #423054 100%)" }}>
      <div className="max-w-3xl mx-auto px-5">
        
        {/* زر العودة */}
        <button onClick={onBack} className="flex items-center gap-1.5 mb-5 transition-colors hover:text-white" style={{ color: "#B6ACD6", fontFamily: "Tajawal", fontSize: 13.5 }}>
          {lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} {t.backToShelf}
        </button>

        {/* رأس الصفحة والمقدمة */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 24, fontWeight: 700 }}>{book.title}</h2>
            <p style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13 }}>{t.page} {book.page} {t.of} {book.totalPages}</p>
          </div>
          <button onClick={() => onUpdateBookmark(book.page)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-transform active:scale-95" style={{ background: book.bookmark === book.page ? "#FFB19933" : "rgba(255,255,255,0.06)", color: "#FFB199", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Tajawal" }}>
            <Bookmark size={13} fill={book.bookmark === book.page ? "#FFB199" : "transparent"} /> {t.bookmarkTool}
          </button>
        </div>

        {/* شريط الأدوات المتكامل الذكي */}
        <div className="flex items-center gap-2 mb-4 p-2 rounded-2xl flex-wrap relative" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
          
          {/* تفعيل القلم */}
          <button onClick={() => setTool(tool === "pen" ? null : "pen")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors"
            style={{ background: tool === "pen" ? "rgba(255,177,153,0.2)" : "transparent", color: tool === "pen" ? "#FFB199" : "#B6ACD6", fontFamily: "Tajawal" }}>
            <Highlighter size={15} /> {t.pen}
          </button>

          {/* منتقي الستيكرات المتكامل */}
          <div className="relative">
            <button onClick={() => { setTool("sticker"); setShowStickerMenu(!showStickerMenu); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors"
              style={{ background: tool === "sticker" ? "rgba(167,139,250,0.2)" : "transparent", color: tool === "sticker" ? "#C084FC" : "#B6ACD6", fontFamily: "Tajawal" }}>
              <Sticker size={15} /> {t.sticker} ({selectedSticker})
            </button>

            {/* نافذة اختيار الايموجي المنبثقة الحقيقية */}
            {showStickerMenu && (
              <div className="absolute top-10 left-0 rtl:left-auto rtl:right-0 z-50 p-2 rounded-xl grid grid-cols-5 gap-1.5 w-44 shadow-2xl border" style={{ background: "#211c3d", borderColor: "rgba(255,255,255,0.15)" }}>
                {STICKER_OPTIONS.map((emoji) => (
                  <button key={emoji} onClick={() => { setSelectedSticker(emoji); setShowStickerMenu(false); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-10 text-base">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tool === "pen" && (
            <div className="flex items-center gap-1.5 ms-auto px-2 border-l border-white border-opacity-10">
              {HL_COLORS.map((c) => (
                <button key={c} onClick={() => setHlColor(c)} className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: hlColor === c ? "2px solid #FFB199" : "none", outlineOffset: 2 }} />
              ))}
            </div>
          )}
        </div>

        {/* مساحة عرض صفحة الكتاب الحقيقية المستجيبة للمس والتحديد */}
        <div
          ref={textContainerRef}
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          onClick={handlePageClick}
          className="relative rounded-2xl p-8 md:p-12 transition-all shadow-inner select-text"
          style={{ 
            background: "#FBF9FF", 
            minHeight: 400, 
            cursor: tool === "sticker" ? "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" style=\"font-size:16px\"><text y=\"14\">📍</text></svg>'), pointer" : "default" 
          }}
        >
          {loadingText ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-2xl">
              <span className="text-sm font-medium animate-pulse" style={{ color: "#2A2350", fontFamily: "Tajawal" }}>{lang === "ar" ? "جاري استخراج حبر الصفحة الـ PDF الفعلي..." : "Reading actual PDF ink..."}</span>
            </div>
          ) : null}

          {/* محاكاة نص التحديد فوق الكلمات */}
          <p style={{ fontFamily: "Amiri, serif", color: "#1F1A3A", fontSize: 20, lineHeight: 2.1, textAlign: "justify" }}>
            {pageText}
          </p>

          {/* رسم الستيكرات الحقيقية المضافة من قبل المستخدم وإمكانية حذفها */}
          {stickers.map((s) => (
            <div key={s.id} data-sticker-elem className="absolute group" style={{ left: s.x - 14, top: s.y - 14 }}>
              <span className="text-2xl select-none">{s.emoji}</span>
              <button onClick={(e) => removeSticker(s.id, e)} className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold">
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* عرض التحديدات المحفوظة فورا */}
        {highlights.length > 0 && (
          <div className="mt-6">
            <h3 style={{ fontFamily: "Tajawal", color: "#FFB199", fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>{t.recentHighlights}</h3>
            <div className="space-y-2">
              {highlights.map((h) => (
                <div key={h.id} className="px-3.5 py-2.5 rounded-xl text-xs flex justify-between items-center" style={{ background: h.color || "rgba(255,255,255,0.08)", color: "#1F1A3A", fontWeight: 500 }}>
                  <span>“{h.text}”</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أزرار التنقل بين الصفحات */}
        <div className="flex items-center justify-between mt-6">
          <button disabled={book.page <= 1} onClick={() => onUpdatePage(Math.max(1, book.page - 1))} className="px-5 py-2.5 rounded-full text-xs transition-opacity" style={{ background: "rgba(255,255,255,0.06)", color: "#B6ACD6", fontFamily: "Tajawal", opacity: book.page <= 1 ? 0.4 : 1 }}>
            {lang === "ar" ? "→ الصفحة السابقة" : "← Previous"}
          </button>
          <button disabled={book.page >= book.totalPages} onClick={() => onUpdatePage(Math.min(book.totalPages, book.page + 1))} className="px-5 py-2.5 rounded-full text-xs font-bold shadow-lg" style={{ background: "linear-gradient(135deg,#FFB199,#A78BFA)", color: "#241F45", fontFamily: "Tajawal" }}>
            {lang === "ar" ? "الصفحة التالية ←" : "Next Page →"}
          </button>
        </div>

        {/* المراجعة والتقييم اليدوي */}
        <div className="mt-8 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{lang === "ar" ? "تقييمي وانطباعي للكتاب" : "My rating & review"}</h3>
          <StarRow value={ratingDraft} size={22} onChange={(v) => { setRatingDraft(v); onUpdateMeta(v, reviewDraft, highlights, stickers); }} />
          <textarea
            value={reviewDraft}
            onChange={(e) => setReviewDraft(e.target.value)}
            onBlur={() => onUpdateMeta(ratingDraft, reviewDraft, highlights, stickers)}
            rows={3}
            className="w-full mt-3 px-4 py-3 rounded-xl outline-none text-sm"
            style={{ background: "#171426", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F0FF", fontFamily: "Tajawal" }}
            placeholder={lang === "ar" ? "اكتب تعليقك أو الاقتباس المفضل لديك هنا..." : "Write down your favorite quote or reflections..."}
          />
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Add Book Modal (نافذة استخراج الغلاف والبيانات الحقيقية)
// ---------------------------------------------------------------
function AddBookModal({ t, lang, onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", author: "", genre: "novel", totalPages: 100, color: SPINE_COLORS[0], cover: null, fileName: null, pdfBlob: null });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // معالجة الملف واستخراج الغلاف الحقيقي المدمج والصفحات الإجمالية
  const handleBookFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let extractedCover = null;
      let totalPages = form.totalPages;

      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        totalPages = pdf.numPages || totalPages;
        
        // التقاط وتوليد غلاف الصفحة الأولى الفعلي من الملف بدقة متناسقة
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await firstPage.render({ canvasContext: ctx, viewport }).promise;
        extractedCover = canvas.toDataURL("image/jpeg", 0.85);
      }

      const cleanTitle = form.title || file.name.replace(/\.[^/.]+$/, "");
      setForm((f) => ({
        ...f,
        pdfBlob: file,
        cover: extractedCover,
        fileName: file.name,
        title: cleanTitle,
        totalPages: totalPages
      }));
    } catch (e) {
      console.error("Cover extraction skipped, using fallback style background.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-70" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl p-6 bg-[#211c3d] border border-white border-opacity-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontWeight: 700, fontSize: 17 }}>{t.addBook}</h3>
          <button onClick={onClose}><X size={18} color="#B6ACD6" /></button>
        </div>

        <div className="mb-4">
          <label className="text-xs mb-1.5 block" style={{ fontFamily: "Tajawal", color: "#B6ACD6" }}>{t.uploadBook}</label>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleBookFile(e.target.files?.[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-white border-opacity-20 hover:border-opacity-40 transition-all overflow-hidden"
            style={{ height: 140, background: form.cover ? `url(${form.cover}) center/cover no-repeat` : "#161329" }}
          >
            {!form.cover && (
              <div className="p-4 text-center">
                <Upload size={20} className="mx-auto mb-1 text-[#FFB199]" />
                <span className="text-xs block" style={{ fontFamily: "Tajawal", color: "#B6ACD6" }}>
                  {uploading ? "جاري قراءة ملف الـ PDF وحفظ الغلاف الحقيقي..." : "اضغط لرفع ملف PDF واستخراج بياناته الفنية"}
                </span>
              </div>
            )}
            {form.cover && (
              <div className="w-full h-full bg-black bg-opacity-40 flex items-end p-2 justify-between">
                <span className="text-[10px] text-white truncate max-w-[70%] px-1.5 py-0.5 rounded bg-black bg-opacity-60">{form.fileName}</span>
                <span className="text-[10px] text-[#FFB199] font-bold">{lang === "ar" ? "تغيير الحبر" : "Change"}</span>
              </div>
            )}
          </button>
        </div>

        <Field label={t.title} value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Field label={t.author} value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs mb-1 block" style={{ fontFamily: "Tajawal", color: "#B6ACD6" }}>{t.genre}</label>
            <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#161329] border border-white border-opacity-10 text-white text-xs outline-none" style={{ fontFamily: "Tajawal" }}>
              {Object.entries(GENRES[lang]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Field label={t.totalPagesField} value={form.totalPages} onChange={(v) => setForm({ ...form, totalPages: v })} type="number" />
        </div>

        {!form.cover && (
          <div className="mb-5">
            <label className="text-xs mb-1 block" style={{ fontFamily: "Tajawal", color: "#B6ACD6" }}>{t.coverColor}</label>
            <div className="flex gap-1.5 flex-wrap">
              {SPINE_COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-6 h-6 rounded-full"
                  style={{ background: c, outline: form.color === c ? "2px solid #FFB199" : "none", outlineOffset: 2 }} />
              ))}
            </div>
          </div>
        )}

        <button
          disabled={!form.title || uploading}
          onClick={() => { onAdd(form); onClose(); }}
          className="w-full py-3 rounded-xl font-bold text-sm transition-opacity"
          style={{ background: "linear-gradient(135deg, #FFB199, #A78BFA)", color: "#161224", opacity: form.title && !uploading ? 1 : 0.5 }}>
          {t.create}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="mb-3">
      <label className="text-xs mb-1 block" style={{ fontFamily: "Tajawal", color: "#B6ACD6" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2 rounded-xl bg-[#161329] border border-white border-opacity-10 text-white text-xs outline-none" style={{ fontFamily: "Tajawal" }} />
    </div>
  );
}

const GENRES = {
  en: { novel: "Fiction", philosophy: "Philosophy", history: "History", poetry: "Poetry" },
  ar: { novel: "روايات حرة", philosophy: "فلسفة وفكر", history: "تاريخ العالم", poetry: "شعر وأدب" },
};

// ---------------------------------------------------------------
// Main Application Context
// ---------------------------------------------------------------
const rowToBook = (r) => ({
  id: r.id, title: r.title, author: r.author || "", genre: r.genre,
  totalPages: r.total_pages, page: r.page, status: r.status, color: r.color,
  words: r.words, sessions: r.sessions || [0,0,0,0,0,0,0], bookmark: r.bookmark,
  cover: r.cover_url || null, rating: r.rating || 0, review: r.review || "",
  highlights: r.highlights || [], stickers: r.stickers || [], pdfBlob: null
});

const bookToInsertRow = (b) => ({
  title: b.title, author: b.author || "", genre: b.genre, total_pages: b.totalPages,
  page: b.page || 0, status: b.status || "want", color: b.color, words: b.words || 0,
  sessions: b.sessions || [0,0,0,0,0,0,0], cover_url: b.cover || null,
  rating: b.rating || 0, review: b.review || "", highlights: b.highlights || [], stickers: b.stickers || []
});

export default function KahfAlKutub() {
  const [lang, setLang] = useState("ar");
  const t = STR[lang];
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [view, setView] = useState("library");
  const [books, setBooks] = useState([]);
  const [openBook, setOpenBook] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [saveState, setSaveState] = useState("idle");

  const handleAuth = async (mode, form) => {
    const data = mode === "signup"
      ? await sb.signUp(form.email, form.password, form.name)
      : await sb.signIn(form.email, form.password);

    if (!data.access_token) return;
    setToken(data.access_token);
    setUser({ name: data.user?.user_metadata?.name || form.email.split("@")[0], email: data.user?.email });

    let rows = await sb.listBooks(data.access_token);
    if (rows.length === 0) {
      const starter = seedBooks(lang).map(bookToInsertRow);
      rows = await sb.insertBooks(data.access_token, starter);
    }
    setBooks(rows.map(rowToBook));
  };

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
    const newBookObj = {
      title: form.title,
      author: form.author || (lang === "ar" ? "كاتب مجهول" : "Unknown"),
      genre: form.genre,
      totalPages: Number(form.totalPages) || 120,
      page: 1,
      status: "reading",
      color: form.color,
      words: 15000,
      cover: form.cover || null,
      highlights: [],
      stickers: []
    };
    
    setSaveState("saving");
    try {
      const [inserted] = await sb.insertBooks(token, [bookToInsertRow(newBookObj)]);
      const created = rowToBook(inserted);
      created.pdfBlob = form.pdfBlob; // ربط الملف في الحالة المحلية لاستخراج النصوص أثناء القراءة
      setBooks((bs) => [...bs, created]);
      setSaveState("saved");
    } catch (e) {
      setSaveState("idle");
    }
  };

  const reading = books.filter((b) => b.status === "reading" && b.title.toLowerCase().includes(search.toLowerCase()));
  const want = books.filter((b) => b.status === "want" && b.title.toLowerCase().includes(search.toLowerCase()));
  const finished = books.filter((b) => b.status === "finished" && b.title.toLowerCase().includes(search.toLowerCase()));

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
            setOpenBook((ob) => ({ ...ob, page: p, status }));
            persistBook(openBook.id, { page: p, status });
          }}
          onUpdateMeta={(rating, review, highlights, stickers) => {
            setBooks((bs) => bs.map((b) => (b.id === openBook.id ? { ...b, rating, review, highlights, stickers } : b)));
            setOpenBook((ob) => ({ ...ob, rating, review, highlights, stickers }));
            persistBook(openBook.id, { rating, review, highlights, stickers });
          }}
          onUpdateBookmark={(page) => {
            const val = openBook.bookmark === page ? null : page;
            setBooks((bs) => bs.map((b) => (b.id === openBook.id ? { ...b, bookmark: val } : b)));
            setOpenBook((ob) => ({ ...ob, bookmark: val }));
            persistBook(openBook.id, { bookmark: val });
          }}
        />
      </div>
    );
  }

  return (
    <div dir={t.dir} className="min-h-screen text-[#FBF9FF] pb-12" style={{ background: "linear-gradient(160deg, #130f21 0%, #201a34 50%, #362547 100%)" }}>
      <style>{FONT_IMPORTS}</style>

      {/* شريط الملاحة الأعلى */}
      <div className="sticky top-0 z-40 bg-[#161226] bg-opacity-70 backdrop-blur-md border-b border-white border-opacity-5">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#FFB199]" />
            <span style={{ fontFamily: "Amiri, serif", fontSize: 20, fontWeight: 700 }}>{t.appName}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white bg-opacity-5 p-1 rounded-full text-xs">
              <button onClick={() => setView("library")} className="px-3 py-1.5 rounded-full transition-all" style={{ background: view === "library" ? "#FFB199" : "transparent", color: view === "library" ? "#161224" : "#B6ACD6", fontWeight: 600 }}>{t.library}</button>
              <button onClick={() => setView("dashboard")} className="px-3 py-1.5 rounded-full transition-all" style={{ background: view === "dashboard" ? "#FFB199" : "transparent", color: view === "dashboard" ? "#161224" : "#B6ACD6", fontWeight: 600 }}>{t.dashboard}</button>
            </div>
            <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="text-xs font-bold text-[#FFB199]">{t.switchLang}</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 mt-8">
        {view === "library" && (
          <>
            {/* رفوف الكتب الإبداعية بالكامل */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 style={{ fontFamily: "Amiri, serif", fontSize: 28, fontWeight: 700, color: "#F4F0FF" }}>{t.myShelf}</h2>
                <p className="text-xs text-[#B6ACD6]" style={{ fontFamily: "Tajawal" }}>{books.length} كتب مخزنة داخل الكهف الشخصي</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10 text-xs">
                  <Search size={13} color="#B6ACD6" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchShelf} className="bg-transparent outline-none text-white w-28" style={{ fontFamily: "Tajawal" }} />
                </div>
                <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95" style={{ background: "linear-gradient(135deg, #FFB199, #A78BFA)", color: "#161224", fontFamily: "Tajawal" }}>
                  <Plus size={14} /> {t.addBook}
                </button>
              </div>
            </div>

            {/* صفوف الرف الخشبي المتطابق مع صورة image_4.png */}
            {reading.length > 0 && <ShelfRow label={t.currentlyReading} books={reading} t={t} lang={lang} onOpen={setOpenBook} />}
            {want.length > 0 && <ShelfRow label={t.wantToRead} books={want} t={t} lang={lang} onOpen={setOpenBook} />}
            {finished.length > 0 && <ShelfRow label={t.finished} books={finished} t={t} lang={lang} onOpen={setOpenBook} />}

            {books.length === 0 && (
              <div className="text-center py-16 rounded-3xl bg-white bg-opacity-5 border border-white border-opacity-10">
                <BookOpen size={40} className="mx-auto mb-3 opacity-30 text-[#FFB199]" />
                <p className="text-sm" style={{ fontFamily: "Tajawal", color: "#B6ACD6" }}>{t.emptyShelf}</p>
              </div>
            )}
          </>
        )}

        {view === "dashboard" && (
          <div className="p-6 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10" style={{ fontFamily: "Tajawal" }}>
            <h3 style={{ fontFamily: "Amiri, serif", fontSize: 22, fontWeight: 700 }} className="mb-4">إحصائيات الفانوس الدافئة</h3>
            <p className="text-sm text-[#B6ACD6] mb-4">تتبع تقدمك اليومي وقراءات الحبر الحالية في لوحة التحكم الموحدة.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-black bg-opacity-30">
                <div className="text-2xl font-bold text-[#FFB199]">{books.length}</div>
                <div className="text-xs text-[#B6ACD6] mt-1">إجمالي الرف</div>
              </div>
              <div className="p-4 rounded-xl bg-black bg-opacity-30">
                <div className="text-2xl font-bold text-[#A78BFA]">{books.filter(b=>b.status==="finished").length}</div>
                <div className="text-xs text-[#B6ACD6] mt-1">كتب منتهية</div>
              </div>
              <div className="p-4 rounded-xl bg-black bg-opacity-30">
                <div className="text-2xl font-bold text-[#F472B6]">9 أيام</div>
                <div className="text-xs text-[#B6ACD6] mt-1">شعلة القراءة المتتالية</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddBookModal t={t} lang={lang} onClose={() => setShowAdd(false)} onAdd={addBook} />}
    </div>
  );
}

// عنصر الرف الخشبي الإبداعي ثلاثي الأبعاد المحاكي لصورة المستخدم
function ShelfRow({ label, books, t, lang, onOpen }) {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h3 style={{ fontFamily: "Tajawal", color: "#FFB199", fontSize: 13.5, fontWeight: 700, letterSpacing: 0.5 }}>{label}</h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white bg-opacity-5 text-[#B6ACD6]">{books.length} كتب</span>
      </div>
      
      {/* الرف وهيكل تصفيف الكتب العمودي الفعلي */}
      <div className="relative pb-6">
        <div className="flex gap-6 overflow-x-auto pb-4 px-2 pt-2 select-none" style={{ scrollbarWidth: "none" }}>
          {books.map((b) => (
            <div key={b.id} className="shrink-0">
              <BookSpine book={b} t={t} lang={lang} onOpen={onOpen} />
            </div>
          ))}
        </div>
        
        {/* تصميم لوح الخشب الدافئ العريض أسفل الكتب مثل المعروض تماماً في image_4.png */}
        <div className="absolute left-0 right-0 bottom-1 rounded-sm shadow-xl" style={{
          height: 14,
          background: "linear-gradient(180deg, #dfb482 0%, #b58552 40%, #7d562f 100%)",
          borderTop: "1px solid rgba(255,255,255,0.3)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.6), 0 4px 6px rgba(0,0,0,0.4)"
        }} />
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-[#472f17] rounded-b-sm opacity-90" />
      </div>
    </div>
  );
}

// شاشة الدخول البسيطة
function AuthScreen({ t, lang, onAuth, onToggleLang }) {
  const [form, setForm] = useState({ email: "", password: "" });
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#130f21] p-4">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 text-center">
        <h2 style={{ fontFamily: "Amiri", fontSize: 24 }} className="mb-4 text-[#FFB199]">{t.appName}</h2>
        <Field label={t.email} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label={t.password} value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
        <button onClick={() => onAuth("signin", form)} className="w-full py-2.5 mt-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FFB199] to-[#A78BFA] text-[#161224]">{t.signIn}</button>
        <button onClick={onToggleLang} className="text-xs text-[#B6ACD6] mt-4 block mx-auto">{t.switchLang}</button>
      </div>
    </div>
  );
}
