import React, { useState, useMemo, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";

// تعيين الـ Worker باستخدام رابط CDN مباشر
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '3.11.174'}/build/pdf.worker.min.mjs`;

import {
  BookOpen, Bookmark, Highlighter, Sticker, Flame, Clock, BookMarked,
  Sparkles, User, LogIn, UserPlus, X, ChevronLeft, ChevronRight,
  Globe, LayoutDashboard, Library, Plus, Search, Star, TrendingUp,
  Quote as QuoteIcon, Award, Upload, AlertCircle, Edit2, Check, Trash2, Camera
} from "lucide-react";

const FONT_IMPORTS = `
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; }
.highlight-text { border-radius: 4px; padding: 0 2px; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
`;

// ----------------------------------------------------------------
// Supabase Mock / Connection (Kept same as requested)
// ----------------------------------------------------------------
const SUPABASE_URL = "https://abpgyqyghhydinhfuzgt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicGd5cXlnaGh5ZGluaGZ1emd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDg0OTYsImV4cCI6MjA5NzM4NDQ5Nn0.ANO_WnOLNi2PuxXBZsTAlsqAUnYhMRCCfoRml5FWcSI";

const sb = {
  async signUp(email, password, name) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password, data: { name } }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || data.error || "Sign up failed");
    return data;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
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
      method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, Prefer: "return=representation" },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error("Failed to add book");
    return res.json();
  },
  async updateBook(token, id, patch) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/books?id=eq.${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update book");
    return res.json();
  },
};

// ---------------------------------------------------------------
// i18n & Static Data
// ---------------------------------------------------------------
const STR = {
  en: {
    dir: "ltr", appName: "Kahf Al-Kutub", tagline: "The Cave of Books",
    heroTitle: "A quiet cave for everything you read",
    heroSub: "Carry your shelf, your bookmarks, your ink, and your streak — into one warm little cave.",
    getStarted: "Enter the cave", signIn: "Sign in", signUp: "Create account",
    name: "Name", email: "Email", password: "Password", welcomeBack: "Welcome back", joinCave: "Join the cave",
    library: "Library", dashboard: "Dashboard", reading: "Reading", quotes: "Quotes", logout: "Log out",
    myShelf: "My Shelf", addBook: "Add a book", uploadBook: "Upload PDF / EPUB", searchShelf: "Search your shelf…",
    continueReading: "Continue reading", currentlyReading: "Currently reading", finished: "Finished", wantToRead: "Want to read",
    pages: "pages", page: "page", of: "of", progress: "progress", readerOfWeek: "Reader of the Week", dailyQuote: "Today's Quote",
    streak: "day streak", hoursRead: "Hours read", booksFinished: "Books finished", wordsRead: "Words read",
    topGenres: "Most-read genres", weeklyActivity: "This week's reading", recentHighlights: "Recent highlights", achievements: "Lantern badges",
    tools: "Tools", pen: "Pen — highlight", sticker: "Sticker", bookmarkTool: "Bookmark",
    save: "Save", cancel: "Cancel", pickColor: "Pick a color", addHighlight: "Add highlight", backToShelf: "Back to shelf",
    genre: "Genre", author: "by", switchLang: "العربية", emptyShelf: "Your shelf is empty. Add your first book to light the cave.",
    title: "Title", coverColor: "Spine color", totalPagesField: "Total pages", create: "Add to shelf", close: "Close",
    myBooksGallery: "My Books Gallery", readingLog: "Reading Log", readingGoal: "Reading Goal",
    status: "Status", rating: "Rating",
  },
  ar: {
    dir: "rtl", appName: "كهف الكتب", tagline: "Kahf Al-Kutub",
    heroTitle: "كهفٌ هادئ لكل ما تقرأ",
    heroSub: "احمل رفّك، وفواصلك، وحبرك، وسلسلة أيامك — في كهفٍ دافئ واحد.",
    getStarted: "ادخل الكهف", signIn: "تسجيل الدخول", signUp: "إنشاء حساب",
    name: "الاسم", email: "البريد الإلكتروني", password: "كلمة المرور", welcomeBack: "أهلاً بعودتك", joinCave: "انضم إلى الكهف",
    library: "المكتبة", dashboard: "لوحتي", reading: "القراءة", quotes: "الاقتباسات", logout: "تسجيل الخروج",
    myShelf: "رفّي", addBook: "أضف كتاباً", uploadBook: "ارفع كتاب (PDF / EPUB)", searchShelf: "ابحث في رفّك…",
    continueReading: "تابع القراءة", currentlyReading: "أقرأ الآن", finished: "منتهية", wantToRead: "أريد قراءتها",
    pages: "صفحة", page: "صفحة", of: "من", progress: "التقدم", readerOfWeek: "قارئ الأسبوع", dailyQuote: "اقتباس اليوم",
    streak: "يوم متتالي", hoursRead: "ساعات القراءة", booksFinished: "كتب أنهيتها", wordsRead: "كلمات قرأتها",
    topGenres: "الأنواع الأكثر قراءة", weeklyActivity: "نشاط هذا الأسبوع", recentHighlights: "أحدث التحديدات", achievements: "الأوسمة والإنجازات",
    tools: "الأدوات", pen: "قلم التحديد", sticker: "ستيكر (ملصق)", bookmarkTool: "فاصلة",
    save: "حفظ", cancel: "إلغاء", pickColor: "اختر لوناً", addHighlight: "إضافة تحديد", backToShelf: "العودة للرف",
    genre: "النوع", author: "بقلم", switchLang: "English", emptyShelf: "رفّك فارغ. أضف كتابك الأول لتضيء الكهف.",
    title: "العنوان", coverColor: "لون الغلاف", totalPagesField: "عدد الصفحات", create: "أضف للرف", close: "إغلاق",
    myBooksGallery: "معرض كتبي", readingLog: "سجل القراءة", readingGoal: "هدف القراءة",
    status: "الحالة", rating: "التقييم",
  },
};

const INITIAL_QUOTES = [
  { id: 1, text: "القارئ يعيش ألف حياة قبل أن يموت.", by: "George R.R. Martin" },
  { id: 2, text: "حين تتعلم القراءة، تصبح حراً إلى الأبد.", by: "Frederick Douglass" },
  { id: 3, text: "الكتب سحرٌ محمول لا مثيل له.", by: "Stephen King" }
];

const GENRES = {
  en: { novel: "Novels", philosophy: "Philosophy", history: "History", scifi: "Sci-Fi", selfhelp: "Self-Development", poetry: "Poetry" },
  ar: { novel: "روايات", philosophy: "فلسفة", history: "تاريخ", scifi: "خيال علمي", selfhelp: "تطوير ذات", poetry: "شعر" },
};

const SPINE_COLORS = ["#A78BFA", "#7C8CFF", "#C084FC", "#F472B6", "#60A5FA", "#FB7185", "#9381FF"];
const ALL_EMOJIS = ["⭐", "🔖", "❤️", "🔥", "💡", "📌", "🎉", "🌟", "👀", "🌸", "☕", "📖"];

// ---------------------------------------------------------------
// Small UI atoms
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// Reader View (PDF Extraction + Real Highlight + Stickers)
// ---------------------------------------------------------------
function ReaderView({ book, t, lang, onBack, onUpdatePage }) {
  const [tool, setTool] = useState(null);
  const [hlColor, setHlColor] = useState("#FFB19966");
  const [stickers, setStickers] = useState([]);
  const [pageText, setPageText] = useState("");
  const [loadingText, setLoadingText] = useState(false);
  const containerRef = useRef(null);

  // Extract real PDF text if a file Blob exists
  useEffect(() => {
    const loadPdfText = async () => {
      if (!book.fileBlob) {
        setPageText(lang === "ar" ? "لم يتم إرفاق ملف حقيقي لهذا الكتاب، يتم عرض نص افتراضي...\nالكتب سحرٌ محمول." : "No actual file attached. Showing dummy text...\nBooks are portable magic.");
        return;
      }
      setLoadingText(true);
      try {
        const arrayBuffer = await book.fileBlob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageNum = Math.max(1, Math.min(book.page || 1, pdf.numPages));
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const textStr = textContent.items.map(item => item.str).join(" ");
        setPageText(textStr || (lang === "ar" ? "الصفحة فارغة أو عبارة عن صورة." : "Page is empty or contains only images."));
      } catch (err) {
        setPageText(lang === "ar" ? "خطأ في قراءة محتوى الملف." : "Error reading file content.");
      } finally {
        setLoadingText(false);
      }
    };
    loadPdfText();
  }, [book.page, book.fileBlob, lang]);

  // Real Text Highlighting
  const applyHighlight = () => {
    if (tool !== "pen") return;
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.toString().trim() === "") return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.backgroundColor = hlColor;
    span.className = "highlight-text";
    try {
      range.surroundContents(span);
    } catch (e) {
      console.log("Highlighting across multiple HTML nodes is limited in this basic version.");
    }
    selection.removeAllRanges();
  };

  // Stickers
  const handlePageClick = (e) => {
    if (!tool || !tool.startsWith("sticker-")) return;
    if (e.target.closest("[data-sticker]")) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const emoji = tool.split("-")[1];
    setStickers((s) => [...s, { id: Date.now(), x, y, emoji }]);
    setTool("sticker"); // Reset to base sticker tool after placement
  };

  const removeSticker = (id, e) => {
    e.stopPropagation();
    setStickers((s) => s.filter((st) => st.id !== id));
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: "linear-gradient(160deg, #211C3D 0%, #3B2F66 55%, #6B4C72 100%)", backgroundAttachment: "fixed" }}>
      <div className="max-w-4xl mx-auto px-5 py-6">
        <button onClick={onBack} className="flex items-center gap-1.5 mb-5" style={{ color: "#B6ACD6", fontFamily: "Tajawal", fontSize: 13 }}>
          {lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} {t.backToShelf}
        </button>

        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 style={{ fontFamily: "Amiri, serif", color: "#F4F0FF", fontSize: 24, fontWeight: 700 }}>{book.title}</h2>
            <p style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 14 }}>{t.page} {book.page || 1} {t.of} {book.totalPages}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl flex-wrap relative" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
          <button onClick={() => setTool(tool === "pen" ? null : "pen")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
            style={{ background: tool === "pen" ? "#A78BFA33" : "transparent", color: tool === "pen" ? "#FFB199" : "#B6ACD6", fontFamily: "Tajawal", fontSize: 13 }}>
            <Highlighter size={16} /> {t.pen}
          </button>
          
          <div className="relative group">
            <button onClick={() => setTool(tool?.startsWith("sticker") ? null : "sticker")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
              style={{ background: tool?.startsWith("sticker") ? "#A78BFA33" : "transparent", color: tool?.startsWith("sticker") ? "#FFB199" : "#B6ACD6", fontFamily: "Tajawal", fontSize: 13 }}>
              <Sticker size={16} /> {t.sticker}
            </button>
            {/* Emoji Palette */}
            {tool?.startsWith("sticker") && (
              <div className="absolute top-full mt-2 left-0 z-50 p-3 rounded-xl shadow-lg grid grid-cols-4 gap-2 w-48" style={{ background: "#2D2A57", border: "1px solid rgba(255,255,255,0.15)" }}>
                {ALL_EMOJIS.map(em => (
                  <button key={em} onClick={() => setTool(`sticker-${em}`)} className="text-xl hover:scale-125 transition-transform">
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tool === "pen" && (
            <div className="flex items-center gap-2 ms-4 border-l border-white/10 pl-4">
              {["#FFB19966", "#A78BFA66", "#7C8CFF66", "#F472B666"].map((c) => (
                <button key={c} onClick={() => setHlColor(c)} className="w-6 h-6 rounded-full"
                  style={{ background: c, outline: hlColor === c ? "2px solid #FFB199" : "none", outlineOffset: 2 }} />
              ))}
            </div>
          )}
        </div>

        {/* Reading Canvas */}
        <div
          ref={containerRef}
          onMouseUp={applyHighlight}
          onClick={handlePageClick}
          className="relative rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden"
          style={{ background: "#FDFBFF", minHeight: "65vh", cursor: tool?.startsWith("sticker-") ? "crosshair" : (tool === "pen" ? "text" : "default") }}
        >
          {loadingText ? (
            <div className="flex items-center justify-center h-full text-gray-400 font-tajawal">جاري تحميل الصفحة...</div>
          ) : (
            <div style={{ fontFamily: "Amiri, serif", color: "#2A2350", fontSize: 20, lineHeight: 2.2, textAlign: lang === "ar" ? "right" : "left", whiteSpace: "pre-wrap" }}>
              {pageText}
            </div>
          )}

          {/* Render Stickers */}
          {stickers.map((s) => (
            <span key={s.id} data-sticker onClick={(e) => removeSticker(s.id, e)}
              className="absolute text-3xl cursor-pointer hover:scale-110 transition-transform"
              style={{ left: s.x - 15, top: s.y - 15, textShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              {s.emoji}
            </span>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => onUpdatePage(Math.max(1, (book.page || 1) - 1))} className="px-6 py-2.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "#F4F0FF", fontFamily: "Tajawal", fontSize: 14 }}>
            {lang === "ar" ? "→ الصفحة السابقة" : "← Previous Page"}
          </button>
          <button onClick={() => onUpdatePage(Math.min(book.totalPages, (book.page || 1) + 1))} className="px-6 py-2.5 rounded-full shadow-lg"
            style={{ background: "linear-gradient(135deg,#FF9E8F,#C9A6FF)", color: "#241F45", fontFamily: "Tajawal", fontWeight: 700, fontSize: 14 }}>
            {lang === "ar" ? "الصفحة التالية ←" : "Next Page →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Add Book Modal (File Upload + PDF Extraction)
// ---------------------------------------------------------------
function AddBookModal({ t, lang, onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", author: "", genre: "novel", totalPages: 200, color: SPINE_COLORS[0], cover: null, fileBlob: null, fileName: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleBookFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      let cover = null;
      let totalPages = form.totalPages;
      const title = file.name.replace(/\.(pdf|epub)$/i, "");

      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        totalPages = pdf.numPages;
        // Extract cover
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        cover = canvas.toDataURL("image/jpeg", 0.8);
      }
      
      setForm({ ...form, title, totalPages, cover, fileBlob: file, fileName: file.name });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "#00000099", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-7 max-h-[90vh] overflow-y-auto shadow-2xl" style={{ background: "linear-gradient(160deg, #2D2A57, #4A3D78)", border: "1px solid rgba(255,255,255,0.18)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontWeight: 700, fontSize: 18 }}>{t.addBook}</h3>
          <button onClick={onClose}><X size={20} color="#B6ACD6" /></button>
        </div>

        <div className="mb-5">
          <label style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13, display: "block", marginBottom: 6 }}>{t.uploadBook}</label>
          <input ref={fileRef} type="file" accept=".pdf,.epub" className="hidden" onChange={(e) => handleBookFile(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full rounded-2xl overflow-hidden relative flex flex-col items-center justify-center transition-colors"
            style={{ background: form.cover ? `url(${form.cover}) center/cover no-repeat` : "rgba(0,0,0,0.2)", border: "2px dashed rgba(255,255,255,0.2)", height: form.cover ? 180 : 100 }}>
            {!form.cover && (
              <div className="flex flex-col items-center gap-2">
                <Upload size={24} color={uploading ? "#FFB199" : "#B6ACD6"} />
                <span style={{ fontFamily: "Tajawal", color: "#F4F0FF", fontSize: 13 }}>{uploading ? "جارٍ استخراج الغلاف..." : "اضغط لرفع ملف"}</span>
              </div>
            )}
            {form.cover && (
              <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-white font-tajawal text-xs truncate w-full px-2">{form.fileName}</span>
              </div>
            )}
          </button>
        </div>

        {["title", "author"].map(field => (
          <div className="mb-4" key={field}>
            <label style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13, display: "block", marginBottom: 6 }}>{t[field]}</label>
            <input type="text" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F0FF", fontFamily: "Tajawal" }} />
          </div>
        ))}

        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13, display: "block", marginBottom: 6 }}>{t.genre}</label>
            <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: "#211C3D", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F0FF", fontFamily: "Tajawal" }}>
              {Object.entries(GENRES[lang]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="w-1/3">
            <label style={{ fontFamily: "Tajawal", color: "#B6ACD6", fontSize: 13, display: "block", marginBottom: 6 }}>{t.totalPagesField}</label>
            <input type="number" value={form.totalPages} onChange={(e) => setForm({ ...form, totalPages: e.target.value })} className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F0FF", fontFamily: "Tajawal" }} />
          </div>
        </div>

        <button disabled={!form.title || uploading} onClick={() => { onAdd(form); onClose(); }} className="w-full py-3.5 rounded-xl transition-transform hover:scale-105 shadow-lg"
          style={{ background: "linear-gradient(135deg,#FF9E8F,#C9A6FF)", color: "#241F45", fontFamily: "Tajawal", fontWeight: 700, fontSize: 15, opacity: form.title && !uploading ? 1 : 0.6 }}>
          {t.create}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Main App Component
// ---------------------------------------------------------------
export default function KahfAlKutub() {
  const [lang, setLang] = useState("ar");
  const t = STR[lang];
  const [user, setUser] = useState({ name: "قارئ الكهف", avatar: null });
  const [view, setView] = useState("dashboard"); // Changed default to dashboard to show requirements
  const [books, setBooks] = useState([]);
  const [openBook, setOpenBook] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [readingGoal, setReadingGoal] = useState(12);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [quotes, setQuotes] = useState(INITIAL_QUOTES);
  const [newQuoteText, setNewQuoteText] = useState("");
  const avatarRef = useRef(null);

  // Mock initial books for demonstration
  useEffect(() => {
    setBooks([
      { id: "1", title: "مقدمة ابن خلدون", author: "ابن خلدون", genre: "history", totalPages: 500, page: 250, status: "reading", rating: 4, cover: null, color: "#C084FC" },
      { id: "2", title: "دلتا الزمن", author: "آندي وير", genre: "scifi", totalPages: 380, page: 380, status: "finished", rating: 5, cover: null, color: "#60A5FA" },
      { id: "3", title: "عادات ذرية", author: "جيمس كلير", genre: "selfhelp", totalPages: 300, page: 0, status: "want", rating: 0, cover: null, color: "#F472B6" }
    ]);
  }, []);

  const addBook = (form) => {
    const newBook = {
      id: Date.now().toString(),
      title: form.title,
      author: form.author || "غير معروف",
      genre: form.genre,
      totalPages: Number(form.totalPages) || 200,
      page: 1,
      status: "reading",
      color: form.color,
      cover: form.cover,
      fileBlob: form.fileBlob,
      rating: 0,
    };
    setBooks([newBook, ...books]);
    setView("library");
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUser({ ...user, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const finishedCount = books.filter((b) => b.status === "finished").length;
  const totalPagesRead = books.reduce((acc, b) => acc + (b.page || 0), 0);
  const readingBooks = books.filter((b) => b.status === "reading");

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
          }}
        />
      </div>
    );
  }

  return (
    <div dir={t.dir} className="min-h-screen text-[#F4F0FF]" style={{ background: "linear-gradient(160deg, #1A162B 0%, #312652 50%, #4D3754 100%)", backgroundAttachment: "fixed", fontFamily: "Tajawal" }}>
      <style>{FONT_IMPORTS}</style>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-[#1A162B]/60">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FFB199] to-[#A78BFA]">
              <BookOpen size={20} color="#241F45" />
            </div>
            <span style={{ fontFamily: "Amiri, serif", fontSize: 20, fontWeight: 700 }}>{t.appName}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full">
            <button onClick={() => setView("dashboard")} className={`px-4 py-2 rounded-full transition-all ${view === "dashboard" ? "bg-gradient-to-r from-[#FFB199] to-[#A78BFA] text-[#241F45] font-bold" : "text-[#B6ACD6]"}`}>
              <LayoutDashboard size={16} className="inline mr-1 rtl:ml-1" /> {t.dashboard}
            </button>
            <button onClick={() => setView("library")} className={`px-4 py-2 rounded-full transition-all ${view === "library" ? "bg-gradient-to-r from-[#FFB199] to-[#A78BFA] text-[#241F45] font-bold" : "text-[#B6ACD6]"}`}>
              <Library size={16} className="inline mr-1 rtl:ml-1" /> {t.library}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Plus size={16} /> {t.addBook}
            </button>
            
            {/* Profile Avatar */}
            <div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
              <input type="file" ref={avatarRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#A78BFA] flex items-center justify-center bg-[#2D2A57]">
                {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={20} color="#A78BFA" />}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera size={14} color="#FFF" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 py-8">
        {view === "library" && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map(book => (
              <div key={book.id} onClick={() => setOpenBook(book)} className="cursor-pointer group">
                <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-lg transition-transform group-hover:-translate-y-2"
                  style={{ background: book.cover ? `url(${book.cover}) center/cover` : `linear-gradient(135deg, ${book.color}, #2D2A57)` }}>
                  {!book.cover && <div className="absolute inset-0 p-4 flex items-center justify-center text-center font-amiri font-bold text-lg text-white/90 leading-tight">{book.title}</div>}
                  {book.status === "reading" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                      <div className="h-full bg-[#FFB199]" style={{ width: `${(book.page / book.totalPages) * 100}%` }} />
                    </div>
                  )}
                </div>
                <h4 className="mt-3 font-bold text-[15px] truncate">{book.title}</h4>
                <p className="text-[#B6ACD6] text-xs truncate">{book.author}</p>
                <div className="mt-1"><StarRow value={book.rating} size={12} /></div>
              </div>
            ))}
          </div>
        )}

        {view === "dashboard" && (
          <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-[#FFB199]" strokeDasharray={`${(finishedCount / readingGoal) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold font-amiri">{finishedCount}</span>
                    <span className="text-[10px] text-[#B6ACD6]">{t.of} {readingGoal}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-[#FFB199]">{t.readingGoal}</h3>
                    {isEditingGoal ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={readingGoal} onChange={(e) => setReadingGoal(Number(e.target.value))} className="w-12 bg-white/10 px-1 rounded text-center outline-none" />
                        <button onClick={() => setIsEditingGoal(false)}><Check size={14} className="text-green-400" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditingGoal(true)}><Edit2 size={12} className="text-[#B6ACD6] hover:text-white" /></button>
                    )}
                  </div>
                  <p className="text-sm text-[#B6ACD6]">{lang === "ar" ? "استمر، أنت تقترب من هدفك السنوي!" : "Keep going, you're getting closer!"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-[#A78BFA] mb-2"><Flame size={18} /> <span className="font-bold">{t.streak}</span></div>
                  <span className="text-3xl font-bold font-amiri">12 <span className="text-sm font-tajawal text-[#B6ACD6] font-normal">{lang === "ar" ? "يوماً" : "Days"}</span></span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-[#60A5FA] mb-2"><Clock size={18} /> <span className="font-bold">{t.hoursRead}</span></div>
                  <span className="text-3xl font-bold font-amiri">45 <span className="text-sm font-tajawal text-[#B6ACD6] font-normal">{lang === "ar" ? "ساعة" : "Hrs"}</span></span>
                </div>
              </div>
            </div>

            {/* Badges Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Award className="text-[#FFB199]" /> {t.achievements}</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[
                  { icon: BookMarked, label: lang === "ar" ? "أول كتاب" : "First Book", active: finishedCount >= 1 },
                  { icon: Flame, label: lang === "ar" ? "٧ أيام متتالية" : "7-Day Streak", active: true },
                  { icon: Star, label: lang === "ar" ? "قارئ مجتهد" : "Avid Reader", active: finishedCount >= 5 },
                  { icon: TrendingUp, label: lang === "ar" ? "١٠٠ ألف كلمة" : "100k Words", active: false },
                ].map((badge, i) => (
                  <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-xl min-w-[120px] border ${badge.active ? "bg-gradient-to-b from-[#A78BFA]/20 to-transparent border-[#A78BFA]/50" : "bg-black/20 border-white/5 opacity-50 grayscale"}`}>
                    <badge.icon size={28} className={badge.active ? "text-[#FFB199] mb-2 drop-shadow-[0_0_8px_rgba(255,177,153,0.8)]" : "text-gray-500 mb-2"} />
                    <span className="text-xs text-center font-bold">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery & Reading Log Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* My Books Gallery */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="font-bold text-lg mb-4">{t.myBooksGallery}</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {books.map(book => (
                    <div key={book.id} className="min-w-[100px] group cursor-pointer" onClick={() => setOpenBook(book)}>
                      <div className="w-full aspect-[2/3] rounded-lg bg-cover bg-center mb-2 shadow-md relative overflow-hidden"
                        style={{ backgroundImage: book.cover ? `url(${book.cover})` : `linear-gradient(135deg, ${book.color}, #333)` }}>
                        <div className="absolute top-0 right-0 bg-black/60 px-2 py-1 text-[10px] rounded-bl-lg">
                          {book.status === "finished" ? "✓" : `${Math.round((book.page / book.totalPages) * 100)}%`}
                        </div>
                      </div>
                      <p className="text-xs font-bold truncate">{book.title}</p>
                      <StarRow value={book.rating} size={10} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reading Log Table */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md overflow-x-auto">
                <h3 className="font-bold text-lg mb-4">{t.readingLog}</h3>
                <table className="w-full text-sm text-left rtl:text-right">
                  <thead className="text-xs text-[#B6ACD6] border-b border-white/10">
                    <tr>
                      <th className="pb-2 font-normal">{t.title}</th>
                      <th className="pb-2 font-normal">{lang === "ar" ? "المؤلف" : "Author"}</th>
                      <th className="pb-2 font-normal">{t.rating}</th>
                      <th className="pb-2 font-normal">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map(b => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setOpenBook(b)}>
                        <td className="py-3 font-bold truncate max-w-[120px]">{b.title}</td>
                        <td className="py-3 text-[#B6ACD6] truncate max-w-[100px]">{b.author}</td>
                        <td className="py-3"><StarRow value={b.rating} size={12} /></td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-[10px] ${b.status === "finished" ? "bg-green-500/20 text-green-300" : b.status === "reading" ? "bg-blue-500/20 text-blue-300" : "bg-gray-500/20 text-gray-300"}`}>
                            {b.status === "finished" ? t.finished : b.status === "reading" ? t.currentlyReading : t.wantToRead}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Editable Quotes Section */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><QuoteIcon size={18} className="text-[#FFB199]" /> {t.quotes}</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {quotes.map(q => (
                  <div key={q.id} className="bg-black/20 p-4 rounded-xl relative group border border-white/5">
                    <p className="font-amiri text-lg leading-relaxed mb-2">"{q.text}"</p>
                    <p className="text-xs text-[#B6ACD6]">— {q.by}</p>
                    <button onClick={() => setQuotes(quotes.filter(x => x.id !== q.id))} className="absolute top-3 right-3 rtl:right-auto rtl:left-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newQuoteText} onChange={e => setNewQuoteText(e.target.value)} placeholder={lang === "ar" ? "أضف اقتباساً جديداً ألهَمَك..." : "Add a quote that inspired you..."} className="flex-1 bg-[#211C3D] border border-white/10 rounded-xl px-4 py-2 outline-none text-sm" />
                <button onClick={() => { if (newQuoteText) { setQuotes([...quotes, { id: Date.now(), text: newQuoteText, by: user.name }]); setNewQuoteText(""); } }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {showAdd && <AddBookModal t={t} lang={lang} onClose={() => setShowAdd(false)} onAdd={addBook} />}
    </div>
  );
}
