document.addEventListener('DOMContentLoaded', () => {
  const favsDiv = document.getElementById('favorites-list');

  // الحصول على المستخدم الحالي
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch {
      return null;
    }
  }

  function getFavorites() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.filter(fav => fav.userEmail === currentUser.email);
  }

  function getRating(bookId) {
    const ratings = JSON.parse(localStorage.getItem('ratings') || '[]');
    const bookRatings = ratings.filter(r => r.bookId === bookId);
    if (bookRatings.length === 0) return 0;
    
    const totalRating = bookRatings.reduce((sum, r) => sum + r.rating, 0);
    return Math.round(totalRating / bookRatings.length);
  }

  // التحقق من تسجيل الدخول
  const currentUser = getCurrentUser();
  if (!currentUser) {
    favsDiv.innerHTML = '<p style="text-align:center;color:#666;">يرجى تسجيل الدخول لعرض المفضلة.</p>';
    return;
  }

  fetch('books.json')
    .then(res => res.json())
    .then(books => {
      // جلب الكتب المرفوعة أيضاً
      let uploadedBooks = [];
      try {
        uploadedBooks = JSON.parse(localStorage.getItem('uploadedBooks') || '[]');
      } catch {}
      
      const allBooks = books.concat(uploadedBooks);
      const userFavorites = getFavorites();
      
      if (userFavorites.length === 0) {
        favsDiv.innerHTML = `
          <div style="text-align:center;padding:2rem;color:#666;">
            <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
            <p>لا توجد كتب مفضلة حتى الآن.</p>
            <a href="index.html" class="btn" style="display:inline-block;margin-top:1rem;">تصفح الكتب</a>
          </div>
        `;
        return;
      }
      
      const favBooks = allBooks.filter(book => 
        userFavorites.some(fav => fav.bookId === book.id)
      );
      
      favBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
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
          <button class="remove-fav-btn" data-id="${book.id}">إزالة من المفضلة</button>
        `;
        favsDiv.appendChild(card);
      });
      
      // إضافة الأحداث لأزرار الإزالة
      document.querySelectorAll('.remove-fav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.getAttribute('data-id'));
          let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
          
          // إزالة الكتاب من مفضلة المستخدم الحالي فقط
          favorites = favorites.filter(fav => 
            !(fav.bookId === id && fav.userEmail === currentUser.email)
          );
          
          localStorage.setItem('favorites', JSON.stringify(favorites));
          location.reload();
        });
      });
    })
    .catch(error => {
      console.error('خطأ في تحميل الكتب:', error);
      favsDiv.innerHTML = '<p style="text-align:center;color:#e53e3e;">حدث خطأ في تحميل الكتب المفضلة.</p>';
    });
}); 