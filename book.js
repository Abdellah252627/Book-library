// استخراج معرف الكتاب من رابط الصفحة
function getBookId() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'));
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser'));
  } catch {
    return null;
  }
}

// دوال المفضلة
function getFavorites() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  return favorites.filter(fav => fav.userEmail === currentUser.email);
}

function setFavorites(favs) {
  localStorage.setItem('favorites', JSON.stringify(favs));
}

function isFavorite(id) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  const favorites = getFavorites();
  return favorites.some(fav => fav.bookId === id);
}

function toggleFavorite(id, bookTitle) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('يرجى تسجيل الدخول أولاً');
    return;
  }

  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const existingIndex = favorites.findIndex(fav => 
    fav.bookId === id && fav.userEmail === currentUser.email
  );

  if (existingIndex !== -1) {
    // إزالة من المفضلة
    favorites.splice(existingIndex, 1);
  } else {
    // إضافة للمفضلة
    favorites.push({
      bookId: id,
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

function setRating(bookId, value) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('يرجى تسجيل الدخول أولاً');
    return;
  }

  let ratings = JSON.parse(localStorage.getItem('ratings') || '[]');
  
  // البحث عن تقييم المستخدم الحالي لهذا الكتاب
  const existingIndex = ratings.findIndex(r => 
    r.bookId === bookId && r.userEmail === currentUser.email
  );

  if (existingIndex !== -1) {
    // تحديث التقييم الموجود
    ratings[existingIndex].rating = value;
    ratings[existingIndex].date = new Date().toISOString();
  } else {
    // إضافة تقييم جديد
    ratings.push({
      bookId: bookId,
      rating: value,
      userEmail: currentUser.email,
      date: new Date().toISOString()
    });
  }

  localStorage.setItem('ratings', JSON.stringify(ratings));
}

// دوال التعليقات
function getComments(bookId) {
  const all = JSON.parse(localStorage.getItem('comments') || '[]');
  return all.filter(comment => comment.bookId === bookId);
}

function addComment(bookId, text) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('يرجى تسجيل الدخول أولاً');
    return;
  }

  const all = JSON.parse(localStorage.getItem('comments') || '[]');
  all.push({
    bookId: bookId,
    user: currentUser.name || currentUser.email,
    userEmail: currentUser.email,
    text: text,
    date: new Date().toISOString()
  });
  localStorage.setItem('comments', JSON.stringify(all));
}

