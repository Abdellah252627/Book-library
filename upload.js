const form = document.getElementById('upload-form');
const coverInput = document.getElementById('cover');
const coverPreview = document.getElementById('cover-preview');
const msgDiv = document.getElementById('msg');
const pdfInput = document.getElementById('file');
const pdfPreviewContainer = document.getElementById('pdf-preview-container');
const pdfPreview = document.getElementById('pdf-preview');

// الحصول على المستخدم الحالي
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser'));
  } catch {
    return null;
  }
}

// عرض معاينة الغلاف
coverInput.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      coverPreview.src = e.target.result;
      coverPreview.style.display = 'block';
    };
    reader.readAsDataURL(this.files[0]);
  } else {
    coverPreview.style.display = 'none';
  }
});

// عرض معاينة أول صفحة PDF (إن أمكن)
pdfInput.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    const file = this.files[0];
    const url = URL.createObjectURL(file);
    pdfPreview.src = url;
    pdfPreviewContainer.style.display = 'block';
  } else {
    pdfPreviewContainer.style.display = 'none';
    pdfPreview.src = '';
  }
});

function showMsg(text, type = 'error') {
  msgDiv.innerHTML = `<div class="${type}-msg">${text}</div>`;
}

function addNotifForUser(userEmail, text, type = 'info', link = null) {
  const notifs = JSON.parse(localStorage.getItem('centerNotifs') || '[]');
  notifs.unshift({
    id: Date.now(),
    text: text,
    type: type,
    link: link,
    date: new Date().toISOString(),
    read: false,
    userEmail: userEmail
  });
  localStorage.setItem('centerNotifs', JSON.stringify(notifs));
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  msgDiv.innerHTML = '';
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showMsg('يرجى تسجيل الدخول أولاً');
    return;
  }
  
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const category = document.getElementById('category').value.trim();
  const desc = document.getElementById('desc').value.trim();
  const coverFile = coverInput.files[0];
  const bookFile = pdfInput.files[0];

  if (!title || !author || !category || !coverFile || !bookFile) {
    showMsg('يرجى تعبئة جميع الحقول ورفع الملفات');
    return;
  }

  // التحقق من حجم الملفات
  const maxSize = 10 * 1024 * 1024; // 10 ميجابايت
  if (coverFile.size > maxSize) {
    showMsg('حجم صورة الغلاف يجب أن يكون أقل من 10 ميجابايت');
    return;
  }
  
  if (bookFile.size > maxSize * 5) { // 50 ميجابايت للكتاب
    showMsg('حجم ملف الكتاب يجب أن يكون أقل من 50 ميجابايت');
    return;
  }

  // حفظ بيانات الكتاب الجديد في LocalStorage
  const readerCover = new FileReader();
  const readerBook = new FileReader();

  readerCover.onload = function(e1) {
    readerBook.onload = function(e2) {
      // بناء كائن الكتاب الجديد
      const newBook = {
        id: Date.now(),
        title,
        author,
        category,
        cover: e1.target.result, // base64
        file: e2.target.result,  // base64
        description: desc,
        uploader: currentUser.name || currentUser.email,
        uploaderEmail: currentUser.email,
        status: 'pending',
        reviewNote: '',
        uploadDate: new Date().toISOString()
      };
      
      // جلب الكتب القديمة من LocalStorage
      let books = [];
      try {
        books = JSON.parse(localStorage.getItem('uploadedBooks') || '[]');
      } catch {}
      
      books.push(newBook);
      localStorage.setItem('uploadedBooks', JSON.stringify(books));
      
      showMsg('✅ تمت إضافة الكتاب بنجاح! سيتم مراجعته من قبل المسؤول قريباً.', 'success');
      
      // إشعار المسؤول إذا لم يكن هو الرافع
      if (currentUser.email !== 'manager') {
        addNotifForUser('manager', `📚 تمت إضافة كتاب جديد: ${title} بواسطة ${currentUser.name || currentUser.email}`);
      }
      
      // إعادة تعيين النموذج
      form.reset();
      coverPreview.style.display = 'none';
      pdfPreviewContainer.style.display = 'none';
      pdfPreview.src = '';
    };
    readerBook.readAsDataURL(bookFile);
  };
  readerCover.readAsDataURL(coverFile);
});

// حماية صفحة رفع الكتب
window.addEventListener('DOMContentLoaded', function() {
  const currentUser = getCurrentUser();
  const authMsg = document.getElementById('auth-msg');
  const formContainer = document.getElementById('upload-form-container');
  
  if (!currentUser) {
    if (formContainer) formContainer.style.display = 'none';
    if (authMsg) {
      authMsg.style.display = 'block';
      authMsg.innerHTML = `
        <div style="text-align:center;padding:2rem;color:#666;">
          <div style="font-size:3rem;margin-bottom:1rem;">🔒</div>
          <p>يجب تسجيل الدخول أولاً لرفع كتاب.</p>
          <a href="login.html" class="btn" style="display:inline-block;margin-top:1rem;">تسجيل الدخول</a>
        </div>
      `;
    }
  } else {
    if (formContainer) formContainer.style.display = 'block';
    if (authMsg) authMsg.style.display = 'none';
  }
}); 