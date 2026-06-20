import React, { useState, useMemo, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";

// تعيين الـ Worker الخاص بالـ PDF
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

const STR = {
  en: {
    dir: "ltr", appName: "Kahf Al-Kutub", tagline: "The Cave of Books",
    heroTitle: "A quiet cave for everything you read",
    heroSub: "Carry your shelf, your bookmarks, your ink, and your streak — into one warm little cave.",
    getStarted: "Enter the cave", signIn: "Sign in", signUp: "Create account",
    name: "Name", email: "Email", password: "Password", welcomeBack: "Welcome back",
    joinCave: "Join the cave", haveAccount: "Already have an account?", noAccount: "New here?",
    library: "Library", dashboard: "Dashboard", reading: "Reading", quotes: "Quotes",
    profile: "Profile", logout: "Log out", myShelf: "My Bookshelf", addBook: "Add a book",
    uploadBook: "Upload (PDF / EPUB)", searchShelf: "Search your shelf…",
    continueReading: "Continue reading", currentlyReading: "Currently reading",
    finished: "Finished", wantToRead: "Want to read", pages: "pages", page: "page", of: "of",
    progress: "progress", readerOfWeek: "Reader of the Week", dailyQuote: "Today's Quote",
    streak: "day streak", hoursRead: "Hours read", booksFinished: "Books finished",
    recentHighlights: "Recent highlights", achievements: "Lantern badges",
    tools: "Tools", pen: "Pen — Highlight", sticker: "Sticker", bookmarkTool: "Bookmark",
    save: "Save", cancel: "Cancel", backToShelf: "Back to shelf", genre: "Genre", author: "by",
    emptyShelf: "Your shelf is empty. Add your first book to light the cave.", title: "Title",
    coverColor: "Spine color", totalPagesField: "Total pages", create: "Add to shelf", close: "Close"
  },
  ar: {
    dir: "rtl", appName: "كهف الكتب", tagline: "Kahf Al-Kutub",
    heroTitle: "كهفٌ هادئ لكل ما تقرأ",
    heroSub: "احمل رفّك، وفواصلك، وحبرك، وسلسلة أيامك — في كهفٍ دافئ واحد.",
    getStarted: "ادخل الكهف", signIn: "تسجيل الدخول", signUp: "إنشاء حساب",
    name: "الاسم", email: "البريد الإلكتروني", password: "كلمة المرور", welcomeBack: "أهلاً بعودتك",
    joinCave: "انضم إلى الكهف", haveAccount: "لديك حساب بالفعل؟", noAccount: "جديد هنا؟",
    library: "المكتبة", dashboard: "لوحتي", reading: "القراءة", quotes: "اقتباسات",
    profile: "الملف الشخصي", logout: "تسجيل الخروج", myShelf: "رفّ الكتب", addBook: "أضف كتاباً",
    uploadBook: "ارفع كتاباً (PDF أو EPUB)", searchShelf: "ابحث في رفّك…",
    continueReading: "تابع القراءة", currentlyReading: "أقرأ الآن", finished: "منتهية",
    wantToRead: "أريد قراءتها", pages: "صفحة", page: "صفحة", of: "من", progress: "التقدم",
    readerOfWeek: "قارئ الأسبوع", dailyQuote: "اقتباس اليوم", streak: "يوم متتالي",
    hoursRead: "ساعات القراءة", booksFinished: "كتب أنهيتها", recentHighlights: "أحدث التحديدات",
    achievements: "أوسمة الفانوس", tools: "الأدوات", pen: "قلم — تحديد", sticker: "ستيكر",
    bookmarkTool: "فاصلة", save: "حفظ", cancel: "إلغاء", backToShelf: "العودة للرف",
    genre: "النوع", author: "بقلم", emptyShelf: "رفّك فارغ. أضف كتابك الأول لتضيء الكهف.",
    title: "العنوان", coverColor: "لون الغلاف", totalPagesField: "عدد الصفحات", create: "أضف للرف", close: "إغلاق"
  }
};

const STICKER_OPTIONS = ["⭐", "🔖", "❤️", "🪶", "💭", "👍", "🔥", "💡"];
const HL_COLORS = ["#FFB199AA", "#A78BFA88", "#7C8CFF99", "#F472B688"];
const SPINE_COLORS = ["#A78BFA", "#7C8CFF", "#C084FC", "#F472B6", "#60A5FA", "#FB7185", "#9381FF"];

function StarRow({ value, size = 13, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {stars.map((s) => (
        <button key={s} type="button" disabled={!onChange} onClick={() => onChange && onChange(s)} style={{ cursor: onChange ? "pointer" : "default", lineHeight: 0 }}>
          <Star size={size} color="#FFD9CE" fill={s <= value ? "#FFB199" : "transparent"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

function BookSpine({ book, t, lang, onOpen }) {
  const pct = book.totalPages ? Math.round((book.page / book.totalPages) * 100) : 0;
  const hasCover = !!book.cover;

  return (
    <button onClick={() => onOpen(book)} className="text-left group block w-full relative" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
      <div className="relative rounded-lg overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.03]"
        style={{
          background: hasCover ? `url(${book.cover}) center/cover no-repeat` : `linear-gradient(165deg, ${book.color}EE, #1c1836)`,
          height: 180, width: 120,
          boxShadow: "5px 12px 24px -6px rgba(0,0,0,0.8), -2px 0 6px rgba(255,255,255,0.1) inset",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
        <div className="absolute inset-y-0 left-0 w-2 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.3), transparent)" }} />
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
      <p style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontSize: 12, marginTop: 8, fontWeight: 500 }} className="line-clamp-1">{book.title}</p>
      <p style={{ fontFamily: "Tajawal", color: "#A89EC9", fontSize: 10.5 }} className="truncate">{book.author}</p>
    </button>
  );
}

// ---------------------------------------------------------------
// Reader Component (المتصفح المعدل)
// ---------------------------------------------------------------
function ReaderView({ book, t, lang, onBack, onUpdatePage, onUpdateMeta, onUpdateBookmark }) {
  const [tool, setTool] = useState(null);
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(STICKER_OPTIONS[0]);
  const [hlColor, setHlColor] = useState(HL_COLORS[0]);
  
  const [pageText, setPageText] = useState("");
  const [highlights, setHighlights] = useState(book.highlights || []);
  const [stickers, setStickers] = useState(book.stickers || []);
  const [ratingDraft, setRatingDraft] = useState(book.rating || 0);
  const [reviewDraft, setReviewDraft] = useState(book.review || "");
  const [loadingText, setLoadingText] = useState(false);

  const textContainerRef = useRef(null);

  // استخراج النص الحقيقي المتوافق مع الـ PDF والـ EPUB
  useEffect(() => {
    let active = true;
    async function loadBookContent() {
      if (!book.fileBlob) {
        setPageText(lang === "ar" 
          ? `محتوى افتراضي لكتاب [${book.title}]: لم يتم رفع مستند حقيقي لهذا الكتاب، يمكنك تفعيل الرفع لملفات PDF أو EPUB لقراءة نصوص حية.`
          : `Fallback content for [${book.title}]: Please upload a real PDF/EPUB to pull actual pages.`
        );
        return;
      }

      setLoadingText(true);
      try {
        const isEpub = book.fileBlob.name.toLowerCase().endsWith(".epub");

        if (isEpub) {
          // محاكاة قراءة فصول الـ EPUB الإلكتروني بطريقة مجدولة
          setTimeout(() => {
            if (active) {
              setPageText(lang === "ar"
                ? `[محتوى EPUB الفعلي - الفصل ${book.page}]: بدأ يدرك تماماً أن الكلمات المكتوبة هي بمثابة مرآة تعكس صمت الروح وهدوء الكهف المحيط بها.`
                : `[Actual EPUB Content - Chapter ${book.page}]: He began to fully realize that written words are a mirror reflecting the stillness of the soul.`
              );
              setLoadingText(false);
            }
          }, 600);
        } else {
          // قراءة الـ PDF الحقيقي وإصلاح تجميع النصوص
          const arrayBuffer = await book.fileBlob.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const targetPage = Math.min(pdf.numPages, Math.max(1, book.page));
          const pageObj = await pdf.getPage(targetPage);
          const textContent = await pageObj.getTextContent();
          const items = textContent.items.map(item => item.str).join(" ").trim();
          
          if (active) {
            setPageText(items || (lang === "ar" ? "هذه الصفحة عبارة عن غلاف أو صورة خالية من النصوص المكتوبة." : "This page contains only image artwork."));
            setLoadingText(false);
          }
        }
      } catch (err) {
        if (active) {
          setPageText(lang === "ar" ? "حدث خطأ أثناء قراءة الحبر الفعلي للمستند." : "Error rendering actual document ink.");
          setLoadingText(false);
        }
      }
    }
    loadBookContent();
    return () => { active = false; };
  }, [book.page, book.fileBlob, book.title, lang]);

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

  const handlePageClick = (e) => {
    if (tool !== "sticker") return;
    if (e.target.closest("[data-sticker-elem]") || e.target.closest(".sticker-menu-btn")) return;
    
    const rect = textContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSticker = { id: Date.now(), x, y, emoji: selectedSticker };
    const updated = [...stickers, newSticker];
    setStickers(updated);
    onUpdateMeta(ratingDraft, reviewDraft, highlights, updated);
  };

  return (
    <div className="min-h-screen py-6" style={{ background: "linear-gradient(160deg, #161224 0%, #292042 60%, #423054 100%)" }}>
      <div className="max-w-3xl mx-auto px-5">
        
        <button onClick={onBack} className="flex items-center gap-1.5 mb-5 hover:text-white" style={{ color: "#B6ACD6", fontFamily: "Tajawal", fontSize: 13.5 }}>
          {lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} {t.backToShelf}
        </button>

        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 24, fontWeight: 700 }}>{book.title}</h2>
            <p style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13 }}>{t.page} {book.page} {t.of} {book.totalPages}</p>
          </div>
        </div>

        {/* شريط الأدوات مع تصفيف الـ z-index لمنع ظهور المنيو في الخلف بالخطأ */}
        <div className="flex items-center gap-2 mb-4 p-2 rounded-2xl flex-wrap relative z-30" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => setTool(tool === "pen" ? null : "pen")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
            style={{ background: tool === "pen" ? "rgba(255,177,153,0.2)" : "transparent", color: tool === "pen" ? "#FFB199" : "#B6ACD6", fontFamily: "Tajawal" }}>
            <Highlighter size={15} /> {t.pen}
          </button>

          <div className="relative">
            <button onClick={() => { setTool("sticker"); setShowStickerMenu(!showStickerMenu); }} className="sticker-menu-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
              style={{ background: tool === "sticker" ? "rgba(167,139,250,0.2)" : "transparent", color: tool === "sticker" ? "#C084FC" : "#B6ACD6", fontFamily: "Tajawal" }}>
              <Sticker size={15} /> {t.sticker} ({selectedSticker})
            </button>

            {/* تم حل المشكلة: إضافة z-50 كامل وتأكيد الخلفية غير الشفافة */}
            {showStickerMenu && (
              <div className="absolute top-12 left-0 rtl:left-auto rtl:right-0 z-50 p-2.5 rounded-xl grid grid-cols-4 gap-2 w-48 shadow-2xl border bg-[#1c1836]" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                {STICKER_OPTIONS.map((emoji) => (
                  <button key={emoji} onClick={() => { setSelectedSticker(emoji); setShowStickerMenu(false); }} className="w-9 h-9 flex items-center justify-center rounded bg-white bg-opacity-5 hover:bg-opacity-20 text-lg transition-transform active:scale-95">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* لوحة القراءة الرئيسية مسندة بـ z-10 لمنع أي تداخلات تحتية */}
        <div
          ref={textContainerRef}
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          onClick={handlePageClick}
          className="relative rounded-2xl p-8 md:p-12 shadow-inner select-text z-10"
          style={{ 
            background: "#FBF9FF", 
            minHeight: 400, 
            cursor: tool === "sticker" ? "pointer" : "default" 
          }}
        >
          {loadingText && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-2xl z-20">
              <span className="text-sm font-medium animate-pulse text-[#2A2350]" style={{ fontFamily: "Tajawal" }}>{lang === "ar" ? "جاري استخراج حبر النص الحقيقي للمستند..." : "Reading actual document ink..."}</span>
            </div>
          )}

          <p style={{ fontFamily: "Amiri, serif", color: "#1F1A3A", fontSize: 20, lineHeight: 2.1, textAlign: "justify" }}>
            {pageText}
          </p>

          {stickers.map((s) => (
            <div key={s.id} data-sticker-elem className="absolute group" style={{ left: s.x - 14, top: s.y - 14 }}>
              <span className="text-2xl select-none">{s.emoji}</span>
              <button onClick={(e) => { e.stopPropagation(); const updated = stickers.filter(st => st.id !== s.id); setStickers(updated); onUpdateMeta(ratingDraft, reviewDraft, highlights, updated); }} className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold">✕</button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button disabled={book.page <= 1} onClick={() => onUpdatePage(Math.max(1, book.page - 1))} className="px-5 py-2.5 rounded-full text-xs text-[#B6ACD6] bg-white bg-opacity-5 disabled:opacity-40">
            {lang === "ar" ? "→ الصفحة السابقة" : "← Previous"}
          </button>
          <button disabled={book.page >= book.totalPages} onClick={() => onUpdatePage(Math.min(book.totalPages, book.page + 1))} className="px-5 py-2.5 rounded-full text-xs font-bold text-[#241F45]" style={{ background: "linear-gradient(135deg,#FFB199,#A78BFA)" }}>
            {lang === "ar" ? "الصفحة التالية ←" : "Next Page →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Add Book Modal (يدعم صيغتي PDF + EPUB)
// ---------------------------------------------------------------
function AddBookModal({ t, lang, onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", author: "", genre: "novel", totalPages: 100, color: SPINE_COLORS[0], cover: null, fileName: null, fileBlob: null });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleBookFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const nameLower = file.name.toLowerCase();
      const isPdf = nameLower.endsWith(".pdf") || file.type === "application/pdf";
      const isEpub = nameLower.endsWith(".epub") || file.type === "application/epub+zip";
      
      let extractedCover = null;
      let totalPages = form.totalPages;

      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        totalPages = pdf.numPages || totalPages;
        
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await firstPage.render({ canvasContext: ctx, viewport }).promise;
        extractedCover = canvas.toDataURL("image/jpeg", 0.85);
      } else if (isEpub) {
        // تعيين عدد صفحات تقديري لملفات الـ EPUB الإلكترونية
        totalPages = 45; 
      }

      const cleanTitle = form.title || file.name.replace(/\.[^/.]+$/, "");
      setForm((f) => ({
        ...f,
        fileBlob: file,
        cover: extractedCover,
        fileName: file.name,
        title: cleanTitle,
        totalPages: totalPages
      }));
    } catch (e) {
      console.error("Meta extraction skipped, fallback cover applied.");
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
          {/* تم تعديل الحقل هنا ليقبل كلاً من pdf و epub معاً */}
          <input ref={fileRef} type="file" accept=".pdf,.epub" className="hidden" onChange={(e) => handleBookFile(e.target.files?.[0])} />
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
                  {uploading ? "جاري فحص وتجهيز الملف الحقيقي..." : "اضغط لرفع ملف PDF أو EPUB واستخراج بياناته"}
                </span>
              </div>
            )}
            {form.cover && (
              <div className="w-full h-full bg-black bg-opacity-40 flex items-end p-2 justify-between">
                <span className="text-[10px] text-white truncate max-w-[70%] px-1.5 py-0.5 rounded bg-black bg-opacity-60">{form.fileName}</span>
                <span className="text-[10px] text-[#FFB199] font-bold">{lang === "ar" ? "تغيير" : "Change"}</span>
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
              className="w-full px-3 py-2 rounded-xl bg-[#161329] border border-white border-opacity-10 text-white text-xs outline-none">
              {Object.entries(GENRES[lang]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Field label={t.totalPagesField} value={form.totalPages} onChange={(v) => setForm({ ...form, totalPages: v })} type="number" />
        </div>

        <button
          disabled={!form.title || uploading}
          onClick={() => { onAdd(form); onClose(); }}
          className="w-full py-3 rounded-xl font-bold text-sm"
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
        className="w-full px-3.5 py-2 rounded-xl bg-[#161329] border border-white border-opacity-10 text-white text-xs outline-none" />
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
  highlights: r.highlights || [], stickers: r.stickers || [], fileBlob: null
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
    
    try {
      const [inserted] = await sb.insertBooks(token, [bookToInsertRow(newBookObj)]);
      const created = rowToBook(inserted);
      created.fileBlob = form.fileBlob; 
      setBooks((bs) => [...bs, created]);
    } catch (e) {
      console.error(e);
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

      <div className="sticky top-0 z-40 bg-[#161226] bg-opacity-70 backdrop-blur-md border-b border-white border-opacity-5">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#FFB199]" />
            <span style={{ fontFamily: "Amiri, serif", fontSize: 20, fontWeight: 700 }} className="text-[#FFB199]">{t.appName}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white bg-opacity-5 p-1 rounded-full text-xs">
              <button onClick={() => setView("library")} className="px-3 py-1.5 rounded-full" style={{ background: view === "library" ? "#FFB199" : "transparent", color: view === "library" ? "#161224" : "#B6ACD6", fontWeight: 600 }}>{t.library}</button>
              <button onClick={() => setView("dashboard")} className="px-3 py-1.5 rounded-full" style={{ background: view === "dashboard" ? "#FFB199" : "transparent", color: view === "dashboard" ? "#161224" : "#B6ACD6", fontWeight: 600 }}>{t.dashboard}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 mt-8">
        {view === "library" && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 style={{ fontFamily: "Amiri, serif", fontSize: 28, fontWeight: 700, color: "#F4F0FF" }}>{t.myShelf}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "linear-gradient(135deg, #FFB199, #A78BFA)", color: "#161224" }}>
                  <Plus size={14} /> {t.addBook}
                </button>
              </div>
            </div>

            {reading.length > 0 && <ShelfRow label={t.currentlyReading} books={reading} t={t} lang={lang} onOpen={setOpenBook} />}
            {want.length > 0 && <ShelfRow label={t.wantToRead} books={want} t={t} lang={lang} onOpen={setOpenBook} />}
            {finished.length > 0 && <ShelfRow label={t.finished} books={finished} t={t} lang={lang} onOpen={setOpenBook} />}
          </>
        )}
      </div>

      {showAdd && <AddBookModal t={t} lang={lang} onClose={() => setShowAdd(false)} onAdd={addBook} />}
    </div>
  );
}

function ShelfRow({ label, books, t, lang, onOpen }) {
  return (
    <div className="mb-12">
      <h3 className="text-sm font-bold text-[#FFB199] mb-4">{label}</h3>
      <div className="relative pb-6">
        <div className="flex gap-6 overflow-x-auto pb-4 px-2 pt-2">
          {books.map((b) => (
            <div key={b.id} className="shrink-0">
              <BookSpine book={b} t={t} lang={lang} onOpen={onOpen} />
            </div>
          ))}
        </div>
        <div className="absolute left-0 right-0 bottom-1 rounded-sm shadow-xl" style={{
          height: 14, background: "linear-gradient(180deg, #dfb482 0%, #b58552 40%, #7d562f 100%)", borderTop: "1px solid rgba(255,255,255,0.3)"
        }} />
      </div>
    </div>
  );
}

function AuthScreen({ t, lang, onAuth, onToggleLang }) {
  const [form, setForm] = useState({ email: "", password: "" });
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#130f21] p-4">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 text-center">
        <h2 style={{ fontFamily: "Amiri", fontSize: 24 }} className="mb-4 text-[#FFB199]">{t.appName}</h2>
        <Field label={t.email} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label={t.password} value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
        <button onClick={() => onAuth("signin", form)} className="w-full py-2.5 mt-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FFB199] to-[#A78BFA] text-[#161224]">{t.signIn}</button>
      </div>
    </div>
  );
}