function renderComments(bookId) {
  const listDiv = document.getElementById('comments-list');
  const comments = getComments(bookId).slice().reverse();
  const currentUser = getCurrentUser();
  
  if (comments.length === 0) {
    listDiv.innerHTML = '<p style="color:#888;text-align:center;">لا توجد تعليقات بعد.</p>';
    return;
  }

  // ترتيب التعليقات: الأعلى تصويتًا أولاً
  const commentsWithVotes = comments.map((c, idx) => {
    const v = getCommentVotes(bookId, idx);
    return {...c, _idx: idx, _votes: v.up - v.down, _up: v.up, _down: v.down};
  });
  commentsWithVotes.sort((a, b) => b._votes - a._votes);
  
  listDiv.innerHTML = commentsWithVotes.map((c, idx) => {
    const v = getCommentVotes(bookId, c._idx);
    const userVote = getUserCommentVote(bookId, c._idx, currentUser?.email || '');
    const isCurrentUserComment = currentUser && c.userEmail === currentUser.email;
    
    return `<div style='margin-bottom:1.1rem;padding-bottom:0.7rem;border-bottom:1px solid #eee;position:relative;${idx === 0 && commentsWithVotes.length > 1 ? "background:#fffbe6;box-shadow:0 2px 8px #ffe082;" : ''}'>
      <img src="${getAvatar(c.user)}" alt="avatar" style="width:28px;height:28px;border-radius:50%;vertical-align:middle;margin-left:0.5rem;background:#eee;object-fit:cover;">
      <b style='color:#2d3748;'>${c.user}</b>
      <span style='color:#888;font-size:0.93rem;margin-right:0.7rem;'>${new Date(c.date).toLocaleString('ar-EG')}</span><br>
      <span style='font-size:1.05rem;'>${c.text.replace(/</g, '&lt;')}</span>
      <div style='margin-top:0.5rem;'>
        <button class='vote-comment-up' data-idx='${c._idx}' style='background:${userVote === 'up' ? '#b8860b' : '#eee'};color:#222;font-size:1rem;'>👍 <span>${v.up}</span></button>
        <button class='vote-comment-down' data-idx='${c._idx}' style='background:${userVote === 'down' ? '#b8860b' : '#eee'};color:#222;font-size:1rem;margin-right:0.5rem;'>👎 <span>${v.down}</span></button>
      </div>
      ${isCurrentUserComment ? `<button class='delete-comment-btn' data-idx='${c._idx}' style='position:absolute;left:0;top:0.5rem;background:#e53e3e;color:#fff;border:none;padding:0.2rem 0.7rem;border-radius:5px;cursor:pointer;font-size:0.95rem;'>حذف</button>` : ''}
    </div>`;
  }).join('');

  // أحداث التصويت
  listDiv.querySelectorAll('.vote-comment-up').forEach(btn => {
    btn.onclick = function() {
      if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
      }
      voteComment(bookId, +this.dataset.idx, 'up', currentUser.email);
      renderComments(bookId);
    };
  });
  
  listDiv.querySelectorAll('.vote-comment-down').forEach(btn => {
    btn.onclick = function() {
      if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
      }
      voteComment(bookId, +this.dataset.idx, 'down', currentUser.email);
      renderComments(bookId);
    };
  });

  // إضافة أحداث الحذف
  document.querySelectorAll('.delete-comment-btn').forEach(btn => {
    btn.onclick = function() {
      deleteComment(bookId, parseInt(this.getAttribute('data-idx')));
      renderComments(bookId);
    };
  });
}

function deleteComment(bookId, idx) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const all = JSON.parse(localStorage.getItem('comments') || '[]');
  const bookComments = all.filter(comment => comment.bookId === bookId);
  
  if (idx >= bookComments.length) return;
  
  // التعليقات معروضة بالعكس (الأحدث أولاً)
  const realIdx = bookComments.length - 1 - idx;
  const commentToDelete = bookComments[realIdx];
  
  // التحقق من أن المستخدم هو صاحب التعليق
  if (commentToDelete.userEmail !== currentUser.email) return;
  
  // حذف التعليق من المصفوفة الرئيسية
  const commentIndex = all.findIndex(comment => 
    comment.bookId === bookId && 
    comment.userEmail === currentUser.email && 
    comment.date === commentToDelete.date
  );
  
  if (commentIndex !== -1) {
    all.splice(commentIndex, 1);
    localStorage.setItem('comments', JSON.stringify(all));
  }
}

let currentPdf = null;
let currentPage = 1;
let totalPages = 0;

function renderPage(num) {
  currentPdf.getPage(num).then(function(page) {
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    page.render(renderContext);
    document.getElementById('page-info').textContent = `صفحة ${num} من ${totalPages}`;
  });
}

function showPdfViewer(pdfUrl) {
  const container = document.getElementById('pdf-viewer-container');
  container.style.display = 'block';
  pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
    currentPdf = pdfDoc_;
    totalPages = pdfDoc_.numPages;
    currentPage = 1;
    renderPage(currentPage);
  });
}

