// حماية الصفحات: إعادة التوجيه إذا لم يكن المستخدم مسجلاً الدخول
(function() {
  const publicPages = ['login.html', 'index.html', 'profile-public.html'];
  const isPublic = publicPages.some(page => window.location.pathname.endsWith(page));
  
  // إذا كانت الصفحة عامة، لا نحتاج للتحقق من تسجيل الدخول
  if (isPublic) {
    return;
  }
  
  // التحقق من وجود مستخدم مسجل دخول
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const loggedInUser = localStorage.getItem('loggedInUser');
  
  if (!currentUser && !loggedInUser) {
    window.location.href = 'login.html';
  }
})();

// التحقق من كون المستخدم مسؤول
function isAdminUser() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser && currentUser.email === 'manager';
  } catch { 
    return false; 
  }
}

// حماية صفحة المسؤول
if (location.pathname.endsWith('admin.html')) {
  if (!isAdminUser()) {
    location.href = 'index.html';
  }
}

// حماية صفحة الملف الشخصي
if (location.pathname.endsWith('profile.html')) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const loggedInUser = localStorage.getItem('loggedInUser');
  
  if (!currentUser && !loggedInUser) {
    location.href = 'login.html';
  }
}

// حماية صفحة رفع الكتب
if (location.pathname.endsWith('upload.html')) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const loggedInUser = localStorage.getItem('loggedInUser');
  
  if (!currentUser && !loggedInUser) {
    location.href = 'login.html';
  }
}

// حماية صفحة المفضلة
if (location.pathname.endsWith('favorites.html')) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const loggedInUser = localStorage.getItem('loggedInUser');
  
  if (!currentUser && !loggedInUser) {
    location.href = 'login.html';
  }
}

// دالة تسجيل الخروج
function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
} 