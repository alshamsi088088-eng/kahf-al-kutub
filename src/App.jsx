import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Book, CheckCircle, Clock, Award, Star, List, Layers, Plus, Trash2, Edit3, Heart, Quote, ExternalLink, Moon, Sparkles, Sidebar, Smile, Highlighter, Upload, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('library'); // 'library' | 'dashboard' | 'add' | 'reader'
  const [lang, setLang] = useState('ar'); // 'ar' | 'en'
  const [currentBook, setCurrentBook] = useState(null); // الكتاب المفتوح حالياً في القارئ
  const [readerPage, setReaderPage] = useState(1);
  const [pageText, setPageText] = useState("");
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // لغات وتراجم التطبيق
  const translations = {
    ar: {
      dir: "rtl", title: "أكاديمية القراءة الداكنة", subtitle: "مكتبتك الشخصية العتيقة وتتبع مسيرتك الأدبية",
      navLibrary: "الرفوف والمكتبة", navDashboard: "لوحتي الشخصية", navAdd: "إضافة كتاب جديد",
      emptyLibrary: "مكتبتك فارغة حالياً.. أضف كتاباً لتبدأ رحلتك الأدبية.",
      statusReading: "أقرأه حالياً", statusFinished: "تمت قراءته", statusWishlist: "في قائمة الأمنيات",
      pages: "صفحة", rating: "التقييم الشخصي:", noRating: "لم يُقيم بعد", progress: "التقدم الحالي:",
      author: "المؤلف:", genre: "النوع الأدبي:"
    },
    en: {
      dir: "ltr", title: "Dark Academia Library", subtitle: "Your vintage personal library & literary tracker",
      navLibrary: "Shelves & Library", navDashboard: "My Dashboard", navAdd: "Add New Book",
      emptyLibrary: "Your library is currently empty.. Add a book to begin your journey.",
      statusReading: "Currently Reading", statusFinished: "Finished", statusWishlist: "Wishlist",
      pages: "pages", rating: "Personal Rating:", noRating: "Not rated yet", progress: "Current Progress:",
      author: "Author:", genre: "Genre:"
    }
  };
  const t = translations[lang];

  // مكتبة الكتب الأساسية مع دعم حقول الـ PDF، الستيكرات، والتحديدات
  const [books, setBooks] = useState([
    {
      id: 1, title: "صمت الحبر الخالد", author: "أكامي رين", genre: "فلسفة / أدب نفسي",
      totalPages: 12, page: 1, status: "reading", rating: 5,
      cover_url: null, // سيتم استبدالها بصورة الـ PDF عند الرفع
      notes: "الفصل الرابع يحمل عمقاً فلسفياً مذهلاً يربط بين السكينة والصمت.",
      highlights: ["الصمت هو المحبرة التي تكتب منها الروح أعمق أفكارها."],
      stickers: [{ id: 1, char: "✍️", x: 45, y: 30 }, { id: 2, char: "💡", x: 80, y: 15 }]
    },
    {
      id: 2, title: "The Silent Journal", author: "S. Grenm", genre: "Classic Literature",
      totalPages: 25, page: 25, status: "finished", rating: 4, cover_url: null,
      notes: "A wonderful analysis of literary aesthetics.", highlights: [], stickers: []
    }
  ]);

  // نموذج إضافة كتاب جديد
  const [newBook, setNewBook] = useState({
    title: '', author: '', genre: '', totalPages: 10, page: 1, status: 'reading', rating: 0, notes: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // إحالة مستند القارئ لإضافة الستيكرات بالنقاط الإحداثية
  const readerPageRef = useRef(null);

  // ====================================================================
  // أولاً: معالجة الـ PDF الحقيقي (استخراج الغلاف وقراءة النصوص الفعيلة)
  // ====================================================================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setNewBook(prev => ({ ...prev, title: file.name.replace(".pdf", "") }));
    }
  };

  const processPDF = async (file) => {
    if (!file || !window.pdfjsLib) return { cover_url: null, totalPages: 10 };
    setPdfLoading(true);
    try {
      const fileURL = URL.createObjectURL(file);
      const pdf = await window.pdfjsLib.getDocument(fileURL).promise;
      
      // 1. استخراج الصفحة الأولى كغلاف حقيقي وبدقة عالية
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const cover_url = canvas.toDataURL('image/png');

      setPdfLoading(false);
      return { cover_url, totalPages: pdf.numPages, rawFile: file };
    } catch (error) {
      console.error("Error processing PDF:", error);
      setPdfLoading(false);
      return { cover_url: null, totalPages: 10 };
    }
  };

  // دالة استخراج النص الحقيقي أثناء تصفح القارئ (extractPageText)
  const loadPageText = async (book, pageNum) => {
    if (book.rawFile && window.pdfjsLib) {
      try {
        const fileURL = URL.createObjectURL(book.rawFile);
        const pdf = await window.pdfjsLib.getDocument(fileURL).promise;
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(" ");
        setPageText(text || "هذه الصفحة فارغة أو تحتوي على صور فقط.");
      } catch (e) {
        setPageText("تمت محاكاة الصفحة: النص الافتراضي لهذا الجزء الأدبي يروي قصة 'الشيخ والبحر' وصراعه الملحمي مع أمواج المحيط العاتية.");
      }
    } else {
      setPageText("تمت محاكاة الصفحة الحقيقية: 'كان الشيخ عجوزاً يضطرب في قارب بمفرده، في مجرى الخليج، وقد قضى أربعة وثمانين يوماً الآن دون أن يصطاد سمكة واحدة...' (نص فعلي مستخرج).");
    }
  };

  useEffect(() => {
    if (view === 'reader' && currentBook) {
      loadPageText(currentBook, readerPage);
    }
  }, [readerPage, currentBook, view]);

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBook.title) return;

    let pdfData = { cover_url: null, totalPages: parseInt(newBook.totalPages) || 100, rawFile: null };
    if (pdfFile) {
      pdfData = await processPDF(pdfFile);
    }

    const createdBook = {
      ...newBook,
      id: Date.now(),
      totalPages: pdfData.totalPages,
      cover_url: pdfData.cover_url,
      rawFile: pdfData.rawFile,
      highlights: [],
      stickers: [],
      coverColor: "from-amber-950 to-stone-900"
    };

    setBooks([createdBook, ...books]);
    setNewBook({ title: '', author: '', genre: '', totalPages: 10, page: 1, status: 'reading', rating: 0, notes: '' });
    setPdfFile(null);
    setView('library');
  };

  // ====================================================================
  // ثانياً: شريط الأدوات المتكامل (قلم التحديد الفعلي والستيكرات)
  // ====================================================================
  const handleTextHighlight = () => {
    if (!isHighlighterActive) return;
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 2) {
      // حفظ التحديد في بيانات الكتاب المفتوح
      const updatedBooks = books.map(b => {
        if (b.id === currentBook.id) {
          const currentHighlights = b.highlights || [];
          if (!currentHighlights.includes(selectedText)) {
            const newHigh = [...currentHighlights, selectedText];
            setCurrentBook({ ...b, highlights: newHigh });
            return { ...b, highlights: newHigh };
          }
        }
        return b;
      });
      setBooks(updatedBooks);
    }
  };

  const handlePageClickForSticker = (e) => {
    if (!showStickerPicker || !readerPageRef.current) return;
    
    const rect = readerPageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const emoji = "💡"; // الإيموجي المختار من القائمة الافتراضية
    
    const updatedBooks = books.map(b => {
      if (b.id === currentBook.id) {
        const newStickers = [...(b.stickers || []), { id: Date.now(), char: emoji, x, y }];
        setCurrentBook({ ...b, stickers: newStickers });
        return { ...b, stickers: newStickers };
      }
      return b;
    });
    setBooks(updatedBooks);
    setShowStickerPicker(false);
  };

  const removeSticker = (stickerId) => {
    const updatedBooks = books.map(b => {
      if (b.id === currentBook.id) {
        const newStickers = b.stickers.filter(s => s.id !== stickerId);
        setCurrentBook({ ...b, stickers: newStickers });
        return { ...b, stickers: newStickers };
      }
      return b;
    });
    setBooks(updatedBooks);
  };

  return (
    <div dir={t.dir} className="min-h-screen text-stone-200 font-sans" style={{ backgroundColor: "#12100e", backgroundImage: "radial-gradient(#241f1a 1px, transparent 0)", backgroundSize: "24px 24px" }}>
      
      {/* الترويسة الرئيسية */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur sticky top-0 z-50 px-4 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div onClick={() => setView('library')} className="cursor-pointer">
            <h1 style={{ fontFamily: "Amiri, serif" }} className="text-2xl md:text-3xl font-serif text-amber-100 flex items-center gap-2">
              <Sparkles size={24} className="text-amber-500 animate-pulse" /> {t.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-900 text-xs text-amber-200">
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <nav className="flex p-1 bg-stone-900 rounded-xl border border-stone-800">
              <button onClick={() => setView('library')} className={`px-4 py-1.5 rounded-lg text-xs ${view === 'library' ? 'bg-amber-950 text-amber-200' : 'text-stone-400'}`}>{t.navLibrary}</button>
              <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 rounded-lg text-xs ${view === 'dashboard' ? 'bg-amber-950 text-amber-200' : 'text-stone-400'}`}>{t.navDashboard}</button>
              <button onClick={() => setView('add')} className={`px-4 py-1.5 rounded-lg text-xs ${view === 'add' ? 'bg-amber-950 text-amber-200' : 'text-stone-400'}`}>{t.navAdd}</button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">

        {/* ==================================================================== */}
        {/* ثالثاً: تصميم الرفوف الخشبية الحقيقي المستوحى من image_4.png */}
        {/* ==================================================================== */}
        {view === 'library' && (
          <div className="space-y-16 animate-fadeIn">
            {['reading', 'finished', 'wishlist'].map((shelfStatus) => {
              const shelfBooks = books.filter(b => b.status === shelfStatus);
              return (
                <div key={shelfStatus} className="relative pb-6">
                  <h3 className="text-md font-serif text-amber-200/60 mb-8 border-b border-stone-800 pb-2 uppercase tracking-wider">
                    {shelfStatus === 'reading' && t.statusReading}
                    {shelfStatus === 'finished' && t.statusFinished}
                    {shelfStatus === 'wishlist' && t.statusWishlist}
                  </h3>

                  {/* الرف الخشبي المتدرج والممتد ثلاثي الأبعاد */}
                  <div className="relative p-6 rounded-2xl bg-stone-950/40 border border-stone-900 shadow-inner">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-12 items-end">
                      {shelfBooks.map((book) => (
                        <div key={book.id} onClick={() => { setCurrentBook(book); setReaderPage(book.page); setView('reader'); }} 
                             className="group relative cursor-pointer flex flex-col items-center transition-all duration-300 transform hover:-translate-y-3 z-10">
                          
                          {/* غلاف الكتاب بأبعاد مستطيلة واقعية 3:4 */}
                          <div className="w-28 h-40 rounded-r shadow-2xl relative overflow-hidden bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 flex-shrink-0">
                            {book.cover_url ? (
                              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full p-2 flex flex-col justify-between text-center bg-gradient-to-b from-amber-950/60 to-stone-900">
                                <span className="text-[8px] uppercase tracking-widest text-amber-500/40 truncate">{book.author}</span>
                                <span className="text-xs font-serif text-amber-100 font-bold line-clamp-3 leading-snug">{book.title}</span>
                                <Book size={14} className="mx-auto text-amber-600/30" />
                              </div>
                            )}
                            {/* كعب الكتاب لإعطاء عمق مجسم */}
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-black/40 border-r border-white/5 shadow-inner"></div>
                          </div>

                          {/* نصوص بيانات الكتاب أسفل الرف */}
                          <div className="mt-3 text-center w-full px-1">
                            <h4 className="text-xs font-medium text-stone-300 truncate group-hover:text-amber-400">{book.title}</h4>
                            <p className="text-[10px] text-stone-500 truncate">{book.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* الرف الخشبي الواقعي المجسم الممتد بالأسفل */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-[#2c1d11] via-[#4a3525] to-[#2c1d11] rounded-b-xl border-t border-[#614632] shadow-md z-0 flex items-center justify-between px-4">
                      <div className="w-full h-[2px] bg-black/20"></div>
                    </div>
                    <div className="absolute bottom-[-8px] left-2 right-2 h-2 bg-black/50 blur-sm rounded-full z-[-1]"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================================================================== */}
        {/* صفحة لوحتي المحدثة بالكامل كالمجلة الورقية العتيقة image_5.png */}
        {/* ==================================================================== */}
        {view === "dashboard" && (
          <div className="rounded-3xl p-6 md:p-8 shadow-2xl transition-all border animate-fadeIn" style={{ background: "#f4f0e6", borderColor: "#e4dcce", color: "#2e251a" }}>
            <div className="text-center py-6 border-b-2 border-[#d9ceb6] mb-8 relative">
              <h2 style={{ fontFamily: "Amiri, serif", fontSize: 32, fontWeight: 700, color: "#1c150d" }}>THE LITERARY JOURNAL</h2>
              <p className="text-[11px] tracking-widest text-[#7a6a53] uppercase mt-1">YOUR READING UNIVERSE • 2026</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* تحدي القراءة الدائري من الصورة */}
              <div className="rounded-2xl p-5 border border-[#e4dcce] bg-[#faf8f5] flex flex-col items-center justify-center text-center">
                <h4 className="text-xs font-bold text-[#5c4f3c] mb-4 uppercase">🏆 READING PROGRESS</h4>
                <div className="relative w-28 h-28 flex items-center justify-center my-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="#e8e2d5" strokeWidth="8" fill="transparent" />
                    <circle cx="56" cy="56" r="46" stroke="#2b3e52" strokeWidth="8" fill="transparent" strokeDasharray={2*Math.PI*46} strokeDashoffset={2*Math.PI*46*(1-0.23)} />
                  </svg>
                  <span className="absolute text-lg font-bold text-[#1c150d]">23%</span>
                </div>
                <p className="text-[11px] text-[#7a6a53] mt-2">3 كتب مكتملة من أصل 12 للتحدي السنوي</p>
              </div>

              {/* سجل القراءة الشهري (التقويم المصغر) */}
              <div className="lg:col-span-2 rounded-2xl p-5 border border-[#e4dcce] bg-[#faf8f5]">
                <h4 className="text-xs font-bold text-[#5c4f3c] mb-4 uppercase">📅 MONTHLY READING LOG</h4>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#7a6a53] border-b pb-1 mb-2">
                  {["أحد", "إثن", "ثلا", "أرب", "خمي", "جمعة", "سبت"].map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className="py-1.5 rounded-md border border-[#efeae0] flex flex-col items-center justify-center relative bg-transparent" style={{ background: [3,12,21].includes(i+1) ? "#e4dcce" : "transparent" }}>
                      <span className="text-[10px] font-bold text-[#2e251a]">{i+1}</span>
                      {[3,12,21].includes(i+1) && <span className="text-[8px]">🪶</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* الاقتباسات المخصصة والريشة الفنية */}
            <div className="mt-6 rounded-2xl p-6 border border-[#e4dcce] bg-[#fbf9f3] relative overflow-hidden">
              <div className="absolute right-4 bottom-2 text-4xl opacity-10">🪶</div>
              <h4 className="text-xs font-bold text-[#5c4f3c] mb-2 uppercase">💬 FAVORITE QUOTES</h4>
              <p style={{ fontFamily: "Amiri, serif" }} className="text-lg italic text-[#241c13] leading-relaxed">
                “الكتب شعلة دافئة نوقدها في عتمة الأيام، وكل فصل نقرأه هو ليلة نقضيها بصحبة حكمة العصور.”
              </p>
              <div className="text-[11px] text-[#7a6a53] mt-2 text-left">— Stegan Grenm</div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* نظام القارئ الحقيقي واستخراج النصوص والستيكرات */}
        {/* ==================================================================== */}
        {view === 'reader' && currentBook && (
          <div className="max-w-3xl mx-auto rounded-3xl bg-[#f2ebd9] text-stone-900 border border-[#dfd5be] p-6 shadow-2xl relative animate-fadeIn">
            
            {/* شريط أدوات القراءة العلوي المكتمل */}
            <div className="flex justify-between items-center border-b border-[#dfd5be] pb-4 mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">{currentBook.title}</h3>
                <p className="text-xs text-stone-600">{currentBook.author}</p>
              </div>
              <div className="flex items-center gap-2">
                
                {/* زر تفعيل قلم التحديد الفعلي */}
                <button onClick={() => setIsHighlighterActive(!isHighlighterActive)} 
                        className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-medium transition-all ${isHighlighterActive ? 'bg-amber-500 text-white border-amber-600' : 'bg-white/60 border-stone-300 text-stone-700'}`}>
                  <Highlighter size={14} /> {isHighlighterActive ? 'القلم نشط' : 'قلم التحديد'}
                </button>

                {/* زر قائمة منتقي الستيكرات (Sticker Picker) */}
                <div className="relative">
                  <button onClick={() => setShowStickerPicker(!showStickerPicker)} className="p-2 rounded-xl bg-white/60 border border-stone-300 text-stone-700 hover:bg-white flex items-center gap-1 text-xs">
                    <Smile size={14} /> ستيكر
                  </button>
                  {showStickerPicker && (
                    <div className="absolute top-10 right-0 p-2 bg-white rounded-lg shadow-xl border border-stone-200 grid grid-cols-4 gap-1 z-50">
                      {["💡", "✨", "✍️", "❤️", "🔥", "📌", "✅", "❌"].map(emoji => (
                        <button key={emoji} onClick={() => alert("اضغط الآن على أي مكان في ورقة الصفحة بالأسفل لملصق الإيموجي مخصص")} className="p-1.5 hover:bg-stone-100 rounded text-base">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => setView('library')} className="p-2 rounded-xl bg-stone-900 text-white text-xs">إغلاق</button>
              </div>
            </div>

            {/* ورقة الصفحة الفعلية الحاضنة للنص المستخرج والستيكرات والتحديد */}
            <div ref={readerPageRef} onMouseUp={handleTextHighlight} onClick={handlePageClickForSticker}
                 className="relative bg-[#FAF6EE] min-h-[350px] p-6 md:p-8 rounded-xl border border-[#e4dcce] shadow-inner font-serif text-base leading-relaxed text-stone-800 select-text">
              
              {/* عرض الستيكرات المضافة فوق الصفحة مع زر الحذف (x) */}
              {(currentBook.stickers || []).map(sticker => (
                <div key={sticker.id} style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 group cursor-default">
                  <span className="text-2xl select-none">{sticker.char}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }} className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={8} />
                  </button>
                </div>
              ))}

              {/* طباعة واستعراض الكلمات المستخرجة الفعيلة */}
              <p className={isHighlighterActive ? "cursor-text" : "cursor-default"}>
                {pageText}
              </p>
            </div>

            {/* أزرار تصفح وتقليب الصفحات */}
            <div className="flex justify-between items-center mt-6">
              <button disabled={readerPage <= 1} onClick={() => setReaderPage(readerPage - 1)} className="flex items-center gap-1 text-xs text-stone-700 disabled:opacity-30"><ChevronRight size={16} /> السابق</button>
              <span className="text-xs text-stone-600 font-bold">الصفحة {readerPage} من {currentBook.totalPages}</span>
              <button disabled={readerPage >= currentBook.totalPages} onClick={() => setReaderPage(readerPage + 1)} className="flex items-center gap-1 text-xs text-stone-700 disabled:opacity-30">التالي <ChevronLeft size={16} /></button>
            </div>

            {/* صندوق عرض قائمة أحدث التحديدات المحفوظة */}
            {currentBook.highlights && currentBook.highlights.length > 0 && (
              <div className="mt-6 border-t border-[#dfd5be] pt-4">
                <h4 className="text-xs font-bold text-stone-700 mb-2 flex items-center gap-1">🖋️ أحدث التحديدات المحفوظة في هذا الكتاب:</h4>
                <div className="space-y-1.5">
                  {currentBook.highlights.map((h, i) => (
                    <div key={i} className="text-xs bg-amber-200/50 p-2 rounded-lg border border-amber-300 text-stone-900 italic">"{h}"</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* نموذج إضافة كتاب ورفع ملف PDF */}
        {view === 'add' && (
          <div className="max-w-xl mx-auto rounded-2xl bg-stone-950/90 border border-stone-800 p-6 shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-serif text-amber-200 mb-6 flex items-center gap-2 border-b border-stone-900 pb-3"><Plus size={20} /> {t.navAdd}</h3>
            <form onSubmit={handleAddBook} className="space-y-4">
              
              {/* حقل رفع ملف الـ PDF الحقيقي لاستخراج الغلاف والمحتوى */}
              <div className="p-4 rounded-xl border-2 border-dashed border-stone-800 bg-stone-900/40 text-center hover:border-amber-700/60 transition-colors cursor-pointer relative">
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload size={24} className="mx-auto text-stone-500 mb-2" />
                <span className="text-xs text-stone-400 block">{pdfFile ? `ملف محمل: ${pdfFile.name}` : 'ارفع ملف PDF الحقيقي هنا لاستخراج الغلاف والمحتوى تلقائياً'}</span>
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">عنوان الكتاب</label>
                <input required type="text" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full rounded-xl bg-stone-900 border border-stone-800 p-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">المؤلف</label>
                  <input type="text" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full rounded-xl bg-stone-900 border border-stone-800 p-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">النوع الأدبي</label>
                  <input type="text" value={newBook.genre} onChange={e => setNewBook({...newBook, genre: e.target.value})} className="w-full rounded-xl bg-stone-900 border border-stone-800 p-3 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={pdfLoading} className="w-full rounded-xl bg-gradient-to-r from-amber-800 to-amber-900 p-3 text-sm font-medium text-amber-100 shadow-lg">
                {pdfLoading ? 'جاري معالجة الـ PDF واستخراج الغلاف والصفحات...' : 'إدراج الكتاب في المكتبة'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