function renderSuggestedBooks(currentBook, allBooks) {
  const listDiv = document.getElementById('suggested-books-list');
  if (!listDiv) return;
  
  // استبعاد الكتاب الحالي
  let sameCat = allBooks.filter(b => b.category === currentBook.category && b.id !== currentBook.id);
  
  // ترتيب حسب التقييم (الأعلى أولاً)
  sameCat = sameCat.map(b => ({...b, _rating: getRating(b.id)}));
  sameCat.sort((a, b) => b._rating - a._rating);
  
  // اختيار حتى 3 كتب الأعلى تقييماً
  const selected = sameCat.slice(0, 3);
  if (selected.length === 0) {
    listDiv.innerHTML = '<p style="color:#888;text-align:center;">لا توجد كتب مقترحة من نفس التصنيف.</p>';
    return;
  }
  
  listDiv.innerHTML = selected.map(book =>
    `<div class='book-card' style='padding:0.7rem;'>
      <img src="${book.cover}" alt="غلاف الكتاب" style="width:80px;height:110px;object-fit:cover;cursor:pointer;" onclick="window.location='book.html?id=${book.id}'">
      <h2 style="font-size:1rem;cursor:pointer;" onclick="window.location='book.html?id=${book.id}'">${book.title}</h2>
      <p style="font-size:0.95rem;">بواسطة: ${book.author}</p>
      <div style='margin:0.3rem 0;'>${renderStaticStars(book._rating)}</div>
    </div>`
  ).join('');
}

function renderStaticStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span style="font-size:1.1rem;color:${i <= rating ? '#FFD700' : '#ccc'}">★</span>`;
  }
  return html;
}

// دوال تصويت الكتب
function getBookVotes(bookId) {
  const votes = JSON.parse(localStorage.getItem('bookVotes') || '{}');
  return votes[bookId] || {up: 0, down: 0};
}

function getUserBookVote(bookId, user) {
  const userVotes = JSON.parse(localStorage.getItem('userBookVotes') || '{}');
  return userVotes[user]?.[bookId] || null;
}

function setUserBookVote(bookId, user, val) {
  let userVotes = JSON.parse(localStorage.getItem('userBookVotes') || '{}');
  if (!userVotes[user]) userVotes[user] = {};
  userVotes[user][bookId] = val;
  localStorage.setItem('userBookVotes', JSON.stringify(userVotes));
}

function voteBook(bookId, val, user) {
  let votes = JSON.parse(localStorage.getItem('bookVotes') || '{}');
  if (!votes[bookId]) votes[bookId] = {up: 0, down: 0};
  const prev = getUserBookVote(bookId, user);
  if (prev === val) return; // منع التصويت المكرر
  if (prev === 'up') votes[bookId].up--;
  if (prev === 'down') votes[bookId].down--;
  if (val === 'up') votes[bookId].up++;
  if (val === 'down') votes[bookId].down++;
  localStorage.setItem('bookVotes', JSON.stringify(votes));
  setUserBookVote(bookId, user, val);
}

// دوال تصويت التعليقات
function getCommentVotes(bookId, idx) {
  const votes = JSON.parse(localStorage.getItem('commentVotes') || '{}');
  return votes[`${bookId}_${idx}`] || {up: 0, down: 0};
}

function getUserCommentVote(bookId, idx, user) {
  const userVotes = JSON.parse(localStorage.getItem('userCommentVotes') || '{}');
  return userVotes[user]?.[`${bookId}_${idx}`] || null;
}

function setUserCommentVote(bookId, idx, user, val) {
  let userVotes = JSON.parse(localStorage.getItem('userCommentVotes') || '{}');
  if (!userVotes[user]) userVotes[user] = {};
  userVotes[user][`${bookId}_${idx}`] = val;
  localStorage.setItem('userCommentVotes', JSON.stringify(userVotes));
}

function voteComment(bookId, idx, val, user) {
  let votes = JSON.parse(localStorage.getItem('commentVotes') || '{}');
  const key = `${bookId}_${idx}`;
  if (!votes[key]) votes[key] = {up: 0, down: 0};
  const prev = getUserCommentVote(bookId, idx, user);
  if (prev === val) return; // منع التصويت المكرر
  if (prev === 'up') votes[key].up--;
  if (prev === 'down') votes[key].down--;
  if (val === 'up') votes[key].up++;
  if (val === 'down') votes[key].down++;
  localStorage.setItem('commentVotes', JSON.stringify(votes));
  setUserCommentVote(bookId, idx, user, val);
}

// دوال متابعة المؤلفين
function getFollowedAuthors() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  return JSON.parse(localStorage.getItem('followedAuthors_' + currentUser.email) || '[]');
}

function setFollowedAuthors(list) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  localStorage.setItem('followedAuthors_' + currentUser.email, JSON.stringify(list));
}

function isFollowingAuthor(author) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  const follows = getFollowedAuthors();
  return follows.includes(author);
}

function toggleFollowAuthor(author) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('يرجى تسجيل الدخول أولاً');
    return;
  }

  const follows = getFollowedAuthors();
  const index = follows.indexOf(author);
  
  if (index !== -1) {
    follows.splice(index, 1);
  } else {
    follows.push(author);
  }
  
  setFollowedAuthors(follows);
}

function addCenterNotifForUser(username, text, type = 'info', link = null) {
  const notifs = JSON.parse(localStorage.getItem('centerNotifs') || '[]');
  notifs.unshift({
    id: Date.now(),
    text: text,
    type: type,
    link: link,
    date: new Date().toISOString(),
    read: false,
    userEmail: username
  });
  localStorage.setItem('centerNotifs', JSON.stringify(notifs));
}

function getAvatar(username) {
  // إنشاء صورة رمزية بسيطة
  const colors = ['#4a90e2', '#e91e63', '#b8860b', '#38a169', '#e53e3e'];
  const color = colors[username.length % colors.length];
  const initial = username.charAt(0).toUpperCase();
  
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${color}"/><text x="50" y="65" font-family="Arial" font-size="40" text-anchor="middle" fill="white">${initial}</text></svg>`;
}

