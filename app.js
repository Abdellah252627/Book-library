document.addEventListener('DOMContentLoaded', () => {
  const booksList = document.getElementById('books-list');
  const searchInput = document.getElementById('search');
  const categoryFilter = document.getElementById('category-filter');
  let books = [];
  let categories = [
    "تطوير الذات", "روايات", "تاريخ إسلامي", "أدب", "شعر", "دين", "علوم", "طب", "هندسة", "اقتصاد", "إدارة أعمال", "سياسة", "فلسفة", "علم نفس", "تربية", "تعليم", "قانون", "قصص أطفال", "سير ذاتية", "تكنولوجيا", "كمبيوتر", "برمجة", "رياضيات", "فيزياء", "كيمياء", "أحياء", "جغرافيا", "فكر", "إعلام", "فن", "تصميم", "تسويق", "تاريخ", "اجتماع", "لغات", "ترجمة", "دراسات إسلامية", "حديث", "تفسير", "فقه", "أصول الدين", "تفسير أحلام", "طبخ", "سفر", "سياحة", "موسيقى", "تربية رياضية", "تنمية بشرية", "مسرح", "مقالات", "مجلات", "أخرى"
  ];

  // الحصول على المستخدم الحالي
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch {
      return null;
    }
  }

  // جلب قائمة المفضلة من LocalStorage
  function getFavorites() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.filter(fav => fav.userEmail === currentUser.email);
  }

  function setFavorites(favs) {
    localStorage.setItem('favorites', JSON.stringify(favs));
  }

  function isFavorite(bookId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const favorites = getFavorites();
    return favorites.some(fav => fav.bookId === bookId);
  }

  function toggleFavorite(bookId, bookTitle) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const existingIndex = favorites.findIndex(fav => 
      fav.bookId === bookId && fav.userEmail === currentUser.email
    );

    if (existingIndex !== -1) {
      // إزالة من المفضلة
      favorites.splice(existingIndex, 1);
    } else {
      // إضافة للمفضلة
      favorites.push({
        bookId: bookId,
        bookTitle: bookTitle,
        userEmail: currentUser.email,
        date: new Date().toISOString()
      });
    }

    setFavorites(favorites);
  }

  // دوال التقييم
  function getRating(bookId) {
    const ratings = JSON.parse(localStorage.getItem('ratings') || '[]');
    const bookRatings = ratings.filter(r => r.bookId === bookId);
    if (bookRatings.length === 0) return 0;
    
    const totalRating = bookRatings.reduce((sum, r) => sum + r.rating, 0);
    return Math.round(totalRating / bookRatings.length);
  }

  // جلب الكتب من ملف JSON + الكتب المرفوعة
  fetch('books.json')
    .then(res => res.json())
    .then(data => {
      // جلب الكتب المرفوعة من LocalStorage
      let uploadedBooks = [];
      try {
        uploadedBooks = JSON.parse(localStorage.getItem('uploadedBooks') || '[]');
      } catch {}
      
      books = data.concat(uploadedBooks);
      
      // بعد جلب الكتب (books وuploadedBooks)
      const acceptedUploaded = uploadedBooks.filter(b => b.status === 'accepted');
      const allBooks = books.concat(acceptedUploaded);
      
      showSuggestedBooks(allBooks);
      showFollowedAuthorsNewBooksToast(allBooks);
      
      // إستخراج جميع التصنيفات من الكتب وإضافتها للقائمة إذا لم تكن موجودة
      const bookCats = Array.from(new Set(allBooks.map(b => b.category)));
      bookCats.forEach(cat => {
        if (!categories.includes(cat)) categories.push(cat);
      });
      categories = Array.from(new Set(categories));
      
      fillCategories();
      displayBooks(allBooks);
      displayRandomBooks();
      updateStats();
      renderBooksWithFilters(allBooks);
      
      // إشعار مركز الإشعارات عند وجود كتب جديدة من المؤلفين المتابَعين
      const currentUser = getCurrentUser();
      if (currentUser) {
        const follows = JSON.parse(localStorage.getItem('followedAuthors_' + currentUser.email) || '[]');
        if (follows.length) {
          const lastVisit = +(localStorage.getItem('lastFollowedBooksCheck_' + currentUser.email) || 0);
          const newBooks = allBooks.filter(b => follows.includes(b.author) && b.id > lastVisit);
          if (newBooks.length) {
            addCenterNotif(`📚 هناك ${newBooks.length} كتاب جديد من المؤلفين الذين تتابعهم!`, 'book', null);
            const maxId = Math.max(...newBooks.map(b => b.id));
            localStorage.setItem('lastFollowedBooksCheck_' + currentUser.email, maxId);
          }
        }
      }
    })
    .catch(error => {
      console.error('خطأ في تحميل الكتب:', error);
      booksList.innerHTML = '<p>حدث خطأ في تحميل الكتب. يرجى المحاولة مرة أخرى.</p>';
    });

  // ملء قائمة التصنيفات
  function fillCategories() {
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="all">كل التصنيفات</option>';
      categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
      });
    }
  }

  // عرض الكتب
  function displayBooks(booksArr) {
    if (!booksList) return;
    
    booksList.innerHTML = '';
    if (booksArr.length === 0) {
      booksList.innerHTML = '<p style="text-align:center;color:#666;font-size:1.1rem;">لا توجد كتب مطابقة.</p>';
      return;
    }
    
    booksArr.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';
      const favText = isFavorite(book.id) ? 'إزالة من المفضلة' : 'أضف إلى المفضلة';
      const rating = getRating(book.id);
      
      let starsHtml = '<div style="margin:0.5rem 0;">';
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<span style="font-size:1.3rem;color:${i <= rating ? '#FFD700' : '#ccc'}">★</span>`;
      }
      starsHtml += '</div>';
      
      card.innerHTML = `
        <img src="${book.cover}" alt="غلاف الكتاب" style="cursor:pointer" onclick="window.location='book.html?id=${book.id}'">
        <h2 style="cursor:pointer" onclick="window.location='book.html?id=${book.id}'">${book.title}</h2>
        <p>بواسطة: ${book.author}</p>
        <p style="color:#666;font-size:0.9rem;">${book.category}</p>
        ${starsHtml}
        <button onclick="window.open('${book.file}', '_blank')">اقرأ الآن</button>
        <button class="fav-btn" data-id="${book.id}" data-title="${book.title}">${favText}</button>
      `;
      booksList.appendChild(card);
    });
    
    // إضافة الأحداث لأزرار المفضلة
    document.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const id = parseInt(this.getAttribute('data-id'));
        const title = this.getAttribute('data-title');
        toggleFavorite(id, title);
        displayBooks(booksArr); // إعادة العرض لتحديث الزر
      });
    });
  }

  // البحث والتصفية
  function filterAndDisplay() {
    const val = searchInput.value.trim().toLowerCase();
    const cat = categoryFilter ? categoryFilter.value : 'all';
    
    let filtered = books.filter(book => {
      const inTitle = book.title.toLowerCase().includes(val);
      const inAuthor = book.author.toLowerCase().includes(val);
      const inCategory = book.category.toLowerCase().includes(val);
      const inDesc = (book.description || '').toLowerCase().includes(val);
      const matchesSearch = inTitle || inAuthor || inCategory || inDesc;
      const matchesCat = (cat === 'all' || book.category === cat);
      return matchesSearch && matchesCat;
    });
    
    displayBooks(filtered);
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterAndDisplay);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterAndDisplay);
  }

  // عرض كتب عشوائية
  function displayRandomBooks() {
    const randomDiv = document.getElementById('random-books-list');
    if (!randomDiv) return;
    
    let pool = books.slice();
    // إذا كان عدد الكتب أقل من 4، اعرض كل الكتب
    if (pool.length <= 4) {
      renderRandom(pool);
      return;
    }
    
    // اختيار 4 كتب عشوائية بدون تكرار
    let selected = [];
    while (selected.length < 4 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool[idx]);
      pool.splice(idx, 1);
    }
    
    renderRandom(selected);
    
    function renderRandom(arr) {
      randomDiv.innerHTML = '';
      arr.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
          <img src="${book.cover}" alt="غلاف الكتاب" style="cursor:pointer" onclick="window.location='book.html?id=${book.id}'">
          <h2 style="cursor:pointer" onclick="window.location='book.html?id=${book.id}'">${book.title}</h2>
          <p>بواسطة: ${book.author}</p>
        `;
        randomDiv.appendChild(card);
      });
    }
  }

  // تحديث الإحصائيات
  function updateStats() {
    // عدد الكتب
    const statBooks = document.getElementById('stat-books');
    if (statBooks) {
      statBooks.textContent = books.length;
    }
    
    // عدد المستخدمين
    const statUsers = document.getElementById('stat-users');
    if (statUsers) {
      let users = [];
      try {
        users = JSON.parse(localStorage.getItem('users') || '[]');
      } catch {}
      statUsers.textContent = users.length;
    }
    
    // أكثر كتاب مضاف للمفضلة
    const statFavBook = document.getElementById('stat-fav-book');
    if (statFavBook) {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      let favCount = {};
      favs.forEach(fav => { 
        favCount[fav.bookId] = (favCount[fav.bookId] || 0) + 1; 
      });
      
      let maxId = null, maxCount = 0;
      for (const id in favCount) {
        if (favCount[id] > maxCount) {
          maxId = id;
          maxCount = favCount[id];
        }
      }
      
      let favBook = books.find(b => b.id == maxId);
      statFavBook.textContent = favBook ? favBook.title : '—';
    }
    
    // الأعلى تقييماً
    const statTopRated = document.getElementById('stat-top-rated');
    if (statTopRated) {
      let topRated = null, topRating = 0;
      books.forEach(b => {
        const r = getRating(b.id);
        if (r > topRating) {
          topRating = r;
          topRated = b;
        }
      });
      statTopRated.textContent = topRated ? topRated.title : '—';
    }
    
    // عدد التعليقات
    const statComments = document.getElementById('stat-comments');
    if (statComments) {
      const comments = JSON.parse(localStorage.getItem('comments') || '[]');
      statComments.textContent = comments.length;
    }
  }

  // إظهار رابط ملفي الشخصي إذا كان المستخدم مسجلاً
  const profileLink = document.getElementById('profile-link');
  if (profileLink && (currentUser || localStorage.getItem('loggedInUser'))) {
    profileLink.style.display = '';
  }

  // إظهار رابط لوحة المسؤول إذا كان المستخدم مسؤولاً
  const adminLink = document.getElementById('admin-link');
  if (adminLink && currentUser && currentUser.isAdmin) {
    adminLink.style.display = '';
  }

  // تعبئة خيارات التصنيف والمؤلف
  function fillFilterOptions(books) {
    const categories = Array.from(new Set(books.map(b => b.category)));
    const authors = Array.from(new Set(books.map(b => b.author)));
    
    const categoryFilter = document.getElementById('filter-category');
    const authorFilter = document.getElementById('filter-author');
    
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">كل التصنيفات</option>';
      categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
      });
    }
    
    if (authorFilter) {
      authorFilter.innerHTML = '<option value="">كل المؤلفين</option>';
      authors.forEach(author => {
        authorFilter.innerHTML += `<option value="${author}">${author}</option>`;
      });
    }
  }

  // تطبيق التصفية المتقدمة
  function applyAdvancedFilters(books) {
    const category = document.getElementById('filter-category')?.value || '';
    const author = document.getElementById('filter-author')?.value || '';
    const rating = document.getElementById('filter-rating')?.value || '';
    
    return books.filter(book => {
      const matchesCategory = !category || book.category === category;
      const matchesAuthor = !author || book.author === author;
      const matchesRating = !rating || getRating(book.id) >= parseInt(rating);
      
      return matchesCategory && matchesAuthor && matchesRating;
    });
  }

  // ربط التصفية مع العرض
  let allBooksCache = [];
  function renderBooksWithFilters(books) {
    allBooksCache = books;
    fillFilterOptions(books);
    document.getElementById('apply-filters')?.addEventListener('click', ()=>{
      const filtered = applyAdvancedFilters(allBooksCache);
      renderBooks(filtered);
    });
    // تصفية مباشرة عند تغيير الخيارات
    ['filter-category','filter-author','filter-rating'].forEach(id=>{
      document.getElementById(id)?.addEventListener('change', ()=>{
        const filtered = applyAdvancedFilters(allBooksCache);
        renderBooks(filtered);
      });
    });
  }

  // عرض كتب مقترحة للمستخدم
  function showSuggestedBooks(allBooks) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const suggestedSection = document.getElementById('suggested-for-you-section');
    const suggestedList = document.getElementById('suggested-for-you-list');
    
    if (!suggestedSection || !suggestedList) return;
    
    const userFavorites = getFavorites();
    if (userFavorites.length === 0) {
      suggestedSection.style.display = 'none';
      return;
    }
    
    // تحليل تفضيلات المستخدم
    const favoriteCategories = {};
    const favoriteAuthors = {};
    
    userFavorites.forEach(fav => {
      const book = allBooks.find(b => b.id === fav.bookId);
      if (book) {
        favoriteCategories[book.category] = (favoriteCategories[book.category] || 0) + 1;
        favoriteAuthors[book.author] = (favoriteAuthors[book.author] || 0) + 1;
      }
    });
    
    // اقتراح كتب بناءً على التفضيلات
    const suggestions = allBooks.filter(book => {
      const isNotInFavorites = !userFavorites.some(fav => fav.bookId === book.id);
      const hasPreferredCategory = favoriteCategories[book.category] > 0;
      const hasPreferredAuthor = favoriteAuthors[book.author] > 0;
      
      return isNotInFavorites && (hasPreferredCategory || hasPreferredAuthor);
    });
    
    if (suggestions.length === 0) {
      suggestedSection.style.display = 'none';
      return;
    }
    
    // عرض أول 6 اقتراحات
    const topSuggestions = suggestions.slice(0, 6);
    suggestedSection.style.display = 'block';
    
    suggestedList.innerHTML = '';
    topSuggestions.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';
      card.innerHTML = `
        <img src="${book.cover}" alt="غلاف الكتاب" style="cursor:pointer" onclick="window.location='book.html?id=${book.id}'">
        <h2 style="cursor:pointer" onclick="window.location='book.html?id=${book.id}'">${book.title}</h2>
        <p>بواسطة: ${book.author}</p>
      `;
      suggestedList.appendChild(card);
    });
  }

  // إشعار فوري عند وجود كتب جديدة من المؤلفين المتابَعين
  function showFollowedAuthorsNewBooksToast(allBooks) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const follows = JSON.parse(localStorage.getItem('followedAuthors_' + currentUser.email) || '[]');
    if (follows.length === 0) return;
    
    const lastVisit = +(localStorage.getItem('lastFollowedBooksCheck_' + currentUser.email) || 0);
    const newBooks = allBooks.filter(b => follows.includes(b.author) && b.id > lastVisit);
    
    if (newBooks.length > 0) {
      showToast(`📚 ${newBooks.length} كتاب جديد من المؤلفين المتابَعين!`);
      const maxId = Math.max(...newBooks.map(b => b.id));
      localStorage.setItem('lastFollowedBooksCheck_' + currentUser.email, maxId);
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #b8860b;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  // مركز الإشعارات المتكامل
  function addCenterNotif(text, type = 'info', link = null) {
    const notifs = getCenterNotifs();
    notifs.unshift({
      id: Date.now(),
      text: text,
      type: type,
      link: link,
      date: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('centerNotifs', JSON.stringify(notifs));
    updateNotifCenterUI();
  }

  function getCenterNotifs() {
    return JSON.parse(localStorage.getItem('centerNotifs') || '[]');
  }

  function markAllCenterNotifsRead() {
    const notifs = getCenterNotifs();
    notifs.forEach(n => n.read = true);
    localStorage.setItem('centerNotifs', JSON.stringify(notifs));
    updateNotifCenterUI();
  }

  function updateNotifCenterUI() {
    const notifs = getCenterNotifs();
    const unreadCount = notifs.filter(n => !n.read).length;
    const countEl = document.getElementById('notif-center-count');
    const listEl = document.getElementById('notif-center-list');
    
    if (countEl) {
      if (unreadCount > 0) {
        countEl.style.display = 'block';
        countEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
      } else {
        countEl.style.display = 'none';
      }
    }
    
    if (listEl) {
      listEl.innerHTML = notifs.slice(0, 10).map(notif => `
        <div style="padding:0.8rem;border-bottom:1px solid #f0f0f0;${!notif.read ? 'background:#f8f9fa;' : ''}">
          <div style="font-size:0.9rem;color:#666;">${new Date(notif.date).toLocaleDateString('ar-SA')}</div>
          <div style="margin-top:0.3rem;">${notif.text}</div>
        </div>
      `).join('');
    }
  }

  // إضافة CSS للرسوم المتحركة
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // تحديث واجهة مركز الإشعارات
  updateNotifCenterUI();
  
  // إضافة أحداث لمركز الإشعارات
  const notifBtn = document.getElementById('notif-center-btn');
  const notifList = document.getElementById('notif-center-list');
  
  if (notifBtn && notifList) {
    notifBtn.addEventListener('click', () => {
      notifList.style.display = notifList.style.display === 'none' ? 'block' : 'none';
      markAllCenterNotifsRead();
    });
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', (e) => {
      if (!notifBtn.contains(e.target) && !notifList.contains(e.target)) {
        notifList.style.display = 'none';
      }
    });
  }
}); 