function renderStars(bookId) {
  const rating = getRating(bookId);
  const currentUser = getCurrentUser();
  
  let html = '<div style="margin:1rem 0;">';
  for (let i = 1; i <= 5; i++) {
    const color = i <= rating ? '#FFD700' : '#ccc';
    html += `<span class="star" data-rating="${i}" style="font-size:1.5rem;color:${color};cursor:pointer;margin:0 0.2rem;">★</span>`;
  }
  html += '</div>';
  
  // إضافة أحداث التقييم
  setTimeout(() => {
    document.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', function() {
        if (!currentUser) {
          alert('يرجى تسجيل الدخول أولاً');
          return;
        }
        const rating = parseInt(this.getAttribute('data-rating'));
        setRating(bookId, rating);
        renderStars(bookId);
      });
    });
  }, 100);
  
  return html;
}

document.addEventListener('DOMContentLoaded', () => {
  const bookId = getBookId();
  const detailsDiv = document.getElementById('book-details');

  fetch('books.json')
    .then(res => res.json())
    .then(books => {
      const book = books.find(b => b.id === bookId);
      if (!book) {
        detailsDiv.innerHTML = '<p>الكتاب غير موجود.</p>';
        return;
      }
      const favText = isFavorite(book.id) ? 'إزالة من المفضلة' : 'أضف إلى المفضلة';
      const votes = getBookVotes(book.id);
      const user = JSON.parse(localStorage.getItem('currentUser'))?.username || localStorage.getItem('loggedInUser') || '';
      const userVote = getUserBookVote(book.id, user);
      const isFollowing = isFollowingAuthor(book.author);
      detailsDiv.innerHTML = `
        <div class="book-card" style="max-width:400px;margin:auto;">
          <img src="${book.cover}" alt="غلاف الكتاب">
          <h2>${book.title}</h2>
          <p>بواسطة: ${book.author} <button id="follow-author-btn" style="font-size:0.95rem;background:${isFollowing?'#e53e3e':'#1a237e'};color:#fff;margin-right:0.7rem;border-radius:5px;">${isFollowing?'إلغاء المتابعة':'متابعة'}</button></p>
          <p><b>التصنيف:</b> ${book.category}</p>
          <p>${book.description}</p>
          <div id="rating-stars" style="margin:1rem 0;"></div>
          <div style="margin:0.7rem 0 1.1rem 0;">
            <button id="vote-up" style="background:${userVote==='up'?'#b8860b':'#eee'};color:#222;font-size:1.1rem;">👍 <span id="vote-up-count">${votes.up}</span></button>
            <button id="vote-down" style="background:${userVote==='down'?'#b8860b':'#eee'};color:#222;font-size:1.1rem;margin-right:0.7rem;">👎 <span id="vote-down-count">${votes.down}</span></button>
          </div>
          <button id="read-btn">اقرأ الآن</button>
          <button id="fav-btn">${favText}</button>
        </div>
      `;
      renderStars(book.id);
      renderComments(book.id);
      // كتب مقترحة
      // جلب الكتب المرفوعة من LocalStorage أيضًا
      let uploadedBooks = [];
      try {
        uploadedBooks = JSON.parse(localStorage.getItem('uploadedBooks') || '[]');
      } catch {}
      const allBooks = books.concat(uploadedBooks);
      renderSuggestedBooks(book, allBooks);
      document.getElementById('read-btn').addEventListener('click', function() {
        showPdfViewer(book.file);
        this.style.display = 'none';
      });
      document.getElementById('fav-btn').addEventListener('click', function() {
        toggleFavorite(book.id, book.title);
        this.textContent = isFavorite(book.id) ? 'إزالة من المفضلة' : 'أضف إلى المفضلة';
      });
      document.getElementById('vote-up').onclick = function() {
        voteBook(book.id,'up',user);
        renderBookDetails();
      };
      document.getElementById('vote-down').onclick = function() {
        voteBook(book.id,'down',user);
        renderBookDetails();
      };
      document.getElementById('comment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const text = document.getElementById('comment-text').value.trim();
        const user = localStorage.getItem('loggedInUser') || 'مستخدم مجهول';
        if (!text) return;
        addComment(book.id, text);
        // إشعار صاحب الكتاب إذا كان غير المعلق
        try {
          let bookUploader = '';
          let uploaded = JSON.parse(localStorage.getItem('uploadedBooks')||'[]');
          const uploadedBook = uploaded.find(b=>b.id==book.id);
          if (uploadedBook) bookUploader = uploadedBook.uploader;
          if (bookUploader && bookUploader !== user) {
            addCenterNotifForUser(bookUploader, `💬 تم إضافة تعليق جديد على كتابك: ${book.title}`,'comment',`book.html?id=${book.id}`);
          }
        } catch{}
        // إشعار المستخدم إذا تم الرد على تعليقه
        try {
          const allComments = JSON.parse(localStorage.getItem('comments')||'{}');
          const prevUsers = (allComments[book.id]||[]).map(c=>c.user).filter(u=>u!==user);
          const uniqueUsers = Array.from(new Set(prevUsers));
          uniqueUsers.forEach(u => {
            if (typeof addNotifForUser === 'function') {
              addNotifForUser(u, `💬 تم إضافة تعليق جديد على كتاب: ${book.title}`);
            }
            // إشعار مركز الإشعارات
            addCenterNotifForUser(u, `💬 تم الرد على تعليقك في كتاب: ${book.title}`,'reply',`book.html?id=${book.id}`);
          });
        } catch{}
        document.getElementById('comment-text').value = '';
        renderComments(book.id);
      });
      document.getElementById('follow-author-btn').onclick = function() {
        toggleFollowAuthor(book.author);
        renderBookDetails();
      };
    });

  // تحكم الصفحات
  document.getElementById('prev-page').addEventListener('click', function() {
    if (currentPdf && currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    }
  });
  document.getElementById('next-page').addEventListener('click', function() {
    if (currentPdf && currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
    }
  });
}); 